import os

def fix_math():
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/commands/math.js'))
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace the premature closing braces
    # Pattern is:
    #   }
    #   } else if (
    # We want:
    #   } else if (
    fixed = content.replace('  }\n  } else if (', '  } else if (')
    fixed = fixed.replace('  }\r\n  } else if (', '  } else if (')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(fixed)
    print('[Fixer] Fixed math.js braces.')

def fix_textutils():
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/commands/textutils.js'))
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace premature closing braces
    fixed = content.replace('    }\n  } else if (', '    } else if (')
    fixed = fixed.replace('    }\r\n  } else if (', '    } else if (')

    # Replace the backtick escape sequence `\\`\\`\\`` with `\`\`\``
    # This avoids terminating the template literal early
    fixed = fixed.replace(r'\\`\\`\\`', r'\`\`\`')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(fixed)
    print('[Fixer] Fixed textutils.js braces and backtick escapes.')

if __name__ == '__main__':
    fix_math()
    fix_textutils()
