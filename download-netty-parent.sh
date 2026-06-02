#!/bin/bash
# Download all netty-parent POMs for the netty versions we have in local repo
set -e

LOCAL_REPO="/workspace/local-maven-repo"
MAVEN_CENTRAL="https://repo1.maven.org/maven2"

# Find all netty versions in the local repo
NETTY_VERSIONS=$(ls $LOCAL_REPO/io/netty/ | head -20 | while read artifact; do
    ls $LOCAL_REPO/io/netty/$artifact/ 2>/dev/null
done | sort -u)

echo "Found netty versions: $NETTY_VERSIONS"

for version in $NETTY_VERSIONS; do
    target_dir="$LOCAL_REPO/io/netty/netty-parent/$version"
    target_pom="$target_dir/netty-parent-$version.pom"

    if [ -f "$target_pom" ]; then
        echo "OK: $target_pom"
        continue
    fi

    mkdir -p "$target_dir"
    url="$MAVEN_CENTRAL/io/netty/netty-parent/$version/netty-parent-$version.pom"
    echo "Downloading: $url"
    if curl -m 30 -fsSL "$url" -o "$target_pom" 2>/dev/null; then
        # Validate it's a POM (not HTML 404)
        if head -1 "$target_pom" | grep -q "<?xml"; then
            echo "  -> Success: $(wc -c < $target_pom) bytes"
        else
            echo "  -> Not a valid POM, removing"
            rm -f "$target_pom"
        fi
    else
        echo "  -> Failed"
    fi
done

echo "Done!"
