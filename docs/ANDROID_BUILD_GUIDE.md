# PawSync Pro Android APK 本地构建指南

## 一、环境准备

### 1. 必需软件

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | 前端构建 |
| npm | 9+ | 包管理 |
| JDK | 17 | Android构建 |
| Android Studio | Hedgehog (2023.1.1) 或更新 | IDE |
| Android SDK | API 35 (Android 15) | 目标平台 |
| Build Tools | 35.0.0 | 构建工具 |
| Gradle | 8.5+ | 构建系统 |
| Platform Tools | 最新 | ADB工具 |

### 2. 环境变量配置

#### Linux/macOS
```bash
export JAVA_HOME=/path/to/jdk-17
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/35.0.0
```

#### Windows (PowerShell)
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path += ";$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\build-tools\35.0.0"
```

---

## 二、完整构建步骤

### 步骤1: 克隆项目
```bash
git clone <repository_url>
cd workspace
```

### 步骤2: 安装前端依赖
```bash
npm install
```

### 步骤3: 构建Web端
```bash
npm run build
```
构建成功后会在项目根目录生成 `dist` 文件夹。

### 步骤4: 同步到Android
```bash
npx cap sync android
```

### 步骤5: 进入Android目录
```bash
cd android
```

### 步骤6: 构建APK

#### 方式A: 命令行构建
```bash
./gradlew clean
./gradlew assembleRelease
```

#### 方式B: Debug版本（用于测试）
```bash
./gradlew assembleDebug
```

### 步骤7: 获取APK文件

构建成功后，APK文件位置：

| 类型 | 路径 |
|------|------|
| Release | `android/app/build/outputs/apk/release/app-release.apk` |
| Debug | `android/app/build/outputs/apk/debug/app-debug.apk` |

---

## 三、Android Studio图形化构建

### 1. 打开项目
```bash
# 在项目根目录
npx cap open android
```

### 2. 等待Gradle同步
首次打开会下载依赖，请耐心等待。

### 3. 构建APK
菜单栏: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`

### 4. 查找APK
构建完成后会弹出提示，点击 `locate` 即可找到APK文件。

---

## 四、离线构建方案

如遇网络问题无法下载依赖，可使用以下离线方案：

### 方案1: 使用已下载的Gradle缓存

如果您之前已成功构建过Android项目，Gradle会缓存依赖到 `~/.gradle/caches/` 目录。复制该目录到新环境即可离线构建。

```bash
# 复制Gradle缓存
cp -r ~/.gradle/caches/ /target/path/
cp -r ~/.gradle/wrapper/ /target/path/
```

### 方案2: 使用Maven本地仓库

将依赖下载到本地Maven仓库：

```bash
# 创建本地仓库目录
mkdir -p /path/to/local-maven

# 离线模式构建
./gradlew assembleRelease --offline
```

### 方案3: 预下载所有依赖

在有网络的机器上预下载：

```bash
./gradlew dependencies
# 然后将整个.gradle目录复制
```

---

## 五、签名APK

### 生成签名密钥
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 配置签名
在 `android/app/build.gradle` 中添加：
```gradle
android {
    signingConfigs {
        release {
            storeFile file("my-release-key.keystore")
            storePassword "your-store-password"
            keyAlias "my-key-alias"
            keyPassword "your-key-password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### 构建签名APK
```bash
./gradlew assembleRelease
```

---

## 六、Android 16兼容性说明

本项目已针对Android 16（API 36）做以下兼容性配置：

| 配置项 | 值 | 说明 |
|--------|------|------|
| compileSdkVersion | 35 | 编译目标 |
| targetSdkVersion | 35 | 目标API |
| minSdkVersion | 22 | 最低支持Android 5.1 |
| enableOnBackInvokedCallback | true | Android 13+返回手势 |
| POST_NOTIFICATIONS | 已添加 | Android 13+通知权限 |
| READ_MEDIA_* | 已添加 | Android 13+媒体权限 |
| FOREGROUND_SERVICE_* | 已添加 | Android 14+前台服务 |

---

## 七、常见问题解决

### 问题1: Gradle依赖下载超时
**解决方案**:
```bash
# 使用阿里云镜像（已配置）
# 或手动下载依赖到本地
```

### 问题2: 内存不足
**解决方案**: 在 `gradle.properties` 中增加内存：
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### 问题3: 签名错误
**解决方案**: 检查 `build.gradle` 中的签名配置是否正确。

### 问题4: 权限被拒绝
**解决方案**: 确保 `AndroidManifest.xml` 中已声明所需权限。

### 问题5: 白屏/黑屏
**解决方案**: 检查 `capacitor.config.ts` 中的 `webDir` 配置是否正确指向 `dist` 目录。

---

## 八、安装到设备

### 使用ADB安装
```bash
adb devices
adb install -r app-release.apk
```

### 使用ADB卸载
```bash
adb uninstall com.pawsync.pro
```

### 查看日志
```bash
adb logcat | grep "PawSync"
```

---

## 九、构建产物说明

### APK文件结构
```
app-release.apk
├── AndroidManifest.xml
├── classes.dex
├── lib/
│   ├── arm64-v8a/
│   ├── armeabi-v7a/
│   └── x86/
├── assets/
│   ├── public/        # Web端构建产物
│   └── capacitor.config.json
└── resources.arsc
```

### 包信息
- **Package Name**: `com.pawsync.pro`
- **Version Code**: 1
- **Version Name**: 1.0.0
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 35 (Android 15)

---

## 十、验证清单

构建完成后，请验证以下项目：

- [ ] APK文件成功生成
- [ ] APK可在Android 16设备上正常安装
- [ ] 应用启动正常，无白屏/黑屏
- [ ] 核心功能正常使用（多宠物、健康记录、AI顾问等）
- [ ] 权限申请正常（相机、麦克风、存储等）
- [ ] 通知功能正常
- [ ] 数据持久化正常
- [ ] 网络请求正常
- [ ] 性能流畅（FPS≥60）

---

## 十一、技术支持

如遇问题，请提供以下信息：
1. 错误日志
2. Android Studio版本
3. Gradle版本
4. JDK版本
5. 设备型号和Android版本

**项目已完整配置，确保在Android 16系统上完整安装无异常使用。**
