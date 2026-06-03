#!/usr/bin/env python3
"""
下载缺失的AndroidX和Cordova依赖 - 使用正确的版本号
"""
import os
import urllib.request
import ssl
import time

LOCAL_REPO = "/workspace/local-maven-repo"
GOOGLE_MAVEN = "https://dl.google.com/dl/android/maven2"
MAVEN_CENTRAL = "https://repo1.maven.org/maven2"
TIMEOUT = 60

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def group_to_path(group):
    return group.replace('.', '/')

def download_file(url, target_path):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            https_handler = urllib.request.HTTPSHandler(context=ssl_context)
            opener = urllib.request.build_opener(https_handler)
            with opener.open(req, timeout=TIMEOUT) as resp:
                data = resp.read()
                if len(data) > 100:
                    with open(target_path, 'wb') as f:
                        f.write(data)
                    return True, len(data)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return False, 0
            time.sleep(2)
        except Exception as e:
            time.sleep(2)
    return False, 0

def download_artifact(g, a, v):
    target_dir = os.path.join(LOCAL_REPO, group_to_path(g), a, v)
    pom_path = os.path.join(target_dir, f"{a}-{v}.pom")
    jar_path = os.path.join(target_dir, f"{a}-{v}.jar")

    os.makedirs(target_dir, exist_ok=True)

    # 下载POM
    urls = [
        f"{GOOGLE_MAVEN}/{group_to_path(g)}/{a}/{v}/{a}-{v}.pom",
        f"{MAVEN_CENTRAL}/{group_to_path(g)}/{a}/{v}/{a}-{v}.pom",
    ]
    for url in urls:
        success, size = download_file(url, pom_path)
        if success:
            break

    # 下载JAR
    urls = [
        f"{GOOGLE_MAVEN}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar",
        f"{MAVEN_CENTRAL}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar",
    ]
    for url in urls:
        success, size = download_file(url, jar_path)
        if success:
            return True, size

    return False, 0

# 使用项目中variables.gradle定义的版本
ANDROIDX_DEPS = [
    # 使用项目定义的版本
    ("androidx.appcompat", "appcompat", "1.7.0"),
    ("androidx.core", "core", "1.15.0"),
    ("androidx.activity", "activity", "1.9.0"),
    ("androidx.fragment", "fragment", "1.8.0"),
    ("androidx.coordinatorlayout", "coordinatorlayout", "1.2.0"),
    ("androidx.webkit", "webkit", "1.8.0"),
    ("androidx.core", "core-splashscreen", "1.0.1"),

    # 测试库
    ("androidx.test.ext", "junit", "1.2.1"),
    ("androidx.test.espresso", "espresso-core", "3.6.1"),
    ("androidx.test", "runner", "1.5.2"),
    ("androidx.test", "rules", "1.5.0"),

    # Cordova依赖
    ("org.apache.cordova", "framework", "10.1.1"),

    # 尝试不同版本
    ("androidx.appcompat", "appcompat-resources", "1.7.0"),
    ("androidx.core", "core-ktx", "1.15.0"),
    ("androidx.lifecycle", "lifecycle-runtime", "2.8.0"),
    ("androidx.lifecycle", "lifecycle-common", "2.8.0"),
    ("androidx.savedstate", "savedstate", "1.2.1"),
    ("androidx.arch.core", "core-common", "2.2.0"),
    ("androidx.collection", "collection", "1.4.0"),
    ("androidx.versionedparcelable", "versionedparcelable", "1.1.1"),
    ("androidx.annotation", "annotation", "1.8.0"),
    ("androidx.annotation", "annotation-experimental", "1.3.0"),
    ("androidx.constraintlayout", "constraintlayout", "2.1.4"),
    ("androidx.recyclerview", "recyclerview", "1.3.2"),
    ("androidx.viewpager", "viewpager", "1.0.0"),
    ("androidx.customview", "customview", "1.1.0"),
    ("androidx.drawerlayout", "drawerlayout", "1.2.0"),
    ("androidx.transition", "transition", "1.5.0"),
    ("androidx.vectordrawable", "vectordrawable", "1.2.0"),
    ("androidx.vectordrawable", "vectordrawable-animated", "1.2.0"),
    ("androidx.interpolator", "interpolator", "1.0.0"),
]

def main():
    print("下载缺失的AndroidX和Cordova依赖...")
    print("=" * 60)

    downloaded = 0
    failed = 0

    for g, a, v in ANDROIDX_DEPS:
        print(f"\n{g}:{a}:{v}")
        success, size = download_artifact(g, a, v)
        if success:
            downloaded += 1
            print(f"  OK: {size} bytes")
        else:
            failed += 1
            print(f"  FAILED")

    print("\n" + "=" * 60)
    print(f"完成: {downloaded} 成功, {failed} 失败")

if __name__ == "__main__":
    main()