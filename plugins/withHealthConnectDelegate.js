const { withMainActivity } = require('expo/config-plugins');

/**
 * Custom Expo Config Plugin to register HealthConnectPermissionDelegate
 * in MainActivity.kt. This is required by react-native-health-connect v3+
 * to avoid the "lateinit property requestPermission has not been initialized" crash.
 *
 * See: https://github.com/matinzd/react-native-health-connect#installation
 */
module.exports = function withHealthConnectDelegate(config) {
    return withMainActivity(config, (config) => {
        let contents = config.modResults.contents;

        // 1. Add the import for HealthConnectPermissionDelegate
        const importLine = 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';
        if (!contents.includes(importLine)) {
            // Insert after the last import statement
            const lastImportIndex = contents.lastIndexOf('import ');
            const endOfLastImport = contents.indexOf('\n', lastImportIndex);
            contents =
                contents.slice(0, endOfLastImport + 1) +
                importLine + '\n' +
                contents.slice(endOfLastImport + 1);
        }

        // 2. Add the delegate registration inside onCreate
        const delegateLine = 'HealthConnectPermissionDelegate.setPermissionDelegate(this)';
        if (!contents.includes(delegateLine)) {
            // Look for super.onCreate(null) which is the Expo default
            if (contents.includes('super.onCreate(null)')) {
                contents = contents.replace(
                    'super.onCreate(null)',
                    'super.onCreate(null)\n    ' + delegateLine
                );
            }
            // Fallback: look for super.onCreate(savedInstanceState)
            else if (contents.includes('super.onCreate(savedInstanceState)')) {
                contents = contents.replace(
                    'super.onCreate(savedInstanceState)',
                    'super.onCreate(savedInstanceState)\n    ' + delegateLine
                );
            }
        }

        config.modResults.contents = contents;
        return config;
    });
};
