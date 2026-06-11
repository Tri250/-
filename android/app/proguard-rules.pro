# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
-renamesourcefileattribute SourceFile

# ============================================
# PawSync ProGuard Rules
# ============================================

# Keep debugging information for crash reports
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions

# Protect sensitive data - obfuscate strings in sensitive classes
-obfuscationdictionary proguard-dictionary.txt
-classobfuscationdictionary proguard-dictionary.txt
-packageobfuscationdictionary proguard-dictionary.txt

# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep class capacitor.** { *; }
-keepclassmembers class capacitor.** { *; }

# Keep Android components
-keep class com.pawsync.pro.** { *; }
-keepclassmembers class com.pawsync.pro.** {
    public <methods>;
    public <fields>;
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Parcelable and Serializable classes
-keepclassmembers class * implements android.os.Parcelable {
    static ** CREATOR;
}
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep enum classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Remove logging in release builds
-assumenosideeffects class android.util.Log {
    public static int v(...);
    public static int d(...);
    public static int i(...);
    public static int w(...);
    public static int e(...);
}

# Keep JavaScript interfaces for WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Retrofit/OkHttp if used
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Keep Gson if used
-keepattributes Signature
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Optimize aggressively
-optimizationpasses 5
-dontskipnonpubliclibraryclasses
-verbose

# Optimization settings
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*,!code/algebra/field/*

# ============================================
# Performance Optimizations
# ============================================

# 内联短方法
-allowaccessmodification

# 合并接口
-mergeinterfacesaggressively

# 优化字符串操作
-optimizations code/simplification/string

# 预验证（Android不需要）
-dontpreverify

# 允许访问修改（优化内联）
-allowaccessmodification

# WebView性能优化
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String);
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
}
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void *(android.webkit.WebView, java.lang.String);
}

# 移除System.out调用（性能优化）
-assumenosideeffects class java.io.PrintStream {
    public void println(...);
    public void print(...);
}

# 优化集合操作
-keepclassmembers class * extends java.util.Collection {
    public boolean add(...);
    public boolean remove(...);
    public boolean contains(...);
    public int size();
}

# 线程优化
-keepclassmembers class * implements java.lang.Runnable {
    public void run();
}
-keepclassmembers class * extends java.lang.Thread {
    public void run();
}
