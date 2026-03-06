const { withGradleProperties } = require('expo/config-plugins');

/**
 * Custom Expo Config Plugin to optimize Gradle properties for KSP/Kotlin stability.
 * Increased memory allocations based on 'medium' EAS worker class (16GB RAM).
 */
module.exports = function withKspStability(config) {
    return withGradleProperties(config, (config) => {
        // 1. Force the removal of any existing jvmargs to start clean
        config.modResults = config.modResults.filter(
            (item) => item.key !== 'org.gradle.jvmargs' &&
                item.key !== 'kotlin.daemon.jvm.options' &&
                item.key !== 'ksp.incremental'
        );

        // 2. Set high stability properties - SAFE FOR MEDIUM WORKER
        config.modResults.push(
            {
                type: 'property',
                key: 'org.gradle.jvmargs',
                value: '-Xmx8192m -XX:MaxMetaspaceSize=1536m -XX:+UseParallelGC -Dkotlin.daemon.jvm.options="-Xmx4096m"',
            },
            {
                type: 'property',
                key: 'kotlin.daemon.jvm.options',
                value: '-Xmx4096m',
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
