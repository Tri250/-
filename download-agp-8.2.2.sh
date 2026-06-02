#!/bin/bash

GOOGLE_URL="https://dl.google.com/dl/android/maven2"
MAVEN_URL="https://repo1.maven.org/maven2"
LOCAL_REPO="/workspace/local-maven-repo"

mkdir -p $LOCAL_REPO

download_artifact() {
    group=$1
    artifact=$2
    version=$3
    source=$4
    
    group_path=$(echo $group | tr '.' '/')
    dest_dir="$LOCAL_REPO/$group_path/$artifact/$version"
    mkdir -p $dest_dir
    
    url_base="${source}/${group_path}/${artifact}/${version}"
    
    echo "Downloading $group:$artifact:$version..."
    
    curl -L --connect-timeout 30 -f -o "$dest_dir/$artifact-$version.pom" "${url_base}/${artifact}-${version}.pom" 2>/dev/null || echo "  POM failed"
    curl -L --connect-timeout 60 -f -o "$dest_dir/$artifact-$version.jar" "${url_base}/${artifact}-${version}.jar" 2>/dev/null || echo "  JAR failed"
}

download_google() {
    download_artifact "$1" "$2" "$3" "$GOOGLE_URL"
}

download_maven() {
    download_artifact "$1" "$2" "$3" "$MAVEN_URL"
}

# AGP 8.2.2 core dependencies
download_google "com.android.tools.build" "builder" "8.2.2"
download_google "com.android.tools.build" "builder-model" "8.2.2"
download_google "com.android.tools.build" "builder-test-api" "8.2.2"
download_google "com.android.tools.build" "gradle-api" "8.2.2"
download_google "com.android.tools.build" "gradle-settings-api" "8.2.2"
download_google "com.android.tools.build" "aaptcompiler" "8.2.2"
download_google "com.android.tools.build" "aapt2-proto" "8.2.2-10151069"
download_google "com.android.tools.build" "manifest-merger" "31.2.2"
download_google "com.android.tools.build" "apkzlib" "8.2.2"
download_google "com.android.tools.build" "apksig" "8.2.2"

# Tools dependencies (version 31.2.2 for AGP 8.2.2)
download_google "com.android.tools" "sdk-common" "31.2.2"
download_google "com.android.tools" "sdklib" "31.2.2"
download_google "com.android.tools" "repository" "31.2.2"
download_google "com.android.tools" "common" "31.2.2"
download_google "com.android.tools" "annotations" "31.2.2"

download_google "com.android.tools.ddms" "ddmlib" "31.2.2"

download_google "com.android.tools.analytics-library" "crash" "31.2.2"
download_google "com.android.tools.analytics-library" "shared" "31.2.2"
download_google "com.android.tools.analytics-library" "protos" "31.2.2"
download_google "com.android.tools.analytics-library" "tracker" "31.2.2"

download_google "com.android.tools.layoutlib" "layoutlib-api" "31.2.2"

# Lint
download_google "com.android.tools.lint" "lint" "31.2.2"
download_google "com.android.tools.lint" "lint-api" "31.2.2"
download_google "com.android.tools.lint" "lint-checks" "31.2.2"
download_google "com.android.tools.lint" "lint-gradle" "31.2.2"
download_google "com.android.tools.lint" "lint-gradle-api" "31.2.2"
download_google "com.android.tools.lint" "lint-model" "31.2.2"
download_google "com.android.tools.lint" "lint-typedef-remover" "31.2.2"

# Databinding
download_google "androidx.databinding" "databinding-compiler-common" "8.2.2"
download_google "androidx.databinding" "databinding-common" "8.2.2"
download_google "com.android.databinding" "baseLibrary" "8.2.2"

# UTP
download_google "com.android.tools.utp" "android-device-provider-ddmlib-proto" "31.2.2"
download_google "com.android.tools.utp" "android-device-provider-gradle-proto" "31.2.2"
download_google "com.android.tools.utp" "android-test-plugin-host-retention-proto" "31.2.2"
download_google "com.android.tools.utp" "android-test-plugin-result-listener-gradle-proto" "31.2.2"
download_google "com.android.tools.utp" "android-test-plugin-host-additional-test-output-proto" "31.2.2"
download_google "com.android.tools.utp" "android-test-plugin-host-coverage-proto" "31.2.2"
download_google "com.android.tools.utp" "android-test-plugin-host-emulator-control-proto" "31.2.2"
download_google "com.android.tools.utp" "android-test-plugin-host-logcat-proto" "31.2.2"
download_google "com.android.tools.utp" "android-test-plugin-host-device-info-proto" "31.2.2"

# External dependencies from Maven Central
download_maven "org.ow2.asm" "asm" "9.6"
download_maven "org.ow2.asm" "asm-commons" "9.6"
download_maven "org.ow2.asm" "asm-tree" "9.6"
download_maven "org.ow2.asm" "asm-analysis" "9.6"
download_maven "org.ow2.asm" "asm-util" "9.6"

download_maven "net.sf.kxml" "kxml2" "2.3.0"
download_maven "com.squareup" "javapoet" "1.13.0"
download_maven "com.squareup" "javawriter" "2.5.0"

download_maven "com.google.code.gson" "gson" "2.9.1"
download_maven "com.google.guava" "guava" "31.1-jre"
download_maven "com.google.protobuf" "protobuf-java" "3.21.12"
download_maven "com.google.protobuf" "protobuf-java-util" "3.21.12"

download_maven "org.jetbrains.kotlin" "kotlin-stdlib" "1.9.0"
download_maven "org.jetbrains.kotlin" "kotlin-stdlib-common" "1.9.0"
download_maven "org.jetbrains.kotlin" "kotlin-stdlib-jdk8" "1.9.0"
download_maven "org.jetbrains.kotlin" "kotlin-stdlib-jdk7" "1.9.0"
download_maven "org.jetbrains.kotlin" "kotlin-reflect" "1.9.0"
download_maven "org.jetbrains.kotlinx" "kotlinx-coroutines-core-jvm" "1.7.3"

download_maven "com.google.code.findbugs" "jsr305" "3.0.2"
download_maven "com.google.errorprone" "error_prone_annotations" "2.11.0"
download_maven "com.google.j2objc" "j2objc-annotations" "1.3"
download_maven "org.checkerframework" "checker-qual" "3.12.0"

download_maven "commons-codec" "commons-codec" "1.11"
download_maven "commons-io" "commons-io" "2.4"
download_maven "org.apache.commons" "commons-lang3" "3.12.0"

download_maven "it.unimi.dsi" "fastutil" "8.5.11"

download_maven "com.sun.activation" "javax.activation" "1.2.0"
download_maven "javax.activation" "javax.activation-api" "1.2.0"

echo "Download complete!"