# 053 场景小坑收口：`?embed=1` / 深链白名单 / 调试钩子（Q6）

## 为什么做这一件
三处都是「接上主站之后才暴露、但不影响单独看」的小坑：

1. **提示条不该出现在主站里**。`scenes/huoyan/index.html` 底部那行「arrows / WASD 走动 · 点地面走过去 · 点人（或 E）说话 · Esc 收起纸片」是给单独打开场景的人看的；嵌进主站的场景窗口后它压在画面下沿，既多余又挡构图。
2. **深链不设防**。`readHash()` 里 `if (q.scene) S.sceneWant = q.scene;` —— 手写 `#scene=nosuch` 就会走到 `openScene`，把 iframe 的 src 指向 `scenes/nosuch/index.html`，控制台留一条 404，画面是一个白框。
3. **调试钩子在生产入口到处漏**。`window.__huoyan` 一直挂着 `people / openPerson / dialog / isFrozen / props` —— 那是验收时用的，任何人打开控制台都能直接改场景状态；而主站其实只用它问一件事（Esc 该先收对话还是先收场景）。

## 做了什么

| 项 | 改法 | 位置 |
| --- | --- | --- |
| `?embed=1` 不显示提示条 | `const EMBED = /[?&]embed=1(&|$)/.test(location.search);` → 命中就把 `#hint` 设 `hidden` | `scenes/huoyan/scene.js`（`try` 之前） |
| 深链白名单 | 新增 `isSceneId(id)`（遍历 `SCENE_STATIONS` 的值比对）；`readHash` 改成 `if (q.scene && isSceneId(q.scene))`；`openScene` 首行 `if (!id || !isSceneId(id)) return;` | `assets/js/app.js` |
| 调试钩子收口 | `window.__huoyan` 生产入口只留 `{ dialogOpen(), closeDialog() }`；`people / openPerson / dialog / isFrozen / props` 改到 `if (H.flags.TEST)` 里 `Object.assign` | `scenes/huoyan/scene.js` 末尾 |
| Esc 契约同步 | 主站原来读 `api.dialog.isOpen()`，改成 `typeof api.dialogOpen === "function" && api.dialogOpen()` | `assets/js/app.js` |

两边同时改是因为它们是一对契约：主站只依赖 `dialogOpen/closeDialog` 两个函数，场景就只需要暴露这两个；`dialog` 对象本身不外露，非 `?test` 下也没法从外面开对话。

## 验收（1256×774，逐条实测）

| 场景 | 检查 | 结果 |
| --- | --- | --- |
| `scenes/huoyan/index.html?embed=1` | `#hint` 的 `hidden` 与计算样式 | `hidden true`、`display:none` ✓ |
| 同上 | `Object.keys(window.__huoyan)` | `["dialogOpen","closeDialog"]` ✓ |
| 同上 | `ready` / `cards` / `clips` | `true` / `198` / `0` ✓ |
| `...index.html?test` | `#hint` | `hidden false`（单独打开要提示）✓ |
| 同上 | 钩子键 | `dialogOpen, closeDialog, people, openPerson, dialog, isFrozen, props`（7 个）✓ |
| 同上 | `openPerson(people[0].id)` → `dialogOpen()` | `true`（罗刹女），`closeDialog()` 后 `false` ✓ |
| 主站 `#scene=nosuch` | `#scene-modal.hidden` / iframe 是否存在 / hash | `true` / 无 iframe / hash 落到 `#s=5`（不加载 404）✓ |
| 主站 `#scene=huoyan` | iframe src / 子页 ready / 子页钩子 | `scenes/huoyan/index.html?embed=1` / `true` / 两个函数 ✓ |
| 同上，向子文档派发 `Escape` | 关闭结果 | 场景收起（`modal.hidden true`、`body.scene-open` 撤掉、hash 回 `#s=5`）✓ |

`node --check assets/js/app.js`、`node --input-type=module --check < scenes/huoyan/scene.js` 均 OK；`node scripts/check-all.mjs` → `OK：4 项全通过`。

**踩坑记录**：`assets/js/app.js` 与 `scenes/huoyan/*.js` 里既有 CRLF（`app.js`）也有 LF（`scene.js`）。第一次批量替换按 `\n` 写多行锚点，`app.js` 直接 AssertionError（文件里是 `\r\n`），而脚本前半段已经把 `scene.js` 写完 —— 于是出现「半套改动」的假象。此后所有多行锚点都先按文件实际换行符 `replace('\n', nl)` 再匹配。

## 遗留
1. 生产入口不再能 `openPerson`，所以「对话开着时按 Esc 只收对话、不关场景」这条**只验了契约函数**，没有在真实 iframe 里连着测（iframe 的 src 固定带 `embed=1`，没有 `?test`）。要真验得在场景里用鼠标点人触发对话，属观感类手动验收。
2. 主站 `writeHash()` 不写 `scene=`（只在 `openScene` 里写），关掉场景后 hash 回到 `#s=`；深链回放能力仍只有「载入时打开一次」。
3. `?embed=1` 只处理提示条；场景里没有别的「给单独打开的人看」的元素。

## 回滚（只前向）
1. `scenes/huoyan/index.html`：`scene.js?v=63 → 64`；`index.html`：`app.js?v=54 → 55`；
2. `scene.js` 删掉 `EMBED` 段、把 `if (H.flags.TEST)` 展开回无条件 `window.__huoyan = {...}`；`app.js` 恢复 `api.dialog.isOpen()` 与无 `isSceneId` 的两处；
3. 版本号只进不退。
