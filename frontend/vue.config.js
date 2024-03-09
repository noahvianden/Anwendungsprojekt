const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  devServer: {
    port: 8080,
    proxy: {
      '/restaurants': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  chainWebpack: config => {
    config.module
      .rule('geojson')
      .test(/\.geojson$/)
      .use('json-loader')
      .loader('json-loader')
      .end();
  }
});