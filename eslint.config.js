import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactPlugin from 'eslint-plugin-react'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'android', '.agents']),
  // Original block for JS/JSX files
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  // New block for TS/TSX files to only run the forbid-elements rule
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'react/forbid-elements': [
        'error',
        {
          forbid: [
            { element: 'button', message: 'Prohibido el uso de HTML nativo. Importa el componente equivalente desde src/components/ui/.' },
            { element: 'input', message: 'Prohibido el uso de HTML nativo. Importa el componente equivalente desde src/components/ui/.' },
            { element: 'select', message: 'Prohibido el uso de HTML nativo. Importa el componente equivalente desde src/components/ui/.' },
            { element: 'textarea', message: 'Prohibido el uso de HTML nativo. Importa el componente equivalente desde src/components/ui/.' },
            { element: 'form', message: 'Prohibido el uso de HTML nativo. Importa el componente equivalente desde src/components/ui/.' }
          ]
        }
      ]
    },
  },
  // Override for UI components to disable the forbid-elements rule
  {
    files: ['src/components/ui/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'react/forbid-elements': 'off'
    }
  }
])
