#!/usr/bin/env python3
"""
下载构建所需的缺失依赖，使用国内镜像源
"""
import os
import urllib.request
import ssl
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

LOCAL_REPO = "/workspace/local-maven-repo"
# 使用国内镜像源
ALIYUN_MAVEN = "https://maven.aliyun.com/repository/central"
ALIYUN_GOOGLE = "https://maven.aliyun.com/repository/google"
ALIYUN_PUBLIC = "https://maven.aliyun.com/repository/public"
TIMEOUT = 120  # 更长的超时
MAX_WORKERS = 5  # 减少并发数以避免超时

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE


def group_to_path(group):
    return group.replace('.', '/')


def download_file(url, target_path):
    for attempt in range(5):  # 更多重试
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            https_handler = urllib.request.HTTPSHandler(context=ssl_context)
            opener = urllib.request.build_opener(https_handler)
            with opener.open(req, timeout=TIMEOUT) as resp:
                data = resp.read()
                if len(data) > 0:
                    with open(target_path, 'wb') as f:
                        f.write(data)
                    return True, len(data)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return False, 0
            time.sleep(3)
        except Exception as e:
            time.sleep(3)
    return False, 0


def download_artifact(g, a, v):
    target_dir = os.path.join(LOCAL_REPO, group_to_path(g), a, v)
    pom_path = os.path.join(target_dir, f"{a}-{v}.pom")
    jar_path = os.path.join(target_dir, f"{a}-{v}.jar")

    os.makedirs(target_dir, exist_ok=True)

    # 先检查文件是否已存在
    if os.path.exists(pom_path) and os.path.exists(jar_path):
        print(f"  SKIP: {g}:{a}:{v} (已存在)")
        return True, 0

    # 多个镜像源
    base_urls = [
        ALIYUN_GOOGLE,
        ALIYUN_MAVEN,
        ALIYUN_PUBLIC,
    ]

    # 下载POM
    pom_success = False
    for base_url in base_urls:
        url = f"{base_url}/{group_to_path(g)}/{a}/{v}/{a}-{v}.pom"
        success, size = download_file(url, pom_path)
        if success:
            pom_success = True
            break

    if not pom_success:
        print(f"  FAILED: {g}:{a}:{v} (POM)")
        return False, 0

    # 下载JAR
    jar_success = False
    for base_url in base_urls:
        url = f"{base_url}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar"
        success, size = download_file(url, jar_path)
        if success:
            jar_success = True
            break

    if jar_success:
        print(f"  OK: {g}:{a}:{v}")
        return True, 0
    else:
        print(f"  FAILED: {g}:{a}:{v} (JAR)")
        return False, 0


# 构建所需的主要依赖
REQUIRED_DEPS = [
    # AndroidX 核心库
    ("androidx.annotation", "annotation", "1.3.0"),
    ("androidx.annotation", "annotation-experimental", "1.4.0"),
    ("androidx.core", "core", "1.12.0"),
    ("androidx.core", "core-ktx", "1.8.0"),
    ("androidx.collection", "collection", "1.1.0"),
    ("androidx.customview", "customview", "1.0.0"),
    ("androidx.cursoradapter", "cursoradapter", "1.0.0"),
    ("androidx.drawerlayout", "drawerlayout", "1.0.0"),
    ("androidx.viewpager", "viewpager", "1.0.0"),
    ("androidx.coordinatorlayout", "coordinatorlayout", "1.2.0"),
    ("androidx.constraintlayout", "constraintlayout", "2.1.4"),

    # AndroidX Activity 和 Fragment
    ("androidx.activity", "activity", "1.8.0"),
    ("androidx.activity", "activity-ktx", "1.8.0"),
    ("androidx.fragment", "fragment", "1.8.0"),

    # AndroidX AppCompat
    ("androidx.appcompat", "appcompat", "1.6.1"),
    ("androidx.appcompat", "appcompat-resources", "1.6.1"),

    # AndroidX Lifecycle
    ("androidx.lifecycle", "lifecycle-common", "2.6.1"),
    ("androidx.lifecycle", "lifecycle-runtime", "2.6.1"),
    ("androidx.lifecycle", "lifecycle-viewmodel", "2.6.1"),
    ("androidx.lifecycle", "lifecycle-viewmodel-savedstate", "2.6.1"),
    ("androidx.lifecycle", "lifecycle-livedata-core", "2.6.1"),
    ("androidx.arch.core", "core-common", "2.1.0"),
    ("androidx.savedstate", "savedstate", "1.2.1"),

    # AndroidX 其他
    ("androidx.webkit", "webkit", "1.12.0"),
    ("androidx.profileinstaller", "profileinstaller", "1.3.1"),
    ("androidx.resourceinspection", "resourceinspection-annotation", "1.0.1"),
    ("androidx.emoji2", "emoji2", "1.2.0"),
    ("androidx.emoji2", "emoji2-views-helper", "1.2.0"),
    ("androidx.loader", "loader", "1.0.0"),

    # AndroidX Concurrent
    ("androidx.concurrent", "concurrent-futures", "1.0.0"),

    # Kotlin 标准库
    ("org.jetbrains.kotlin", "kotlin-stdlib", "1.8.22"),
    ("org.jetbrains.kotlin", "kotlin-stdlib-common", "1.8.22"),
    ("org.jetbrains.kotlin", "kotlin-stdlib-jdk7", "1.8.22"),
    ("org.jetbrains.kotlin", "kotlin-stdlib-jdk8", "1.8.22"),

    # Checker framework
    ("org.checkerframework", "checker-qual", "2.5.8"),

    # Apache Cordova
    ("org.apache.cordova", "framework", "14.0.1"),
]


def main():
    print("下载构建所需的依赖...")
    print("=" * 70)

    downloaded = 0
    skipped = 0
    failed = 0

    def download_one(item):
        g, a, v = item
        success, size = download_artifact(g, a, v)
        return (g, a, v, success, size)

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(download_one, item): item for item in REQUIRED_DEPS}
        for future in as_completed(futures):
            g, a, v, success, size = future.result()
            if success:
                if size == 0:
                    skipped += 1
                else:
                    downloaded += 1
            else:
                failed += 1

    print("\n" + "=" * 70)
    print(f"完成: {downloaded} 下载, {skipped} 跳过, {failed} 失败")


if __name__ == "__main__":
    main()
