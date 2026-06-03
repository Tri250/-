#!/usr/bin/env python3
"""
全面修复本地Maven仓库
1. 清理损坏的POM文件（HTML 404页面）
2. 检查并下载缺失的JAR文件
3. 修复版本不匹配问题
"""
import os
import re
import urllib.request
import ssl
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import xml.etree.ElementTree as ET

LOCAL_REPO = "/workspace/local-maven-repo"
MAVEN_CENTRAL = "https://repo1.maven.org/maven2"
GOOGLE_MAVEN = "https://dl.google.com/dl/android/maven2"
TIMEOUT = 60
MAX_WORKERS = 8

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def group_to_path(group):
    return group.replace('.', '/')

def is_valid_pom(path):
    """检查POM文件是否有效（不是HTML 404页面）"""
    if not os.path.exists(path):
        return False
    try:
        with open(path, 'rb') as f:
            content = f.read(100)
            if content.startswith(b'<?xml') or content.startswith(b'<project'):
                return True
            # 检查是否是HTML
            if b'<html' in content.lower() or b'<!doctype' in content.lower():
                return False
            return True
    except:
        return False

def is_valid_jar(path):
    """检查JAR文件是否有效"""
    if not os.path.exists(path):
        return False
    try:
        size = os.path.getsize(path)
        if size < 1000:  # 太小，可能是损坏的
            return False
        with open(path, 'rb') as f:
            # JAR文件应该以PK签名开始
            magic = f.read(4)
            if magic == b'PK\x03\x04':
                return True
            return False
    except:
        return False

def download_file(url, target_path, description=""):
    """下载文件"""
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
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
                return False, 0  # 不存在，不重试
            time.sleep(2)
        except Exception as e:
            time.sleep(2)
    return False, 0

def clean_invalid_files():
    """清理无效的POM和JAR文件"""
    print("=== Phase 1: 清理无效文件 ===")
    cleaned_poms = 0
    cleaned_jars = 0

    for root, dirs, files in os.walk(LOCAL_REPO):
        for file in files:
            path = os.path.join(root, file)
            if file.endswith('.pom'):
                if not is_valid_pom(path):
                    os.remove(path)
                    cleaned_poms += 1
                    print(f"  清理无效POM: {path}")
            elif file.endswith('.jar'):
                if not is_valid_jar(path):
                    os.remove(path)
                    cleaned_jars += 1
                    print(f"  清理无效JAR: {path}")

    print(f"清理完成: {cleaned_poms} 个POM, {cleaned_jars} 个JAR")
    return cleaned_poms, cleaned_jars

def find_missing_jars():
    """查找缺失的JAR文件"""
    print("\n=== Phase 2: 查找缺失JAR ===")
    missing = []

    for root, dirs, files in os.walk(LOCAL_REPO):
        pom_files = [f for f in files if f.endswith('.pom')]
        jar_files = [f for f in files if f.endswith('.jar')]

        for pom in pom_files:
            # 从路径提取groupId, artifactId, version
            pom_path = os.path.join(root, pom)
            parts = root.replace(LOCAL_REPO, '').strip('/').split('/')

            if len(parts) >= 3:
                # 最后三个部分是 artifactId/version
                version = parts[-1]
                artifact_id = parts[-2]
                group_id = '.'.join(parts[:-2])

                jar_name = f"{artifact_id}-{version}.jar"
                jar_path = os.path.join(root, jar_name)

                if not os.path.exists(jar_path) or not is_valid_jar(jar_path):
                    missing.append((group_id, artifact_id, version, pom_path))

    print(f"找到 {len(missing)} 个缺失的JAR")
    return missing

def download_missing_jars(missing_list):
    """下载缺失的JAR文件"""
    print("\n=== Phase 3: 下载缺失JAR ===")

    downloaded = 0
    failed = 0
    not_found = 0

    def download_one(item):
        g, a, v, pom_path = item
        target_dir = os.path.dirname(pom_path)
        jar_path = os.path.join(target_dir, f"{a}-{v}.jar")

        # 判断是否应该优先使用Google Maven
        prefer_google = g.startswith('com.android') or g.startswith('androidx') or g.startswith('com.google.android')

        urls = []
        if prefer_google:
            urls.append(f"{GOOGLE_MAVEN}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar")
        urls.append(f"{MAVEN_CENTRAL}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar")
        if not prefer_google:
            urls.append(f"{GOOGLE_MAVEN}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar")

        for url in urls:
            success, size = download_file(url, jar_path, f"{g}:{a}:{v}")
            if success:
                return (g, a, v, "downloaded", size)

        return (g, a, v, "failed", 0)

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(download_one, item): item for item in missing_list}
        for future in as_completed(futures):
            g, a, v, status, size = future.result()
            if status == "downloaded":
                downloaded += 1
                if downloaded % 20 == 0:
                    print(f"  已下载 {downloaded} 个...")
            elif status == "not_found":
                not_found += 1
            else:
                failed += 1

    print(f"下载完成: {downloaded} 成功, {failed} 失败, {not_found} 不存在")
    return downloaded, failed, not_found

def download_critical_dependencies():
    """下载关键依赖（AGP 8.2.2及其所有依赖）"""
    print("\n=== Phase 4: 下载关键依赖 ===")

    # AGP 8.2.2 的完整依赖列表
    critical = [
        # AGP核心
        ("com.android.tools.build", "gradle", "8.2.2", True),
        ("com.android.tools.build", "gradle-api", "8.2.2", True),
        ("com.android.tools.build", "builder", "8.2.2", True),
        ("com.android.tools.build", "builder-model", "8.2.2", True),

        # Android Tools
        ("com.android.tools", "common", "31.2.2", True),
        ("com.android.tools", "sdklib", "31.2.2", True),
        ("com.android.tools", "sdk-common", "31.2.2", True),
        ("com.android.tools", "repository", "31.2.2", True),
        ("com.android.tools", "annotations", "31.2.2", True),

        # Analytics
        ("com.android.tools.analytics-library", "protos", "31.2.2", True),
        ("com.android.tools.analytics-library", "shared", "31.2.2", True),
        ("com.android.tools.analytics-library", "tracker", "31.2.2", True),
        ("com.android.tools.analytics-library", "crash", "31.2.2", True),

        # DDMlib - 使用不同版本
        ("com.android.ddmlib", "ddmlib", "31.2.2", True),

        # Signflinger/Zipflinger
        ("com.android", "signflinger", "8.2.2", True),
        ("com.android", "zipflinger", "8.2.2", True),

        # DataBinding
        ("androidx.databinding", "databinding-compiler-common", "8.2.2", True),
        ("androidx.databinding", "databinding-common", "8.2.2", True),

        # AndroidX核心库
        ("androidx.appcompat", "appcompat", "1.7.0", True),
        ("androidx.core", "core", "1.15.0", True),
        ("androidx.activity", "activity", "1.9.0", True),
        ("androidx.fragment", "fragment", "1.8.0", True),
        ("androidx.coordinatorlayout", "coordinatorlayout", "1.2.0", True),
        ("androidx.webkit", "webkit", "1.8.0", True),

        # Cordova
        ("org.apache.cordova", "framework", "10.1.1", False),

        # 其他必要依赖
        ("com.google.guava", "guava", "31.1-jre", False),
        ("com.google.code.gson", "gson", "2.10.1", False),
        ("com.google.protobuf", "protobuf-java", "3.21.12", False),
        ("org.jetbrains.kotlin", "kotlin-stdlib", "1.9.0", False),
        ("org.jetbrains.kotlin", "kotlin-stdlib-common", "1.9.0", False),
        ("org.jetbrains", "annotations", "13.0", False),

        # Netty (gRPC依赖)
        ("io.netty", "netty-common", "4.1.72.Final", False),
        ("io.netty", "netty-buffer", "4.1.72.Final", False),
        ("io.netty", "netty-transport", "4.1.72.Final", False),
        ("io.netty", "netty-resolver", "4.1.72.Final", False),
        ("io.netty", "netty-codec", "4.1.72.Final", False),
        ("io.netty", "netty-codec-http", "4.1.72.Final", False),
        ("io.netty", "netty-codec-http2", "4.1.72.Final", False),
        ("io.netty", "netty-handler", "4.1.72.Final", False),

        # gRPC
        ("io.grpc", "grpc-core", "1.45.1", False),
        ("io.grpc", "grpc-api", "1.45.1", False),
        ("io.grpc", "grpc-netty", "1.45.1", False),
        ("io.grpc", "grpc-protobuf", "1.45.1", False),
        ("io.grpc", "grpc-stub", "1.45.1", False),

        # Commons
        ("commons-io", "commons-io", "2.11.0", False),
        ("commons-codec", "commons-codec", "1.11", False),
        ("commons-logging", "commons-logging", "1.2", False),

        # 其他
        ("com.squareup", "javapoet", "1.13.0", False),
        ("com.sun.istack", "istack-commons-runtime", "3.0.8", False),
        ("org.jvnet.staxex", "stax-ex", "1.8.1", False),
        ("jakarta.xml.bind", "jakarta.xml.bind-api", "2.3.2", False),
        ("org.glassfish.jaxb", "txw2", "2.3.2", False),
        ("com.sun.xml.fastinfoset", "FastInfoset", "1.2.16", False),
        ("jakarta.activation", "jakarta.activation-api", "1.2.1", False),
        ("org.checkerframework", "checker-qual", "3.12.0", False),
        ("com.google.errorprone", "error_prone_annotations", "2.11.0", False),
    ]

    downloaded = 0
    failed = 0

    for g, a, v, prefer_google in critical:
        target_dir = os.path.join(LOCAL_REPO, group_to_path(g), a, v)
        pom_path = os.path.join(target_dir, f"{a}-{v}.pom")
        jar_path = os.path.join(target_dir, f"{a}-{v}.jar")

        os.makedirs(target_dir, exist_ok=True)

        # 下载POM
        if not is_valid_pom(pom_path):
            urls = []
            if prefer_google:
                urls.append(f"{GOOGLE_MAVEN}/{group_to_path(g)}/{a}/{v}/{a}-{v}.pom")
            urls.append(f"{MAVEN_CENTRAL}/{group_to_path(g)}/{a}/{v}/{a}-{v}.pom")
            if not prefer_google:
                urls.append(f"{GOOGLE_MAVEN}/{group_to_path(g)}/{a}/{v}/{a}-{v}.pom")

            for url in urls:
                success, size = download_file(url, pom_path)
                if success:
                    break

        # 下载JAR
        if not is_valid_jar(jar_path):
            urls = []
            if prefer_google:
                urls.append(f"{GOOGLE_MAVEN}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar")
            urls.append(f"{MAVEN_CENTRAL}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar")
            if not prefer_google:
                urls.append(f"{GOOGLE_MAVEN}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar")

            for url in urls:
                success, size = download_file(url, jar_path)
                if success:
                    downloaded += 1
                    print(f"  OK: {g}:{a}:{v} ({size} bytes)")
                    break
            else:
                failed += 1
                print(f"  FAILED: {g}:{a}:{v}")
        else:
            downloaded += 1

    print(f"关键依赖下载完成: {downloaded} 成功, {failed} 失败")
    return downloaded, failed

def verify_repository():
    """验证仓库完整性"""
    print("\n=== Phase 5: 验证仓库 ===")

    valid_poms = 0
    valid_jars = 0
    invalid_poms = 0
    invalid_jars = 0

    for root, dirs, files in os.walk(LOCAL_REPO):
        for file in files:
            path = os.path.join(root, file)
            if file.endswith('.pom'):
                if is_valid_pom(path):
                    valid_poms += 1
                else:
                    invalid_poms += 1
            elif file.endswith('.jar'):
                if is_valid_jar(path):
                    valid_jars += 1
                else:
                    invalid_jars += 1

    print(f"仓库状态:")
    print(f"  有效POM: {valid_poms}")
    print(f"  有效JAR: {valid_jars}")
    print(f"  无效POM: {invalid_poms}")
    print(f"  无效JAR: {invalid_jars}")

    return valid_poms, valid_jars, invalid_poms, invalid_jars

def main():
    print("开始全面修复本地Maven仓库...")
    print("=" * 60)

    # Phase 1: 清理无效文件
    clean_invalid_files()

    # Phase 2 & 3: 查找并下载缺失JAR
    missing = find_missing_jars()
    if missing:
        download_missing_jars(missing[:500])  # 限制数量避免超时

    # Phase 4: 下载关键依赖
    download_critical_dependencies()

    # Phase 5: 验证
    verify_repository()

    print("\n" + "=" * 60)
    print("修复完成!")

if __name__ == "__main__":
    main()