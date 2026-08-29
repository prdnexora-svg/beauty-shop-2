// ============================================================================
// NEXORA LUXE — STORAGE HEALTH PANEL
// In-app diagnostics for the media system: bucket inventory, client-side
// limits, and a live end-to-end self test (upload -> ledger -> read ->
// signed URL -> RLS probe -> cleanup) that runs against the real project.
// ============================================================================

import React, { useCallback, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  HardDrive,
  Loader2,
  Lock,
  Play,
  Globe,
  XCircle,
} from 'lucide-react';
import {
  ALL_BUCKETS,
  MediaBucketId,
  formatBytes,
  isStorageConfigured,
} from '../../lib/mediaConfig';
import {
  MediaAsset,
  SelfTestReport,
  SelfTestStep,
  listMedia,
  resolveMediaUrl,
  runStorageSelfTest,
} from '../../lib/mediaService';
import { useMediaOwner } from '../../hooks/useMediaOwner';

const STATUS_STYLES: Record<SelfTestStep['status'], { className: string; label: string }> = {
  pending: { className: 'bg-stone-100 text-stone-500 border-stone-200', label: 'Pending' },
  running: { className: 'bg-sky-50 text-sky-700 border-sky-200', label: 'Running' },
  passed: { className: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Passed' },
  failed: { className: 'bg-red-50 text-red-700 border-red-200', label: 'Failed' },
  skipped: { className: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Skipped' },
};

function StatusIcon({ status }: { status: SelfTestStep['status'] }) {
  if (status === 'running') return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
  if (status === 'passed') return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (status === 'failed') return <XCircle className="w-3.5 h-3.5" />;
  if (status === 'skipped') return <AlertCircle className="w-3.5 h-3.5" />;
  return <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />;
}

export const StorageHealthPanel: React.FC = () => {
  const configured = isStorageConfigured();
  const { ownerId, isAuthenticated, isDemo } = useMediaOwner();
  const [report, setReport] = useState<SelfTestReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const runTest = useCallback(async () => {
    setIsRunning(true);
    setReport(null);
    try {
      const result = await runStorageSelfTest(ownerId);
      setReport(result);
    } catch (err: any) {
      setReport({
        configured,
        steps: [
          {
            id: 'fatal',
            label: 'Self test crashed',
            status: 'failed',
            detail: err?.message || String(err),
          },
        ],
        passed: 0,
        failed: 1,
      });
    } finally {
      setIsRunning(false);
    }
  }, [configured, ownerId]);

  const loadAssets = useCallback(async () => {
    setListError(null);
    try {
      const result = await listMedia({ ownerId: ownerId || undefined, limit: 50 });
      setAssets(result);
    } catch (err: any) {
      setListError(err?.message || 'Could not list media assets.');
      setAssets([]);
    }
  }, [ownerId]);

  const openAsset = useCallback(async (asset: MediaAsset) => {
    const url = await resolveMediaUrl(asset);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className="flex-1 overflow-auto p-5 space-y-5 custom-scrollbar bg-[#FDFBF7]">
      {/* Status banner */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5D8EE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              configured
                ? 'bg-[#3ECF8E]/15 text-[#3ECF8E] border-[#3ECF8E]/30'
                : 'bg-amber-100 text-amber-700 border-amber-300'
            }`}
          >
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-[#2A0E3F]">Supabase Storage &amp; Media</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                  configured
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {configured ? 'Storage configured' : 'Local demo mode'}
              </span>
            </div>
            <p className="text-xs text-[#5B4A6E] font-medium mt-1 max-w-xl">
              {configured
                ? 'Uploads are written to Supabase Storage under owner-scoped paths, recorded in the media_assets ledger, and governed by storage RLS policies.'
                : 'No Supabase project is configured, so uploads stay in this browser and are labelled as local demo media. Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY and run migration 0005_media_storage.sql to persist them.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void loadAssets()}
            className="px-3.5 py-2 rounded-xl border border-[#E5D8EE] bg-white text-[#2A0E3F] text-[11px] font-bold hover:bg-[#F5EEF8] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            List my media
          </button>
          <button
            type="button"
            onClick={() => void runTest()}
            disabled={isRunning}
            className="px-3.5 py-2 rounded-xl bg-[#6B2D8C] text-white text-[11px] font-bold hover:bg-[#4A2560] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Running…' : 'Run storage self-test'}
          </button>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {isDemo
              ? 'No local demo session found — sign in to enable uploads.'
              : 'Sign in to run the upload tests: storage policies key every write to the authenticated user.'}
          </span>
        </div>
      )}

      {/* Bucket inventory */}
      <section className="bg-white border border-[#E5D8EE] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F4F0E9] flex items-center justify-between">
          <h4 className="text-[13px] font-black text-[#2A0E3F] flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-[#6B2D8C]" />
            Buckets
          </h4>
          <span className="text-[10px] font-bold text-[#7E6C96]">
            Defined in 0005_media_storage.sql
          </span>
        </div>
        <div className="divide-y divide-[#F4F0E9]">
          {ALL_BUCKETS.map((bucket) => (
            <div key={bucket.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 min-w-[200px]">
                {bucket.visibility === 'public' ? (
                  <Globe className="w-3.5 h-3.5 text-[#3ECF8E]" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                )}
                <code className="text-[11.5px] font-bold text-[#2A0E3F]">{bucket.id}</code>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${
                    bucket.visibility === 'public'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {bucket.visibility}
                </span>
              </div>
              <p className="text-[10.5px] text-[#5B4A6E] font-medium flex-1">{bucket.description}</p>
              <div className="text-[10px] font-bold text-[#7E6C96] shrink-0">
                {bucket.kinds.join(' / ')} · max {formatBytes(bucket.maxBytes)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Self-test results */}
      {report && (
        <section className="bg-white border border-[#E5D8EE] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F4F0E9] flex items-center justify-between">
            <h4 className="text-[13px] font-black text-[#2A0E3F]">Self-test results</h4>
            <span className="text-[10px] font-bold text-[#7E6C96]">
              {report.passed} passed · {report.failed} failed
              {(() => {
                const skipped = report.steps.filter((s) => s.status === 'skipped').length;
                return skipped > 0 ? ` · ${skipped} skipped` : '';
              })()}
            </span>
          </div>
          <div className="divide-y divide-[#F4F0E9]">
            {(report.steps as SelfTestStep[]).map((step) => {
              const style = STATUS_STYLES[step.status];
              return (
                <div key={step.id} className="px-4 py-2.5 flex items-start gap-3">
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${style.className}`}
                  >
                    <StatusIcon status={step.status} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11.5px] font-bold text-[#2A0E3F]">{step.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${style.className}`}
                      >
                        {style.label}
                      </span>
                      {step.durationMs !== undefined && (
                        <span className="text-[9.5px] font-mono text-[#7E6C96]">{step.durationMs}ms</span>
                      )}
                    </div>
                    {step.detail && (
                      <p className="text-[10.5px] text-[#5B4A6E] font-medium mt-0.5 break-all">
                        {step.detail}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Media ledger preview */}
      {assets && (
        <section className="bg-white border border-[#E5D8EE] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F4F0E9] flex items-center justify-between">
            <h4 className="text-[13px] font-black text-[#2A0E3F]">
              My media assets ({assets.length})
            </h4>
            <button
              type="button"
              onClick={() => setAssets(null)}
              className="text-[10px] font-bold text-[#7E6C96] hover:text-[#2A0E3F]"
            >
              Hide
            </button>
          </div>
          {listError && (
            <p className="px-4 py-3 text-[11px] font-bold text-red-600">{listError}</p>
          )}
          {!listError && assets.length === 0 && (
            <p className="px-4 py-6 text-center text-[11px] font-bold text-[#7E6C96]">
              No media recorded yet.
            </p>
          )}
          <div className="divide-y divide-[#F4F0E9] max-h-72 overflow-auto">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => void openAsset(asset)}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-[#FDFBF7] transition-colors"
              >
                <span className="px-1.5 py-0.5 rounded bg-[#F5EEF8] text-[#6B2D8C] text-[9px] font-black uppercase shrink-0">
                  {asset.bucket as MediaBucketId}
                </span>
                <span className="text-[11px] font-bold text-[#2A0E3F] truncate flex-1">
                  {asset.originalName || asset.path}
                </span>
                <span className="text-[9.5px] text-[#7E6C96] shrink-0">
                  {formatBytes(asset.byteSize)}
                </span>
                {asset.isLocal && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase shrink-0">
                    demo
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default StorageHealthPanel;
