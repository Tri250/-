#!/bin/bash

GOOGLE_URL="https://dl.google.com/dl/android/maven2"
LOCAL_REPO="/workspace/local-maven-repo"

mkdir -p $LOCAL_REPO

download_from_google() {
    group=$1
    artifact=$2
    version=$3
    
    group_path=$(echo $group | tr '.' '/')
    dest_dir="$LOCAL_REPO/$group_path/$artifact/$version"
    mkdir -p $dest_dir
    
    url_base="${GOOGLE_URL}/${group_path}/${artifact}/${version}"
    
    echo "Downloading $group:$artifact:$version..."
    
    curl -L --connect-timeout 30 -f -o "$dest_dir/$artifact-$version.pom" "${url_base}/${artifact}-${version}.pom" 2>/dev/null || echo "  POM failed"
    curl -L --connect-timeout 60 -f -o "$dest_dir/$artifact-$version.jar" "${url_base}/${artifact}-${version}.jar" 2>/dev/null || echo "  JAR failed"
}

download_from_google "com.android.tools.utp" "android-test-plugin-host-coverage-proto" "31.5.2"
download_from_google "com.android.tools.utp" "android-test-plugin-host-emulator-control-proto" "31.5.2"
download_from_google "com.android.tools.utp" "android-test-plugin-host-logcat-proto" "31.5.2"
download_from_google "com.android.tools.utp" "android-test-plugin-host-device-info-proto" "31.5.2"
download_from_google "com.android.tools.utp" "android-test-plugin-result-listener-gradle-proto" "31.5.2"
download_from_google "com.android.tools.utp" "android-test-plugin-host-side-truth-proto" "31.5.2"
download_from_google "com.android.tools.utp" "android-test-plugin-lib-proto" "31.5.2"
download_from_google "com.android.tools.utp" "utp-common-lib-proto" "31.5.2"

download_from_google "com.android.tools" "dvklib" "31.5.2"

download_from_google "com.android.tools.build" "transform-api" "2.0.0"
download_from_google "com.android.tools.build" "apkzlib" "8.5.2"
download_from_google "com.android.tools.build" "apksig" "8.5.2"

download_from_google "com.android.tools.analytics-library" "protos" "31.5.2"
download_from_google "com.android.tools.analytics-library" "tracker" "31.5.2"

download_from_google "com.android.tools.internal.lint" "lint-api" "31.5.2"
download_from_google "com.android.tools.internal.lint" "lint-checks" "31.5.2"
download_from_google "com.android.tools.internal.lint" "lint-gradle" "31.5.2"
download_from_google "com.android.tools.internal.lint" "lint-gradle-api" "31.5.2"
download_from_google "com.android.tools.internal.lint" "lint-model" "31.5.2"
download_from_google "com.android.tools.internal.lint" "lint-typedef-remover" "31.5.2"

download_from_google "com.android.tools.lint" "lint-api" "31.5.2"
download_from_google "com.android.tools.lint" "lint-checks" "31.5.2"
download_from_google "com.android.tools.lint" "lint-gradle" "31.5.2"
download_from_google "com.android.tools.lint" "lint-gradle-api" "31.5.2"
download_from_google "com.android.tools.lint" "lint-model" "31.5.2"
download_from_google "com.android.tools.lint" "lint-typedef-remover" "31.5.2"

download_from_google "com.android.databinding" "baseLibrary" "8.5.2"
download_from_google "com.android.databinding" "compilerCommon" "8.5.2"

download_from_google "com.google.protobuf" "protobuf-java" "3.19.3"
download_from_google "com.google.protobuf" "protobuf-java-util" "3.19.3"

download_from_google "com.google.testing.platform" "core" "0.0.1-alpha12"
download_from_google "com.google.testing.platform" "launcher" "0.0.1-alpha12"

echo "Download complete!"