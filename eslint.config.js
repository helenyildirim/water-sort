const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*'] },
  {
    // The board runs its pour animation in a requestAnimationFrame loop and redraws
    // from mutable frame state on purpose, so it reads refs and the clock while rendering.
    files: ['src/ui/Board.tsx'],
    rules: { 'react-hooks/refs': 'off', 'react-hooks/purity': 'off' },
  },
]);
