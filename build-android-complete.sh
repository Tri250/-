#!/bin/bash
# PawSync Pro Android 一键构建脚本
# 自动处理环境配置、Web 构建、Capacitor 同步、APK 构建

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 步骤 1: 设置环境变量
log_info "=== 步骤 1: 设置构建环境 ==="
export JAVA_HOME=/root/.local/share/mise/installs/java/17.0.2
export ANDROID_HOME=/root/android-sdk
export ANDROID_SDK_ROOT=/root/android-sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0:$PATH

# 验证环境
java -version 2>&1 | head -1
log_success "Java 环境配置完成"

if [ ! -d "$ANDROID_HOME" ]; then
    log_error "Android SDK 未安装: $ANDROID_HOME"
    exit 1
fi
log_success "Android SDK 配置完成"

# 步骤 2: 构建 Web 应用
log_info "=== 步骤 2: 构建 Web 应用 ==="
cd /workspace

if [ ! -d "node_modules" ]; then
    log_warn "node_modules 不存在，正在安装依赖..."
    npm install --prefer-offline --no-audit --no-fund
fi

log_info "执行 Vite 构建..."
npm run build 2>&1 | tail -10

if [ ! -d "dist" ]; then
    log_error "Web 构建失败：dist 目录未生成"
    exit 1
fi
log_success "Web 构建完成"

# 步骤 3: 同步 Capacitor
log_info "=== 步骤 3: 同步 Capacitor ==="
export CAPACITOR_ANDROID_STUDIO_PATH=
npx cap sync android 2>&1 | tail -20
log_success "Capacitor 同步完成"

# 步骤 3.5: 修复 Capacitor 生成的 build.gradle 文件
log_info "=== 步骤 3.5: 修复 Gradle 配置 ==="

# 修复 capacitor-android 模块
log_info "修复 capacitor-android build.gradle..."
cat > /workspace/node_modules/@capacitor/android/capacitor/build.gradle << 'CAPACITOR_BUILD_GRADLE'
ext {
    androidxActivityVersion = project.hasProperty('androidxActivityVersion') ? rootProject.ext.androidxActivityVersion : '1.8.0'
    androidxAppCompatVersion = project.hasProperty('androidxAppCompatVersion') ? rootProject.ext.androidxAppCompatVersion : '1.6.1'
    androidxAnnotationVersion = project.hasProperty('androidxAnnotationVersion') ? rootProject.ext.androidxAnnotationVersion : '1.7.0'
    androidxAnnotationExperimentalVersion = project.hasProperty('androidxAnnotationExperimentalVersion') ? rootProject.ext.androidxAnnotationExperimentalVersion : '1.4.0'
    androidxCoordinatorLayoutVersion = project.hasProperty('androidxCoordinatorLayoutVersion') ? rootProject.ext.androidxCoordinatorLayoutVersion : '1.2.0'
    androidxCoreVersion = project.hasProperty('androidxCoreVersion') ? rootProject.ext.androidxCoreVersion : '1.12.0'
    androidxFragmentVersion = project.hasProperty('androidxFragmentVersion') ? rootProject.ext.androidxFragmentVersion : '1.8.0'
    androidxWebkitVersion = project.hasProperty('androidxWebkitVersion') ? rootProject.ext.androidxWebkitVersion : '1.12.0'
    junitVersion = project.hasProperty('junitVersion') ? rootProject.ext.junitVersion : '4.13.2'
    androidxJunitVersion = project.hasProperty('androidxJunitVersion') ? rootProject.ext.androidxJunitVersion : '1.1.5'
    androidxEspressoCoreVersion = project.hasProperty('androidxEspressoCoreVersion') ? rootProject.ext.androidxEspressoCoreVersion : '3.5.1'
    cordovaAndroidVersion = project.hasProperty('cordovaAndroidVersion') ? rootProject.ext.cordovaAndroidVersion : '14.0.1'
}

buildscript {
    repositories {
        maven { url '/workspace/local-maven-repo' }
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
        maven { url 'https://repo.huaweicloud.com/repository/maven/' }
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
    }
}

apply plugin: 'com.android.library'

android {
    namespace = "com.getcapacitor.android"
    compileSdk = project.hasProperty('compileSdkVersion') ? rootProject.ext.compileSdkVersion : 34
    defaultConfig {
        minSdkVersion project.hasProperty('minSdkVersion') ? rootProject.ext.minSdkVersion : 22
        targetSdkVersion project.hasProperty('targetSdkVersion') ? rootProject.ext.targetSdkVersion : 34
        versionCode 1
        versionName "1.0"
        consumerProguardFiles 'proguard-rules.pro'
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    lintOptions {
        abortOnError = false
        warningsAsErrors = false
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

repositories {
    maven { url '/workspace/local-maven-repo' }
    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/public' }
    maven { url 'https://repo.huaweicloud.com/repository/maven/' }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation "androidx.annotation:annotation:$androidxAnnotationVersion"
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.core:core:$androidxCoreVersion"
    implementation "androidx.activity:activity:$androidxActivityVersion"
    implementation "androidx.fragment:fragment:$androidxFragmentVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.webkit:webkit:$androidxWebkitVersion"
    testImplementation "junit:junit:$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
    implementation "org.apache.cordova:framework:$cordovaAndroidVersion"
}
CAPACITOR_BUILD_GRADLE
log_success "capacitor-android build.gradle 已修复"

# 修复 capacitor-cordova-android-plugins 模块
log_info "修复 capacitor-cordova-android-plugins build.gradle..."
cat > /workspace/android/capacitor-cordova-android-plugins/build.gradle << 'CORDOVA_BUILD_GRADLE'
ext {
    androidxAppCompatVersion = project.hasProperty('androidxAppCompatVersion') ? rootProject.ext.androidxAppCompatVersion : '1.6.1'
    cordovaAndroidVersion = project.hasProperty('cordovaAndroidVersion') ? rootProject.ext.cordovaAndroidVersion : '14.0.1'
}

buildscript {
    repositories {
        maven { url '/workspace/local-maven-repo' }
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
        maven { url 'https://repo.huaweicloud.com/repository/maven/' }
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
    }
}

apply plugin: 'com.android.library'

android {
    namespace = "capacitor.cordova.android.plugins"
    compileSdk = project.hasProperty('compileSdkVersion') ? rootProject.ext.compileSdkVersion : 34
    defaultConfig {
        minSdkVersion project.hasProperty('minSdkVersion') ? rootProject.ext.minSdkVersion : 22
        targetSdkVersion project.hasProperty('targetSdkVersion') ? rootProject.ext.targetSdkVersion : 34
        versionCode 1
        versionName "1.0"
    }
    lintOptions {
        abortOnError = false
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

repositories {
    maven { url '/workspace/local-maven-repo' }
    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/public' }
    maven { url 'https://repo.huaweicloud.com/repository/maven/' }
    flatDir{
        dirs 'src/main/libs', 'libs'
    }
}

dependencies {
    implementation fileTree(dir: 'src/main/libs', include: ['*.jar'])
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "org.apache.cordova:framework:$cordovaAndroidVersion"
}

apply from: "cordova.variables.gradle"

for (def func : cdvPluginPostBuildExtras) {
    func()
}
CORDOVA_BUILD_GRADLE
log_success "capacitor-cordova-android-plugins build.gradle 已修复"

# 步骤 4: 构建 Android APK
log_info "=== 步骤 4: 构建 Android APK ==="
cd /workspace/android

# 设置 Gradle 用户主目录使用本地仓库
export GRADLE_USER_HOME=/root/.gradle

log_info "执行 Gradle assembleRelease..."
gradle assembleRelease --no-daemon --init-script init.gradle 2>&1 | tail -50

# 步骤 5: 验证产物
log_info "=== 步骤 5: 验证 APK 产物 ==="
APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
if [ -f "$APK_PATH" ]; then
    log_success "APK 构建成功！"
    ls -lh "$APK_PATH"
    echo ""
    echo "================================="
    echo "  构建完成！"
    echo "  APK 路径: /workspace/android/$APK_PATH"
    echo "================================="
else
    log_error "APK 未生成，请检查构建日志"
    exit 1
fi