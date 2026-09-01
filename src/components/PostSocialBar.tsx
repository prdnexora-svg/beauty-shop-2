import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { usePostSocial } from '../hooks/usePostSocial';

interface PostSocialBarProps {
  postId: string;
  /** Current auth user id, or null when signed out. */
  userId?: string | null;
  /** False in demo mode (Supabase not configured). */
  enabled?: boolean;
  /** Prompt sign-in when a signed-out visitor tries to interact. */
  onRequireAuth?: () => void;
}

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

/**
 * Like + comment affordances for a single feed post.
 * All state, optimistic updates and realtime sync live in usePostSocial.
 */
export const PostSocialBar: React.FC<PostSocialBarProps> = ({
  postId,
  userId = null,
  enabled = true,
  onRequireAuth,
}) => {
  const {
    likeCount, likedByMe, comments, loading, submitting, error,
    toggleLike, addComment, removeComment, clearError,
  } = usePostSocial({ postId, userId, enabled });

  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState('');

  const requireAuth = () => {
    if (userId) return false;
    onRequireAuth?.();
    return true;
  };

  const handleLike = () => {
    if (requireAuth()) return;
    void toggleLike();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requireAuth()) return;
    const text = draft.trim();
    if (!text) return;
    // Clear the field immediately; restore it only if the post failed.
    setDraft('');
    const okResult = await addComment(text);
    if (!okResult) setDraft(text);
  };

  return (
    <div className="border-t border-[#F0E6F3] pt-3 mt-3">
      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          aria-pressed={likedByMe}
          aria-label={likedByMe ? 'Unlike this request' : 'Like this request'}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-[#5B4A6E] hover:text-[#6B2D8C] transition-colors cursor-pointer group"
        >
          <Heart
            className={`w-[18px] h-[18px] transition-all group-active:scale-90 ${
              likedByMe ? 'fill-[#E23A6E] text-[#E23A6E]' : ''
            }`}
          />
          <span className={likedByMe ? 'text-[#E23A6E]' : ''}>{likeCount}</span>
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-[#5B4A6E] hover:text-[#6B2D8C] transition-colors cursor-pointer"
        >
          <MessageCircle className="w-[18px] h-[18px]" />
          <span>{comments.length}</span>
        </button>

        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7E6C96]" />}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[12px] font-semibold"
        >
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="underline cursor-pointer shrink-0">Dismiss</button>
        </div>
      )}

      {showComments && (
        <div className="mt-3 space-y-3">
          {comments.length === 0 && !loading && (
            <p className="text-[12px] text-[#7E6C96]">No comments yet. Start the conversation.</p>
          )}

          {comments.map((c) => {
            const name = c.author?.displayName || 'Nexora Member';
            const pending = c.id.startsWith('temp-');
            return (
              <div key={c.id} className={`flex gap-2.5 ${pending ? 'opacity-60' : ''}`}>
                {c.author?.avatarUrl ? (
                  <img src={c.author.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#F5EEF8] text-[#6B2D8C] text-[10px] font-bold flex items-center justify-center shrink-0">
                    {initials(name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[12px] font-bold text-[#2A0E3F]">{name}</span>
                    {c.author?.companyName && (
                      <span className="text-[11px] text-[#7E6C96] truncate">{c.author.companyName}</span>
                    )}
                    <span className="text-[11px] text-[#9C8DB0]">
                      {pending ? 'sending…' : timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#4E3D63] break-words whitespace-pre-wrap">{c.content}</p>
                </div>
                {userId === c.userId && !pending && (
                  <button
                    onClick={() => void removeComment(c.id)}
                    aria-label="Delete comment"
                    className="text-[#9C8DB0] hover:text-red-600 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={userId ? 'Write a comment…' : 'Sign in to comment'}
              maxLength={2000}
              aria-label="Write a comment"
              className="flex-1 bg-[#F6F1FA] border border-[#E8DEEF] focus:border-[#C9A961] rounded-xl px-3 py-2 text-[13px] text-[#2A0E3F] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={submitting || !draft.trim()}
              aria-label="Post comment"
              className="w-9 h-9 rounded-xl bg-[#6B2D8C] hover:bg-[#4A2560] disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
