// ============================================================================
// NEXORA LUXE — LIKES & COMMENTS STATE + REALTIME
// ----------------------------------------------------------------------------
// One hook per post. Owns optimistic UI, rollback on failure, and the realtime
// subscription that keeps other viewers in sync.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  addComment as addCommentApi,
  deleteComment as deleteCommentApi,
  fetchComments,
  fetchLikesCount,
  toggleLike as toggleLikeApi,
  type PostComment,
} from '../db/socialApi';

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected';

export interface UsePostSocialOptions {
  postId: string | null;
  /** Current auth user id, or null when signed out. */
  userId?: string | null;
  /** Skip all network work (e.g. Supabase not configured / demo mode). */
  enabled?: boolean;
}

export interface UsePostSocialResult {
  likeCount: number;
  likedByMe: boolean;
  comments: PostComment[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  status: RealtimeStatus;
  toggleLike: () => Promise<void>;
  addComment: (text: string) => Promise<boolean>;
  removeComment: (commentId: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function usePostSocial({
  postId,
  userId = null,
  enabled = true,
}: UsePostSocialOptions): UsePostSocialResult {
  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');

  // Guards against setState after unmount and against a stale response from a
  // previous postId overwriting the current one.
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  // Likes this tab just wrote. Realtime echoes our own INSERT/DELETE back to
  // us; without this the optimistic count would be applied twice.
  const selfLikeOpsRef = useRef(new Set<string>());
  // Same idea for comments: ignore the echo of a comment we already inserted.
  const selfCommentIdsRef = useRef(new Set<string>());

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const active = Boolean(enabled && postId);

  const load = useCallback(async () => {
    if (!active || !postId) return;
    const rid = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const [likeRes, commentRes] = await Promise.all([
      fetchLikesCount(postId, userId),
      fetchComments(postId),
    ]);

    if (!mountedRef.current || rid !== requestIdRef.current) return;

    if (likeRes.data) {
      setLikeCount(likeRes.data.count);
      setLikedByMe(likeRes.data.likedByMe);
    }
    if (commentRes.data) setComments(commentRes.data);

    const firstError = likeRes.error || commentRes.error;
    if (firstError) setError(firstError);
    setLoading(false);
  }, [active, postId, userId]);

  useEffect(() => {
    if (!active) {
      setLikeCount(0);
      setLikedByMe(false);
      setComments([]);
      setStatus('disconnected');
      return;
    }
    void load();
  }, [active, load]);

  // --------------------------------------------------------------------------
  // Realtime
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!active || !postId) return;

    setStatus('connecting');

    const channel = supabase
      .channel(`realtime:post-social:${postId}`)
      // ---- Likes -------------------------------------------------------
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_likes', filter: `post_id=eq.${postId}` },
        (payload) => {
          const row = payload.new as { user_id?: string };
          const key = `add:${row?.user_id}`;
          if (selfLikeOpsRef.current.delete(key)) return; // our own echo
          setLikeCount((c) => c + 1);
          if (row?.user_id && row.user_id === userId) setLikedByMe(true);
        },
      )
      .on(
        'postgres_changes',
        // NOTE: this filter only works because migration 0007 sets
        // REPLICA IDENTITY FULL — otherwise DELETE payloads carry the primary
        // key alone and would never match post_id.
        { event: 'DELETE', schema: 'public', table: 'post_likes', filter: `post_id=eq.${postId}` },
        (payload) => {
          const row = payload.old as { user_id?: string };
          const key = `del:${row?.user_id}`;
          if (selfLikeOpsRef.current.delete(key)) return;
          setLikeCount((c) => Math.max(0, c - 1));
          if (row?.user_id && row.user_id === userId) setLikedByMe(false);
        },
      )
      // ---- Comments ----------------------------------------------------
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` },
        async (payload) => {
          const row = payload.new as { id: string };
          if (!row?.id) return;
          if (selfCommentIdsRef.current.delete(row.id)) return;
          // The payload has no joined author, so re-read this post's comments
          // to pick up display name + avatar.
          const res = await fetchComments(postId);
          if (mountedRef.current && res.data) setComments(res.data);
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` },
        (payload) => {
          const row = payload.old as { id?: string };
          if (!row?.id) return;
          setComments((prev) => prev.filter((c) => c.id !== row.id));
        },
      )
      .subscribe((state) => {
        if (!mountedRef.current) return;
        if (state === 'SUBSCRIBED') setStatus('connected');
        else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
          setStatus('disconnected');
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [active, postId, userId]);

  // --------------------------------------------------------------------------
  // Mutations (optimistic, with rollback)
  // --------------------------------------------------------------------------
  const toggleLike = useCallback(async () => {
    if (!postId) return;
    if (!userId) {
      setError('Please sign in to like this post.');
      return;
    }

    const prevLiked = likedByMe;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;

    // Optimistic: paint immediately.
    setLikedByMe(nextLiked);
    setLikeCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));
    selfLikeOpsRef.current.add(nextLiked ? `add:${userId}` : `del:${userId}`);
    setError(null);

    const res = await toggleLikeApi(postId, userId);
    if (!mountedRef.current) return;

    if (res.error || !res.data) {
      // Roll back to the exact prior state.
      setLikedByMe(prevLiked);
      setLikeCount(prevCount);
      selfLikeOpsRef.current.delete(nextLiked ? `add:${userId}` : `del:${userId}`);
      setError(res.error || 'Could not update your like. Please try again.');
      return;
    }

    // Reconcile with the server's authoritative count.
    setLikedByMe(res.data.likedByMe);
    setLikeCount(res.data.count);
  }, [postId, userId, likedByMe, likeCount]);

  const addComment = useCallback(async (text: string): Promise<boolean> => {
    if (!postId) return false;
    if (!userId) {
      setError('Please sign in to comment.');
      return false;
    }
    const content = (text ?? '').trim();
    if (!content) {
      setError('Comment cannot be empty.');
      return false;
    }

    // Optimistic placeholder, replaced by the real row on success.
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimistic: PostComment = {
      id: tempId,
      postId,
      userId,
      content,
      createdAt: new Date().toISOString(),
      author: null,
    };
    setComments((prev) => [...prev, optimistic]);
    setSubmitting(true);
    setError(null);

    const res = await addCommentApi(postId, userId, content);
    if (!mountedRef.current) return false;
    setSubmitting(false);

    if (res.error || !res.data) {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setError(res.error || 'Could not post your comment. Please try again.');
      return false;
    }

    selfCommentIdsRef.current.add(res.data.id);
    setComments((prev) => {
      // Realtime may have already inserted the real row; avoid a duplicate.
      const withoutTemp = prev.filter((c) => c.id !== tempId && c.id !== res.data!.id);
      return [...withoutTemp, res.data!];
    });
    return true;
  }, [postId, userId]);

  const removeComment = useCallback(async (commentId: string) => {
    const snapshot = comments;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    const res = await deleteCommentApi(commentId);
    if (!mountedRef.current) return;
    if (res.error) {
      setComments(snapshot);
      setError(res.error);
    }
  }, [comments]);

  return {
    likeCount,
    likedByMe,
    comments,
    loading,
    submitting,
    error,
    status,
    toggleLike,
    addComment,
    removeComment,
    refresh: load,
    clearError: () => setError(null),
  };
}
