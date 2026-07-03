/** .musicgenre — preferred music index for user-to-user discovery. */
import { makeProfileFieldCommand } from './_profileField.js';

export default makeProfileFieldCommand({
  name: 'musicgenre',
  aliases: ['genre'],
  field: 'musicGenres',
  label: 'Music genres',
  emoji: '🎶',
  description: 'Sets your preferred music genres for discovery.',
  maxLength: 300,
});
