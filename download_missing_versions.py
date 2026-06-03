#!/usr/bin/env python3
"""
下载项目构建需要的特定版本依赖
"""
import os
import urllib.request
import ssl
import time

LOCAL_REPO = "/workspace/local-maven-repo"
ALIYUN_GOOGLE = "https://maven.aliyun.com/repository/google"
ALIYUN_CENTRAL = "https://maven.aliyun.com/repository/central"
HUAWEI = "https://repo.huaweicloud.com/repository/maven"

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE


def group_to_path(group):
    return group.replace('.', '/')


def download_file(url, target_path):
    for attempt in range(5):
        try:
            print(f"  尝试: {url}")
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            https_handler = urllib.request.HTTPSHandler(context=ssl_context)
            opener = urllib.request.build_opener(https_handler)
            with opener.open(req, timeout=120) as resp:
                data = resp.read()
                if len(data) > 0:
                    with open(target_path, 'wb') as f:
                        f.write(data)
                    print(f"    ✅ 成功下载: {len(data)} bytes")
                    return True, len(data)
        except Exception as e:
            print(f"    尝试 {attempt+1}/5 失败: {e}")
            time.sleep(3)
    return False, 0


def download_dep(g, a, v):
    target_dir = os.path.join(LOCAL_REPO, group_to_path(g), a, v)
    os.makedirs(target_dir, exist_ok=True)

    pom_path = os.path.join(target_dir, f"{a}-{v}.pom")
    jar_path = os.path.join(target_dir, f"{a}-{v}.jar")

    if os.path.exists(pom_path) and os.path.exists(jar_path):
        print(f"✅ 已存在: {g}:{a}:{v}")
        return True

    print(f"下载: {g}:{a}:{v}")

    base_urls = [ALIYUN_GOOGLE, HUAWEI, ALIYUN_CENTRAL]

    pom_success = False
    if not os.path.exists(pom_path):
        for base in base_urls:
            url = f"{base}/{group_to_path(g)}/{a}/{v}/{a}-{v}.pom"
            success, size = download_file(url, pom_path)
            if success:
                pom_success = True
                break
    else:
        pom_success = True

    jar_success = False
    if not os.path.exists(jar_path):
        for base in base_urls:
            url = f"{base}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar"
            success, size = download_file(url, jar_path)
            if success:
                jar_success = True
                break
    else:
        jar_success = True

    return pom_success and jar_success


# 下载构建失败提示需要的那些关键版本
required_deps = [
    # 需要的核心 AndroidX 库
    ("androidx.core", "core", "1.13.0"),
    ("androidx.collection", "collection", "1.0.0"),
    ("androidx.versionedparcelable", "versionedparcelable", "1.1.1"),
    ("androidx.interpolator", "interpolator", "1.0.0"),
    ("androidx.vectordrawable", "vectordrawable", "1.1.0"),
    ("androidx.vectordrawable", "vectordrawable", "1.2.0"),
    ("androidx.vectordrawable", "vectordrawable-animated", "1.1.0"),
    ("androidx.vectordrawable", "vectordrawable-animated", "1.2.0"),
    ("androidx.cursoradapter", "cursoradapter", "1.0.0"),
    ("androidx.viewpager", "viewpager", "1.0.0"),
    ("androidx.customview", "customview", "1.0.0"),
    ("androidx.customview", "customview", "1.1.0"),
    ("androidx.drawerlayout", "drawerlayout", "1.0.0"),
    ("androidx.drawerlayout", "drawerlayout", "1.2.0"),
    ("androidx.savedstate", "savedstate", "1.2.1"),
    ("androidx.lifecycle", "lifecycle-livedata-core", "2.6.1"),
    ("androidx.lifecycle", "lifecycle-viewmodel", "2.6.1"),
    ("androidx.lifecycle", "lifecycle-viewmodel-savedstate", "2.6.1"),
    ("androidx.lifecycle", "lifecycle-runtime", "2.6.1"),
    ("androidx.lifecycle", "lifecycle-runtime", "2.6.2"),
    ("androidx.loader", "loader", "1.0.0"),
    ("androidx.activity", "activity", "1.8.0"),
    ("androidx.activity", "activity", "1.9.0"),
    ("androidx.activity", "activity-ktx", "1.8.0"),
    ("androidx.fragment", "fragment", "1.8.0"),
    ("androidx.fragment", "fragment", "1.6.2"),
    ("androidx.appcompat", "appcompat", "1.6.1"),
    ("androidx.appcompat", "appcompat-resources", "1.6.1"),
    ("androidx.appcompat", "appcompat", "1.7.0"),
    ("androidx.appcompat", "appcompat-resources", "1.7.0"),
    ("androidx.webkit", "webkit", "1.7.0"),
    ("androidx.webkit", "webkit", "1.8.0"),
    ("androidx.webkit", "webkit", "1.12.0"),
    ("androidx.core", "core", "1.12.0"),
    ("androidx.core", "core", "1.15.0"),
    ("androidx.core", "core-ktx", "1.8.0"),
    ("androidx.core", "core-ktx", "1.12.0"),
    ("androidx.core", "core-ktx", "1.15.0"),
    ("androidx.core", "core-splashscreen", "1.0.1"),
    ("androidx.emoji2", "emoji2", "1.2.0"),
    ("androidx.emoji2", "emoji2-views-helper", "1.2.0"),
    ("androidx.annotation", "annotation-experimental", "1.3.0"),
    ("androidx.annotation", "annotation-experimental", "1.4.0"),
    ("androidx.constraintlayout", "constraintlayout", "2.1.4"),
    ("androidx.profileinstaller", "profileinstaller", "1.3.1"),
    ("androidx.transition", "transition", "1.4.1"),
    ("androidx.transition", "transition", "1.5.0"),
    ("androidx.recyclerview", "recyclerview", "1.3.2"),
    # 其他可能需要的库
    ("androidx.test", "rules", "1.5.0"),
    ("androidx.test.ext", "junit", "1.1.5"),
    ("androidx.test.ext", "junit", "1.2.1"),
    ("androidx.test", "runner", "1.5.2"),
    ("androidx.test.espresso", "espresso-core", "3.5.1"),
    ("androidx.test.espresso", "espresso-core", "3.6.1"),
]


def main():
    print("=" * 80)
    print("下载构建需要的关键依赖版本")
    print("=" * 80)

    success = 0
    fail = 0

    for dep in required_deps:
        if download_dep(*dep):
            success += 1
        else:
            fail += 1

    print("\n" + "=" * 80)
    print(f"完成: 成功 {success}, 失败 {fail}")


if __name__ == "__main__":
    main()
