// ============================================================================
// NEXORA LUXE — MEDIA UPLOAD HOOK
// Wraps `mediaService` with React state: per-file progress, cancel, retry,
// validation errors and cleanup of object URLs on unmount.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaScope } from '../lib/mediaConfig';
import {
  MediaAsset,
  UploadOptions,
  deleteMedia,
  replaceMedia,
  uploadMedia,
} from '../lib/mediaService';

export interface UploadTask {
  id: string;
  fileName: string;
  byteSize: number;
  percent: number;
  status: 'queued' | 'uploading' | 'done' | 'error' | 'cancelled';
  error?: string;
  asset?: MediaAsset;
}

interface UseMediaUploadArgs {
  /** Required for real uploads — the signed-in user's id. */
  ownerId?: string | null;
  scope: MediaScope;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  /** Called with each successfully uploaded asset. */
  onUploaded?: (asset: MediaAsset) => void;
  /** Called with the first error message encountered. */
  onError?: (message: string) => void;
}

let taskSeq = 0;

export function useMediaUpload({
  ownerId,
  scope,
  entityType,
  entityId,
  metadata,
  onUploaded,
  onError,
}: UseMediaUploadArgs) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const controllersRef = useRef(new Map<string, AbortController>());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllersRef.current.forEach((controller) => controller.abort());
      controllersRef.current.clear();
    };
  }, []);

  const patchTask = useCallback((id: string, patch: Partial<UploadTask>) => {
    if (!mountedRef.current) return;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const clearFinished = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status === 'uploading' || t.status === 'queued'));
  }, []);

  const uploadOne = useCallback(
    async (file: File, replaceOf?: MediaAsset | null): Promise<MediaAsset | null> => {
      taskSeq += 1;
      const taskId = `task-${taskSeq}`;
      const controller = new AbortController();
      controllersRef.current.set(taskId, controller);

      setTasks((prev) => [
        ...prev,
        {
          id: taskId,
          fileName: file.name,
          byteSize: file.size,
          percent: 0,
          status: 'queued',
        },
      ]);
      setIsUploading(true);

      const options: UploadOptions = {
        file,
        scope,
        ownerId: ownerId as string,
        entityType,
        entityId,
        metadata,
        signal: controller.signal,
        onProgress: (percent) => {
          patchTask(taskId, { percent, status: percent >= 100 ? 'done' : 'uploading' });
        },
      };

      const result = replaceOf
        ? await replaceMedia(replaceOf, options)
        : await uploadMedia(options);

      controllersRef.current.delete(taskId);

      if (!mountedRef.current) return null;

      if (!result.ok || !result.asset) {
        patchTask(taskId, {
          status: controller.signal.aborted ? 'cancelled' : 'error',
          error: result.error || 'Upload failed.',
          percent: 0,
        });
        onError?.(result.error || 'Upload failed.');
        setIsUploading(tasks.some((t) => t.status === 'uploading'));
        return null;
      }

      patchTask(taskId, { status: 'done', percent: 100, asset: result.asset });
      onUploaded?.(result.asset);
      setIsUploading(false);
      return result.asset;
    },
    [entityId, entityType, metadata, onError, onUploaded, ownerId, patchTask, scope, tasks],
  );

  const uploadMany = useCallback(
    async (files: File[] | FileList): Promise<MediaAsset[]> => {
      const list = Array.from(files || []);
      if (list.length === 0) return [];
      const uploaded: MediaAsset[] = [];
      // Sequential: predictable progress bars and no burst of parallel XHRs
      // on mobile connections.
      for (const file of list) {
        const asset = await uploadOne(file);
        if (asset) uploaded.push(asset);
      }
      return uploaded;
    },
    [uploadOne],
  );

  const cancel = useCallback((taskId?: string) => {
    if (taskId) {
      controllersRef.current.get(taskId)?.abort();
      controllersRef.current.delete(taskId);
      patchTask(taskId, { status: 'cancelled' });
      return;
    }
    controllersRef.current.forEach((controller) => controller.abort());
    controllersRef.current.clear();
    setTasks((prev) =>
      prev.map((t) => (t.status === 'uploading' || t.status === 'queued' ? { ...t, status: 'cancelled' as const } : t)),
    );
    setIsUploading(false);
  }, [patchTask]);

  const removeUploaded = useCallback(async (asset: MediaAsset) => {
    if (!asset) return { ok: false as const, error: 'No asset.' };
    return deleteMedia(asset);
  }, []);

  return {
    tasks,
    isUploading,
    upload: uploadOne,
    uploadMany,
    cancel,
    clearFinished,
    removeUploaded,
    /** Overall percent across all active tasks, for a single aggregate bar. */
    totalPercent:
      tasks.length === 0
        ? 0
        : Math.round(tasks.reduce((sum, t) => sum + (t.percent || 0), 0) / tasks.length),
  };
}

export default useMediaUpload;
