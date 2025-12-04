module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@core': './src/core',
            '@components': './src/components',
            '@screens': './src/screens',
            '@storage': './src/storage',
            '@stores': './src/stores',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@types': './src/types',
            '@navigation': './src/navigation',
          },
        },
      ],
    ],
  };
};
