#!/bin/bash

GOOGLE_URL="https://dl.google.com/dl/android/maven2"
MAVEN_URL="https://repo1.maven.org/maven2"
LOCAL_REPO="/workspace/local-maven-repo"

mkdir -p $LOCAL_REPO

download_from_maven() {
    group=$1
    artifact=$2
    version=$3
    source=$4
    
    group_path=$(echo $group | tr '.' '/')
    dest_dir="$LOCAL_REPO/$group_path/$artifact/$version"
    mkdir -p $dest_dir
    
    url_base="${source}/${group_path}/${artifact}/${version}"
    
    echo "Downloading $group:$artifact:$version from $source..."
    
    curl -L --connect-timeout 30 -f -o "$dest_dir/$artifact-$version.pom" "${url_base}/${artifact}-${version}.pom" 2>/dev/null
    curl -L --connect-timeout 60 -f -o "$dest_dir/$artifact-$version.jar" "${url_base}/${artifact}-${version}.jar" 2>/dev/null
    
    if [ ! -s "$dest_dir/$artifact-$version.pom" ]; then
        echo "  POM failed, trying alternate..."
        if [ "$source" == "$GOOGLE_URL" ]; then
            download_from_maven "$group" "$artifact" "$version" "$MAVEN_URL"
        fi
    fi
}

download_from_google() {
    download_from_maven "$1" "$2" "$3" "$GOOGLE_URL"
}

download_from_maven_central() {
    download_from_maven "$1" "$2" "$3" "$MAVEN_URL"
}

download_from_google "com.android.tools.build" "builder-test-api" "8.5.2"
download_from_google "com.android.tools.layoutlib" "layoutlib-api" "31.5.2"
download_from_google "com.android.tools.utp" "android-device-provider-ddmlib-proto" "31.5.2"
download_from_google "com.android.tools.utp" "android-device-provider-gradle-proto" "31.5.2"
download_from_google "com.android.tools.utp" "android-test-plugin-result-listener-gradle-proto" "31.5.2"
download_from_google "com.android.tools.utp" "android-test-plugin-host-retention-proto" "31.5.2"
download_from_google "com.android.tools.utp" "android-test-plugin-host-additional-test-output-proto" "31.5.2"

download_from_maven_central "org.ow2.asm" "asm" "9.6"
download_from_maven_central "org.ow2.asm" "asm-commons" "9.6"
download_from_maven_central "org.ow2.asm" "asm-tree" "9.6"
download_from_maven_central "org.ow2.asm" "asm-analysis" "9.6"
download_from_maven_central "org.ow2.asm" "asm-util" "9.6"

download_from_maven_central "net.sf.kxml" "kxml2" "2.3.0"
download_from_maven_central "com.squareup" "javawriter" "2.5.0"
download_from_maven_central "com.sun.activation" "javax.activation" "1.2.0"
download_from_maven_central "javax.activation" "javax.activation-api" "1.2.0"

download_from_google "com.android.tools" "annotations" "31.5.2"
download_from_google "com.android.tools.build.jetifier" "jetifier-core" "1.0.0"
download_from_google "com.android.tools.build.jetifier" "jetifier-processor" "1.0.0"

download_from_maven_central "com.google.code.findbugs" "jsr305" "3.0.2"
download_from_maven_central "com.google.errorprone" "error_prone_annotations" "2.11.0"
download_from_maven_central "com.google.j2objc" "j2objc-annotations" "1.3"
download_from_maven_central "org.checkerframework" "checker-qual" "3.12.0"

download_from_maven_central "commons-codec" "commons-codec" "1.11"
download_from_maven_central "commons-io" "commons-io" "2.4"
download_from_maven_central "org.apache.commons" "commons-lang3" "3.12.0"

download_from_maven_central "it.unimi.dsi" "fastutil" "8.5.11"

download_from_google "com.android.tools.build" "manifest-merger" "31.5.2"

echo "Download complete!"