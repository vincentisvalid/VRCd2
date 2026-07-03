/** .games — preferred / frequently played titles on the user profile card. */
import { makeProfileFieldCommand } from './_profileField.js';

export default makeProfileFieldCommand({
  name: 'games',
  aliases: [],
  field: 'games',
  label: 'Games list',
  emoji: '🎮',
  description: 'Sets the games list on your profile card.',
  maxLength: 400,
});
