/**
 * Humanizer — tiny phrasing library that keeps the bot's voice warm and
 * varied instead of robotic. Every helper returns a randomly chosen line
 * so repeated interactions never read like a template.
 */

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

const LINES = {
  working: [
    'On it — give me a moment…',
    'Working on that for you…',
    'Spinning that up now…',
    'One sec, crunching…',
    'Give me a beat…',
  ],
  done: [
    'All set!',
    'Done — here you go.',
    'Sorted.',
    'There we go.',
    'Finished up.',
  ],
  timeout: [
    'I waited as long as I could — run the command again whenever you’re ready.',
    'No rush! This menu closed itself, just run the command again when you want to continue.',
    'Looks like you stepped away — this session closed. Fire it up again anytime.',
  ],
  cancelled: [
    'No worries — nothing was changed.',
    'Cancelled. Everything stays as it was.',
    'Okay, backing off — no action taken.',
  ],
  notYours: [
    'This menu belongs to someone else — run the command yourself and I’ll set one up for you.',
    'Careful, that’s someone else’s session! Run the command to get your own.',
    'Only the person who opened this can use it — but you can run the command too!',
  ],
  helpIntro: [
    'What are we doing today? Pick a category below to browse.',
    'Here’s everything I can do — choose a category to dig in.',
    'Browse my toolkit with the menu below — every command mirrors a slash command too.',
  ],
  pollFooter: [
    'Tap a button to cast your vote — tap again to retract it.',
    'One vote per person — you can change it anytime.',
    'Votes update live. Choose wisely!',
  ],
};

/** `flavor('working')` → a random human line for that moment. */
export function flavor(key) {
  const options = LINES[key];
  return options ? pick(options) : '';
}

export default flavor;
