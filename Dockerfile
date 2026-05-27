FROM ubuntu:22.04

LABEL maintainer="PawSync Pro Team"
LABEL description="PawSync Pro Android APK Builder - Android 16 Compatible"

ENV DEBIAN_FRONTEND=noninteractive
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV JAVA_HOME=/opt/java
ENV GRADLE_HOME=/opt/gradle
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$GRADLE_HOME/bin

WORKDIR /app

RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    openjdk-17-jdk \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -s /bin/bash builder

USER builder

RUN wget -q https://services.gradle.org/distributions/gradle-8.14.4-bin.zip -O /tmp/gradle.zip && \
    unzip -q /tmp/gradle.zip -d /opt && \
    ln -s /opt/gradle-8.14.4 /opt/gradle && \
    rm /tmp/gradle.zip

RUN mkdir -p $ANDROID_HOME/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdline-tools.zip && \
    unzip -q /tmp/cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools && \
    mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest && \
    rm /tmp/cmdline-tools.zip

RUN yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses >/dev/null 2>&1

RUN $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platforms;android-36" "build-tools;36.0.0" "platform-tools"

COPY --chown=builder:builder . /app

RUN chmod +x gradlew build-apk.sh && \
    ./gradlew assembleDebug

RUN mkdir -p /output && \
    cp android/app/build/outputs/apk/debug/app-debug.apk /output/

FROM alpine:3.19
LABEL description="PawSync Pro APK Output"
COPY --from=0 /output/app-debug.apk /app-debug.apk
WORKDIR /app
CMD echo "APK built successfully! File: /app-debug.apk"
