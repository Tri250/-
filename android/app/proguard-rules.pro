# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /path/to/proguard-android-optimize.txt

# Keep data models
-keep class com.battery.master.model.** { *; }
-keep class com.battery.master.data.** { *; }

# 保留运行时可见注解与默认值元数据（Compose / Lifecycle consumer rules 之外的兜底）
-keepattributes RuntimeVisibleAnnotations, AnnotationDefault

# Compose 组件与回调签名兜底，避免 R8 优化裁剪相关成员
-keepclassmembers class com.battery.master.** {
    public void on*Event(android.view.View);
}
