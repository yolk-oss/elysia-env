import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

/** @type { import("eslint").Linter.Config[] } */
export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.es2021,
            },
        },
        rules: {
            '@typescript-eslint/ban-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'no-mixed-spaces-and-tabs': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-extra-semi': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-namespace': 'off',
            'no-case-declarations': 'off',
        },
    },
    {
        ignores: ['dist/**/*', 'examples/**/*', 'tests/**/*'],
    },
)