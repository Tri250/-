#!/usr/bin/env python3
"""
只下载缺失的 JAR 文件（POM 已存在）
"""
import os
import urllib.request
import ssl
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

LOCAL_REPO = "/workspace/local-maven-repo"
# 使用可以正常工作的镜像源
ALIYUN_GOOGLE = "https://maven.aliyun.com/repository/google"
ALIYUN_PUBLIC = "https://maven.aliyun.com/repository/public"
HUAWEI = "https://repo.huaweicloud.com/repository/maven"
TIMEOUT = 120
MAX_WORKERS = 3  # 减少并发

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
                if len(data) > 0:
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


def find_missing_jars():
    """查找只有 POM 没有 JAR 的依赖"""
    missing = []
    
    for root, dirs, files in os.walk(LOCAL_REPO):
        # 只检查版本目录（包含 pom 文件的目录）
        pom_files = [f for f in files if f.endswith('.pom')]
        if pom_files:
            # 提取 group:artifact:version
            # root格式: /repo/group/path/artifact/version
            parts = root.replace(LOCAL_REPO + '/', '').split('/')
            if len(parts) >= 3:
                version = parts[-1]
                artifact = parts[-2]
                group = '.'.join(parts[:-2])
                
                # 检查是否有对应的 jar 文件
                jar_name = f"{artifact}-{version}.jar"
                if jar_name not in files:
                    print(f"发现缺失: {group}:{artifact}:{version}")
                    missing.append((group, artifact, version))
    
    return missing


def download_jar(g, a, v):
    target_dir = os.path.join(LOCAL_REPO, group_to_path(g), a, v)
    jar_path = os.path.join(target_dir, f"{a}-{v}.jar")
    
    # 检查是否已经有 jar 文件
    if os.path.exists(jar_path):
        return True, 0
    
    # 使用可以工作的镜像源
    base_urls = [
        ALIYUN_GOOGLE,
        HUAWEI,
        ALIYUN_PUBLIC,
    ]
    
    for base_url in base_urls:
        url = f"{base_url}/{group_to_path(g)}/{a}/{v}/{a}-{v}.jar"
        success, size = download_file(url, jar_path)
        if success:
            return True, size
    
    return False, 0


def main():
    print("查找缺失的 JAR 文件...")
    print("=" * 70)
    
    missing_deps = find_missing_jars()
    print(f"\n找到 {len(missing_deps)} 个缺失的 JAR 文件")
    print("开始下载...\n")
    
    downloaded = 0
    failed = 0
    
    def download_one(item):
        g, a, v = item
        success, size = download_jar(g, a, v)
        return (g, a, v, success, size)
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(download_one, item): item for item in missing_deps}
        for future in as_completed(futures):
            g, a, v, success, size = future.result()
            if success:
                if size > 0:
                    downloaded += 1
                    print(f"  OK: {g}:{a}:{v} ({size} bytes)")
            else:
                failed += 1
                print(f"  FAILED: {g}:{a}:{v}")
    
    print("\n" + "=" * 70)
    print(f"完成: {downloaded} 下载, {failed} 失败")


if __name__ == "__main__":
    main()
