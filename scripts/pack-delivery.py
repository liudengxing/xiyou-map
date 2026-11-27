#!/usr/bin/env python3
"""Pack the Xiaomi delivery zip from the current repo (Q12).

Only whitelisted runtime files go in: no docs/, no scripts/, no .tmp/, no README. The list is explicit on purpose so a
new runtime file never ships by accident and a deleted one never lingers. Nothing is edited on the way in; the zip is
just a copy. Run: python scripts/pack-delivery.py
"""
import hashlib
import io
import os
import shutil
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, '西游记时序图-小米 vibeCoding 大赛')
DIST = os.path.join(OUT_DIR, 'dist')
ZIP = os.path.join(OUT_DIR, '西游时序-取经路线交互舆图.zip')

FILES = [
    'index.html',
    'assets/css/style.css',
    'assets/js/app.js',
    'assets/js/data.js',
    'assets/vendor/d3.min.js',
    'assets/vendor/topojson-client.min.js',
    'assets/vendor/land-110m.json',
    'assets/vendor/china-provinces.json',
    'assets/vendor/geo-inline.js',
    'scenes/huoyan/index.html',
    'scenes/huoyan/scene.js',
    'scenes/huoyan/wukong.js',
    'scenes/huoyan/people.js',
    'scenes/huoyan/props.js',
    'scenes/huoyan/print.js',
    'scenes/shared/dialog.js',
    'scenes/shared/paper-ui.css',
    'scenes/vendor/three.module.js',
    'scenes/vendor/three.core.js',
    'scenes/vendor/papercraft/harness.js',
    'scenes/vendor/papercraft/lights.json',
    'scenes/vendor/papercraft/lib/paperkit-2d.js',
    'scenes/vendor/papercraft/lib/paperkit-3d.js',
    'scenes/vendor/papercraft/lib/paper-motion.js',
    'scenes/vendor/papercraft/lib/paper-life.js',
    'scenes/vendor/papercraft/lib/paper-sound.js',
]

BANNED_EXT = {'.exe', '.sh', '.bat', '.cmd', '.php', '.jsp', '.py', '.map', '.env', '.zip'}

# written into the package itself so whoever unzips it knows how to open it
README = """# 西游时序 · 取经路线交互舆图

纯静态站点，无构建、无后端、无 CDN，全部资源在本目录内。

## 两种打开方式

**一、直接双击 `index.html`**（推荐先试这个）
主舆图、时间轴、搜索、行程表、八十一难、人物行迹、古今地图切换都可正常使用。
地图数据已内联在 `assets/vendor/geo-inline.js` 里，不会再发 JSON 请求。

**二、本地静态服务**（火焰山纸模场景需要它）
浏览器出于安全限制，不允许 `file://` 页面加载 ES Module（场景用的是 importmap + module），
所以「火焰山 · 三调芭蕉扇」这个 3D 纸模场景必须用下面这种方式打开：

```bash
cd <本目录>
python -m http.server 8123 --bind 127.0.0.1
```

然后访问 http://127.0.0.1:8123/index.html ，点时间轴上的「火焰山」或详情卡里的入口即可进入。
场景需要 WebGL；浏览器不支持时场景区给出降级提示，舆图部分不受影响。

## 目录

- `index.html` 入口
- `assets/css/style.css` 样式
- `assets/js/data.js` 回目/难号/站点/人物数据，`assets/js/app.js` 交互与绘制
- `assets/vendor/` d3 v7、topojson-client、陆地与省级边界数据（含九段线，均本地）
- `scenes/huoyan/` 火焰山纸模场景，`scenes/shared/` 场景共用的纸片对话框
- `scenes/vendor/` three.js 与纸模运行时（含 `lib/`）

## 边界数据说明

今图层只画省级行政轮廓与南海九段线，不加载任何海外国界数据集，也不画任何国界线；
古图层只有海岸线与陆地轮廓，没有疆域界线。数据仅作示意，并非测绘成果。
"""

README_NAME = 'README.md'


def main():
    missing = [f for f in FILES if not os.path.isfile(os.path.join(ROOT, f))]
    if missing:
        raise SystemExit('pack-delivery: missing from the repo: ' + ', '.join(missing))

    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    total = 0
    for rel in FILES:
        dst = os.path.join(DIST, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(os.path.join(ROOT, rel), dst)
        total += os.path.getsize(dst)

    # fixed timestamps, sorted order: the same tree must hash the same twice
    io.open(os.path.join(DIST, README_NAME), 'w', encoding='utf-8', newline='\n').write(README)
    total += os.path.getsize(os.path.join(DIST, README_NAME))
    packed = FILES + [README_NAME]
    if os.path.exists(ZIP):
        os.remove(ZIP)
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
        for rel in packed:
            info = zipfile.ZipInfo(rel, date_time=(2026, 11, 27, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, io.open(os.path.join(DIST, rel), 'rb').read())

    names = zipfile.ZipFile(ZIP).namelist()
    bad = [n for n in names if os.path.splitext(n)[1].lower() in BANNED_EXT or n.startswith('/') or '..' in n]
    if bad:
        raise SystemExit('pack-delivery: banned or unsafe entry: ' + ', '.join(bad))
    if 'index.html' not in names:
        raise SystemExit('pack-delivery: no index.html at the zip root')

    zip_size = os.path.getsize(ZIP)
    sha = hashlib.sha256(io.open(ZIP, 'rb').read()).hexdigest()
    print(f'{len(names)} files, {total} B unpacked, {zip_size} B zip, sha256 {sha}')
    for rel in packed:
        print(f'  {os.path.getsize(os.path.join(DIST, rel)):>9}  {rel}')


if __name__ == '__main__':
    sys.exit(main())