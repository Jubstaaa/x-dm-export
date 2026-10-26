import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import perfectionistPlugin from 'eslint-plugin-perfectionist'
import prettierPlugin from 'eslint-plugin-prettier'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const memberGroups = {
    customGroups: [
        { elementNamePattern: '^(id|uuid)$', groupName: 'identity' },
        { elementNamePattern: '^on[A-Z]', groupName: 'callbacks' },
    ],
    groups: ['identity', 'unknown', 'callbacks'],
    order: 'asc',
    type: 'alphabetical',
}

export default defineConfig([
    globalIgnores(['**/dist', '**/node_modules', 'src/components/ui']),
    {
        files: ['src/**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
            prettierConfig,
        ],
        plugins: {
            import: importPlugin,
            perfectionist: perfectionistPlugin,
            prettier: prettierPlugin,
            react: reactPlugin,
        },
        languageOptions: {
            ecmaVersion: 2022,
            globals: { ...globals.browser, chrome: 'readonly' },
        },
        rules: {
            'prettier/prettier': 'error',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-console': ['warn', { allow: ['error'] }],
            'no-unused-vars': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            'import/order': [
                'error',
                {
                    'groups': [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                    ],
                    'pathGroups': [
                        {
                            pattern: 'react',
                            group: 'external',
                            position: 'before',
                        },
                        {
                            pattern: 'react-*',
                            group: 'external',
                            position: 'before',
                        },
                        {
                            pattern: '@/**',
                            group: 'internal',
                            position: 'after',
                        },
                    ],
                    'pathGroupsExcludedImportTypes': ['react'],
                    'newlines-between': 'always',
                    'alphabetize': { order: 'asc', caseInsensitive: true },
                },
            ],
            'perfectionist/sort-interfaces': ['error', memberGroups],
            'perfectionist/sort-object-types': ['error', memberGroups],
            'perfectionist/sort-named-imports': [
                'warn',
                { order: 'asc', type: 'alphabetical' },
            ],
            'perfectionist/sort-objects': [
                'warn',
                {
                    customGroups: [
                        {
                            elementNamePattern: '^on[A-Z]',
                            groupName: 'callbacks',
                        },
                    ],
                    groups: ['unknown', 'callbacks'],
                    order: 'asc',
                    type: 'alphabetical',
                },
            ],
            'react/jsx-sort-props': [
                'warn',
                {
                    callbacksLast: true,
                    ignoreCase: true,
                    locale: 'auto',
                    multiline: 'last',
                    reservedFirst: ['key', 'ref'],
                    shorthandFirst: true,
                    shorthandLast: false,
                },
            ],
        },
    },
    {
        files: ['**/*.types.ts', '**/*.d.ts'],
        rules: { 'no-unused-vars': 'off' },
    },
])
