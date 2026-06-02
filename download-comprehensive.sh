#!/bin/bash

MAVEN_URL="https://repo1.maven.org/maven2"
LOCAL_REPO="/workspace/local-maven-repo"

mkdir -p $LOCAL_REPO

download() {
    group=$1
    artifact=$2
    version=$3
    
    group_path=$(echo $group | tr '.' '/')
    dest_dir="$LOCAL_REPO/$group_path/$artifact/$version"
    mkdir -p $dest_dir
    
    url_base="${MAVEN_URL}/${group_path}/${artifact}/${version}"
    
    if [ ! -f "$dest_dir/$artifact-$version.pom" ] || [ ! -s "$dest_dir/$artifact-$version.pom" ]; then
        curl -L --connect-timeout 30 -f -o "$dest_dir/$artifact-$version.pom" "${url_base}/${artifact}-${version}.pom" 2>/dev/null
    fi
    if [ ! -f "$dest_dir/$artifact-$version.jar" ] || [ ! -s "$dest_dir/$artifact-$version.jar" ]; then
        curl -L --connect-timeout 60 -f -o "$dest_dir/$artifact-$version.jar" "${url_base}/${artifact}-${version}.jar" 2>/dev/null
    fi
}

# errorprone
for v in 2.5.1 2.4.0 2.3.4 2.2.0 2.0.18 2.4.0 2.7.1 2.10.0 2.14.0 2.15.0; do
    download "com.google.errorprone" "error_prone_annotations" "$v"
    download "com.google.errorprone" "error_prone_parent" "$v"
done

# Android annotations
for v in 4.1.1.4 4.0.0 4.1.0 4.1.1 4.1.2 4.1.3 4.1.4 4.1.5 4.1.6 4.1.7; do
    download "com.google.android" "annotations" "$v"
done

# Apache commons (various versions)
for v in 1.0 2.0 3.0 4.0 5.0 6.0 7.0 8.0 9.0 10.0 11.0 12.0 13.0 14.0; do
    download "commons-io" "commons-io" "$v"
    download "commons-codec" "commons-codec" "$v"
done

# FastUtil
for v in 8.5.11 8.5.10 8.5.9 8.5.8 8.4.0 8.3.0 8.2.0; do
    download "it.unimi.dsi" "fastutil" "$v"
done

# Other common deps
download "net.sf.jopt-simple" "jopt-simple" "4.9"
download "net.sf.jopt-simple" "jopt-simple" "5.0.4"
download "com.google.crypto.tink" "tink" "1.7.0"
download "com.google.flatbuffers" "flatbuffers-java" "1.12.0"
download "com.google.flatbuffers" "flatbuffers-java" "1.12.0"

# Auto Value
download "com.google.auto.value" "auto-value-annotations" "1.6.2"
download "com.google.auto.value" "auto-value-parent" "1.6.2"
download "com.google.auto.value" "auto-value" "1.6.2"

# Commons io
download "commons-io" "commons-io" "2.11.0"
download "commons-io" "commons-io" "2.9.0"
download "commons-io" "commons-io" "2.8.0"
download "commons-io" "commons-io" "2.7.0"
download "commons-io" "commons-io" "2.6"
download "commons-io" "commons-io" "2.5"

# GSON various
for v in 2.8.9 2.8.8 2.8.7 2.8.6 2.8.5 2.8.0 2.7.0 2.6.0; do
    download "com.google.code.gson" "gson" "$v"
    download "com.google.code.gson" "gson-parent" "$v"
done

# Lombok-like 
download "javax.annotation" "javax.annotation-api" "1.3.2"
download "javax.annotation" "jsr250-api" "1.0"
download "javax.inject" "javax.inject" "1"

# Bouncy Castle
for v in 1.60 1.61 1.62 1.63 1.64 1.65 1.66 1.67 1.68 1.69 1.70 1.71; do
    download "org.bouncycastle" "bcpkix-jdk15on" "$v"
    download "org.bouncycastle" "bcprov-jdk15on" "$v"
    download "org.bouncycastle" "bcpkix-jdk18on" "$v"
    download "org.bouncycastle" "bcprov-jdk18on" "$v"
    download "org.bouncycastle" "bcutil-jdk18on" "$v"
done

# Common
download "com.google.jimfs" "jimfs" "1.1"
download "com.google.jimfs" "jimfs-parent" "1.1"
download "org.jdom" "jdom2" "2.0.6"

# Okio 
for v in 1.17.2 1.17.1 1.17.0 1.16.0 1.15.0 1.14.0 1.13.0; do
    download "com.squareup.okio" "okio" "$v"
    download "com.squareup.okio" "okio-jvm" "$v"
done

# OkHttp
for v in 4.10.0 4.9.3 4.9.0 4.8.0 4.7.0 4.6.0; do
    download "com.squareup.okhttp3" "okhttp" "$v"
done

# SLF4J
for v in 1.7.30 1.7.29 1.7.28 1.7.25; do
    download "org.slf4j" "slf4j-api" "$v"
    download "org.slf4j" "slf4j-parent" "$v"
done

echo "Download complete!"