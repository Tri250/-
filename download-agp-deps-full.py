#!/usr/bin/env python3
"""
Download AGP 8.2.2 and all its transitive dependencies
"""
import os
import urllib.request
import time
from xml.etree import ElementTree as ET

LOCAL_REPO = "/workspace/local-maven-repo"
MAVEN_CENTRAL = "https://repo1.maven.org/maven2"
GOOGLE_MAVEN = "https://dl.google.com/dl/android/maven2"
TIMEOUT = 60

def group_to_path(group):
    return group.replace('.', '/')

def download_artifact(group, artifact, version, prefer_google=False):
    target_dir = os.path.join(LOCAL_REPO, group_to_path(group), artifact, version)
    target_pom = os.path.join(target_dir, f"{artifact}-{version}.pom")
    target_jar = os.path.join(target_dir, f"{artifact}-{version}.jar")

    if os.path.exists(target_pom) and os.path.exists(target_jar):
        return True

    os.makedirs(target_dir, exist_ok=True)

    urls = []
    if prefer_google or group.startswith('com.android'):
        urls.append(f"{GOOGLE_MAVEN}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.pom")
    urls.append(f"{MAVEN_CENTRAL}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.pom")

    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                data = resp.read()
                if data.startswith(b'<?xml'):
                    with open(target_pom, 'wb') as f:
                        f.write(data)
                    break
        except:
            continue

    if not os.path.exists(target_pom):
        return False

    # Download JAR
    urls = []
    if prefer_google or group.startswith('com.android'):
        urls.append(f"{GOOGLE_MAVEN}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.jar")
    urls.append(f"{MAVEN_CENTRAL}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.jar")

    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                with open(target_jar, 'wb') as f:
                    f.write(resp.read())
                return True
        except:
            continue

    return os.path.exists(target_pom)

def parse_pom_deps(pom_path):
    try:
        tree = ET.parse(pom_path)
        root = tree.getroot()
        ns_prefix = ''
        if root.tag.startswith('{'):
            ns_prefix = root.tag.split('}')[0] + '}'

        deps = []
        parent = root.find(f'{ns_prefix}parent')
        if parent is not None:
            g = parent.find(f'{ns_prefix}groupId')
            a = parent.find(f'{ns_prefix}artifactId')
            v = parent.find(f'{ns_prefix}version')
            if g is not None and a is not None and v is not None:
                deps.append((g.text.strip(), a.text.strip(), v.text.strip(), g.text.strip().startswith('com.android')))

        deps_elem = root.find(f'{ns_prefix}dependencies')
        if deps_elem is not None:
            for dep in deps_elem.findall(f'{ns_prefix}dependency'):
                g = dep.find(f'{ns_prefix}groupId')
                a = dep.find(f'{ns_prefix}artifactId')
                v = dep.find(f'{ns_prefix}version')
                if g is not None and a is not None and v is not None:
                    deps.append((g.text.strip(), a.text.strip(), v.text.strip(), g.text.strip().startswith('com.android')))
        return deps
    except:
        return []

def main():
    print("Starting AGP dependency download...")

    # Start with AGP 8.2.2
    queue = [('com.android.tools.build', 'gradle', '8.2.2', True)]

    downloaded = set()
    iteration = 0
    max_iterations = 30

    while queue and iteration < max_iterations:
        iteration += 1
        print(f"\nIteration {iteration}: {len(queue)} artifacts to process")

        next_queue = []
        for g, a, v, prefer_google in queue:
            key = (g, a, v)
            if key in downloaded:
                continue
            downloaded.add(key)

            print(f"  Processing: {g}:{a}:{v}")
            success = download_artifact(g, a, v, prefer_google)
            if success:
                pom_path = os.path.join(LOCAL_REPO, group_to_path(g), a, v, f"{a}-{v}.pom")
                if os.path.exists(pom_path):
                    new_deps = parse_pom_deps(pom_path)
                    for ng, na, nv, npg in new_deps:
                        if (ng, na, nv) not in downloaded:
                            next_queue.append((ng, na, nv, npg))
            else:
                print(f"    FAILED to download")

        queue = next_queue

    print(f"\nDownloaded {len(downloaded)} artifacts")

if __name__ == "__main__":
    main()