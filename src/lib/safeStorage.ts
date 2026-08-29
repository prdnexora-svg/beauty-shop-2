// ============================================================================
// NEXORA LUXE — GUARDED LOCAL STORAGE
//
// The data stores read localStorage straight from `useState` initializers, so
// they execute during render — including under SSR, in unit tests, and in any
// browser context where storage is blocked (Safari private mode, third-party
// iframe, storage-partitioning). An unguarded `localStorage` is a ReferenceError
// or a SecurityError that takes the whole component tree down.
//
// Every store should go through this module. It never throws: when storage is
// unavailable it transparently degrades to an in-memory map for the session.
// ============================================================================

const memory = new Map<string, string>();

function backend(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    // Touching the object is what throws when access is denied, not the typeof.
    const probe = '__nexora_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

let cached: Storage | null | undefined;
function store(): Storage | null {
  if (cached === undefined) cached = backend();
  return cached;
}

export function readStorage(key: string): string | null {
  const s = store();
  if (s) {
    try {
      return s.getItem(key);
    } catch {
      /* fall through to memory */
    }
  }
  return memory.get(key) ?? null;
}

export function writeStorage(key: string, value: string): void {
  const s = store();
  if (s) {
    try {
      s.setItem(key, value);
      return;
    } catch {
      /* quota exceeded or access denied — fall through to memory */
    }
  }
  memory.set(key, value);
}

export function removeStorage(key: string): void {
  const s = store();
  if (s) {
    try {
      s.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  memory.delete(key);
}

/** Test seam: forget whether real storage is available. */
export function resetStorageProbe(): void {
  cached = undefined;
}
