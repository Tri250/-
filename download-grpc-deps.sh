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
    
    echo "Downloading $group:$artifact:$version..."
    curl -L --connect-timeout 30 -f -o "$dest_dir/$artifact-$version.pom" "${url_base}/${artifact}-${version}.pom" 2>/dev/null || echo "  POM failed"
    curl -L --connect-timeout 60 -f -o "$dest_dir/$artifact-$version.jar" "${url_base}/${artifact}-${version}.jar" 2>/dev/null || echo "  JAR failed"
}

# Gson parent
download "com.google.code.gson" "gson-parent" "2.10"

# gRPC dependencies
download "io.grpc" "grpc-stub" "1.45.1"
download "io.grpc" "grpc-protobuf" "1.45.1"
download "io.grpc" "grpc-protobuf-lite" "1.45.1"
download "io.grpc" "grpc-api" "1.45.1"
download "io.grpc" "grpc-context" "1.45.1"
download "io.grpc" "grpc-okhttp" "1.45.1"
download "io.grpc" "grpc-util" "1.45.1"
download "io.grpc" "grpc-core" "1.45.1"
download "io.grpc" "grpc-netty" "1.45.1"
download "io.grpc" "grpc-stub" "1.45.1"
download "io.grpc" "grpc-internal" "1.45.1"
download "io.grpc" "grpc-api" "1.45.1"

# Netty
download "io.netty" "netty-codec-http" "4.1.94.Final"
download "io.netty" "netty-codec-http2" "4.1.94.Final"
download "io.netty" "netty-codec" "4.1.94.Final"
download "io.netty" "netty-handler" "4.1.94.Final"
download "io.netty" "netty-buffer" "4.1.94.Final"
download "io.netty" "netty-common" "4.1.94.Final"
download "io.netty" "netty-transport" "4.1.94.Final"
download "io.netty" "netty-resolver" "4.1.94.Final"
download "io.netty" "netty-tcnative-classes" "2.0.61.Final"

# Okio
download "com.squareup.okio" "okio" "1.17.2"
download "com.squareup.okio" "okio-jvm" "1.17.2"

# OkHttp
download "com.squareup.okhttp3" "okhttp" "4.10.0"

# Animal Sniffer
download "org.codehaus.mojo" "animal-sniffer-annotations" "1.21"

# Google API
download "com.google.api" "api-common" "2.1.4"

echo "Download complete!"