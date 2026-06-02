#!/usr/bin/env python3
"""
Download missing JAR files for AGP dependencies
"""
import os
import urllib.request
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

LOCAL_REPO = "/workspace/local-maven-repo"
MAVEN_CENTRAL = "https://repo1.maven.org/maven2"
GOOGLE_MAVEN = "https://dl.google.com/dl/android/maven2"
TIMEOUT = 60
MAX_WORKERS = 10

def group_to_path(group):
    return group.replace('.', '/')

def download_jar(group, artifact, version):
    target_dir = os.path.join(LOCAL_REPO, group_to_path(group), artifact, version)
    target_jar = os.path.join(target_dir, f"{artifact}-{version}.jar")

    if os.path.exists(target_jar) and os.path.getsize(target_jar) > 1000:
        return True, "exists"

    os.makedirs(target_dir, exist_ok=True)

    # Try both Maven Central and Google Maven
    urls = [
        f"{MAVEN_CENTRAL}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.jar",
        f"{GOOGLE_MAVEN}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.jar",
    ]

    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                data = resp.read()
                if len(data) > 1000:
                    with open(target_jar, 'wb') as f:
                        f.write(data)
                    return True, "downloaded"
        except Exception as e:
            continue

    return False, "failed"

# List of missing artifacts from the error
MISSING_ARTIFACTS = [
    ("androidx.databinding", "databinding-compiler-common", "8.2.2"),
    ("androidx.databinding", "databinding-common", "8.2.2"),
    ("com.google.testing.platform", "core-proto", "0.0.8-alpha08"),
    ("commons-codec", "commons-codec", "1.11"),
    ("org.jvnet.staxex", "stax-ex", "1.8.1"),
    ("jakarta.xml.bind", "jakarta.xml.bind-api", "2.3.2"),
    ("org.glassfish.jaxb", "txw2", "2.3.2"),
    ("com.sun.istack", "istack-commons-runtime", "3.0.8"),
    ("com.sun.xml.fastinfoset", "FastInfoset", "1.2.16"),
    ("jakarta.activation", "jakarta.activation-api", "1.2.1"),
    ("com.google.errorprone", "error_prone_annotations", "2.11.0"),
    ("org.checkerframework", "checker-qual", "3.12.0"),
    ("commons-logging", "commons-logging", "1.2"),
    ("io.netty", "netty-codec-http", "4.1.72.Final"),
    ("io.netty", "netty-handler", "4.1.72.Final"),
    ("io.netty", "netty-codec-socks", "4.1.72.Final"),
    ("io.netty", "netty-codec", "4.1.72.Final"),
    ("io.netty", "netty-transport", "4.1.72.Final"),
    ("io.netty", "netty-buffer", "4.1.72.Final"),
    ("io.netty", "netty-resolver", "4.1.72.Final"),
    ("io.netty", "netty-common", "4.1.72.Final"),
    ("io.netty", "netty-codec-http2", "4.1.72.Final"),
    ("io.netty", "netty-codec-dns", "4.1.72.Final"),
    ("io.netty", "netty-handler-proxy", "4.1.72.Final"),
]

def main():
    print(f"Downloading {len(MISSING_ARTIFACTS)} missing JAR files...")

    downloaded = 0
    failed = 0
    existed = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(download_jar, g, a, v): (g, a, v) for g, a, v in MISSING_ARTIFACTS}
        for future in as_completed(futures):
            g, a, v = futures[future]
            success, status = future.result()
            if status == "downloaded":
                downloaded += 1
                print(f"  Downloaded: {g}:{a}:{v}")
            elif status == "exists":
                existed += 1
            else:
                failed += 1
                print(f"  FAILED: {g}:{a}:{v}")

    print(f"\nResults: downloaded={downloaded}, existed={existed}, failed={failed}")

if __name__ == "__main__":
    main()