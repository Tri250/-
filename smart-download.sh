#!/bin/bash
# Smart downloader that walks all POMs in the local-maven-repo
# and downloads missing dependencies from Maven Central
set -e

LOCAL_REPO="/workspace/local-maven-repo"
MAVEN_CENTRAL="https://repo1.maven.org/maven2"
QUEUE=()
PROCESSED=0
DOWNLOADED=0
FAILED=0
MAX_ITERATIONS=20

# Helper function to extract dependencies from a POM
extract_deps() {
    local pom_file="$1"

    # Extract parent reference
    grep -A4 "<parent>" "$pom_file" 2>/dev/null | grep -E "(groupId|artifactId|version)" | sed 's/.*<[^>]*>\(.*\)<\/[^>]*>.*/\1/' | tr '\n' ' '
    echo ""

    # Extract dependencies (only direct, not managed)
    sed -n '/<dependencies>/,/<\/dependencies>/p' "$pom_file" 2>/dev/null | \
        grep -A4 "<dependency>" | \
        grep -E "(groupId|artifactId|version)" | \
        sed 's/.*<[^>]*>\(.*\)<\/[^>]*>.*/\1/' | tr '\n' ' '
    echo ""
}

# Try to download a single artifact
try_download() {
    local group="$1"
    local artifact="$2"
    local version="$3"

    local group_path=$(echo "$group" | tr '.' '/')
    local target_dir="$LOCAL_REPO/$group_path/$artifact/$version"
    local target_pom="$target_dir/$artifact-$version.pom"
    local target_jar="$target_dir/$artifact-$version.jar"

    if [ -f "$target_pom" ]; then
        return 1
    fi

    mkdir -p "$target_dir"

    local url="$MAVEN_CENTRAL/$group_path/$artifact/$version/$artifact-$version.pom"
    if curl -m 30 -fsSL "$url" -o "$target_pom" 2>/dev/null; then
        if head -1 "$target_pom" | grep -q "<?xml"; then
            # Also try to download JAR
            curl -m 30 -fsSL "$MAVEN_CENTRAL/$group_path/$artifact/$version/$artifact-$version.jar" -o "$target_jar" 2>/dev/null || true
            return 0
        else
            rm -f "$target_pom"
            return 1
        fi
    fi
    return 1
}

# Initial queue: find all POMs and add their dependencies
echo "Phase 1: Initial scan of existing POMs"
for pom in $(find "$LOCAL_REPO" -name "*.pom" 2>/dev/null); do
    deps=$(extract_deps "$pom")
    if [ -n "$deps" ]; then
        # Parse dependencies in groups of 3 (groupId, artifactId, version)
        echo "$deps" | tr ' ' '\n' | tr -d '\n' | sed 's/.\{0,2000\}/&\n/g' | head -200 | while read line; do
            :
        done
    fi
done > /tmp/initial_deps.txt 2>/dev/null || true

# Use a python-based approach for more reliable parsing
cat > /tmp/parse_pom.py << 'EOF'
import os
import sys
import re
import urllib.request
import urllib.error
from xml.etree import ElementTree as ET

LOCAL_REPO = "/workspace/local-maven-repo"
MAVEN_CENTRAL = "https://repo1.maven.org/maven2"

def group_to_path(group):
    return group.replace('.', '/')

def has_artifact(group, artifact, version):
    path = os.path.join(LOCAL_REPO, group_to_path(group), artifact, version)
    return os.path.exists(os.path.join(path, f"{artifact}-{version}.pom"))

def download_artifact(group, artifact, version):
    target_dir = os.path.join(LOCAL_REPO, group_to_path(group), artifact, version)
    target_pom = os.path.join(target_dir, f"{artifact}-{version}.pom")
    target_jar = os.path.join(target_dir, f"{artifact}-{version}.jar")

    if os.path.exists(target_pom):
        return False  # Already exists

    os.makedirs(target_dir, exist_ok=True)

    url = f"{MAVEN_CENTRAL}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.pom"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            if data.startswith(b'<?xml'):
                with open(target_pom, 'wb') as f:
                    f.write(data)

                # Also try to download JAR
                jar_url = f"{MAVEN_CENTRAL}/{group_to_path(group)}/{artifact}/{version}/{artifact}-{version}.jar"
                try:
                    req2 = urllib.request.Request(jar_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req2, timeout=30) as resp2:
                        with open(target_jar, 'wb') as f:
                            f.write(resp2.read())
                except:
                    pass
                return True
            else:
                if os.path.exists(target_pom):
                    os.remove(target_pom)
                return False
    except Exception as e:
        return False

def parse_pom_dependencies(pom_path):
    """Parse a POM file and return list of (group, artifact, version) tuples"""
    try:
        tree = ET.parse(pom_path)
        root = tree.getroot()

        ns = {'mvn': 'http://maven.apache.org/POM/4.0.0'}
        if root.tag.startswith('{'):
            # Has namespace
            ns_prefix = root.tag.split('}')[0] + '}'
        else:
            ns_prefix = ''

        deps = []

        # Parent
        parent = root.find(f'{ns_prefix}parent')
        if parent is not None:
            g = parent.find(f'{ns_prefix}groupId')
            a = parent.find(f'{ns_prefix}artifactId')
            v = parent.find(f'{ns_prefix}version')
            if g is not None and a is not None and v is not None:
                deps.append((g.text, a.text, v.text))

        # Dependencies
        deps_elem = root.find(f'{ns_prefix}dependencies')
        if deps_elem is not None:
            for dep in deps_elem.findall(f'{ns_prefix}dependency'):
                g = dep.find(f'{ns_prefix}groupId')
                a = dep.find(f'{ns_prefix}artifactId')
                v = dep.find(f'{ns_prefix}version')
                if g is not None and a is not None:
                    version = v.text if v is not None else None
                    if version:
                        deps.append((g.text, a.text, version))

        return deps
    except Exception as e:
        return []

# Initial scan
queue = []
print("Phase 1: Scanning existing POMs for dependencies...")

# Also seed with known missing parents
queue.append(('org.sonatype.oss', 'oss-parent', '9'))

for pom in []
for root, dirs, files in os.walk(LOCAL_REPO):
    for file in files:
        if file.endswith('.pom'):
            pom_path = os.path.join(root, file)
            deps = parse_pom_dependencies(pom_path)
            for g, a, v in deps:
                if not has_artifact(g, a, v):
                    queue.append((g, a, v))

print(f"Found {len(queue)} artifacts to check")
print("Phase 2: Downloading missing artifacts...")

downloaded = 0
failed = 0
iteration = 0
max_iterations = 30

while queue and iteration < max_iterations:
    iteration += 1
    next_queue = []
    for g, a, v in queue:
        if has_artifact(g, a, v):
            continue
        result = download_artifact(g, a, v)
        if result:
            downloaded += 1
            print(f"  Downloaded: {g}:{a}:{v}")
        else:
            failed += 1
            # Don't retry failures

    # Rescan newly downloaded artifacts
    new_deps = []
    for g, a, v in queue:
        if has_artifact(g, a, v):
            group_path = group_to_path(g)
            pom_path = os.path.join(LOCAL_REPO, group_path, a, v, f"{a}-{v}.pom")
            if os.path.exists(pom_path):
                deps = parse_pom_dependencies(pom_path)
                for ng, na, nv in deps:
                    if not has_artifact(ng, na, nv):
                        new_deps.append((ng, na, nv))

    # Dedupe
    seen = set()
    queue = []
    for item in new_deps:
        if item not in seen:
            seen.add(item)
            queue.append(item)

    print(f"Iteration {iteration}: downloaded={downloaded}, failed={failed}, queue={len(queue)}")

    if not queue:
        break

print(f"\nTotal downloaded: {downloaded}, failed: {failed}")
EOF

python3 /tmp/parse_pom.py
