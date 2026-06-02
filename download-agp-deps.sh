#!/bin/bash

BASE_URL="https://dl.google.com/dl/android/maven2"
LOCAL_REPO="/workspace/local-maven-repo"

mkdir -p $LOCAL_REPO

download_artifact() {
    group=$1
    artifact=$2
    version=$3
    
    group_path=$(echo $group | tr '.' '/')
    dest_dir="$LOCAL_REPO/$group_path/$artifact/$version"
    mkdir -p $dest_dir
    
    echo "Downloading $group:$artifact:$version..."
    
    curl -L --connect-timeout 30 -o "$dest_dir/$artifact-$version.pom" "$BASE_URL/$group_path/$artifact/$version/$artifact-$version.pom" 2>/dev/null || echo "POM failed: $artifact"
    curl -L --connect-timeout 60 -o "$dest_dir/$artifact-$version.jar" "$BASE_URL/$group_path/$artifact/$version/$artifact-$version.jar" 2>/dev/null || echo "JAR failed: $artifact"
}

download_artifact "com.android.tools.build" "gradle" "8.5.2"
download_artifact "com.android.tools.build" "builder" "8.5.2"
download_artifact "com.android.tools.build" "builder-model" "8.5.2"
download_artifact "com.android.tools.build" "gradle-api" "8.5.2"
download_artifact "com.android.tools.build" "gradle-settings-api" "8.5.2"
download_artifact "com.android.tools.build" "aaptcompiler" "8.5.2"
download_artifact "com.android.tools.build" "aapt2-proto" "8.5.2-11315950"

download_artifact "com.android.tools" "sdk-common" "31.5.2"
download_artifact "com.android.tools" "sdklib" "31.5.2"
download_artifact "com.android.tools" "repository" "31.5.2"
download_artifact "com.android.tools" "common" "31.5.2"

download_artifact "com.android.tools.ddms" "ddmlib" "31.5.2"

download_artifact "com.android.tools.analytics-library" "crash" "31.5.2"
download_artifact "com.android.tools.analytics-library" "shared" "31.5.2"
download_artifact "com.android.tools.analytics-library" "protos" "31.5.2"
download_artifact "com.android.tools.analytics-library" "tracker" "31.5.2"

download_artifact "com.android.tools.lint" "lint-model" "31.5.2"
download_artifact "com.android.tools.lint" "lint-typedef-remover" "31.5.2"
download_artifact "com.android.tools.lint" "lint-gradle" "31.5.2"
download_artifact "com.android.tools.lint" "lint" "31.5.2"
download_artifact "com.android.tools.lint" "lint-api" "31.5.2"
download_artifact "com.android.tools.lint" "lint-checks" "31.5.2"
download_artifact "com.android.tools.lint" "lint-gradle-api" "31.5.2"

download_artifact "androidx.databinding" "databinding-compiler-common" "8.5.2"
download_artifact "androidx.databinding" "databinding-common" "8.5.2"
download_artifact "com.android.databinding" "baseLibrary" "8.5.2"

download_artifact "com.google.code.gson" "gson" "2.8.9"
download_artifact "com.google.guava" "guava" "31.1-jre"
download_artifact "com.google.protobuf" "protobuf-java" "3.19.3"
download_artifact "com.google.protobuf" "protobuf-java-util" "3.19.3"

download_artifact "org.jetbrains.kotlin" "kotlin-stdlib" "1.9.0"
download_artifact "org.jetbrains.kotlin" "kotlin-stdlib-common" "1.9.0"
download_artifact "org.jetbrains.kotlin" "kotlin-stdlib-jdk8" "1.9.0"
download_artifact "org.jetbrains.kotlin" "kotlin-stdlib-jdk7" "1.9.0"
download_artifact "org.jetbrains.kotlin" "kotlin-reflect" "1.9.0"
download_artifact "org.jetbrains.kotlinx" "kotlinx-coroutines-core-jvm" "1.7.3"

download_artifact "com.squareup" "javapoet" "1.13.0"
download_artifact "com.squareup" "javawriter" "2.5.0"

download_artifact "org.ow2.asm" "asm" "9.6"
download_artifact "org.ow2.asm" "asm-commons" "9.6"
download_artifact "org.ow2.asm" "asm-tree" "9.6"
download_artifact "org.ow2.asm" "asm-analysis" "9.6"

download_artifact "net.sf.kxml" "kxml2" "2.3.0"
download_artifact "com.sun.activation" "javax.activation" "1.2.0"
download_artifact "javax.activation" "javax.activation-api" "1.2.0"

echo "Download complete!"
ls -la $LOCAL_REPO/com/android/tools/build/