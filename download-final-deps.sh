#!/bin/bash

MAVEN_URL="https://repo1.maven.org/maven2"
LOCAL_REPO="/workspace/local-maven-repo"

mkdir -p $LOCAL_REPO

download_maven() {
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

# Bouncy Castle
download_maven "org.bouncycastle" "bcpkix-jdk15on" "1.67"
download_maven "org.bouncycastle" "bcprov-jdk15on" "1.67"
download_maven "org.bouncycastle" "bcpkix-jdk18on" "1.67"

# JAXB
download_maven "org.glassfish.jaxb" "jaxb-runtime" "2.3.2"
download_maven "org.glassfish.jaxb" "txw2" "2.3.2"
download_maven "com.sun.xml.bind" "jaxb-impl" "2.3.2"
download_maven "com.sun.istack" "istack-commons-runtime" "3.0.8"
download_maven "com.sun.activation" "javax.activation" "1.2.0"

# jopt-simple
download_maven "net.sf.jopt-simple" "jopt-simple" "4.9"

# Other dependencies
download_maven "org.glassfish.jaxb" "jaxb-core" "2.3.0.1"
download_maven "jakarta.xml.bind" "jakarta.xml.bind-api" "2.3.2"
download_maven "javax.xml.bind" "jaxb-api" "2.3.1"

# Kotlin compiler embeddable (needed for some)
download_maven "org.jetbrains.kotlin" "kotlin-compiler-embeddable" "1.9.0"
download_maven "org.jetbrains.kotlin" "kotlin-daemon-embeddable" "1.9.0"

# Protobuf
download_maven "com.google.protobuf" "protobuf-java" "3.21.12"
download_maven "com.google.protobuf" "protobuf-java-util" "3.21.12"

# Junit
download_maven "junit" "junit" "4.13.2"
download_maven "org.hamcrest" "hamcrest-core" "1.3"

# AndroidX (for runtime)
download_maven "androidx.annotation" "annotation" "1.7.0"
download_maven "androidx.annotation" "annotation-jvm" "1.7.0"
download_maven "androidx.collection" "collection" "1.3.0"
download_maven "androidx.lifecycle" "lifecycle-common" "2.6.1"

echo "Download complete!"