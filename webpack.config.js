const MinifyPlugin = require("babel-minify-webpack-plugin");

module.exports = (env = {}) => {
  const plugins = env.production ? [ new MinifyPlugin ] : [];
  return {
    entry: {
      cteepbd: './src/cteepbd.js'
    },
    target: 'node',
    output: {
      path: __dirname + '/lib',
      filename: '[name].js',
    },
    plugins: plugins
  };
}