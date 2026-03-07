const { withGradleProperties } = require('expo/config-plugins');

module.exports = function withKspStability(config) {
  return withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (item) =>
        item.key !== 'org.gradle.jvmargs' &&
        item.key !== 'kotlin.daemon.jvm.options' &&
        item.key !== 'ksp.incremental' &&
        item.key !== 'ksp.allow.all.files' &&
        item.key !== 'kotlin.compiler.execution.strategy' &&
        item.key !== 'org.gradle.parallel' &&
        item.key !== 'kotlin.version'
    );

    config.modResults.push(
      {
        type: 'property',
        key: 'org.gradle.jvmargs',
        value: '-Xmx6144m -XX:MaxMetaspaceSize=1024m -XX:+UseParallelGC',
      },
      {
        type: 'property',
        key: 'kotlin.daemon.jvm.options',
        value: '-Xmx3072m',
      },
      {
        type: 'property',
        key: 'ksp.incremental',
        value: 'false',
      },
      {
        type: 'property',
        key: 'ksp.allow.all.files',
        value: 'true',
      },
      {
        type: 'property',
        key: 'kotlin.compiler.execution.strategy',
        value: 'in-process',
      },
      {
        type: 'property',
        key: 'org.gradle.parallel',
        value: 'false',
      },
      {
        type: 'property',
        key: 'kotlin.version',
        value: '2.0.21',
      }
    );

    return config;
  });
};
