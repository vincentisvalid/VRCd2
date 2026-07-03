import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class LocalJSONDatabase {
  constructor(tableName) {
    this.filePath = path.join(DATA_DIR, `${tableName}.json`);
    this.cache = {};
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        this.cache = JSON.parse(fileContent || '{}');
      } else {
        this.cache = {};
        this.save();
      }
    } catch (error) {
      console.error(`[DB Error] Failed to load table ${this.filePath}:`, error);
      this.cache = {};
    }
  }

  save() {
    try {
      // Atomic-like write
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.cache, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (error) {
      console.error(`[DB Error] Failed to save table ${this.filePath}:`, error);
    }
  }

  get(key, defaultValue = null) {
    return this.cache[key] !== undefined ? this.cache[key] : defaultValue;
  }

  set(key, value) {
    this.cache[key] = value;
    this.save();
  }

  delete(key) {
    if (this.cache[key] !== undefined) {
      delete this.cache[key];
      this.save();
    }
  }

  all() {
    return { ...this.cache };
  }

  clear() {
    this.cache = {};
    this.save();
  }
}

// Instantiate database tables
export const db = {
  profiles: new LocalJSONDatabase('profiles'),
  quotes: new LocalJSONDatabase('quotes'),
  embeds: new LocalJSONDatabase('embeds'),
  reactionRoles: new LocalJSONDatabase('reaction_roles'),
  reminders: new LocalJSONDatabase('reminders'),
  settings: new LocalJSONDatabase('settings'),
  autoroles: new LocalJSONDatabase('autoroles'),
  jails: new LocalJSONDatabase('jails'),
};

console.log('[Database] Lightweight JSON Database initialization complete.');
