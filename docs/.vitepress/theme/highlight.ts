/** A tiny highlighter for the fixed snippets on the home page, so they need no Shiki at runtime. */
const RULES: [RegExp, string][] = [
  [/^\/\/.*/, 'c'],
  [/^(['"`])(?:\\.|(?!\1).)*\1/, 's'],
  [/^@[A-Za-z]+/, 'd'],
  [/^<\/?[a-z][\w-]*/, 't'],
  [/^[a-z][\w-]*(?==)/, 'a'],
  [
    /^(?:import|from|export|class|const|await|async|return|new|true|false)\b/,
    'k',
  ],
  [/^[A-Z][A-Z0-9_]{2,}\b/, 'n'],
  [/^[A-Z][A-Za-z0-9]*/, 'y'],
  [/^[a-z_$][\w$]*(?=\()/, 'f'],
  [/^[A-Za-z_$][\w$]*/, ''],
  [/^\d+/, 'n'],
];

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function highlight(code: string): string {
  let out = '';
  let rest = code;
  while (rest.length > 0) {
    let matched = false;
    for (const [rule, cls] of RULES) {
      const m = rule.exec(rest);
      if (!m) continue;
      const text = escape(m[0]);
      out += cls ? `<span class="tk-${cls}">${text}</span>` : text;
      rest = rest.slice(m[0].length);
      matched = true;
      break;
    }
    if (!matched) {
      out += escape(rest[0]);
      rest = rest.slice(1);
    }
  }
  return out;
}
