#!/usr/bin/env python3
"""
下载AGP运行时依赖
"""
import os
import urllib.request
import ssl
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

LOCAL_REPO = "/workspace/local-maven-repo"
GOOGLE_MAVEN = "https://dl.google.com/dl/android/maven2"
MAVEN_CENTRAL = "https://repo1.maven.org/maven2"
TIMEOUT = 60
MAX_WORKERS = 10

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

# 运行时依赖
RUNTIME_DEPS = [
    ("org.jetbrains.kotlin", "kotlin-stdlib-jdk8", "1.9.0"),
    ("org.jetbrains.kotlin", "kotlin-stdlib-jdk7", "1.9.0"),
    ("org.jetbrains.kotlin", "kotlin-reflect", "1.9.0"),
    ("org.apache.httpcomponents", "httpmime", "4.5.6"),
    ("org.apache.httpcomponents", "httpclient", "4.5.14"),
    ("org.apache.httpcomponents", "httpcore", "4.4.16"),
    ("commons-io", "commons-io", "2.4"),
    ("org.ow2.asm", "asm", "9.2"),
    ("org.ow2.asm", "asm-commons", "9.2"),
    ("org.ow2.asm", "asm-util", "9.2"),
    ("org.ow2.asm", "asm-analysis", "9.2"),
    ("org.ow2.asm", "asm-tree", "9.2"),
    ("org.bouncycastle", "bcpkix-jdk15on", "1.67"),
    ("org.bouncycastle", "bcprov-jdk15on", "1.67"),
    ("org.glassfish.jaxb", "jaxb-runtime", "2.3.2"),
    ("org.tensorflow", "tensorflow-lite-metadata", "0.1.0-rc2"),
    ("org.jetbrains.intellij.deps", "trove4j", "1.0.20200330"),
    ("org.apache.commons", "commons-compress", "1.21"),
    ("org.bitbucket.b_c", "jose4j", "0.7.0"),
    ("org.slf4j", "slf4j-api", "1.7.30"),
    ("org.jdom", "jdom2", "2.0.6"),
    ("org.codehaus.mojo", "animal-sniffer-annotations", "1.19"),
    ("com.google.guava", "failureaccess", "1.0.1"),
    ("com.google.guava", "listenablefuture", "9999.0-empty-to-avoid-conflict-with-guava"),
    ("com.google.jimfs", "jimfs", "1.1"),
    ("net.sf.kxml", "kxml2", "2.3.0"),
    ("com.squareup.okio", "okio", "3.0.0"),
    ("com.squareup.okhttp3", "okhttp", "4.9.3"),
]

def main():
    print("下载AGP运行时依赖...")
    print("=" * 60)

    downloaded = 0
    failed = 0

    def download_one(item):
        g, a, v = item
        success, size = download_artifact(g, a, v)
        return (g, a, v, success, size)

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(download_one, item): item for item in RUNTIME_DEPS}
        for future in as_completed(futures):
            g, a, v, success, size = future.result()
            if success:
                downloaded += 1
                print(f"  OK: {g}:{a}:{v} ({size} bytes)")
            else:
                failed += 1
                print(f"  FAILED: {g}:{a}:{v}")

    print("\n" + "=" * 60)
    print(f"完成: {downloaded} 成功, {failed} 失败")

if __name__ == "__main__":
    main()