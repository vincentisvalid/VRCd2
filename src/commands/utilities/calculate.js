/**
 * .calculate — sanitised expression evaluation through the shunting-yard
 * engine in utils/math.js. No eval(), no Function(), no execution risk.
 */
import { brandEmbed } from '../../core/embeds.js';
import { evaluateExpression } from '../../utils/math.js';
import { truncate } from '../../utils/text.js';

export default {
  name: 'calculate',
  category: 'Utilities',
  description: 'Evaluates a math expression safely (supports ^ % sqrt sin cos log pi e …).',
  usage: '.calculate <expression>  — e.g. .calculate (2+3)^2 / sqrt(16)',
  aliases: ['calc', 'math'],
  cooldownMs: 2000,
  options: [{ name: 'expression', type: 'string', description: 'The expression to evaluate', required: true, rest: true }],
  async execute(ctx) {
    const expression = ctx.getOption('expression');

    let result;
    try {
      result = evaluateExpression(expression);
    } catch (error) {
      return ctx.replyError('Cannot evaluate', error.message);
    }

    // Render cleanly: integers plain, floats trimmed to 10 significant digits.
    const rendered = Number.isInteger(result) ? result.toLocaleString() : String(Number(result.toPrecision(10)));
    const embed = brandEmbed()
      .setTitle('🧮 Result')
      .setDescription(`\`${truncate(expression, 500)}\`\n\n**= ${rendered}**`);
    return ctx.reply({ embeds: [embed] });
  },
};
