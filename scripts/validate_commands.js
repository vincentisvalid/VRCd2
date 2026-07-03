import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMMANDS_DIR = path.join(__dirname, '../src/commands');

async function validate() {
  const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.js'));
  
  for (const file of files) {
    try {
      const modulePath = path.join(COMMANDS_DIR, file);
      const { default: commands } = await import(`file://${modulePath}`);
      
      if (!commands || !Array.isArray(commands)) continue;
      
      for (const cmd of commands) {
        if (!cmd.name) {
          console.warn(`[Warning] Command in ${file} is missing a name.`);
          continue;
        }
        
        // Command name validation
        if (cmd.name.length > 32 || cmd.name.length < 1) {
          console.error(`[Error] Command "${cmd.name}" in ${file}: name length ${cmd.name.length} is invalid (must be 1-32).`);
        }
        if (!/^[-_\w]{1,32}$/.test(cmd.name)) {
          console.error(`[Error] Command "${cmd.name}" in ${file}: name contains invalid characters.`);
        }
        
        // Command description validation
        if (cmd.description) {
          if (cmd.description.length > 100) {
            console.error(`[Error] Command "${cmd.name}" in ${file}: description length ${cmd.description.length} exceeds 100 chars: "${cmd.description}"`);
          }
        } else {
          console.warn(`[Warning] Command "${cmd.name}" in ${file} is missing a description.`);
        }
        
        // Options validation
        if (cmd.options && Array.isArray(cmd.options)) {
          for (const opt of cmd.options) {
            if (!opt.name) {
              console.error(`[Error] Command "${cmd.name}" in ${file} has an option missing a name.`);
              continue;
            }
            if (opt.name.length > 32 || opt.name.length < 1) {
              console.error(`[Error] Command "${cmd.name}" option "${opt.name}" in ${file}: name length is invalid (must be 1-32).`);
            }
            if (!opt.description) {
              console.error(`[Error] Command "${cmd.name}" option "${opt.name}" in ${file} is missing a description.`);
              continue;
            }
            if (opt.description.length > 100) {
              console.error(`[Error] Command "${cmd.name}" option "${opt.name}" in ${file}: description length ${opt.description.length} exceeds 100 chars: "${opt.description}"`);
            }
          }
        }
      }
    } catch (err) {
      console.error(`[Error] Failed to load/validate ${file}:`, err.message);
    }
  }
}

validate();
