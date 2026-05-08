import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', 'unpackage/**', 'coverage/**', 'src/**/*.d.ts', '*.local', '*.log'],
  },
  {
    files: ['src/**/*.{ts,vue}', '*.config.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, ...pluginVue.configs['flat/essential']],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        uni: 'readonly',
        wx: 'readonly',
      },
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'vue/multi-word-component-names': 'off',
    },
  },
)
