const { withGradleProperties } = require('expo/config-plugins');

/**
 * Custom Expo Config Plugin to optimize Gradle properties for KSP/Kotlin stability.
 * This is crucial for fixing "Internal compiler error" in kspDebugKotlin.
 */
module.exports = function withKspStability(config) {
    return withGradleProperties(config, (config) => {
        // 1. Force the removal of any existing jvmargs to start clean
        config.modResults = config.modResults.filter(
            (item) => item.key !== 'org.gradle.jvmargs' &&
                item.key !== 'kotlin.daemon.jvm.options' &&
                item.key !== 'ksp.incremental'
        );

        // 2. Set high stability properties
        config.modResults.push(
            {
                type: 'property',
                key: 'org.gradle.jvmargs',
                value: '-Xmx10240m -Xms2048m -XX:MaxMetaspaceSize=1536m -XX:+UseParallelGC -Dkotlin.daemon.jvm.options="-Xmx6g"',
            },
            {
                type: 'property',
                key: 'kotlin.daemon.jvm.options',
                value: '-Xmx6g',
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
            }
        );

        return config;
    });
};
