#!/usr/bin/env python3
"""
Download remaining AGP dependencies
"""
import os
import urllib.request
import ssl
import time

LOCAL_REPO = "/workspace/local-maven-repo"
MAVEN_CENTRAL = "https://repo1.maven.org/maven2"
GOOGLE_MAVEN = "https://dl.google.com/dl/android/maven2"
TIMEOUT = 120

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
        except Exception as e:
            print(f"  Attempt {attempt+1} failed: {e}")
            time.sleep(10)
    return False, 0

def download_artifact(group, artifact, version):
    target_dir = os.path.join(LOCAL_REPO, group_to_path(group), artifact, version)
    target_pom = os.path.join(target_dir, f"{artifact}-{version}.pom")
    target_jar = os.path.join(target_dir, f"{artifact}-{version}.jar")

    os.makedirs(target_dir, exist_ok=True)

    # Try Google Maven first for Android artifacts
    urls = [
        (f"{GOOGLE_MAVEN}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.pom", target_pom),
        (f"{MAVEN_CENTRAL}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.pom", target_pom),
    ]

    for url, path in urls:
        if os.path.exists(path) and os.path.getsize(path) > 100:
            break
        print(f"  Downloading POM: {url}")
        success, size = download_file(url, path)
        if success:
            print(f"    Success: {size} bytes")
            break

    urls = [
        (f"{GOOGLE_MAVEN}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.jar", target_jar),
        (f"{MAVEN_CENTRAL}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.jar", target_jar),
    ]

    for url, path in urls:
        if os.path.exists(path) and os.path.getsize(path) > 100:
            break
        print(f"  Downloading JAR: {url}")
        success, size = download_file(url, path)
        if success:
            print(f"    Success: {size} bytes")
            break

    return os.path.exists(target_jar) and os.path.getsize(target_jar) > 100

# Remaining artifacts
REMAINING = [
    ("com.android.layoutlib", "layoutlib-api", "31.2.2"),
    ("com.android.build", "aapt2", "8.2.2-10154469"),
    ("com.android.ddmlib", "ddmlib", "31.2.2"),
    ("com.android.build", "aapt2-proto", "8.2.2-10154469"),
]

def main():
    print("Downloading remaining artifacts...")
    for g, a, v in REMAINING:
        print(f"\n{g}:{a}:{v}")
        success = download_artifact(g, a, v)
        if success:
            print(f"  SUCCESS")
        else:
            print(f"  FAILED")

if __name__ == "__main__":
    main()