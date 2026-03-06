const { withGradleProperties } = require('expo/config-plugins');

/**
 * Custom Expo Config Plugin to optimize Gradle properties for KSP/Kotlin stability.
 * Reduced memory allocations to be safe for EAS Standard workers (typically 8GB).
 */
module.exports = function withKspStability(config) {
    return withGradleProperties(config, (config) => {
        // 1. Force the removal of any existing jvmargs to start clean
        config.modResults = config.modResults.filter(
            (item) => item.key !== 'org.gradle.jvmargs' &&
                item.key !== 'kotlin.daemon.jvm.options' &&
                item.key !== 'ksp.incremental'
        );

        // 2. Set high stability properties - SAFE FOR EAS
        config.modResults.push(
            {
                type: 'property',
                key: 'org.gradle.jvmargs',
                value: '-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+UseParallelGC -Dkotlin.daemon.jvm.options="-Xmx3072m"',
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
                value: 'false', // Retornar fallback seguro
            }
        );

        return config;
    });
};
