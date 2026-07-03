import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMMANDS_DIR = path.join(__dirname, '../src/commands');

async function inspect() {
  const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.js'));
  
  for (const file of files) {
    const fileUrl = pathToFileURL(path.join(COMMANDS_DIR, file)).href;
    const module = await import(fileUrl);
    const cmdList = module.default;
    if (Array.isArray(cmdList)) {
      console.log(`${file}: ${cmdList.length} commands`);
    } else {
      console.log(`${file}: Not an array`);
    }
  }
}

inspect();
