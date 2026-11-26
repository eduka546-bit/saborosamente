// Persistência local de campanhas em elaboração. Não guarda autorizações de envio.
const DRAFT_VERSION = 1;
const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MEDIA_DB = "saborosamente-campaign-drafts";
const MEDIA_STORE = "media";

export function readCampaignDraft<T extends object>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as { version?: number; savedAt?: number; value?: unknown };
    if (stored.version !== DRAFT_VERSION || typeof stored.savedAt !== "number" ||
      stored.savedAt > Date.now() || Date.now() - stored.savedAt > DRAFT_MAX_AGE_MS ||
      !stored.value || typeof stored.value !== "object" || Array.isArray(stored.value)) return fallback;
    return { ...fallback, ...stored.value };
  } catch {
    return fallback;
  }
}

export function writeCampaignDraft<T extends object>(key: string, value: T): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify({
      version: DRAFT_VERSION, savedAt: Date.now(), value,
    }));
    return true;
  } catch {
    return false;
  }
}

export function clearCampaignDraft(key: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(key); } catch { /* armazenamento indisponível */ }
}

type SavedMedia = {
  blob: Blob;
  name: string;
  type: string;
  lastModified: number;
  kind: "imagem" | "video";
};

function openMediaDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(MEDIA_DB, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(MEDIA_STORE)) {
          request.result.createObjectStore(MEDIA_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveCampaignMediaDraft(
  key: string, file: File, kind: "imagem" | "video",
): Promise<boolean> {
  const db = await openMediaDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(MEDIA_STORE, "readwrite");
      tx.objectStore(MEDIA_STORE).put({
        blob: file, name: file.name, type: file.type, lastModified: file.lastModified, kind,
      } satisfies SavedMedia, key);
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onerror = () => { db.close(); resolve(false); };
      tx.onabort = () => { db.close(); resolve(false); };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

export async function loadCampaignMediaDraft(
  key: string,
): Promise<{ file: File; kind: "imagem" | "video" } | null> {
  const db = await openMediaDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(MEDIA_STORE, "readonly");
      const request = tx.objectStore(MEDIA_STORE).get(key);
      request.onsuccess = () => {
        const media = request.result as SavedMedia | undefined;
        if (!media?.blob || !["imagem", "video"].includes(media.kind)) {
          resolve(null);
        } else {
          resolve({
            kind: media.kind,
            file: new File([media.blob], media.name || "arquivo", {
              type: media.type, lastModified: media.lastModified,
            }),
          });
        }
      };
      request.onerror = () => resolve(null);
      tx.oncomplete = () => db.close();
      tx.onabort = () => { db.close(); resolve(null); };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function clearCampaignMediaDraft(key: string): Promise<void> {
  const db = await openMediaDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(MEDIA_STORE, "readwrite");
      tx.objectStore(MEDIA_STORE).delete(key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); resolve(); };
    } catch {
      db.close();
      resolve();
    }
  });
}
