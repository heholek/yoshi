const chalk = require('chalk');
const schema = require('./schema/yoshi-config-schema');
const validateConfig = require('./validateConfig');
const { PACKAGE_JSON } = require('./constants');
const YoshiOptionsValidationError = require('./utils/YoshiOptionsValidationError');

module.exports = function readConfig({ configPath, validate }) {
  let configObject = require(configPath);

  if (configPath.endsWith(PACKAGE_JSON)) {
    configObject = configObject.yoshi || {};
  }

  if (validate) {
    try {
      validateConfig(configObject, schema);
    } catch (err) {
      if (err instanceof YoshiOptionsValidationError) {
        console.warn(chalk.yellow('Warning: ' + err.message));
      } else {
        throw err;
      }
    }
  }

  return configObject;
};
