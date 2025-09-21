module.exports = {
  // Basic formatting
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,

  // JSX
  jsxSingleQuote: false,
  jsxBracketSameLine: false,

  // Other options
  arrowParens: 'avoid',
  bracketSpacing: true,
  endOfLine: 'lf',
  proseWrap: 'preserve',
  quoteProps: 'as-needed',
  insertPragma: false,
  requirePragma: false,

  // Override for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: '*.{yml,yaml}',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};