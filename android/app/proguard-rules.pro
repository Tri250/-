# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /path/to/proguard-android-optimize.txt

# 启动闪退治理：应用全部类 (数据模型 / 硬件采集 / ViewModel / UI / 广播接收器) 全量保留，
# 避免 R8 优化阶段裁剪或重命名引发运行期 NoSuchMethodError / ClassCastException。
# Compose/Lifecycle 官方 consumer rules 已覆盖框架侧，此处兜底业务侧。
-keep class com.battery.master.** { *; }

# 保留运行时可见注解与默认值元数据（Compose / Lifecycle consumer rules 之外的兜底）
-keepattributes RuntimeVisibleAnnotations, AnnotationDefault

# Compose 组件与回调签名兜底，避免 R8 优化裁剪相关成员
-keepclassmembers class com.battery.master.** {
    public void on*Event(android.view.View);
}

# 硬件反射目标：PowerProfile 在混淆后不可用 (系统类不受 R8 影响，此处显式声明防止误删引用)
-dontwarn com.android.internal.os.PowerProfile
