const fs = require('fs');
const path = require('path');

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

    const updated = fs.readFileSync(gradlePropsPath, 'utf8');
    const jvmLine = updated.split('\n').find(l => l.includes('org.gradle.jvmargs'));
    console.log('✅ gradle.properties patched:', jvmLine);
} else {
    console.log('⚠️ gradle.properties not found at', gradlePropsPath);
}
