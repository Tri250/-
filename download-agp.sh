#!/bin/bash
# Download Android Gradle Plugin 8.2.2 and its dependencies
set -e

LOCAL_REPO="/workspace/local-maven-repo"
MAVEN_CENTRAL="https://repo1.maven.org/maven2"
GOOGLE_MAVEN="https://dl.google.com/dl/android/maven2"

# AGP 8.2.2 main artifact
mkdir -p "$LOCAL_REPO/com/android/tools/build/gradle/8.2.2"

echo "Downloading AGP 8.2.2..."
curl -m 60 -fsSL "$MAVEN_CENTRAL/com/android/tools/build/gradle/8.2.2/gradle-8.2.2.pom" -o "$LOCAL_REPO/com/android/tools/build/gradle/8.2.2/gradle-8.2.2.pom" || \
curl -m 60 -fsSL "$GOOGLE_MAVEN/com/android/tools/build/gradle/8.2.2/gradle-8.2.2.pom" -o "$LOCAL_REPO/com/android/tools/build/gradle/8.2.2/gradle-8.2.2.pom" || \
echo "Failed to download AGP POM"

curl -m 60 -fsSL "$MAVEN_CENTRAL/com/android/tools/build/gradle/8.2.2/gradle-8.2.2.jar" -o "$LOCAL_REPO/com/android/tools/build/gradle/8.2.2/gradle-8.2.2.jar" || \
curl -m 60 -fsSL "$GOOGLE_MAVEN/com/android/tools/build/gradle/8.2.2/gradle-8.2.2.jar" -o "$LOCAL_REPO/com/android/tools/build/gradle/8.2.2/gradle-8.2.2.jar" || \
echo "Failed to download AGP JAR"

ls -la "$LOCAL_REPO/com/android/tools/build/gradle/8.2.2/"