const { DefinePlugin } = require('webpack');

module.exports = {
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
  },
  configureWebpack: {
    plugins: [
      // Hier wird das Feature-Flag global injiziert
      new DefinePlugin({
        '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': false
      })
    ]
  }
};
