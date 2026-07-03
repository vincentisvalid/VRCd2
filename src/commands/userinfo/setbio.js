/** .setbio — editable introductory text block on the user profile. */
import { makeProfileFieldCommand } from './_profileField.js';

export default makeProfileFieldCommand({
  name: 'setbio',
  aliases: ['bio'],
  field: 'bio',
  label: 'Bio',
  emoji: '📝',
  description: 'Sets your profile bio (an introductory text block).',
  maxLength: 500,
});
