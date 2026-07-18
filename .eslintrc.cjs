module.exports = {
	root: true,
	env: {
		browser: true,
		es2022: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:react/recommended',
		'plugin:react-hooks/recommended',
		'plugin:import/recommended',
		'prettier',
	],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		ecmaFeatures: { jsx: true },
	},
	settings: {
		react: { version: 'detect' },
		'import/resolver': {
			node: { extensions: ['.js', '.jsx'] },
		},
	},
	plugins: ['react', 'react-hooks', 'react-refresh', 'import'],
	ignorePatterns: ['dist', 'node_modules', 'build', 'android', 'ios'],
	rules: {
		'react/react-in-jsx-scope': 'off',
		'react/prop-types': 'off',
		'react/jsx-uses-react': 'off',
		'react/jsx-key': 'error',
		'react/no-unescaped-entities': 'warn',
		'react/jsx-no-target-blank': 'warn',

		'react-refresh/only-export-components': [
			'warn',
			{ allowConstantExport: true },
		],

		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': 'off',

		'no-unused-vars': [
			'warn',
			{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
		],
		'no-console': ['warn', { allow: ['warn', 'error'] }],
		'no-debugger': 'warn',
		'no-duplicate-imports': 'error',
		'prefer-const': 'warn',
		'no-var': 'error',
		eqeqeq: ['error', 'always'],
		curly: ['error', 'all'],

		'import/order': [
			'warn',
			{
				groups: [
					'builtin',
					'external',
					'internal',
					'parent',
					'sibling',
					'index',
				],
				'newlines-between': 'always',
				alphabetize: { order: 'asc', caseInsensitive: true },
			},
		],
		'import/no-duplicates': 'error',
		'import/no-unresolved': 'off',
	},
};
