const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const hotClient = require('webpack-hot-client');
const {decorate} = require('./server-api');
const {shouldRunWebpack, filterNoise, normalizeEntries} = require('./utils');
const {getListOfEntries} = require('../../utils');


module.exports = ({
  port = '3000',
  ssl,
  hmr = true,
  transformHMRRuntime,
  host = 'localhost',
  publicPath,
  statics,
  webpackConfigPath,
  configuredEntry,
  defaultEntry,
} = {}) => {
  return new Promise((resolve, reject) => {
    let middlewares = [];

    if (webpackConfigPath) {
      const getConfig = require(webpackConfigPath);
      const webpackConfig = getConfig({debug: true, disableModuleConcatenation: true});

      if (shouldRunWebpack(webpackConfig, defaultEntry, configuredEntry)) {
        webpackConfig.output.publicPath = publicPath;

        if (transformHMRRuntime) {
          const entryFiles = getListOfEntries(configuredEntry);
          webpackConfig.module.rules.forEach(rule => {
            if (Array.isArray(rule.use)) {
              rule.use = rule.use.map(useItem => {
                if (useItem === 'babel-loader') {
                  useItem = {loader: 'babel-loader'};
                }
                if (useItem.loader === 'babel-loader') {
                  if (!useItem.options) {
                    useItem.options = {};
                  }
                  if (!useItem.options.plugins) {
                    useItem.options.plugins = [];
                  }
                  useItem.options.plugins.push(
                    require.resolve('react-hot-loader/babel'),
                    [path.resolve(__dirname, '../../plugins/babel-plugin-transform-hmr-runtime'), {entryFiles}]
                  );
                }
                return useItem;
              });
            }
          });
        }

        webpackConfig.entry = normalizeEntries(webpackConfig.entry);
        const bundler = filterNoise(webpack(webpackConfig));
        hotClient(bundler, {hot: Boolean(hmr), logLevel: 'warn'});

        middlewares = [
          webpackDevMiddleware(bundler, {logLevel: 'silent'}),
        ];
      }
    }

    const app = express();

    decorate({app, middlewares, host, port, statics});

    const serverFactory = ssl ? httpsServer(app) : app;

    serverFactory.listen(port, host, err =>
      err ? reject(err) : resolve());
  });
};

function sslCredentials(keyPath, certificatePath, passphrase) {
  const privateKey = fs.readFileSync(path.join(__dirname, keyPath), 'utf8');
  const certificate = fs.readFileSync(path.resolve(__dirname, certificatePath), 'utf8');

  return {
    key: privateKey,
    cert: certificate,
    passphrase
  };
}

function httpsServer(app) {
  const credentials = sslCredentials('./assets/key.pem', './assets/cert.pem', '1234');
  return https.createServer(credentials, app);
}
