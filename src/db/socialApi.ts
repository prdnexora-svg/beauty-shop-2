// ============================================================================
// NEXORA LUXE — POST LIKES & COMMENTS DATA ACCESS
// ----------------------------------------------------------------------------
// Thin, typed wrappers over Supabase for the social layer on the sourcing feed
// (see migration 0007). Every function returns a discriminated result instead
// of throwing, matching the error-handling style used by src/db/api.ts.
//
// "post" here means a row in `rfqs_enquiries` — this schema has no `posts`
// table. See the migration header.
// ============================================================================

import { supabase } from '../lib/supabase';

export interface PostAuthor {
  id: string;
  displayName: string;
  companyName: string | null;
  avatarUrl: string | null;
  role: string | null;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  author: PostAuthor | null;
}

export interface LikeState {
  postId: string;
  count: number;
  likedByMe: boolean;
}

export interface Result<T> {
  data: T | null;
  error: string | null;
}

const ok = <T,>(data: T): Result<T> => ({ data, error: null });
const fail = <T,>(error: string): Result<T> => ({ data: null, error });

/** Shape returned by the embedded `user_public_profiles` join. */
interface RawAuthor {
  id: string;
  display_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  role: string | null;
}

function mapAuthor(raw: RawAuthor | RawAuthor[] | null | undefined): PostAuthor | null {
  // PostgREST returns an object for a to-one embed, but an array when it
  // cannot prove the relationship is to-one (which is the case for a view).
  const a = Array.isArray(raw) ? raw[0] : raw;
  if (!a) return null;
  return {
    id: a.id,
    displayName: a.display_name || 'Nexora Member',
    companyName: a.company_name ?? null,
    avatarUrl: a.avatar_url ?? null,
    role: a.role ?? null,
  };
}

// ============================================================================
// LIKES
// ============================================================================

/**
 * Add or remove the current user's like.
 *
 * Deliberately NOT implemented as "read, then decide, then write" — two tabs
 * or a double-click would both read `liked: false` and both try to insert.
 * Instead we attempt the insert and treat a unique-violation (23505) as
 * "already liked", falling through to the delete. The database, not the
 * client, is the arbiter.
 *
 * Returns the authoritative post-toggle state.
 */
export async function toggleLike(postId: string, userId: string): Promise<Result<LikeState>> {
  if (!postId || !userId) return fail('A post and a signed-in user are required to like.');

  const { error: insertError } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, user_id: userId });

  let likedByMe: boolean;

  if (!insertError) {
    likedByMe = true;
  } else if (insertError.code === '23505') {
    // Already liked -> this toggle means "unlike".
    const { error: deleteError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (deleteError) return fail(deleteError.message);
    likedByMe = false;
  } else if (insertError.code === '42501' || insertError.code === '42P01') {
    return fail('You do not have permission to like this post. Please sign in again.');
  } else {
    return fail(insertError.message);
  }

  const { count, error: countError } = await supabase
    .from('post_likes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (countError) return fail(countError.message);
  return ok({ postId, count: count ?? 0, likedByMe });
}

/** Total likes for a post plus whether `userId` is among them. */
export async function fetchLikesCount(postId: string, userId?: string | null): Promise<Result<LikeState>> {
  if (!postId) return fail('A post id is required.');

  const { count, error } = await supabase
    .from('post_likes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (error) return fail(error.message);

  let likedByMe = false;
  if (userId) {
    // maybeSingle() returns null rather than erroring when there is no row.
    const { data, error: mineError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();
    if (mineError) return fail(mineError.message);
    likedByMe = Boolean(data);
  }

  return ok({ postId, count: count ?? 0, likedByMe });
}

/**
 * Batched counts for a feed. One round trip instead of N.
 * Falls back to per-post queries if the RPC is missing (migration not applied).
 */
export async function fetchLikeCountsFor(postIds: string[], userId?: string | null): Promise<Result<LikeState[]>> {
  if (postIds.length === 0) return ok([]);

  const { data, error } = await supabase.rpc('get_post_like_counts', { post_ids: postIds });

  if (error) {
    const results = await Promise.all(postIds.map((id) => fetchLikesCount(id, userId)));
    const firstError = results.find((r) => r.error);
    if (firstError?.error) return fail(firstError.error);
    return ok(results.map((r) => r.data!).filter(Boolean));
  }

  return ok(
    (data as { post_id: string; like_count: number; liked_by_me: boolean }[]).map((r) => ({
      postId: r.post_id,
      count: Number(r.like_count) || 0,
      likedByMe: Boolean(r.liked_by_me),
    })),
  );
}

// ============================================================================
// COMMENTS
// ============================================================================

const COMMENT_SELECT = `
  id,
  post_id,
  user_id,
  content,
  created_at,
  author:user_public_profiles!post_comments_user_id_fkey (
    id, display_name, company_name, avatar_url, role
  )
`;

/** Comments for a post, oldest first, with author display details attached. */
export async function fetchComments(postId: string): Promise<Result<PostComment[]>> {
  if (!postId) return fail('A post id is required.');

  const { data, error } = await supabase
    .from('post_comments')
    .select(COMMENT_SELECT)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    // The embed relies on a FK that PostgREST can only resolve to a table, not
    // a view. If the relationship cannot be inferred, retry flat and hydrate
    // authors separately rather than showing the user nothing.
    if (error.code === 'PGRST200' || /relationship|schema cache/i.test(error.message)) {
      return fetchCommentsFallback(postId);
    }
    return fail(error.message);
  }

  return ok(
    (data ?? []).map((row: any) => ({
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      content: row.content,
      createdAt: row.created_at,
      author: mapAuthor(row.author),
    })),
  );
}

/** Two-query path used when PostgREST cannot infer the view relationship. */
async function fetchCommentsFallback(postId: string): Promise<Result<PostComment[]>> {
  const { data, error } = await supabase
    .from('post_comments')
    .select('id, post_id, user_id, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) return fail(error.message);
  const rows = data ?? [];
  if (rows.length === 0) return ok([]);

  const authorIds = [...new Set(rows.map((r: any) => r.user_id))];
  const { data: authors } = await supabase
    .from('user_public_profiles')
    .select('id, display_name, company_name, avatar_url, role')
    .in('id', authorIds);

  const byId = new Map((authors ?? []).map((a: any) => [a.id, mapAuthor(a)]));

  return ok(
    rows.map((row: any) => ({
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      content: row.content,
      createdAt: row.created_at,
      author: byId.get(row.user_id) ?? null,
    })),
  );
}

/** Insert a comment and return it with its author hydrated. */
export async function addComment(
  postId: string,
  userId: string,
  commentText: string,
): Promise<Result<PostComment>> {
  if (!postId || !userId) return fail('A post and a signed-in user are required to comment.');

  // Mirror the CHECK constraint client-side for an instant, friendlier error.
  const content = (commentText ?? '').trim();
  if (!content) return fail('Comment cannot be empty.');
  if (content.length > 2000) return fail('Comment is too long (2000 characters maximum).');

  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select(COMMENT_SELECT)
    .single();

  if (error) {
    if (error.code === '23503') return fail('That post no longer exists.');
    if (error.code === '42501') return fail('You do not have permission to comment. Please sign in again.');
    if (error.code === 'PGRST200' || /relationship|schema cache/i.test(error.message)) {
      const flat = await supabase
        .from('post_comments')
        .insert({ post_id: postId, user_id: userId, content })
        .select('id, post_id, user_id, content, created_at')
        .single();
      if (flat.error) return fail(flat.error.message);
      return ok({
        id: flat.data.id,
        postId: flat.data.post_id,
        userId: flat.data.user_id,
        content: flat.data.content,
        createdAt: flat.data.created_at,
        author: null,
      });
    }
    return fail(error.message);
  }

  const row = data as any;
  return ok({
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    author: mapAuthor(row.author),
  });
}

/** Delete a comment. RLS guarantees only the author can succeed. */
export async function deleteComment(commentId: string): Promise<Result<true>> {
  if (!commentId) return fail('A comment id is required.');
  const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
  if (error) return fail(error.message);
  return ok(true as const);
}
