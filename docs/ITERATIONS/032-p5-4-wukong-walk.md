# 032 · P5-4：T 型纸偶孙悟空与点击寻路

- 时间：2026-11-27
- 改动单元：U-032-01（新建 `scenes/huoyan/wukong.js`、`scene.js` 接入主角与寻路、`play: true`）
- 上一轮：`docs/ITERATIONS/031-p5-3-firewall-cave.md`

## 本轮目标

把「占位立牌」换成真正的纸偶孙悟空（T 型，11 张卡），并让他能走到鼠标点的那个位置 —— 这是「主角在火焰山走动」里程碑（P5-1~P5-4）的最后一步。

## 可测指标（开工前列，收工时逐条给数）

| # | 指标 | 目标 | 实测 |
| --- | --- | --- | --- |
| 1 | `__papercraft.clips()` | 空（卡片互穿 = 走动时出现游动裁切线） | **[]**（初版 4 对，见下） |
| 2 | `walkPath()` | `reached == of`、`blockedBy` 为空 | **reached 3 / of 3**、`blockedBy null`、`y 0`、`on "page"` |
| 3 | 点击地面是否真的走 | 主角坐标朝落点移动并停在落点附近 | **0,3 → 4.54,3.39**（2.5 s 内到位后停住） |
| 4 | 走动画面 | 3–5 帧 | `Z:/build-tmp/r32-walk-{a,b,c}.png`（1256×774） |
| 5 | `buildMs` | < 5000 | **337 ms** |
| 6 | `cards()` | 不低于上一轮 123 | **133**（+10：悟空 11 张卡中 10 张在取景框内） |

## 改了什么

### 1. 新建 `scenes/huoyan/wukong.js`（238 行 / 11581 B）

`export function buildWukong(H, { x, z })` 返回 `{ handle, stride, parts }`。卡片的材质走 harness 现成的 `H.cardOpts(x, z)`（它给 `paper / thickness / edgeWidth / pxPerUnit / effects / seed`），几何走 `paperkit-3d` 的 `makeCard(pts, opts)`。

11 张卡与各自深度（**每张 z 唯一**，机制文档 §12 的硬要求）：

| 卡 | z | 内容 |
| --- | --- | --- |
| `wukong-torso` | 0 | 赭石短打：斜襟墨线、朱砂腰带、两枚金扣、内缘暗影 |
| `wukong-torso-side` | −0.10 | 侧面卡，整张在正面之后，顶低于领口 |
| `wukong-head` | +0.10 | 桃心脸：腮部暗晕、雷公嘴一道朱砂弧、墨点眼 + 朱砂眼圈（不画高光，spec 禁纯白） |
| `wukong-head-side` | +0.02 | 侧面头颅，顶 3.14 低于脸顶 3.34（高了会像多出两只耳朵） |
| `wukong-crown` | +0.20 | 金箍 + 朱砂圆章 |
| `wukong-arm-l` / `-r` | 枢轴 `(±0.60, 2.42, −0.20)` | 赭石袖、朱砂袖口、脸色的手 |
| `wukong-leg-l` / `-r` | 枢轴 `(±0.20, 1.10, −0.13)` | 墨色裤、云靴、赭金靴口 |
| `wukong-skirt` | +0.14 | 虎皮裙，五道朱砂虎纹 |
| `wukong-staff` | −0.50 | 金箍棒斜背（`rotation.z = 0.34`），两端金环 |

**为什么躯干只有 0.42 半宽、手臂枢轴要到 0.60**：四肢在正面轮廓里摆动时，会绕髋/肩扫过身体那一层卡片（平面相扫会产生一条随走动游动的裁切线）。机制文档的说法是「四肢必须放在身体轮廓之外」，所以躯干压窄、手臂外移，让手臂内缘（0.47）与裙摆（0.40）之间留 0.07。

**为什么裙要到 z=0.14**：裙子原本在 0.06，厚度 0.08 → 占 0.02–0.10，而躯干在 −0.04–0.04，两者在 z 上叠了 0.02 —— `clips()` 因此报 `wukong-torso / wukong-skirt overlap @standing`。

### 2. 步态 `stride(walked, gait)`

照 `references/motion.md` 的公式：

- `phase = walked / STEP * PI`，`STEP = 3.6 * 0.58 / 2 = 1.044`（半步长，即 0.58 H）；
- 摆幅 `A = min(0.5, gait * STEP * 2 / (2 * LEG))`，`LEG = 1.08`；上限 0.5 rad 是为了不让 3.6 高的纸偶看起来在劈叉；
- 支撑相（`u >= 1`）腿角 `A * (3 - 2u)` 线性 —— 脚钉在地上不打滑；摆动相 `A * (2e - 1)`，`e` 是 smoothstep；
- 手臂 `±ARM * gait * cos(phase)`，`ARM = 0.34`，与腿反相；
- 身体起伏 `0.033 H * gait * |sin|`（过步最高、落脚最低），躯干再叠 0.02 rad 的滞后与前后的 0.012 rad 轻晃。

### 3. `scene.js`（12577 B / 235 行）

- `import * as THREE from 'three'` + `import { buildWukong } from './wukong.js'`；删掉 `standee()` 与占位立牌（**不留死代码**）。
- `const wk = buildWukong(H, { x: 0, z: 3 }); H.scene.add(wk.handle.pivot); H.setHero(wk.handle, { stride: wk.stride });`
- **点击寻路**：`Raycaster` + `Plane(0,1,0)`，`canvas.getBoundingClientRect()` 归一化到 NDC，落点夹进 `H.walkArea` 内缩 0.6；`H.onStep` 每帧比较当前位置与落点，`< 0.35` 就松杆。
- 兜底：`#fallback` 追加一行「原因：<err.message>」——用户看不到控制台，我自己下一轮也要能一眼读到。

## 踩到的三个坑（都已修，写下来省下一轮）

1. **`H.setHero(h)` 的 `h` 不是 Object3D**，是 popup 那样的句柄：harness 每帧读 `h.group`（位置、朝向）与 `h.pivot.children[0]`（前倾/侧倾）。直接传 `Group` 会 `Cannot read properties of undefined (reading 'position')`，整页落到兜底文案。正解是自建两层：`pivot`（外壳，只承接 lean/roll）里装 `rig`（被搬动的那层）。
2. **`createHarness` 的返回值上没有 `heroPos`，也没有 `steer`** —— 这两个只在 `window.__papercraft` 上。从 `H` 上取会得到 `undefined`；正确做法是 `H.onStep` 里读 `wk.handle.group.position`（harness 每帧 `sync()` 已经把 heroPos 写进去），转向用 `window.__papercraft.steer(x, z)`。
3. **`play: false` 时 `flags.WALK` 是 false**（`WALK = ?walk || (play && !still && !test)`），于是 `walkStep` 根本不跑：`walkPath()` 能走（它绕过这一层），但点击与 WASD 都不动。改成 `play: true` 后立刻正常 —— 首测那次「主角纹丝不动」就是这个原因，不是寻路写错了。

## 互穿的修法（`clips()` 从 4 对到 0）

初版报的四对与对应修法：

| 报告 | 原因 | 改法 |
| --- | --- | --- |
| `torso / skirt overlap @standing` | 裙 z 0.06 与躯干 0±0.04 叠了 0.02 | 裙推到 **z 0.14** |
| `staff / leg-r overlap @walking 0.0` | 金箍棒 z −0.34 太近，腿前扫时擦到 | 棒推到 **z −0.50** |
| `arm-l / skirt overlap @walking 0.2` | 裙外扩 0.44 压住手臂内缘 0.43 | 裙收到 **±0.40**（顶 0.36） |
| `arm-r / skirt overlap @walking 0.8` | 同上 | 同上，另把肩枢轴 0.56 → **0.60** |

## 验证证据

浏览器（ego，1256×774，`http://127.0.0.1:8123/scenes/huoyan/index.html`）：

```
ready true / cards 133 / pieces 127 / buildMs 337 / clips []
walkPath([[0,3],[6,1],[-6,-10]]) → {"reached":3,"of":3,"stuck":null,"blockedBy":null,"y":0,"on":"page"}
点击地面（62% × 72% 处）：(0,3) → (3.12,3.27) → (4.54,3.39) → 停住（连步 5×0.5 s）
资源 host：["127.0.0.1:8123"]（无 CDN）
```

走动三帧 Pillow 量化（`Z:/build-tmp/r32-walk-{a,b,c}.png`，取中间 520×520 区域）：

| 帧 | 墨色像素占比 |
| --- | --- |
| a | 0.719 % |
| b | 0.702 % |
| c | 0.674 % |

帧间差异：a↔b **15679 px（5.80 %）**、a↔c **15422 px（5.70 %）**，平均差 5.6 / 5.9 —— 证明四肢确实在动（若步态没生效，两帧只会差在主角位移的那一小片）。

## 盲评 A/B 的诚实说明

`read_image` 本轮仍只回元数据、像素没进上下文，所以**没有肉眼判读**：纸偶的比例、脸、金箍、虎皮裙好不好看，走路是否「像纸在动」，我都没看到。上面只用可量化的东西交账（`clips()`、`walkPath()`、坐标轨迹、帧间像素差、墨色占比）。按规矩不写「已肉眼确认」。**未做**与上一轮的并排 A/B（上一轮没有主角，构图对象不同，盲评无意义）。

## 回滚

1. 删 `scenes/huoyan/wukong.js`；
2. `scene.js` 把 `buildWukong` 那 4 行换回 `standee()` 占位立牌块（见 `docs/ITERATIONS/029` 的文内引用）；
3. `play: true` → `play: false`（重新禁用走动）；
4. 删点击寻路那一段（`Raycaster` / `onStep` / `walkTo`）。

## 遗留

1. **火墙与主角的遮挡关系未验**：走动时主角会不会被近层纸焰挡住（`sight()` 报 `plain 0 / blockers 0`，说明目前没有任何遮挡物登记为 blocker，但火墙本身就是一层纸，视觉上可能压住人）。若下一轮看见人「陷进火里」，改法是把近层焰的 z 再往后，或给 `walk.solid` 登记一道墙。
2. **主角高度 3.6 与场景比例**：`?test` 取景（dist 38）下主角占画面高度比例偏大，正式取景（dist 66）合适；没有调过。
3. **寻路只有单点**：点远处只朝该点直线走，遇 `walk.solid` 会停（`walkPath` 的 route 才有绕行）；要绕长得用 `walkPath`。
4. **走动时相机跟随**：harness 的 `follow(true)` 会平移镜头，但 `look()` 之后镜头是锁在注视点的，两者叠加的行为未验。
