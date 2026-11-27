# 034 · P5-6 主站集成：火焰山入口 + iframe 模态 + 深链

- 时间：2026-11-27 02:50 – 03:10
- 轮次：第 34 轮（`N = 33 + 1`）
- 改动单元：`U-034-01`
- 对应实现文档任务：P0-6（主站集成）

## 本轮目标

把已经跑通的火焰山纸模场景接进主站：火焰山详情卡里出现入口按钮，点开后是 96vw×90vh 的 iframe 模态，深链 `#s=29&scene=huoyan` 可直接进场景；场景开着时主站的键盘不再抢输入，关掉时把 WebGL 上下文一起卸掉。

## 可测指标（开工前定，收工后对）

| # | 指标 | 目标 | 实测 |
|---|---|---|---|
| 1 | 入口按钮只在火焰山出现 | 仅 `#s=29` 有 `[data-scene]` | 第 5 站（长安）`btnAt5 false`、第 29 站（火焰山）`btnAt29 true` |
| 2 | 模态尺寸 = 96vw×90vh | 1440：1382×810；1200：1152×666 | 1440 → `[29,45,1382,810]`；1200 → `[24,37,1152,666]`；1256 → `[25,39,1206,697]` |
| 3 | 场景在模态里真的跑起来 | `__papercraft.ready === true`、`clips()` 空 | `ready true / cards 156 / buildMs 444 / clips []`（1440）；390 与 1200 同为 `ready true` |
| 4 | 主站三档无回归 | 48 图钉 / `tabindex=0` 1 个 / `aria-current` 1 个 / 海纹 `path` 64 | 390、1200、1256 三档全部 `48 / 1 / 1 / 64`；行程表 48 项 + 2 组；八十一难 81 格；人物行迹 5 条 |
| 5 | 进场景前不请求 three | `performance` 里无 three/papercraft/huoyan | `threeReqsBefore: []`（点火之前取样） |

## 改了什么

| 文件 | 区块 | 改动 |
|---|---|---|
| `assets/js/app.js`（56949 → 60949 B） | `S` | 加 `scene`（当前场景 id）与 `sceneWant`（深链暂存，待 build 完再开） |
| 同上 | `renderDetail()` | 火焰山专属 `sceneBtn`：`<button class="d-scene-btn" data-scene="huoyan">进入纸模场景<span>3D · 需 WebGL</span></button>`，插在 `quote + note` 之后、难号 chips 之前 |
| 同上 | 新增 `/* ── 纸模场景（P5-6） */` 段 | `openScene(id, fromEl)` / `closeScene()`：惰性建 iframe、`?embed=1`、`body.scene-open`、`writeHash()`、焦点回收；关闭时 `src = "about:blank"` 卸 WebGL |
| 同上 | `writeHash()` / `readHash()` | hash 增删 `scene=`，读到就先存 `S.sceneWant` |
| 同上 | `init()` / 全局 `keydown` / `bind()` | build 完若 `sceneWant` 则开场景；场景开着时键盘只认 Esc；`#scene-close`、遮罩点击、`[data-scene]` 三处绑定 |
| `index.html`（7564 → 8471 B） | `#about` 之后 | `.scene-modal#scene-modal[hidden] > .scene-sheet`（`.scene-head` 标题 + 关闭键、`.scene-frame` 装 iframe、`.scene-note` 操作提示）；iframe 平时无 `src` |
| `assets/css/style.css`（37038 → 39722 B） | 末尾追加 | 遮罩（`rgba(38,29,17,.62)` + blur 2px）、纸色 sheet + 三条影子、40px 头、提示条、`.d-scene-btn`、`body.scene-open` 时主站卡片与时间轴 `pointer-events:none`、620px 断点全屏 |

## 为什么这么改

- **只给火焰山挂按钮**：现在只有这一个场景跑通，别的站露一个点不开的按钮是骗人。`n.id === "huoyan"` 一行判断，加场景时改这一处。
- **iframe 平时无 `src`、关掉写 `about:blank`**：3D 场景一开就吃一个 WebGL 上下文和 one 个 rAF 循环；关掉不卸，回到舆图后仍在后台跑。空白页是最直接的释放方式（实测关掉后 `src` 变 `about:blank`）。
- **Esc 分两层**：场景自己的纸片对话先吃 Esc（`__huoyan.dialog.isOpen()` 判），第二下才关整个场景。否则读着台词按 Esc 会把整个场景掀掉。
- **场景开着时父文档键盘只认 Esc**：主站的 `←/→/空格/` 会偷偷换站或开始播放，用户以为在看场景却在下面换站。验收里用父文档派发 `ArrowRight` 验证 `.d-name` 不变。
- **焦点交还按钮**：关掉后 `document.activeElement` 回到 `.d-scene-btn`，键盘用户不用重新 Tab 一遍。
- **窄屏全屏**：96vw×90vh 在 390 宽上只剩 374×760，纸模的取景框里全是边；620px 断点直接铺满。这是**假设**，不是原始规格——已写进遗留。

## 验证证据

### 1440×900（`.tmp/frame1440.html?s=29`）

```json
{"btnRect":[1083,528,167,28],"hidden":false,
 "sheet":[29,45,1382,810],"head":[30,46,1380,40],"frame":[30,86,1380,742],"note":[30,828,1380,26],
 "canvas":[1380,742],"ready":true,"cards":156,"buildMs":444,"clips":[]}
```

### 深链与降级

- `index.html?t=771&s=29#s=29&scene=huoyan` → `hidden false`、`src scenes/huoyan/index.html?embed=1`、`ready true`、sheet `[25,39,1206,697]`。
- 关闭后：`hidden true`、`hash #s=29`、`src about:blank`；点 `#scene-close` 后 `focusOnBtn true`；再点按钮重新开 → `src` 重新设上、`ready true / cards 156`。

### 键盘隔离

| 动作 | 结果 |
|---|---|
| 场景开着，父文档派发 `ArrowRight` | `.d-name` 仍「火焰山第 47 – 49 难」，`unchanged true` |
| 场景内开猪八戒对话 → iframe 内 Esc | 对话收起（`dlgHidden true`），模态仍开（`modalHidden false`） |
| 再按一次 Esc | 模态收起、`hash #s=29`、`src about:blank` |

### 390×844（`.tmp/frame390.html?s=29`）

`sheet [0,0,390,844]`、head 36、frame 806、`ready true`、`pins 48 / tab0 1 / ariaCur 1 / seaPaths 64`。

### 像素（Pillow，`C:/Users/StarStorm/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/python/python.exe`）

`.tmp/r34-scene-modal-1256.png`（1256×774 整页，未裁切）：

| 区域 | 均值 | 说明 |
|---|---|---|
| 遮罩顶 | (113,102,86) | 底下的舆图被压暗，仍能看出是地图 |
| sheet 头 | (243,231,205) | 正是宣纸 `#f3e7cd` |
| 场景上带 | (139,47,17) | 火墙纸片的朱砂/焦色 |
| 场景中带 | (227,196,130) | 纸地面（与第 29–32 轮同档） |
| 全幅 | 近纯白 0.00% / 深色 0.53% | 没有死白，也没有大片黑 |

`.tmp/r34-scene-modal-390.png`：head (243,231,205)、frame 顶 (157,70,33)、frame 中 (227,197,134)。

### 命令

```
node scripts/check-all.mjs        → OK：3 项全通过
node --check assets/js/app.js      → SYNTAX_OK
wc -c：index.html 8471 / app.js 60949 / style.css 39722
docs/ITERATIONS 34 个；grep -c '^| 034' docs/CHANGELOG.md = 1
curl：index 200 / scenes/huoyan/index.html 200
```

## 盲评诚实说明

`read_image` 在本会话仍然只返回元数据（尺寸 / 字节 / sha256），像素没有进上下文：**没有肉眼判读，也没有做 A/B 盲评**。本轮能给的只有 DOM 数字 + Pillow 均值，它们能证明「尺寸对、位置对、颜色档位对、没有死白」，**不能证明「看起来好看」**——模态的纸边、遮罩压暗是否过头、390 全屏是否显得太空，留待视觉通道恢复后判。

另：`.tmp/r34-scene-modal-1440.png` 用 `bcdp_screenshot({selector:"iframe"})` 截 1440×900 的 iframe，而 ego 视口只有 1256×774，超出部分被拍成纯黑 (34,34,34)（右侧 1280–1440、下方 760–900）。第一次量出「sheet 头 216,205,183」就是这个黑边拉低了均值。**判色必须用不超过视口的截图**（顶页 1256 或 390 壳），已记进 BACKLOG 的「工具坑」。

## 回滚

1. `assets/js/app.js`：删掉 `/* ── 纸模场景（P5-6） */` 整段与 `S.scene`/`S.sceneWant`；`renderDetail()` 去掉 `sceneBtn` 变量与拼接；`writeHash()` 去掉 `scene=` 那段；`readHash()` 去掉 `q.scene`；`init()` 去掉 `sceneWant` 分支；`keydown` 去掉 `if (S.scene)` 早退；`bind()` 去掉三处绑定。
2. `index.html`：删 `.scene-modal` 整块（`#about` 之后）。
3. `assets/css/style.css`：删末尾追加的 `.scene-modal` … `.d-scene` 与 `body.scene-open` 规则、620px 断点里那两行。
4. 回退后主站应回到「56 949 / 7 564 / 37 038 B、无 `#scene-modal`」；`check-all` 仍通过；`scenes/` 不受影响（场景本身没动）。

## 遗留

1. **没看见画面**（同上）：模态观感未经肉眼确认。
2. 390 上模态铺满全屏（`100vw/100vh`）是**假设**，原始规格是 96vw×90vh；若全屏显得空，可改回 96vw×90vh 或按 92vw×86vh 折中。
3. **`?embed=1` 目前没有行为差异**（场景不读这个参数）：留在 URL 里是为下一轮做「嵌入态隐藏 hint / 不加历史记录」的钩子，或直接删掉。
4. **深链传入不存在的场景 id**（如 `&scene=foo`）会加载 404 的 iframe 并显示浏览器错误页，主站不会兜底。需要白名单校验（只认 `huoyan`）。
5. 场景里 `window.__huoyan` 在正式嵌入时也暴露（P5-5 遗留）：集成后仍可被外部脚本驱动，P5-7 收成只读或 `?embed=1` 下不给。
6. **WebGL 失败降级路径未验**：场景自身的 `#fallback`（含「原因：<err.message>」）是有的，但在 iframe 里没有真触发过（本机 webgl2 正常）。想验可在模态里加 `&gl=0` 之类的强制失败开关，或临时断 `three.module.js` 观察；本轮没做，不写「已验证」。
