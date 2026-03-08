const fs = require('fs');
const path = require('path');

// 1. Patch Gradle Properties
const gradlePropsPath = path.join(__dirname, 'android', 'gradle.properties');

if (fs.existsSync(gradlePropsPath)) {
    let content = fs.readFileSync(gradlePropsPath, 'utf8');

    // Use regex to replace any existing jvmargs line to be more robust
    const jvmArgsRegex = /^org\.gradle\.jvmargs=.*$/m;
    const newJvmArgs = 'org.gradle.jvmargs=-Xmx6144m -XX:MaxMetaspaceSize=1024m -XX:+UseParallelGC -XX:+HeapDumpOnOutOfMemoryError -Dkotlin.daemon.jvm.options="-Xmx3g"';

    if (jvmArgsRegex.test(content)) {
        content = content.replace(jvmArgsRegex, newJvmArgs);
    } else {
        content += `\n${newJvmArgs}\n`;
    }

    // Explicitly set Kotlin daemon and disable KSP incremental compilation for stability
    content += '\nkotlin.daemon.jvm.options=-Xmx4g\n';
    content += 'ksp.incremental=false\n';
    content += 'ksp.incremental.log=true\n';

    fs.writeFileSync(gradlePropsPath, content, 'utf8');
    console.log('✅ gradle.properties patched successfully.');
} else {
    console.log('⚠️ gradle.properties not found at', gradlePropsPath);
}

// 2. Inject Global KSP Resolution Strategy (Gradle Init Script)
const initScriptContent = `
allprojects {
    buildscript {
        configurations.all {
            resolutionStrategy.eachDependency { DependencyResolveDetails details ->
                if (details.requested.group == 'com.google.devtools.ksp' && 
                    details.requested.name == 'symbol-processing-gradle-plugin') {
                    details.useVersion '2.1.20-1.0.32'
                    details.because 'Force KSP version compatible with Kotlin 2.1.20 daemon in EAS'
                }
            }
        }
    }
    configurations.all {
        resolutionStrategy.eachDependency { DependencyResolveDetails details ->
            if (details.requested.group == 'com.google.devtools.ksp') {
                details.useVersion '2.1.20-1.0.32'
                details.because 'Force KSP version compatible with Kotlin 2.1.20 daemon in EAS'
            }
        }
    }
}
`;

const gradleInitDir = path.join(process.env.HOME || process.env.USERPROFILE, '.gradle', 'init.d');

try {
    fs.mkdirSync(gradleInitDir, { recursive: true });
    fs.writeFileSync(path.join(gradleInitDir, 'force-ksp.gradle'), initScriptContent);
    console.log('🚀 Gradle init script installed to ~/.gradle/init.d/force-ksp.gradle');
} catch (error) {
    console.error('❌ Failed to install Gradle init script:', error.message);
}
