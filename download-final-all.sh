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
    
    if [ ! -f "$dest_dir/$artifact-$version.pom" ]; then
        echo "Downloading $group:$artifact:$version..."
        curl -L --connect-timeout 30 -f -o "$dest_dir/$artifact-$version.pom" "${url_base}/${artifact}-${version}.pom" 2>/dev/null
    fi
    if [ ! -f "$dest_dir/$artifact-$version.jar" ]; then
        curl -L --connect-timeout 60 -f -o "$dest_dir/$artifact-$version.jar" "${url_base}/${artifact}-${version}.jar" 2>/dev/null
    fi
}

# JAXB parents
download "jakarta.xml.bind" "jakarta.xml.bind-api-parent" "2.3.2"
download "com.sun.xml.bind.mvn" "jaxb-txw-parent" "2.3.2"
download "com.sun.istack" "istack-commons" "3.0.8"
download "com.sun.istack" "istack-commons-runtime" "3.0.8"

# ProtoLite
download "com.google.protobuf" "protolite" "3.0.1"

# Other dependencies
download "org.bouncycastle" "bcpkix-jdk18on" "1.71"
download "org.bouncycastle" "bcprov-jdk18on" "1.71"
download "org.bouncycastle" "bcutil-jdk18on" "1.71"

# Kotlin
download "org.jetbrains.kotlin" "kotlin-build-tools-impl" "1.9.0"
download "org.jetbrains.kotlin" "kotlin-script-runtime" "1.9.0"

# Additional android tools
download "com.android.tools.analytics-library" "protos" "31.2.2"
download "com.android.tools.analytics-library" "shared" "31.2.2"
download "com.android.tools.analytics-library" "crash" "31.2.2"
download "com.android.tools.analytics-library" "tracker" "31.2.2"

# jaxb boms
download "com.sun.xml.bind.mvn" "jaxb-bom" "2.3.2"
download "com.sun.xml.bind.mvn" "jaxb-runtime-parent" "2.3.2"

# Other tools deps
download "com.android.tools.layoutlib" "layoutlib-api" "31.2.2"

# Other
download "net.java.dev.jna" "jna" "5.6.0"
download "net.java.dev.jna" "jna-platform" "5.6.0"

# Apache
download "org.apache" "apache" "16"
download "org.apache" "apache" "19"
download "org.apache" "apache" "20"
download "org.apache" "apache" "24"
download "org.apache" "apache" "25"
download "org.apache" "apache" "26"
download "org.apache" "apache" "27"
download "org.apache" "apache" "28"
download "org.apache" "apache" "29"
download "org.apache" "apache" "30"
download "org.apache" "apache" "31"

# Project parents
download "com.google" "google" "1"
download "com.google" "google" "2"
download "com.google" "google" "3"
download "com.google" "google" "4"
download "com.google" "google" "5"
download "com.google" "google" "6"

# Other 
download "javax.xml.bind" "jaxb-api" "2.3.1"

echo "Download complete!"