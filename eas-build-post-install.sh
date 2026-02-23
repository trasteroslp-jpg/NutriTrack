#!/bin/bash
set -eo pipefail

echo "🔧 EAS Post-Install Hook: Patching gradle.properties for KSP compilation..."

GRADLE_PROPS="android/gradle.properties"

if [ -f "$GRADLE_PROPS" ]; then
  # Replace JVM memory from default 2GB to 4GB to prevent KSP Internal Compiler Error
  sed -i 's/org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m/org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+UseParallelGC/' "$GRADLE_PROPS"
  
  # Verify the change was applied
  echo "✅ gradle.properties patched successfully:"
  grep "org.gradle.jvmargs" "$GRADLE_PROPS"
else
  echo "⚠️ gradle.properties not found at $GRADLE_PROPS"
fi
