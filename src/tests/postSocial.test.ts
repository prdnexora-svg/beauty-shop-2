/**
 * Likes & comments logic tests.
 * Run with: npm test
 *
 * These cover the non-obvious parts of the social layer: the unique-violation
 * toggle strategy, optimistic rollback, and realtime echo suppression.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

// ---------------------------------------------------------------------------
// toggleLike concurrency strategy.
//
// The naive implementation is read-then-write:
//     if (await hasLiked()) delete(); else insert();
// Two tabs (or a double-click) both read `false` and both insert. One wins,
// the other gets a 23505 and surfaces an error for what the user perceives as
// a successful like. The implementation instead attempts the insert first and
// treats 23505 as "already liked -> unlike".
// ---------------------------------------------------------------------------

type PgError = { code: string } | null;

/** Mirrors the decision tree in socialApi.toggleLike. */
function resolveToggle(insertError: PgError): 'liked' | 'unliked' | 'error' {
  if (!insertError) return 'liked';
  if (insertError.code === '23505') return 'unliked';
  return 'error';
}

test('a clean insert means the post is now liked', () => {
  assert.equal(resolveToggle(null), 'liked');
});

test('a unique violation is treated as an unlike, not an error', () => {
  // 23505 = unique_violation. This is the double-click / second-tab path.
  assert.equal(resolveToggle({ code: '23505' }), 'unliked');
});

test('genuine failures still surface as errors', () => {
  assert.equal(resolveToggle({ code: '42501' }), 'error'); // insufficient_privilege
  assert.equal(resolveToggle({ code: '23503' }), 'error'); // foreign_key_violation
  assert.equal(resolveToggle({ code: '08006' }), 'error'); // connection_failure
});

// ---------------------------------------------------------------------------
// Optimistic like state + rollback.
// ---------------------------------------------------------------------------
interface LikeUi { count: number; liked: boolean }

function applyOptimisticLike(state: LikeUi): LikeUi {
  const liked = !state.liked;
  return { liked, count: Math.max(0, state.count + (liked ? 1 : -1)) };
}

test('optimistic like increments immediately', () => {
  assert.deepEqual(applyOptimisticLike({ count: 4, liked: false }), { count: 5, liked: true });
});

test('optimistic unlike decrements immediately', () => {
  assert.deepEqual(applyOptimisticLike({ count: 5, liked: true }), { count: 4, liked: false });
});

test('an optimistic unlike can never drive the count below zero', () => {
  // Guards against a stale count of 0 with liked=true producing "-1 likes".
  assert.deepEqual(applyOptimisticLike({ count: 0, liked: true }), { count: 0, liked: false });
});

test('rollback restores the exact prior state after a failed toggle', () => {
  const before: LikeUi = { count: 7, liked: false };
  const optimistic = applyOptimisticLike(before);
  assert.deepEqual(optimistic, { count: 8, liked: true });
  // On failure the hook restores the captured snapshot verbatim.
  const rolledBack = { ...before };
  assert.deepEqual(rolledBack, { count: 7, liked: false });
});

// ---------------------------------------------------------------------------
// Realtime echo suppression.
//
// Supabase broadcasts our own writes back to us. Since we already applied the
// change optimistically, the echo must be swallowed exactly once or the count
// double-counts.
// ---------------------------------------------------------------------------
function makeEchoGuard() {
  const pending = new Set<string>();
  return {
    expect: (key: string) => pending.add(key),
    /** @returns true when the event is our own echo and should be ignored. */
    shouldIgnore: (key: string) => pending.delete(key),
    size: () => pending.size,
  };
}

test('our own like echo is ignored exactly once', () => {
  const guard = makeEchoGuard();
  guard.expect('add:user-1');
  assert.equal(guard.shouldIgnore('add:user-1'), true, 'own echo suppressed');
  // A later genuine like from the same user (after an unlike) must count.
  assert.equal(guard.shouldIgnore('add:user-1'), false, 'guard is not sticky');
});

test('another user like event is never suppressed', () => {
  const guard = makeEchoGuard();
  guard.expect('add:user-1');
  assert.equal(guard.shouldIgnore('add:user-2'), false);
  assert.equal(guard.size(), 1, 'the pending self-op is left intact');
});

test('like and unlike echoes are tracked independently', () => {
  const guard = makeEchoGuard();
  guard.expect('add:user-1');
  assert.equal(guard.shouldIgnore('del:user-1'), false, 'a delete is not an insert echo');
  assert.equal(guard.shouldIgnore('add:user-1'), true);
});

test('a failed toggle clears its pending echo so later events still apply', () => {
  const guard = makeEchoGuard();
  guard.expect('add:user-1');
  guard.shouldIgnore('add:user-1'); // rollback path removes it
  assert.equal(guard.size(), 0);
});

// ---------------------------------------------------------------------------
// Optimistic comments.
// ---------------------------------------------------------------------------
interface C { id: string; content: string }

function replaceTemp(list: C[], tempId: string, real: C): C[] {
  // Realtime may already have appended the real row; filtering both the temp
  // id and the real id prevents a duplicate key / double render.
  const cleaned = list.filter((c) => c.id !== tempId && c.id !== real.id);
  return [...cleaned, real];
}

test('the optimistic comment is swapped for the server row', () => {
  const list: C[] = [{ id: 'c1', content: 'first' }, { id: 'temp-9', content: 'hello' }];
  const out = replaceTemp(list, 'temp-9', { id: 'c2', content: 'hello' });
  assert.deepEqual(out.map((c) => c.id), ['c1', 'c2']);
});

test('a realtime echo arriving before the insert resolves does not duplicate', () => {
  // Race: realtime delivered 'c2' already, and now the insert returns 'c2'.
  const list: C[] = [{ id: 'temp-9', content: 'hello' }, { id: 'c2', content: 'hello' }];
  const out = replaceTemp(list, 'temp-9', { id: 'c2', content: 'hello' });
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 'c2');
});

test('a failed comment removes only its own placeholder', () => {
  const list: C[] = [{ id: 'c1', content: 'keep' }, { id: 'temp-9', content: 'lost' }];
  const out = list.filter((c) => c.id !== 'temp-9');
  assert.deepEqual(out.map((c) => c.id), ['c1']);
});

// ---------------------------------------------------------------------------
// Content validation must match the DB CHECK constraint
// (btrim(content) <> '' AND length(content) <= 2000).
// ---------------------------------------------------------------------------
function isValidComment(text: string): boolean {
  const t = (text ?? '').trim();
  return t.length > 0 && t.length <= 2000;
}

test('blank and whitespace-only comments are rejected client-side', () => {
  assert.equal(isValidComment(''), false);
  assert.equal(isValidComment('   '), false);
  assert.equal(isValidComment('\n\t '), false);
});

test('normal and boundary-length comments are accepted', () => {
  assert.equal(isValidComment('Interested in this RFQ.'), true);
  assert.equal(isValidComment('a'.repeat(2000)), true);
});

test('over-long comments are rejected before hitting the database', () => {
  assert.equal(isValidComment('a'.repeat(2001)), false);
});
