import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface StoredResult {
  id: string;
  imageUrl: string;
  label: string;
  confidence: number;
  timestamp: string;

  accessories?: string[];
  rawResult?: any;
}

interface FashionDB extends DBSchema {
  results: {
    key: string;
    value: StoredResult;
    indexes: { 'by-timestamp': string };
  };
}

const DB_NAME = 'fashion-db';
const STORE_NAME = 'results';

let dbPromise: Promise<IDBPDatabase<FashionDB>>;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<FashionDB>(DB_NAME, 1, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
};

export const saveResult = async (result: StoredResult) => {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, result);
  } catch (error) {
    console.error("Failed to save result to IndexedDB:", error);
    throw error;
  }
};

export const getResults = async (): Promise<StoredResult[]> => {
  try {
    const db = await getDB();
    // Get all results and sort by timestamp descending
    const results = await db.getAllFromIndex(STORE_NAME, 'by-timestamp');
    return results.reverse();
  } catch (error) {
    console.error("Failed to load results from IndexedDB:", error);
    return [];
  }
};

export const clearResults = async () => {
  const db = await getDB();
  await db.clear(STORE_NAME);
};

export const deleteResult = async (id: string) => {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  } catch (error) {
    console.error("Failed to delete result from IndexedDB:", error);
    throw error;
  }
};
