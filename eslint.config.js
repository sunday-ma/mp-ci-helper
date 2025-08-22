import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  ignores: ['lib/**', 'node_modules/**', '*.config.js'],
  rules: {
    'node/prefer-global/process': 'off',
    'no-console': 'off',
  },
})