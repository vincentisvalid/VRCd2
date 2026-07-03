/**
 * Data Access Abstraction Layer.
 *
 * A lightweight, dependency-free JSON key-value store. Each logical
 * collection persists to its own file under `data/` using atomic
 * write-then-rename semantics, with debounced flushes so hot paths
 * (e.g. prefix lookups) never block on disk I/O.
 *
 * The public surface intentionally mirrors a document store:
 *   db.collection('users').get(id) / .set(id, doc) / .update(id, fn)
 *   .delete(id) / .all() / .find(predicate)
 *
 * Swapping this file for a better-sqlite3 or NeDB implementation only
 * requires preserving that surface — nothing above this layer changes.
 */
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import path from 'node:path';
import { config, PROJECT_ROOT } from '../core/config.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('database');
const DATA_DIR = path.join(PROJECT_ROOT, config.database.directory);
const FLUSH_DEBOUNCE_MS = 250;

class Collection {
  constructor(name) {
    this.name = name;
    this.file = path.join(DATA_DIR, `${name}.json`);
    this.documents = new Map();
    this.flushTimer = null;
    this.load();
  }

  load() {
    try {
      if (existsSync(this.file)) {
        const parsed = JSON.parse(readFileSync(this.file, 'utf8'));
        for (const [key, value] of Object.entries(parsed)) this.documents.set(key, value);
      }
    } catch (error) {
      // A corrupt collection file must never take the bot down — start empty
      // and keep the broken file aside for manual recovery.
      log.error(`Failed to load collection "${this.name}":`, error.message);
      try {
        renameSync(this.file, `${this.file}.corrupt-${Date.now()}`);
      } catch {
        /* the original may not exist / not be movable — nothing else to do */
      }
    }
  }

  /** Debounced persistence — coalesces bursts of writes into one disk flush. */
  scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flushSync();
    }, FLUSH_DEBOUNCE_MS);
    // Never keep the event loop alive just for a pending flush.
    this.flushTimer.unref?.();
  }

  /** Atomic write: serialise to a temp file, then rename over the target. */
  flushSync() {
    try {
      const temp = `${this.file}.tmp`;
      writeFileSync(temp, JSON.stringify(Object.fromEntries(this.documents), null, 2));
      renameSync(temp, this.file);
    } catch (error) {
      log.error(`Failed to flush collection "${this.name}":`, error.message);
    }
  }

  get(key, fallback = null) {
    const value = this.documents.get(String(key));
    return value === undefined ? fallback : value;
  }

  has(key) {
    return this.documents.has(String(key));
  }

  set(key, value) {
    this.documents.set(String(key), value);
    this.scheduleFlush();
    return value;
  }

  /**
   * Read-modify-write helper. `mutator` receives the current document (or
   * `initial` when absent) and must return the replacement document.
   */
  update(key, mutator, initial = {}) {
    const current = this.get(key, initial);
    const next = mutator(structuredClone(current)) ?? current;
    return this.set(key, next);
  }

  delete(key) {
    const existed = this.documents.delete(String(key));
    if (existed) this.scheduleFlush();
    return existed;
  }

  /** Returns entries as `[key, document]` pairs. */
  all() {
    return [...this.documents.entries()];
  }

  find(predicate) {
    return this.all().filter(([key, value]) => predicate(value, key));
  }

  get size() {
    return this.documents.size;
  }
}

class Database {
  constructor() {
    mkdirSync(DATA_DIR, { recursive: true });
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) this.collections.set(name, new Collection(name));
    return this.collections.get(name);
  }

  /** Force-persist everything — called from shutdown hooks. */
  flushAll() {
    for (const collection of this.collections.values()) collection.flushSync();
  }
}

export const db = new Database();

// Guarantee durability on clean shutdowns and fatal signals alike.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    db.flushAll();
    process.exit(0);
  });
}
process.once('exit', () => db.flushAll());

export default db;
