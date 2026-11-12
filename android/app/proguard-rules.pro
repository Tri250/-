# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /path/to/proguard-android-optimize.txt

# v1.2.4 P3 审计修复：移除旧版 "-keep class com.battery.master.** { *; }" 全量保留规则。
# 该规则使业务代码 (数据模型 / 硬件采集 / ViewModel / UI / 广播接收器) 实际未被混淆
# 与裁剪，与 release notes 及 README 的 "R8 混淆" 宣称不符 (宣称失实)。
# 全量混淆安全性论证：
# 1. 业务侧无反射依赖——仅反射系统 @hide 类 PowerProfile (系统类不受 R8 影响)；
# 2. Compose / Lifecycle 官方 consumer rules 覆盖框架侧生成代码；
# 3. AGP 默认规则 (proguard-android-optimize.txt) 保留枚举 values()/valueOf()；
# 4. 数据模型为纯 Kotlin data class，无 JSON/Parcelable 反射序列化。

# 保留运行时可见注解与默认值元数据（Compose / Lifecycle consumer rules 之外的兜底）
-keepattributes RuntimeVisibleAnnotations, AnnotationDefault

# 硬件反射目标：PowerProfile 为 @hide 系统类，仅声明不告警
-dontwarn com.android.internal.os.PowerProfile
