import type { ThemeRegistration } from 'shiki';

interface Palette {
  name: string;
  type: 'light' | 'dark';
  bg: string;
  fg: string;
  comment: string;
  keyword: string;
  string: string;
  fn: string;
  type_: string;
  decorator: string;
  constant: string;
  tag: string;
  attr: string;
  punct: string;
}

function build(p: Palette): ThemeRegistration {
  return {
    name: p.name,
    type: p.type,
    colors: { 'editor.background': p.bg, 'editor.foreground': p.fg },
    tokenColors: [
      {
        scope: ['comment', 'punctuation.definition.comment'],
        settings: { foreground: p.comment, fontStyle: 'italic' },
      },
      {
        scope: [
          'keyword',
          'storage',
          'storage.type',
          'storage.modifier',
          'keyword.control',
          'keyword.operator.new',
          'keyword.operator.expression',
        ],
        settings: { foreground: p.keyword },
      },
      {
        scope: ['string', 'punctuation.definition.string'],
        settings: { foreground: p.string },
      },
      {
        scope: ['entity.name.function', 'support.function'],
        settings: { foreground: p.fn },
      },
      {
        scope: [
          'entity.name.type',
          'entity.name.class',
          'support.class',
          'support.type',
          'entity.other.inherited-class',
        ],
        settings: { foreground: p.type_ },
      },
      {
        scope: [
          'punctuation.decorator',
          'meta.decorator meta.function-call entity.name.function',
          'meta.decorator variable.other.readwrite',
        ],
        settings: { foreground: p.decorator },
      },
      {
        /** Calls inside a decorator's arguments, like forRoot() in @Module, keep the normal colors. */
        scope: [
          'meta.decorator meta.objectliteral meta.function-call entity.name.function',
        ],
        settings: { foreground: p.fn },
      },
      {
        scope: ['meta.decorator meta.objectliteral variable.other.readwrite'],
        settings: { foreground: p.fg },
      },
      {
        scope: [
          'constant.numeric',
          'constant.language',
          'variable.other.constant',
        ],
        settings: { foreground: p.constant },
      },
      { scope: ['entity.name.tag'], settings: { foreground: p.tag } },
      {
        scope: ['entity.other.attribute-name'],
        settings: { foreground: p.attr },
      },
      {
        scope: ['punctuation', 'meta.brace', 'keyword.operator'],
        settings: { foreground: p.punct },
      },
    ],
  };
}

export const codeThemeLight = build({
  name: 'turnstile-light',
  type: 'light',
  bg: '#fafafa',
  fg: '#262626',
  comment: '#8a8a8a',
  keyword: '#c2410c',
  string: '#0f7b3f',
  fn: '#1d4ed8',
  type_: '#0e7490',
  decorator: '#e8530f',
  constant: '#a21caf',
  tag: '#c2410c',
  attr: '#1d4ed8',
  punct: '#737373',
});

export const codeThemeDark = build({
  name: 'turnstile-dark',
  type: 'dark',
  bg: '#171717',
  fg: '#e5e5e5',
  comment: '#7a7a7a',
  keyword: '#fb923c',
  string: '#86d9a6',
  fn: '#93b9fd',
  type_: '#67d4e8',
  decorator: '#ff7a3d',
  constant: '#e3a3f5',
  tag: '#fb923c',
  attr: '#93b9fd',
  punct: '#a3a3a3',
});
