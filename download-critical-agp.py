#!/usr/bin/env python3
"""
Download AGP 8.2.2 and all dependencies from Maven Central using direct HTTP
"""
import os
import urllib.request
import ssl
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

LOCAL_REPO = "/workspace/local-maven-repo"
MAVEN_CENTRAL = "https://repo1.maven.org/maven2"
GOOGLE_MAVEN = "https://dl.google.com/dl/android/maven2"
TIMEOUT = 120
MAX_WORKERS = 5

# Create SSL context that doesn't verify certificates (for network issues)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def group_to_path(group):
    return group.replace('.', '/')

def download_file(url, target_path):
    """Download a file with retries"""
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
            https_handler = urllib.request.HTTPSHandler(context=ssl_context)
            opener = urllib.request.build_opener(https_handler)
            with opener.open(req, timeout=TIMEOUT) as resp:
                data = resp.read()
                if len(data) > 100:
                    with open(target_path, 'wb') as f:
                        f.write(data)
                    return True, len(data)
        except Exception as e:
            if attempt < 2:
                time.sleep(5)
            continue
    return False, 0

def download_artifact(group, artifact, version, prefer_google=False):
    target_dir = os.path.join(LOCAL_REPO, group_to_path(group), artifact, version)
    target_pom = os.path.join(target_dir, f"{artifact}-{version}.pom")
    target_jar = os.path.join(target_dir, f"{artifact}-{version}.jar")

    os.makedirs(target_dir, exist_ok=True)

    results = []

    # Download POM
    if not os.path.exists(target_pom) or os.path.getsize(target_pom) < 100:
        urls = []
        if prefer_google or group.startswith('com.android') or group.startswith('androidx'):
            urls.append(f"{GOOGLE_MAVEN}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.pom")
        urls.append(f"{MAVEN_CENTRAL}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.pom")

        for url in urls:
            success, size = download_file(url, target_pom)
            if success:
                results.append(f"POM: {size} bytes")
                break

    # Download JAR
    if not os.path.exists(target_jar) or os.path.getsize(target_jar) < 100:
        urls = []
        if prefer_google or group.startswith('com.android') or group.startswith('androidx'):
            urls.append(f"{GOOGLE_MAVEN}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.jar")
        urls.append(f"{MAVEN_CENTRAL}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.jar")

        for url in urls:
            success, size = download_file(url, target_jar)
            if success:
                results.append(f"JAR: {size} bytes")
                break

    return (group, artifact, version), results

# Critical artifacts needed for AGP 8.2.2
CRITICAL_ARTIFACTS = [
    ("com.android.tools.build", "gradle", "8.2.2", True),
    ("com.android.tools.build", "gradle-api", "8.2.2", True),
    ("com.android.tools.build", "builder", "8.2.2", True),
    ("com.android.tools.build", "builder-model", "8.2.2", True),
    ("com.android.tools", "common", "31.2.2", True),
    ("com.android.tools", "sdklib", "31.2.2", True),
    ("com.android.tools", "sdk-common", "31.2.2", True),
    ("com.android.tools", "repository", "31.2.2", True),
    ("com.android.tools", "annotations", "31.2.2", True),
    ("com.android.tools.analytics-library", "protos", "31.2.2", True),
    ("com.android.tools.analytics-library", "shared", "31.2.2", True),
    ("com.android.tools.analytics-library", "tracker", "31.2.2", True),
    ("com.android.tools.analytics-library", "crash", "31.2.2", True),
    ("com.android.ddmlib", "ddmlib", "31.2.2", True),
    ("com.android.layoutlib", "layoutlib-api", "31.2.2", True),
    ("com.android.build", "aapt2-proto", "8.2.2-10154469", True),
    ("com.android.build", "aapt2", "8.2.2-10154469", True),
    ("com.android", "signflinger", "8.2.2", True),
    ("com.android", "zipflinger", "8.2.2", True),
    ("androidx.databinding", "databinding-compiler-common", "8.2.2", True),
    ("androidx.databinding", "databinding-common", "8.2.2", True),
]

def main():
    print(f"Downloading {len(CRITICAL_ARTIFACTS)} critical artifacts...")

    downloaded = 0
    failed = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(download_artifact, g, a, v, pg): (g, a, v) for g, a, v, pg in CRITICAL_ARTIFACTS}
        for future in as_completed(futures):
            g, a, v = futures[future]
            key, results = future.result()
            if results:
                downloaded += 1
                print(f"  OK: {g}:{a}:{v} - {results}")
            else:
                failed += 1
                print(f"  FAILED: {g}:{a}:{v}")

    print(f"\nResults: downloaded={downloaded}, failed={failed}")

if __name__ == "__main__":
    main()