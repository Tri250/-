#!/usr/bin/env python3
"""
继续下载AGP缺失依赖
"""
import os
import urllib.request
import ssl
import time

LOCAL_REPO = "/workspace/local-maven-repo"
GOOGLE_MAVEN = "https://dl.google.com/dl/android/maven2"
MAVEN_CENTRAL = "https://repo1.maven.org/maven2"
TIMEOUT = 90

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def group_to_path(group):
    return group.replace('.', '/')

def download_file(url, target_path):
    for attempt in range(5):
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
            time.sleep(5)
        except Exception as e:
            time.sleep(5)
    return False, 0

def download_artifact(g, a, v, prefer_google=True):
    target_dir = os.path.join(LOCAL_REPO, group_to_path(g), a, v)
    pom_path = os.path.join(target_dir, f"{a}-{v}.pom")
    jar_path = os.path.join(target_dir, f"{a}-{v}.jar")

    os.makedirs(target_dir, exist_ok=True)

    # 下载POM
    urls = []
    if prefer_google:
        urls.append(f"{GOOGLE_MAVEN}/{group_to_path(g)}/{a}/{v}/{a}-{v}.pom")
    urls.append(f"{MAVEN_CENTRAL}/{group_to_path(g)}/{a}/{v}/{a}-{v}.pom")

    for url in urls:
        success, size = download_file(url, pom_path)
        if success:
            break

    # 下载JAR
    urls = []
    if prefer_google:
        urls.append(f"{GOOGLE_MAVEN}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar")
    urls.append(f"{MAVEN_CENTRAL}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar")

    for url in urls:
        success, size = download_file(url, jar_path)
        if success:
            return True

    return False

# 更多缺失的依赖
MORE_DEPS = [
    ("com.android.tools.build", "gradle-settings-api", "8.2.2", True),
    ("com.android.tools.build", "aapt2-proto", "8.2.2-10154469", True),
    ("com.android.tools.build", "aapt2", "8.2.2-10154469", True),
    ("com.android.tools.ddms", "ddmlib", "31.2.2", True),
    ("com.android.tools.ddms", "ddms-lib", "31.2.2", True),
    ("com.android.tools.emulator", "emulator-control", "31.2.2", True),
    ("com.android.tools.utp", "android-test-plugin-result-listener-gradle-proto", "31.2.2", True),
    ("com.android.tools.utp", "shared", "31.2.2", True),
    ("com.android.tools.utp", "utp-core", "31.2.2", True),
    ("com.android.tools", "device-provisioner", "31.2.2", True),
    ("com.android.tools", "device-validator", "31.2.2", True),
    ("com.android.tools", "profiler-support", "31.2.2", True),
    ("com.android.tools", "profiler-lib", "31.2.2", True),
]

def main():
    print("下载更多AGP依赖...")
    print("=" * 60)

    downloaded = 0
    failed = 0

    for g, a, v, pg in MORE_DEPS:
        print(f"\n{g}:{a}:{v}")
        success = download_artifact(g, a, v, pg)
        if success:
            downloaded += 1
            print(f"  OK")
        else:
            failed += 1
            print(f"  FAILED")

    print("\n" + "=" * 60)
    print(f"完成: {downloaded} 成功, {failed} 失败")

if __name__ == "__main__":
    main()