import nextPlugin from '@next/eslint-plugin-next'
import eslint from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Repo-wide flat config: typescript-eslint + react-hooks for the plugin
 * package and the dev playground alike. The @next plugin is registered so
 * its rule ids resolve (a few source files carry targeted disables), without
 * enabling the full Next preset outside the Next app. Generated and build
 * artifacts are ignored wholesale.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      'dev/src/app/(payload)/admin/importMap.js',
      'dev/src/payload-types.ts',
      'dev/test-results/**',
      'dev/playwright-report/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // hydration-safe "read localStorage after mount" patterns set state in
      // effects on purpose — the new v6 rule flags them all
      'react-hooks/set-state-in-effect': 'off',
      // the theme bridges Payload's loosely-typed component APIs in places
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
)
