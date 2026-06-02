#!/usr/bin/env python3
"""
Fast iterative dependency downloader
Walks through all POMs in local-maven-repo and downloads missing parents/deps from Maven Central
"""
import os
import sys
import urllib.request
import urllib.error
import socket
from xml.etree import ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

LOCAL_REPO = "/workspace/local-maven-repo"
MAVEN_CENTRAL = "https://repo1.maven.org/maven2"
TIMEOUT = 30
MAX_WORKERS = 8

download_lock = threading.Lock()
stats = {'downloaded': 0, 'failed': 0, 'skipped': 0}

def group_to_path(group):
    return group.replace('.', '/')

def has_artifact(group, artifact, version):
    if not version:
        return True
    path = os.path.join(LOCAL_REPO, group_to_path(group), artifact, version)
    return os.path.exists(os.path.join(path, f"{artifact}-{version}.pom"))

def download_artifact(group, artifact, version):
    target_dir = os.path.join(LOCAL_REPO, group_to_path(group), artifact, version)
    target_pom = os.path.join(target_dir, f"{artifact}-{version}.pom")
    target_jar = os.path.join(target_dir, f"{artifact}-{version}.jar")

    if os.path.exists(target_pom):
        return None, False

    os.makedirs(target_dir, exist_ok=True)

    pom_url = f"{MAVEN_CENTRAL}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.pom"
    try:
        req = urllib.request.Request(pom_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            data = resp.read()
            if not data.startswith(b'<?xml'):
                return None, False
            with open(target_pom, 'wb') as f:
                f.write(data)
    except Exception as e:
        return None, False

    # Also try to download JAR
    try:
        jar_url = f"{MAVEN_CENTRAL}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.jar"
        req2 = urllib.request.Request(jar_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req2, timeout=TIMEOUT) as resp2:
            with open(target_jar, 'wb') as f:
                f.write(resp2.read())
    except:
        pass

    return (group, artifact, version), True

def parse_pom_dependencies(pom_path):
    try:
        tree = ET.parse(pom_path)
        root = tree.getroot()
        ns_prefix = ''
        if root.tag.startswith('{'):
            ns_prefix = root.tag.split('}')[0] + '}'

        deps = []
        # Parent
        parent = root.find(f'{ns_prefix}parent')
        if parent is not None:
            g = parent.find(f'{ns_prefix}groupId')
            a = parent.find(f'{ns_prefix}artifactId')
            v = parent.find(f'{ns_prefix}version')
            if g is not None and a is not None and v is not None:
                if g.text and a.text and v.text:
                    deps.append((g.text.strip(), a.text.strip(), v.text.strip()))

        # Direct dependencies
        deps_elem = root.find(f'{ns_prefix}dependencies')
        if deps_elem is not None:
            for dep in deps_elem.findall(f'{ns_prefix}dependency'):
                g = dep.find(f'{ns_prefix}groupId')
                a = dep.find(f'{ns_prefix}artifactId')
                v = dep.find(f'{ns_prefix}version')
                scope = dep.find(f'{ns_prefix}scope')
                if g is not None and a is not None:
                    version = v.text.strip() if v is not None and v.text else None
                    if version:
                        deps.append((g.text.strip(), a.text.strip(), version))
        return deps
    except:
        return []

def find_all_poms():
    poms = []
    for root, dirs, files in os.walk(LOCAL_REPO):
        for file in files:
            if file.endswith('.pom'):
                poms.append(os.path.join(root, file))
    return poms

def main():
    print("Phase 1: Scanning all POMs to find dependencies...")
    poms = find_all_poms()
    print(f"Found {len(poms)} POMs")

    all_deps = set()
    for pom in poms:
        deps = parse_pom_dependencies(pom)
        for d in deps:
            all_deps.add(d)

    print(f"Found {len(all_deps)} unique dependencies to check")

    iteration = 0
    max_iterations = 50
    while all_deps and iteration < max_iterations:
        iteration += 1
        to_download = []
        for g, a, v in all_deps:
            if not has_artifact(g, a, v):
                to_download.append((g, a, v))

        if not to_download:
            print(f"Iteration {iteration}: No more downloads needed")
            break

        print(f"Iteration {iteration}: Downloading {len(to_download)} artifacts...")

        downloaded_count = 0
        failed_count = 0
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(download_artifact, g, a, v): (g, a, v) for g, a, v in to_download}
            for future in as_completed(futures):
                result, success = future.result()
                if success:
                    downloaded_count += 1
                else:
                    failed_count += 1

        print(f"  Downloaded: {downloaded_count}, Failed: {failed_count}")

        # Re-scan to find new dependencies
        all_deps = set()
        poms = find_all_poms()
        for pom in poms:
            deps = parse_pom_dependencies(pom)
            for d in deps:
                all_deps.add(d)

        print(f"  Total deps to check: {len(all_deps)}")

    print("Done!")

if __name__ == "__main__":
    main()
