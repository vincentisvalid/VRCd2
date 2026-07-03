import { respond, buildEmbed } from '../utils/helpers.js';

export default [
  {
    name: 'add',
    description: 'Add two numbers.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'sub',
    description: 'Subtract b from a.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'mul',
    description: 'Multiply two numbers.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'div',
    description: 'Divide a by b.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'pow',
    description: 'Raise a to power of b.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'sqrt',
    description: 'Square root of a.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'abs',
    description: 'Absolute value of a.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'ceil',
    description: 'Ceiling value of a.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'floor',
    description: 'Floor value of a.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'round',
    description: 'Round a to nearest integer.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'sin',
    description: 'Sine of a (radians).',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'cos',
    description: 'Cosine of a (radians).',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'tan',
    description: 'Tangent of a (radians).',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'log',
    description: 'Natural logarithm of a.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'log10',
    description: 'Base-10 logarithm of a.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'min',
    description: 'Minimum of a and b.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'max',
    description: 'Maximum of a and b.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'pi',
    description: 'Value of Pi.',
    category: 'Mathematics',
    options: [],
    async execute(message, args) {
      if (args.length < 0) return respond(message, { content: 'Parameters required: ' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [];
      return run(interaction, args);
    }
  },
  {
    name: 'euler',
    description: 'Euler constant E.',
    category: 'Mathematics',
    options: [],
    async execute(message, args) {
      if (args.length < 0) return respond(message, { content: 'Parameters required: ' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [];
      return run(interaction, args);
    }
  },
  {
    name: 'modulo',
    description: 'Modulo of a and b.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'square',
    description: 'Square of a.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'cube',
    description: 'Cube of a.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'hypotenuse',
    description: 'Hypotenuse of triangle sides a and b.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'rad2deg',
    description: 'Convert radians a to degrees.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'deg2rad',
    description: 'Convert degrees a to radians.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'percent',
    description: 'Calculate b percentage of a.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'average',
    description: 'Average of a and b.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'clamp',
    description: 'Clamp a value x between min and max.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }, { name: 'c', type: 10, description: 'Parameter c', required: true }],
    async execute(message, args) {
      if (args.length < 3) return respond(message, { content: 'Parameters required: a, b, c' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b'), interaction.options.getNumber('c')];
      return run(interaction, args);
    }
  },
  {
    name: 'factorial',
    description: 'Factorial of integer a.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'iseven',
    description: 'Check if a is even.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'isodd',
    description: 'Check if a is odd.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'isprime',
    description: 'Check if integer a is prime.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'rand',
    description: 'Random float between 0 and 1.',
    category: 'Mathematics',
    options: [],
    async execute(message, args) {
      if (args.length < 0) return respond(message, { content: 'Parameters required: ' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [];
      return run(interaction, args);
    }
  },
  {
    name: 'randint',
    description: 'Random integer between a and b.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'circlearea',
    description: 'Area of circle with radius r.',
    category: 'Mathematics',
    options: [{ name: 'r', type: 10, description: 'Parameter r', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: r' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('r')];
      return run(interaction, args);
    }
  },
  {
    name: 'circlecirc',
    description: 'Circumference of circle with radius r.',
    category: 'Mathematics',
    options: [{ name: 'r', type: 10, description: 'Parameter r', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: r' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('r')];
      return run(interaction, args);
    }
  },
  {
    name: 'spherevol',
    description: 'Volume of sphere with radius r.',
    category: 'Mathematics',
    options: [{ name: 'r', type: 10, description: 'Parameter r', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: r' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('r')];
      return run(interaction, args);
    }
  },
  {
    name: 'spheresurf',
    description: 'Surface area of sphere with radius r.',
    category: 'Mathematics',
    options: [{ name: 'r', type: 10, description: 'Parameter r', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: r' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('r')];
      return run(interaction, args);
    }
  },
  {
    name: 'cylindervol',
    description: 'Volume of cylinder with radius r and height h.',
    category: 'Mathematics',
    options: [{ name: 'r', type: 10, description: 'Parameter r', required: true }, { name: 'h', type: 10, description: 'Parameter h', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: r, h' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('r'), interaction.options.getNumber('h')];
      return run(interaction, args);
    }
  },
  {
    name: 'conevol',
    description: 'Volume of cone with radius r and height h.',
    category: 'Mathematics',
    options: [{ name: 'r', type: 10, description: 'Parameter r', required: true }, { name: 'h', type: 10, description: 'Parameter h', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: r, h' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('r'), interaction.options.getNumber('h')];
      return run(interaction, args);
    }
  },
  {
    name: 'boxvol',
    description: 'Volume of box with length l, width w, height h.',
    category: 'Mathematics',
    options: [{ name: 'l', type: 10, description: 'Parameter l', required: true }, { name: 'w', type: 10, description: 'Parameter w', required: true }, { name: 'h', type: 10, description: 'Parameter h', required: true }],
    async execute(message, args) {
      if (args.length < 3) return respond(message, { content: 'Parameters required: l, w, h' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('l'), interaction.options.getNumber('w'), interaction.options.getNumber('h')];
      return run(interaction, args);
    }
  },
  {
    name: 'pythagoras',
    description: 'Solve hypotenuse side c = sqrt(a^2 + b^2).',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'gcd',
    description: 'Greatest Common Divisor of a and b.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'lcm',
    description: 'Least Common Multiple of a and b.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Parameters required: a, b' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b')];
      return run(interaction, args);
    }
  },
  {
    name: 'fibonacci',
    description: 'Nth Fibonacci number.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'log2',
    description: 'Base-2 logarithm of a.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'sign',
    description: 'Sign of a (-1, 0, 1).',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'trunc',
    description: 'Truncate fractional digits of a.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }],
    async execute(message, args) {
      if (args.length < 1) return respond(message, { content: 'Parameters required: a' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a')];
      return run(interaction, args);
    }
  },
  {
    name: 'lerp',
    description: 'Linear interpolation between a and b by fraction t.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }, { name: 't', type: 10, description: 'Parameter t', required: true }],
    async execute(message, args) {
      if (args.length < 3) return respond(message, { content: 'Parameters required: a, b, t' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b'), interaction.options.getNumber('t')];
      return run(interaction, args);
    }
  },
  {
    name: 'quadratic',
    description: 'Solve positive root of ax^2 + bx + c = 0.',
    category: 'Mathematics',
    options: [{ name: 'a', type: 10, description: 'Parameter a', required: true }, { name: 'b', type: 10, description: 'Parameter b', required: true }, { name: 'c', type: 10, description: 'Parameter c', required: true }],
    async execute(message, args) {
      if (args.length < 3) return respond(message, { content: 'Parameters required: a, b, c' });
      return run(message, args);
    },
    async executeSlash(interaction) {
      const args = [interaction.options.getNumber('a'), interaction.options.getNumber('b'), interaction.options.getNumber('c')];
      return run(interaction, args);
    }
  }
];

function run(ctx, args) {
  try {
if (ctx.commandName === 'add' || (ctx.content && ctx.content.includes('add'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = a + b;
    return respond(ctx, { embeds: [buildEmbed('Math Result: add', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'sub' || (ctx.content && ctx.content.includes('sub'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = a - b;
    return respond(ctx, { embeds: [buildEmbed('Math Result: sub', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'mul' || (ctx.content && ctx.content.includes('mul'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = a * b;
    return respond(ctx, { embeds: [buildEmbed('Math Result: mul', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'div' || (ctx.content && ctx.content.includes('div'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = a / b;
    return respond(ctx, { embeds: [buildEmbed('Math Result: div', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'pow' || (ctx.content && ctx.content.includes('pow'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = Math.pow(a, b);
    return respond(ctx, { embeds: [buildEmbed('Math Result: pow', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'sqrt' || (ctx.content && ctx.content.includes('sqrt'))) {
    const a = parseFloat(args[0]);
    const result = Math.sqrt(a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: sqrt', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'abs' || (ctx.content && ctx.content.includes('abs'))) {
    const a = parseFloat(args[0]);
    const result = Math.abs(a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: abs', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'ceil' || (ctx.content && ctx.content.includes('ceil'))) {
    const a = parseFloat(args[0]);
    const result = Math.ceil(a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: ceil', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'floor' || (ctx.content && ctx.content.includes('floor'))) {
    const a = parseFloat(args[0]);
    const result = Math.floor(a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: floor', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'round' || (ctx.content && ctx.content.includes('round'))) {
    const a = parseFloat(args[0]);
    const result = Math.round(a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: round', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'sin' || (ctx.content && ctx.content.includes('sin'))) {
    const a = parseFloat(args[0]);
    const result = Math.sin(a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: sin', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'cos' || (ctx.content && ctx.content.includes('cos'))) {
    const a = parseFloat(args[0]);
    const result = Math.cos(a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: cos', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'tan' || (ctx.content && ctx.content.includes('tan'))) {
    const a = parseFloat(args[0]);
    const result = Math.tan(a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: tan', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'log' || (ctx.content && ctx.content.includes('log'))) {
    const a = parseFloat(args[0]);
    const result = Math.log(a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: log', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'log10' || (ctx.content && ctx.content.includes('log10'))) {
    const a = parseFloat(args[0]);
    const result = Math.log10(a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: log10', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'min' || (ctx.content && ctx.content.includes('min'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = Math.min(a, b);
    return respond(ctx, { embeds: [buildEmbed('Math Result: min', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'max' || (ctx.content && ctx.content.includes('max'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = Math.max(a, b);
    return respond(ctx, { embeds: [buildEmbed('Math Result: max', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'pi' || (ctx.content && ctx.content.includes('pi'))) {
    
    const result = Math.PI;
    return respond(ctx, { embeds: [buildEmbed('Math Result: pi', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'euler' || (ctx.content && ctx.content.includes('euler'))) {
    
    const result = Math.E;
    return respond(ctx, { embeds: [buildEmbed('Math Result: euler', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'modulo' || (ctx.content && ctx.content.includes('modulo'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = a % b;
    return respond(ctx, { embeds: [buildEmbed('Math Result: modulo', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'square' || (ctx.content && ctx.content.includes('square'))) {
    const a = parseFloat(args[0]);
    const result = a * a;
    return respond(ctx, { embeds: [buildEmbed('Math Result: square', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'cube' || (ctx.content && ctx.content.includes('cube'))) {
    const a = parseFloat(args[0]);
    const result = a * a * a;
    return respond(ctx, { embeds: [buildEmbed('Math Result: cube', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'hypotenuse' || (ctx.content && ctx.content.includes('hypotenuse'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = Math.hypot(a, b);
    return respond(ctx, { embeds: [buildEmbed('Math Result: hypotenuse', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'rad2deg' || (ctx.content && ctx.content.includes('rad2deg'))) {
    const a = parseFloat(args[0]);
    const result = a * (180 / Math.PI);
    return respond(ctx, { embeds: [buildEmbed('Math Result: rad2deg', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'deg2rad' || (ctx.content && ctx.content.includes('deg2rad'))) {
    const a = parseFloat(args[0]);
    const result = a * (Math.PI / 180);
    return respond(ctx, { embeds: [buildEmbed('Math Result: deg2rad', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'percent' || (ctx.content && ctx.content.includes('percent'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = (b / 100) * a;
    return respond(ctx, { embeds: [buildEmbed('Math Result: percent', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'average' || (ctx.content && ctx.content.includes('average'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = (a + b) / 2;
    return respond(ctx, { embeds: [buildEmbed('Math Result: average', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'clamp' || (ctx.content && ctx.content.includes('clamp'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const c = parseFloat(args[2]);
    const result = Math.max(b, Math.min(c, a));
    return respond(ctx, { embeds: [buildEmbed('Math Result: clamp', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'factorial' || (ctx.content && ctx.content.includes('factorial'))) {
    const a = parseFloat(args[0]);
    const result = Array.from({length: a}, (_, i) => i + 1).reduce((p, c) => p * c, 1);
    return respond(ctx, { embeds: [buildEmbed('Math Result: factorial', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'iseven' || (ctx.content && ctx.content.includes('iseven'))) {
    const a = parseFloat(args[0]);
    const result = a % 2 === 0 ? "True" : "False";
    return respond(ctx, { embeds: [buildEmbed('Math Result: iseven', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'isodd' || (ctx.content && ctx.content.includes('isodd'))) {
    const a = parseFloat(args[0]);
    const result = a % 2 !== 0 ? "True" : "False";
    return respond(ctx, { embeds: [buildEmbed('Math Result: isodd', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'isprime' || (ctx.content && ctx.content.includes('isprime'))) {
    const a = parseFloat(args[0]);
    const result = a > 1 && Array.from({length: Math.floor(Math.sqrt(a)) - 1}, (_, i) => i + 2).every(d => a % d !== 0) ? "True" : "False";
    return respond(ctx, { embeds: [buildEmbed('Math Result: isprime', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'rand' || (ctx.content && ctx.content.includes('rand'))) {
    
    const result = Math.random();
    return respond(ctx, { embeds: [buildEmbed('Math Result: rand', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'randint' || (ctx.content && ctx.content.includes('randint'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = Math.floor(Math.random() * (b - a + 1)) + a;
    return respond(ctx, { embeds: [buildEmbed('Math Result: randint', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'circlearea' || (ctx.content && ctx.content.includes('circlearea'))) {
    const r = parseFloat(args[0]);
    const result = Math.PI * r * r;
    return respond(ctx, { embeds: [buildEmbed('Math Result: circlearea', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'circlecirc' || (ctx.content && ctx.content.includes('circlecirc'))) {
    const r = parseFloat(args[0]);
    const result = 2 * Math.PI * r;
    return respond(ctx, { embeds: [buildEmbed('Math Result: circlecirc', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'spherevol' || (ctx.content && ctx.content.includes('spherevol'))) {
    const r = parseFloat(args[0]);
    const result = (4/3) * Math.PI * Math.pow(r, 3);
    return respond(ctx, { embeds: [buildEmbed('Math Result: spherevol', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'spheresurf' || (ctx.content && ctx.content.includes('spheresurf'))) {
    const r = parseFloat(args[0]);
    const result = 4 * Math.PI * r * r;
    return respond(ctx, { embeds: [buildEmbed('Math Result: spheresurf', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'cylindervol' || (ctx.content && ctx.content.includes('cylindervol'))) {
    const r = parseFloat(args[0]);
    const h = parseFloat(args[1]);
    const result = Math.PI * r * r * h;
    return respond(ctx, { embeds: [buildEmbed('Math Result: cylindervol', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'conevol' || (ctx.content && ctx.content.includes('conevol'))) {
    const r = parseFloat(args[0]);
    const h = parseFloat(args[1]);
    const result = (1/3) * Math.PI * r * r * h;
    return respond(ctx, { embeds: [buildEmbed('Math Result: conevol', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'boxvol' || (ctx.content && ctx.content.includes('boxvol'))) {
    const l = parseFloat(args[0]);
    const w = parseFloat(args[1]);
    const h = parseFloat(args[2]);
    const result = l * w * h;
    return respond(ctx, { embeds: [buildEmbed('Math Result: boxvol', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'pythagoras' || (ctx.content && ctx.content.includes('pythagoras'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = Math.sqrt(a*a + b*b);
    return respond(ctx, { embeds: [buildEmbed('Math Result: pythagoras', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'gcd' || (ctx.content && ctx.content.includes('gcd'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = ((x, y) => { while(y) { let t = y; y = x % y; x = t; } return x; })(a, b);
    return respond(ctx, { embeds: [buildEmbed('Math Result: gcd', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'lcm' || (ctx.content && ctx.content.includes('lcm'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const result = Math.abs(a * b) / ((x, y) => { while(y) { let t = y; y = x % y; x = t; } return x; })(a, b);
    return respond(ctx, { embeds: [buildEmbed('Math Result: lcm', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'fibonacci' || (ctx.content && ctx.content.includes('fibonacci'))) {
    const a = parseFloat(args[0]);
    const result = ((n) => { let a = 0, b = 1; for(let i=0; i<n; i++) { let t = a; a = b; b = t + b; } return a; })(a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: fibonacci', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'log2' || (ctx.content && ctx.content.includes('log2'))) {
    const a = parseFloat(args[0]);
    const result = Math.log2(a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: log2', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'sign' || (ctx.content && ctx.content.includes('sign'))) {
    const a = parseFloat(args[0]);
    const result = Math.sign(a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: sign', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'trunc' || (ctx.content && ctx.content.includes('trunc'))) {
    const a = parseFloat(args[0]);
    const result = Math.trunc(a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: trunc', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'lerp' || (ctx.content && ctx.content.includes('lerp'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const t = parseFloat(args[2]);
    const result = a + t * (b - a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: lerp', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } else if (ctx.commandName === 'quadratic' || (ctx.content && ctx.content.includes('quadratic'))) {
    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);
    const c = parseFloat(args[2]);
    const result = (-b + Math.sqrt(b*b - 4*a*c)) / (2*a);
    return respond(ctx, { embeds: [buildEmbed('Math Result: quadratic', `Result: **${result}**`, [], 0x00ffcc)] });
  }
  } catch (err) {
    return respond(ctx, { content: 'Calculation failed.' });
  }
}
