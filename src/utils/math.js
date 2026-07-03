/**
 * Safe arithmetic expression evaluator — zero `eval`, zero `Function`.
 *
 * A classic two-stage design: a tokenizer feeds a shunting-yard conversion
 * to Reverse Polish Notation, which a tiny stack machine then executes.
 * Only whitelisted operators, functions, and constants exist; anything else
 * is rejected at tokenization, so no user string can reach an open
 * execution risk block.
 */

const FUNCTIONS = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  log: Math.log10,
  ln: Math.log,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
};

const CONSTANTS = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 };

const OPERATORS = {
  '+': { precedence: 2, assoc: 'L', arity: 2, apply: (a, b) => a + b },
  '-': { precedence: 2, assoc: 'L', arity: 2, apply: (a, b) => a - b },
  '*': { precedence: 3, assoc: 'L', arity: 2, apply: (a, b) => a * b },
  '/': { precedence: 3, assoc: 'L', arity: 2, apply: (a, b) => a / b },
  '%': { precedence: 3, assoc: 'L', arity: 2, apply: (a, b) => a % b },
  '^': { precedence: 4, assoc: 'R', arity: 2, apply: (a, b) => a ** b },
  'neg': { precedence: 5, assoc: 'R', arity: 1, apply: (a) => -a },
};

function tokenizeExpression(input) {
  const tokens = [];
  const pattern = /\s*(\d+\.?\d*|\.\d+|[a-zA-Z]+|[+\-*/%^(),])/y;
  let index = 0;
  while (index < input.length) {
    pattern.lastIndex = index;
    const match = pattern.exec(input);
    if (!match) throw new Error(`Unexpected character at position ${index + 1}: \`${input[index]}\``);
    tokens.push(match[1]);
    index = pattern.lastIndex;
  }
  return tokens;
}

/** @returns {number} evaluation result @throws on any malformed/unsafe input */
export function evaluateExpression(input) {
  const expression = String(input ?? '').trim();
  if (!expression) throw new Error('Empty expression.');
  if (expression.length > 300) throw new Error('Expression too long (300 char cap).');

  const tokens = tokenizeExpression(expression);
  const output = [];
  const stack = [];
  let previous = null; // for unary-minus detection

  for (const token of tokens) {
    if (/^(\d+\.?\d*|\.\d+)$/.test(token)) {
      output.push(Number.parseFloat(token));
    } else if (/^[a-zA-Z]+$/.test(token)) {
      const lowered = token.toLowerCase();
      if (lowered in CONSTANTS) output.push(CONSTANTS[lowered]);
      else if (lowered in FUNCTIONS) stack.push(lowered);
      else throw new Error(`Unknown identifier \`${token}\`.`);
    } else if (token === ',') {
      while (stack.length && stack.at(-1) !== '(') output.push(stack.pop());
      if (!stack.length) throw new Error('Misplaced comma.');
    } else if (token in OPERATORS || token === '-') {
      // A minus is unary when it starts the expression or follows ( , or another operator.
      const isUnary = token === '-' && (previous === null || previous === '(' || previous === ',' || previous in OPERATORS);
      const opKey = isUnary ? 'neg' : token;
      const op = OPERATORS[opKey];
      while (stack.length) {
        const top = stack.at(-1);
        const topOp = OPERATORS[top];
        if (top in FUNCTIONS) {
          output.push(stack.pop());
        } else if (topOp && (topOp.precedence > op.precedence || (topOp.precedence === op.precedence && op.assoc === 'L'))) {
          output.push(stack.pop());
        } else break;
      }
      stack.push(opKey);
    } else if (token === '(') {
      stack.push('(');
    } else if (token === ')') {
      while (stack.length && stack.at(-1) !== '(') output.push(stack.pop());
      if (!stack.length) throw new Error('Unbalanced parentheses.');
      stack.pop(); // discard '('
      if (stack.length && stack.at(-1) in FUNCTIONS) output.push(stack.pop());
    } else {
      throw new Error(`Unexpected token \`${token}\`.`);
    }
    previous = token;
  }
  while (stack.length) {
    const top = stack.pop();
    if (top === '(') throw new Error('Unbalanced parentheses.');
    output.push(top);
  }

  // ── RPN stack machine ──────────────────────────────────────────────────
  const values = [];
  for (const item of output) {
    if (typeof item === 'number') {
      values.push(item);
    } else if (item in FUNCTIONS) {
      if (!values.length) throw new Error(`Function \`${item}\` is missing its argument.`);
      values.push(FUNCTIONS[item](values.pop()));
    } else {
      const op = OPERATORS[item];
      if (values.length < op.arity) throw new Error(`Operator \`${item}\` is missing operands.`);
      const args = values.splice(-op.arity);
      values.push(op.apply(...args));
    }
  }
  if (values.length !== 1) throw new Error('Malformed expression.');
  const result = values[0];
  if (!Number.isFinite(result)) throw new Error('Result is not a finite number (division by zero?).');
  return result;
}
