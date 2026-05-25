FROM ubuntu:22.04

# 避免交互式配置
ENV DEBIAN_FRONTEND=noninteractive

# 安装基础依赖
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# 设置 Java 环境变量
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

# 安装 Android SDK 命令行工具
RUN mkdir -p /android-sdk/cmdline-tools
WORKDIR /android-sdk/cmdline-tools
RUN wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip && \
    unzip -q cmdline-tools.zip && \
    mv cmdline-tools latest && \
    rm cmdline-tools.zip

# 设置 Android SDK 环境变量
ENV ANDROID_HOME=/android-sdk
ENV ANDROID_SDK_ROOT=/android-sdk
ENV PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

# 接受 Android SDK 许可证并安装必要的包
RUN yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 授予 gradlew 执行权限
RUN chmod +x android/gradlew

# 构建 APK
CMD ["sh", "-c", "cd android && ./gradlew assembleDebug"]
