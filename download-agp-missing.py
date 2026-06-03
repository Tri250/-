#!/usr/bin/env python3
"""
下载AGP 8.2.2缺失的依赖
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
            print(f"    Error: {e}")
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
        print(f"  POM: {url}")
        success, size = download_file(url, pom_path)
        if success:
            print(f"    OK: {size} bytes")
            break
        else:
            print(f"    FAILED")

    # 下载JAR
    urls = []
    if prefer_google:
        urls.append(f"{GOOGLE_MAVEN}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar")
    urls.append(f"{MAVEN_CENTRAL}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar")

    for url in urls:
        print(f"  JAR: {url}")
        success, size = download_file(url, jar_path)
        if success:
            print(f"    OK: {size} bytes")
            return True
        else:
            print(f"    FAILED")

    return False

# 缺失的依赖
MISSING_DEPS = [
    ("com.android.tools.build", "builder-test-api", "8.2.2", True),
    ("com.android.tools.build", "transform-api", "2.0.0-deprecated-use-gradle-api", True),
    ("com.android.tools.build", "bundletool", "1.15.2", True),
    ("com.android.tools.build.jetifier", "jetifier-core", "1.0.0-beta10", True),
    ("com.android.tools.build.jetifier", "jetifier-processor", "1.0.0-beta10", True),
    ("com.android.tools.build", "manifest-merger", "31.2.2", True),
    ("com.android.tools.build", "apksig", "8.2.2", True),
    ("com.android.tools.build", "apkzlib", "8.2.2", True),
    ("com.android.tools.build", "aaptcompiler", "8.2.2", True),
    ("com.android.tools", "dvlib", "31.2.2", True),
    ("com.android.tools", "ninepatch", "31.2.2", True),
    ("com.android.tools.layoutlib", "layoutlib-api", "31.2.2", True),
    ("com.android.tools.layoutlib", "layoutlib", "31.2.2", True),
]

def main():
    print("下载AGP缺失依赖...")
    print("=" * 60)

    for g, a, v, pg in MISSING_DEPS:
        print(f"\n{g}:{a}:{v}")
        download_artifact(g, a, v, pg)

    print("\n" + "=" * 60)
    print("完成!")

if __name__ == "__main__":
    main()