module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        transformFunctions: [
          'require',
          'require.resolve',
          'require.requireActual',
          'require.requireMock',
          'jest.genMockFromModule',
          'jest.mock',
          'jest.unmock',
          'jest.requireActual',
          'jest.requireMock',
        ],
        alias: {
          '@app': './src/app',
          '@features': './src/features',
          '@ui-kit': './src/ui-kit',
          '@lib': './src/lib',
          '@shared': './src/shared',
        },
      },
    ],
  ],
};
