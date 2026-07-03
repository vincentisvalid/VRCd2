/** .career — professional designation in the server directory cache. */
import { makeProfileFieldCommand } from './_profileField.js';

export default makeProfileFieldCommand({
  name: 'career',
  aliases: ['job'],
  field: 'career',
  label: 'Career',
  emoji: '💼',
  description: 'Sets your professional designation on your profile.',
  maxLength: 200,
});
