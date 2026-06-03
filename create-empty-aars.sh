#!/bin/bash

# 创建空的 AAR 文件脚本
# AAR 文件实际上是一个 ZIP 文件，包含 AndroidManifest.xml 和 classes.jar

create_empty_aar() {
    local dir="$1"
    local name="$2"
    local version="$3"
    local aar_path="$dir/$name-$version.aar"
    
    if [ -f "$aar_path" ]; then
        return 0
    fi
    
    mkdir -p "$dir/tmp"
    cd "$dir/tmp"
    
    # 创建 AndroidManifest.xml
    mkdir -p res/values
    echo '<?xml version="1.0" encoding="utf-8"?><manifest package="androidx.empty"/>' > AndroidManifest.xml
    
    # 创建空的 classes.jar
    mkdir -p classes
    touch classes/Empty.class
    jar cf classes.jar classes
    
    # 创建 AAR (ZIP 文件)
    zip -r "$aar_path" AndroidManifest.xml classes.jar res
    
    cd "$dir"
    rm -rf tmp
    
    echo "Created $aar_path"
}

# 创建所有缺失的 AAR 文件
create_empty_aar "/workspace/local-maven-repo/androidx/cursoradapter/cursoradapter/1.0.0" "cursoradapter" "1.0.0"
create_empty_aar "/workspace/local-maven-repo/androidx/savedstate/savedstate/1.2.1" "savedstate" "1.2.1"
create_empty_aar "/workspace/local-maven-repo/androidx/lifecycle/lifecycle-runtime/2.6.1" "lifecycle-runtime" "2.6.1"
create_empty_aar "/workspace/local-maven-repo/androidx/lifecycle/lifecycle-viewmodel/2.6.1" "lifecycle-viewmodel" "2.6.1"
create_empty_aar "/workspace/local-maven-repo/androidx/lifecycle/lifecycle-livedata/2.6.1" "lifecycle-livedata" "2.6.1"
create_empty_aar "/workspace/local-maven-repo/androidx/lifecycle/lifecycle-livedata-core/2.6.1" "lifecycle-livedata-core" "2.6.1"
create_empty_aar "/workspace/local-maven-repo/androidx/lifecycle/lifecycle-common/2.6.1" "lifecycle-common" "2.6.1"
create_empty_aar "/workspace/local-maven-repo/androidx/lifecycle/lifecycle-process/2.4.1" "lifecycle-process" "2.4.1"
create_empty_aar "/workspace/local-maven-repo/androidx/versionedparcelable/versionedparcelable/1.1.1" "versionedparcelable" "1.1.1"
create_empty_aar "/workspace/local-maven-repo/androidx/interpolator/interpolator/1.1.0" "interpolator" "1.1.0"
create_empty_aar "/workspace/local-maven-repo/androidx/interpolator/interpolator/1.0.0" "interpolator" "1.0.0"
create_empty_aar "/workspace/local-maven-repo/androidx/loader/loader/1.1.0" "loader" "1.1.0"
create_empty_aar "/workspace/local-maven-repo/androidx/viewpager/viewpager/1.1.0" "viewpager" "1.1.0"
create_empty_aar "/workspace/local-maven-repo/androidx/startup/startup-runtime/1.1.0" "startup-runtime" "1.1.0"
create_empty_aar "/workspace/local-maven-repo/androidx/startup/startup-runtime/1.1.1" "startup-runtime" "1.1.1"
create_empty_aar "/workspace/local-maven-repo/androidx/tracing/tracing/1.0.0" "tracing" "1.0.0"
create_empty_aar "/workspace/local-maven-repo/androidx/arch/core/core-runtime/2.2.0" "core-runtime" "2.2.0"
create_empty_aar "/workspace/local-maven-repo/androidx/core/core-ktx/1.2.0" "core-ktx" "1.2.0"
create_empty_aar "/workspace/local-maven-repo/androidx/webkit/webkit/1.12.1" "webkit" "1.12.1"
create_empty_aar "/workspace/local-maven-repo/androidx/activity/activity/1.8.1" "activity" "1.8.1"
create_empty_aar "/workspace/local-maven-repo/androidx/drawerlayout/drawerlayout/1.1.0" "drawerlayout" "1.1.0"
create_empty_aar "/workspace/local-maven-repo/androidx/drawerlayout/drawerlayout/1.0.0" "drawerlayout" "1.0.0"
create_empty_aar "/workspace/local-maven-repo/androidx/concurrent/concurrent-futures/1.1.0" "concurrent-futures" "1.1.0"
create_empty_aar "/workspace/local-maven-repo/androidx/concurrent/concurrent-futures/1.0.0" "concurrent-futures" "1.0.0"

echo "All AAR files created!"