# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /path/to/proguard-android-optimize.txt

# Keep data models
-keep class com.battery.master.model.** { *; }
-keep class com.battery.master.data.** { *; }
