const { defineConfig } = require('@vue/cli-service')
module.exports = {
  chainWebpack: config => {
    config.module
      .rule('geojson')
      .test(/\.geojson$/)
      .use('json-loader')
      .loader('json-loader')
      .end();
  }
};
