# 058 `capture.py --from-dir`：把已有截图拼成并排图（Q11 / P4-25）

## 为什么做
`scripts/papercraft/capture.py` 是纸模场景的截图/录像工具，但它整条链路依赖 Playwright：起 http 服务、
launch Chrome、等 `__papercraft.ready`、逐镜头 `evaluate` 再 `screenshot`。本机**没有 Playwright**
（第 35 轮起就一直用 ego 浏览器截图 + `measure.py` 量数），所以「A/B 并排图」这一步每次都得手工拼，
而 `ab_sheet.py` 又不是同一套参数。P4-25 就是补这条腿：让截图脚本能吃现成 PNG。

## 做了什么
1. `capture.py` 的位置参数 `project` 改为可选（`nargs='?'`, default `.`），新增四个开关：
   `--from-dir DIR`、`--sheet NAME`（默认 `ab-sheet.png`）、`--cols N`（默认 2）、`--cell-height N`（默认 760）。
2. 新增 `sheet_from_dir(src, out_dir, name, cols, height)`：按文件名排序取 `*.png`，等比缩到 `--cell-height`，
   按 `--cols` 排成网格，纸色底 `(243,231,205)`、每格下方写「文件名 + 缩后尺寸」，存到 `--out` 目录。
3. `main()` 里**先**处理 `--from-dir` 再 `import playwright`：没有 Playwright 也能用，不联网、不起服务、不启动浏览器。
4. 没有 Pillow 时回退成 HTML 拼版（`grid` 布局 + `max-height`），文件名同 `--sheet` 改后缀 `.html`，打印一行说明。
5. 文件头 docstring 补了这一段用法（`--from-dir` 的用途、Pillow 要求、回退）。

## 验收
```
python scripts/papercraft/capture.py --help          # usage 里出现 [--from-dir DIR] [--sheet SHEET] [--cols COLS]
python scripts/papercraft/capture.py . --from-dir .tmp/q11in --out .tmp/q11out --sheet q11-sheet.png
  → 2 file(s) from .tmp/q11in -> …/.tmp/q11out/q11-sheet.png (2502x802)
      a-props.png  1233x760
      b-q4.png  1233x760
```
- 拼版内容核对（Pillow 取样）：尺寸 **2502×802**；左格中心 `(160,77,34)`、右格 `(160,78,34)`（都是场景暖色，
  不是纯色空白）；四角底色 `(243,231,205)` = 纸色。
- 无 Pillow 回退（系统 python）：`… .tmp/q11out2/fallback.html (2 file(s))`，HTML 有 2 个 `<figure>`。
- 原有 Playwright 路径未动：不带 `--from-dir` 时仍打印 `capture.py needs Playwright: …`。

## 改动文件
- `scripts/papercraft/capture.py`（`--from-dir` / `--sheet` / `--cols` / `--cell-height`、`sheet_from_dir()`、docstring）
- `docs/ITERATIONS/058-capture-from-dir.md`、`docs/CHANGELOG.md`、`docs/STATE.md`、`docs/BACKLOG.md`、`docs/PLAN.md`

## 遗留
- 拼版只按文件名排序，不能指定「左 A 右 B」的显式对应；需要时用 `a-` / `b-` 前缀（本轮就是这么做的）。
- `--from-dir` 不做任何像素度量（`measure.py` 才是量数的那一支），也不生成视频。
- 仍无 Playwright：截图只能来自 ego 浏览器，脚本的 `screenshot` 分支在本机依旧跑不起来。

## 前向回滚
1. 删掉 `ap.add_argument('--from-dir' …)`、`--sheet`、`--cols`、`--cell-height` 四行与 `if a.from_dir:` 分支（U-058-01）。
2. 删掉 `sheet_from_dir()` 与 docstring 里那一段（U-058-02）。
3. `ap.add_argument('project', nargs='?', default='.')` 恢复为 `ap.add_argument('project')`（U-058-03）。
