# 《西游记》纸模场景 · 实现文档（v1 · 待确认）

> 状态：**设计稿，尚未执行任何安装或搭场景动作。** 用户确认本文后才开始第 0 步安装与第一个场景（火焰山）的搭建。
> 依据：`xikhar/papercraft` v0.6.0（MIT，pop-up papercraft 立体书风格编码 agent skill）+ 本工作区现状（纯静态站点，无构建/无依赖/无 CDN）。
> 用户已确认（m00141）：① 用 3D；② 先做到主角走动，然后主要人物互动各有一段对话；③ 场景按候选名单，先做火焰山；④ 安装进来。

---

## 0. 一句话目标

在现有「西游时序 · 取经路线交互舆图」里，给重点站点加一个**可操作的立体书纸模场景**：主角在纸做的地面上走动，走近/点击主要人物弹出一段对话。第一个场景做**火焰山**（三调芭蕉扇），验证这条技术路线跑得通，再复制到其它场景。

---

## 1. 范围（做什么 / 不做什么）

### 做
- 把 papercraft skill 与运行时依赖**装进本项目并本地化**（主站「无 CDN」的承诺不破）。
- 新增独立的 `scenes/`  subtree；**主站 `index.html` / `assets/` / `assets/vendor/` 一个字节不改**，只在火焰山详情卡加一个入口按钮。
- 火焰山 3D 纸模场景：纸地面、八百里火墙、芭蕉洞、孙悟空（主角，可走动）、罗刹女 / 牛魔王 / 猪八戒（各一段对话）、芭蕉扇道具。
- 主角走动（键盘 WASD/方向键 + 点击地面寻路），人物对话（走近或点击触发，纸片式对话框）。
- 用 skill 自带的确定性渲染 + 测量脚本做验收。

### 不做（本期边界）
- 不做完整「三调芭蕉扇」剧情关卡（拿扇→灭火→过山的状态机），列为**第二阶段增强**。
- 不做自由转视角/第三人称漫游相机（L3），相机沿用 papercraft 的跟随式微距移轴。
- 不做配音、音效合成（sound 留接口，pilot 可静音）。
- 不做其它四个场景（大闹天宫 / 三打白骨精 / 通天河落水 / 花果山水帘洞）——火焰山跑通后按同一套模板复制。
- 不做真折纸 / 可打印纸样（papercraft 是屏幕上的纸模美术风格，不是纸艺工程图）。

---

## 2. 依赖与安装（第 0 步，确认后执行）

分两层：**skill 本体**（给编码 agent 的指令集）与**运行时**（浏览器实际加载的 JS）。

### 2.1 skill 本体
- 命令：`npx skills add xikhar/papercraft`（agentskills.io 标准，装入 agent skills 目录）。
- 若 DSH 的 skill 目录与该命令的默认位置不同，退路：从 `https://github.com/xikhar/papercraft` 取 `skills/papercraft/` 整目录拷入本地 skills 目录。
- 装好后，后续搭场景严格按它的 `SKILL.md` 12 条材料定律 + `references/process.md` 工作流执行（测试卡 → 场景 → 走动 → 截图测量 → 诚实报告）。

### 2.2 运行时本地化（关键：保持主站零依赖）
从 `xikhar/papercraft` 仓库 `skills/papercraft/` 取这些文件，落到 `scenes/`：

| 来源 | 落地 | 用途 |
| --- | --- | --- |
| `assets/templates/popup-3d/harness.js` | `scenes/vendor/papercraft/harness.js` | 固定框架，**不改一个字节** |
| `assets/lib/paperkit-3d.js` / `paperkit-2d.js` / `paper-motion.js` / `paper-life.js` / `paper-sound.js` | `scenes/vendor/papercraft/lib/` | 纸材、卡片、铰链、WalkField、生活、声音的管道代码 |
| `assets/lights.json` | `scenes/vendor/papercraft/lights.json` | 光环境预设 |
| `assets/templates/popup-3d/index.html` | 改写成 `scenes/huoyan/index.html` | importmap / canvas / 对话框容器 |
| `three@0.187.0` 的 `build/three.module.js`（jsDelivr 取一次） | `scenes/vendor/three.module.js` | 把 CDN 依赖本地化 |
| `scripts/capture.py` / `measure.py` / `ab_sheet.py` | `scripts/papercraft/` | 截图、量指标、A/B 盲测 |

`scenes/huoyan/index.html` 的 importmap 由模板的 CDN 地址改为本地：

```html
<script type="importmap">
{ "imports": {
    "three": "../vendor/three.module.js",
    "papercraft/": "../vendor/papercraft/"
} }
</script>
<script type="module" src="./scene.js"></script>
```

> 这样主站继续「双击 index.html 即可打开」，纸模场景是独立子页面，只有进场景时才加载 three.js。

---

## 3. 目录规划

```
西游记时序图/
├─ index.html / assets/ / assets/vendor/     ← 主站，全程不动
├─ scenes/                                   ← 新增
│  ├─ vendor/three.module.js
│  ├─ vendor/papercraft/{harness.js, lights.json, lib/}
│  ├─ shared/paper-ui.css                    ← 纸片对话框/按钮（沿用主站宣纸色）
│  ├─ shared/dialog.js                       ← 对话控制器：触发/逐字/翻页/关闭
│  ├─ huoyan/
│  │  ├─ index.html                          ← 页面骨架 + importmap
│  │  ├─ scene.js                            ← 唯一要写的场景代码（papercraft 契约）
│  │  ├─ script.js                           ← 对话文案 + 触发区数据
│  │  └─ README.md                           ← 场景说明与复现步骤
│  └─ _template/                             ← 火焰山跑通后提炼的模板（后续场景复制）
├─ scripts/papercraft/{capture.py, measure.py, ab_sheet.py}
└─ docs/PAPERCRAFT-IMPLEMENTATION.md          ← 本文
```

---

## 4. 技术架构（papercraft 契约）

### 4.1 固定与可写的边界
- **`harness.js` 固定**：渲染器、纸材质（MeshLambert + onBeforeCompile）、4096 软阴影、PaperPost 移轴景深、时钟、`window.__papercraft` 钩子、行走相机都在里面。**不改**。
- **`scene.js` 是唯一写的场景代码**，调用契约：

```js
const H = createHarness({
  bounds, ground, stock, view, testView, heroHeight, light, lens,
  walk, play, mood, moods, focus, walkArea, camBox, size, aspect, subject, rotate
});
H.printGround(t => { /* 印地面： washes / band / line / drifts / water */ });
H.popup(outline, print, { x, z, yaw, cross, node, parent, solid, holes, res, ... });
H.stack(...) / H.dome(...) / H.lamp(...) / H.glowing(group) / H.inReach(...);
H.setHero(hero, { stride, turn });
H.onStep((t, dt) => { ... });
H.onRestart(() => { ... });
H.start();
```

### 4.2 关键数字（写 scene 时对齐 papercraft 定律）
| 项 | 值 |
| --- | --- |
| 主角高度 H | 3.6 units |
| 纸片厚度 T | H 的 1.5–3%（≈0.054–0.108 units，取 0.072） |
| 镜头 FOV / 俯角 | 24–32° / 40–55°（火焰山取 28° / 46°） |
| 清晰带 | 帧高 36–45%（focusBand 0.3 / ramp 0.3；focusHeight 0.55–0.75） |
| 打印精度 | 40–48 px/unit（远处用 `res:0.6–0.75` 或 `effects:0` 降本） |
| 阴影 | map 4096 / softness 0.26 / maxPenumbra 1.4，阴影色用赭橙 `#a0602c`，禁灰黑 |
| 每帧片数 | 100–250 片，15–25 种；主角 10–20 片卡纸模型 |
| 弹起 | 8–15% 过冲，~1s 静止，片间错峰 0.05–0.1s |
| 构建耗时 | 目标 < 5s（超时 `__papercraft.printStats()` 会点名慢的那一行） |

### 4.3 结构类型（火焰山用哪些）
- **交叉卡 `H.popup(pts, paint, { cross:true })`**：火墙上的枯树、旗杆、洞府外的道具——两片 90° 插接，主面偏镜头约 24°，任意角度都不变成薄片。
- **V-fold `{ cross:'quarter', angle:120–130 }`**：远处火焰山脊/火墙的每一簇火苗（开口朝镜头）。
- **层叠纸片 `H.stack` / `layeredCard`**：远景火墙层次、焦黑山影。
- **boxFold**：芭蕉洞（可加 `holes` 门洞）。
- **T 型角色**：孙悟空 = 正面卡 + 侧影卡在后（侧影不穿过脸），四肢在肩/髋枢轴上摆动；罗刹女 / 牛魔王 / 猪八戒同法但片数可少。用 `__papercraft.clips()` 查互穿。
- **纸片对话框**：遵循 `paper-ui.md`——屏幕是一张纸（卡纸纤维 + 细墨框），ink `#2a241c`、page `#f3e7cd`、accent 朱砂 `#b03a2e`，衬线字，不上 HUD/发光描边。

---

## 5. 火焰山 paper spec（15 行，写 scene.js 前定稿）

```
BRIEF      火焰山 · 三调芭蕉扇。八百里火焰，四周寸草不生，师徒受阻于西行路口。
SUBJECT    主角孙悟空（10–20 片纸模）；罗刹女、牛魔王、猪八戒（纸人）；芭蕉扇；八百里火墙；芭蕉洞。
STOCK      暖赭卡纸，死哑光；厚度 T = H×2%（0.072 units）。
PALETTE    从主站宣纸色推导：page #f3e7cd / paper-deep #ead8b6 / ink #2a241c /
           cinnabar #b03a2e（火）/ cinnabar-deep #8c2b22 / gold #b8934a（金箍）/ azurite #3f6b4a（芭蕉叶）；
           阴影暖赭 #a0602c，禁灰黑、禁纯白。
LIGHT      一盏暖主光 #ffdcb2（强度 3.0，偏侧前上方），软阴影被地面染成赭橙；4096 map / softness 0.26。
LENS       28° FOV，俯角 46°，地面铺满四边；focusBand 0.3 / ramp 0.3；清晰带 36–45%。
FORMAT     16:9（iframe 模态大窗）；scene 留 ?size / ?aspect 参数入口，便于复用到竖屏。
GROUND     焦赭戈壁，无水；印龟裂纹、焦痕、风卷灰线；远处火墙用 V-fold + 层叠纸片立起来。
LAYOUT     主角从近景起步，向右上走向火墙与洞府；火墙横贯远景，芭蕉洞偏右，三人沿路分布。
MOTION     主角走动四肢绕肩/髋摆动；火苗轻晃；弹起 8–15% 过冲、~1s 静止、错峰 0.05–0.1s。
LIFE       3–5 种纸活物：跳动的火苗、飘灰、乌鸦、沙蜥、风卷纸屑（paper-life）。
TYPES      cross（枯树/旗杆）、V-fold（火苗）、layered flats（远山火墙）、boxFold（芭蕉洞）、T 型角色、单卡小物（扇/石）。
SOUND      轻低闷稀疏：纸脚步、火焰低频、扇风一记、纸张翻动（对话出现）；pilot 阶段可静音。
BANNED     灰黑阴影、纯白高光、发光描边、HUD 面板、MeshStandardMaterial 塑料感、薄刀片状单卡。
QA         __papercraft.clips() 空；cards() 100–250；focusHeight 0.55–0.75；buildMs < 5s；?diag=key 阴影朝向正确。
```

---

## 6. 场景拆解与交互

### 6.1 主角走动（先做）
- `H.setHero(hero, { stride })`：WASD / 方向键走，`stride(walked, gait)` 里按行走距离摆动手臂、双腿（相反的相位），身体朝行进方向平滑转向，起步/停步有前倾弹簧。
- 相机：沿用 harness 的跟随式——静止区不抖、走起来轻跟、前方留白；`view.follow: [-9.3, -9]` 让主角在画面偏右下，路线向右上铺。
- **点击地面寻路**：`__papercraft.steer(x, z)` / `place(x, z)`，点击地面把主角走到该点（纸片地面印一枚手墨虚线圈作为落点提示，`paper-ui.md` 的 diegetic 做法，不做 3D 光标）。
- `walkArea` / `camBox` 圈住主角活动范围，防止走出已布置区域看到裸纸边；`walk.add` 登记可走面，`walk.solid` 登记火墙/人物/洞府的占地，主角不会穿过它们。

### 6.2 主要人物对话（后做）
- 三名主要人物：**罗刹女（铁扇公主）、牛魔王、猪八戒**（悟空是主角本人，不设自己的对话）。
- 触发方式（pilot 采用 **点击触发**，避免与走动冲突）：人物头顶一枚小纸标（diegetic 提示），点击该人物或按 `E` → 对话纸片从下方滑入（0.7s cubic in-out，起始 -4°，leading edge 投影），逐字显示文案。
- 对话纸片（DOM 覆盖层，遵循 paper-ui.md）：
  - 卡纸纤维背景 + 内外双细墨框 + 12 等分刻度（仿舆图 Plate）；
  - 衬线字，ink `#2a241c` on page `#f3e7cd`，小字 9px 起；
  - 人物名用朱砂小标；点击/空格/回车翻下一句，Esc 收起；收起时反向滑出。
- 文案（**示例，待用户确认或改写**）：
  - 悟空 ↔ 罗刹女：「嫂嫂，借我芭蕉扇一用，扇熄了火，师父好过山。」/「泼猴！红孩儿之仇未报，还敢来借扇？」（一调被扇飞五万里）
  - 悟空 ↔ 牛魔王：「老牛，扇子借与不借？」/「我那扇子，岂是你能拿的！」（三调大战）
  - 猪八戒 ↔ 牛魔王：「呆子！你且看俺老猪这一耙！」/「好你个猪悟能，也敢来搅局！」（八戒助力）
  - 结尾一句（可选）：罗刹女献扇，悟空扇熄八百里火，师徒继续西行。
- 对话出现时暂停走动输入（harness 输入被对话框截断），关闭后恢复；不因对话推进场景状态（灭火交互留第二阶段）。

### 6.3 道具与火墙（视觉重点）
- 火墙：多簇 V-fold 火苗 + 层叠赭红/朱砂纸片，火苗用 `H.onStep` 按固定时钟轻晃（自发光 `P.glow` 走 `H.glowing`，白天 0.35 强度）。
- 芭蕉扇：一片带叶脉印刷的纸卡，放在罗刹女手边；点击有一记「扇风」纸响（第二阶段作交互道具）。
- 芭蕉洞：`boxFold` 带 `holes` 门洞，门内暖光小纸灯 `H.lamp`。

---

## 7. 与主站集成

- **入口**：仅改火焰山站点的详情卡，在卡片里加一枚按钮「进入纸模场景」（沿用主站 `.tbtn` 样式 + 纸片按下手感）。
- **打开方式**：模态 iframe 大窗（如 96vw × 90vh），`src = "scenes/huoyan/index.html"`；iframe 内 Esc 或关闭按钮 → 关闭模态并恢复主站滚动/键盘。
- **深链**：主站 hash 增加 `&scene=huoyan`，冷启动带此参数直接打开模态（沿用现有深链解析位置，不新增框架）。
- **零污染**：iframe 是独立 document，three.js / papercraft 的全局符号不会进主站；主站在没有点入口前完全不加载 `scenes/` 下任何资源。
- **降级**：若浏览器不支持 WebGL 或 three 加载失败，iframe 内显示一段说明文字（「纸模场景需要 WebGL」），主站照常可用。

---

## 8. 验收清单

用 skill 自带脚本 + 浏览器人工确认，逐条留证据：

| # | 检查 | 判据 | 手段 |
| --- | --- | --- | --- |
| 1 | 人物不互穿 | `__papercraft.clips()` 返回空 | 浏览器控制台 / capture.py |
| 2 | 片数密度 | `__papercraft.cards()` 在 100–250 | capture.py |
| 3 | 移轴清晰带 | `focusHeight` 0.55–0.75 | `measure.py` |
| 4 | 构建耗时 | `buildMs < 5s`；超时 `printStats()` 定位 | `capture.py` |
| 5 | 阴影方向 | `?diag=key` 下阴影偏侧后、暖赭非灰黑 | 截图人工看 |
| 6 | 可走性 | `walkPath()` 从起点到火墙/洞府 `reached`、`blockedBy` 为空；`walkMap()` 无意外障碍 | `__papercraft` 钩子 |
| 7 | 走动视觉 | `restart(); step(T)` 截 3–5 帧，脚在地面、不穿人物/火墙 | `capture.py` |
| 8 | 对话 | 点三个角色各弹一段、逐字/翻页/Esc 正常、关后恢复走动 | 浏览器人工 |
| 9 | 主站无回归 | 1440 / 1200 / 390 三档：48 图钉、`tabindex=0` 1 个、`aria-current` 1 个、海纹 64、控制台 `errs []` | 现有检查法 |
| 10 | 零依赖 | 主站仍可 `file://` 双击打开；网络面板无 CDN 请求（进场景前） | 浏览器网络面板 |

截图落 `Z:\build-tmp\`（与项目现有迭代截图同处），结果写进 `docs/ITERATIONS/` 新一轮（U 编号按序），更新 `docs/STATE.md` / `docs/BACKLOG.md`。

> 关于 `measure.py` 的印花门限（第 36 轮实测补注，不改上表原文）：`printDetail` 的定义是
> 「清晰带里梯度 > 0.10 的像素占比」（`scripts/papercraft/measure.py:608-618`），量的其实是**边缘密度**，
> 不是印花浓度。荒漠这类「一大片空地面 + 一道火墙」的构图，靠给地面印纹顶不到 0.06；要达标，
> 正路是在清晰带里立更多不同的纸件（成组体块、组间留空），见 `docs/ITERATIONS/036-p5-8-ground-print.md`。

---

## 9. 迭代排期（每项可独立验收，约 20–40 分钟/项）

| 轮次 | 任务 | 产出 |
| --- | --- | --- |
| ~~P0-1~~ ✅ 2026-11-27（第 29 轮，U-029-01/02/03） | 安装 skill + 本地化运行时 + `scenes/` 骨架 + 本地 importmap 跑通空场景 | `scenes/` 可打开，空白纸地面，`window.__papercraft.ready === true`（实测 ready / cards 1 / buildMs 168 / 无 CDN，见 `docs/ITERATIONS/029-p5-1-paper-skeleton.md`） |
| ~~P0-2~~ ✅ 2026-11-27（第 30 轮，U-030-01） | 火焰山 paper spec 定稿 + **测试卡**（`?test` 分支：主角 + 2–4 张测试纸片） | 测试卡截图，材料定律（厚度/裁切边/哑光/光向）肉眼确认 |
| ~~P0-3~~ ✅ 2026-11-27（第 31 轮，U-031-01） | 地面焦痕 + 三层层叠纸焰火墙（120 片）+ 芭蕉洞（`holes` 门洞/纸灯/芭蕉叶）；V-fold 未采用，改用「同轮廓 × 三层 × 抖动」 | 静态全景截图 `Z:/build-tmp/r31-p5-3-wall-2.png`，`cards() = 123`（区间 100–250）、`clips()` 空、`buildMs 281`；肉眼判读待视觉通道恢复 |
| ~~P0-4~~ ✅ 2026-11-27（第 32 轮，U-032-01） | 主角纸模 + 走动（stride + 走向 + 寻路 + walkArea） | `walkPath()` 通，走动 3–5 帧截图，`clips()` 空 | 已做：11 张卡 T 型悟空 + stride；`walkPath` reached 3/3、`clips()` 空、点击地面 (62%,72%) 走到 (4.54,3.39) 停住；截图 `Z:/build-tmp/r32-walk-{a,b,c}.png` |
| ~~P0-5~~ ✅ 2026-11-27（第 33 轮，U-033-01） | 三名人物纸人 + 对话纸片 + 文案 | 点三人各弹对话，第 8 项验收通过 | 已做：三人各 6 张卡（`scenes/huoyan/people.js`）+ 纸片对话框（`scenes/shared/{paper-ui.css,dialog.js}`，逐字/翻页/Esc/末句收起）；点 `(816,383)` 命中八戒、`E` 命中最近人、对话中走动被 `frozen` 截断、关后恢复；`cards 151 / clips []`；台词均标「示例台词，待用户确认」并注回目；截图 `Z:/build-tmp/r33-dialog-*.png` |
| ~~P0-6~~ ✅ 2026-11-27（第 34 轮，U-034-01） | 主站集成（入口按钮 + iframe 模态 + 深链） | 第 9、10 项验收通过 | 已做：火焰山详情卡 `.d-scene-btn` + `.scene-modal`（96vw×90vh，620px 全屏）+ `#s=29&scene=huoyan` 深链 + Esc 两层 + 关掉写 `about:blank`；三档 `pins 48 / tab0 1 / ariaCur 1 / seaPaths 64`；点火前 `threeReqs []`；`ready true / cards 156 / clips []`；截图 `.tmp/r34-scene-modal-1256.png` |
| ~~P0-7~~ ✅ 2026-11-27（第 35 轮，U-035-01） | measure/capture 全量验收 + 写迭代文档 | 验收表 9 PASS / 1 FAIL（第 10 条 `file://`），`docs/` 已归档 | 已做：`docs/ITERATIONS/035-p5-7-acceptance.md` 十条逐条结论 + 三张图 `measure.py` 表；提炼 `scenes/_template/`（`ready true / cards 7 / clips [] / walkPath 3/3`）；`capture.py` 因本机无 Playwright 未跑，截图走浏览器手工截、`ab_sheet.py` 未跑。FAIL 条目转 BACKLOG P4-24（内联 topojson）。 |

估时：P0-1~P0-4 是一个可演示的里程碑（主角在火焰山走动），P0-5~P0-7 补对话与集成。**全部约 3–4 小时**，可视情况分批确认。

---

## 10. 风险与边界

1. **three.js r187 与本地 importmap**：模板 import 用相对路径 `papercraft/lib/...`，本地化时要保证 `papercraft/` 指向含 `lib/` 的目录，否则模块解析失败。P0-1 第一件事就是验证。
2. **构建耗时**：纸片打印是逐片 canvas 绘制，片数一多容易 >5s；用 `H.printed(pts, paint)` 一次印刷多卡复用、`res:0.6–0.75`、`effects:0` 三招控制。
3. **主角互穿**：卡纸 T 型人物最容易在走动时四肢穿身体，`clips()` 必须空；按 `mechanisms.md` §12 的层级法摆卡（侧影全在正面之后、四肢枢轴在身体轮廓外、两腿不重叠）。
4. **阴影色**：火焰山是暖赭世界，阴影必须是赭橙 `#a0602c`，不能是灰/黑；`?diag=key` 检查。
5. **对话与走动抢输入**：对话框打开时必须截断键盘走动，否则边走边弹字；`paper-ui.md` 的 sheet 规则「Input while open: capture it」。
6. **iframe 高度与键盘**：模态打开时主站全局键（← → / 空格 / /）不能被触发；iframe 取得焦点后由 iframe 内处理键盘。
7. **环境**：本工作区 `ops_bash` 在 workspace-write 下会 ACL 拒绝，需按次 `danger-full-access`；本项目不是 git 仓库，回滚靠 U-ID + 文件级说明（与 `docs/STATE.md` 一致）。

---

## 11. 请确认

1. **本文整体方案**（本地化 three.js + scenes/ 独立子树 + 只改火焰山详情卡入口）是否 OK？
2. **主角取孙悟空**（而非唐僧师徒同框）是否 OK？
3. **三段示例对话文案**是否要用你自己的文字替换（现在是示例）？
4. **对话触发方式**取「点击人物 / 按 E」还是「走近自动弹出」？pilot 建议前者。
5. **分期**：是否按 P0-1~P0-4 先出一个「主角在火焰山走动」的里程碑，给你看过再补对话与集成？

确认后我从第 0 步开始安装并搭第一个场景。

---

## 12. 参考 mpt 的取舍（2026-11-27 追加）

用户提供了一份「Pop-up Atlas」制作型 prompt（Three.js + Blender/glTF + Codex imagegen + Vite + Web Audio + 波函数坍缩 + 盲评 A/B）。分析结论：**与 papercraft 的美学目标几乎逐条重合，但执行路线冲突**。仅采纳下列三项，其余明确不采纳；技术栈维持 papercraft，不变。

### 12.1 采纳：盲评 + 撤销回归的纪律
- 「独立严格盲评、A/B 随机顺序、撤销任何让结果变差的修改、日志只追加」与本项目 U-ID 前进式回退、永不删历史同构。
- 落地为 P5 每轮固定动作：`capture.py` 截图 → 与上一轮并排（随机排列 A/B）→ 盲评记录 → 退步则记 `U-NNN-XX（回退 U-…）`。papercraft 已有 `ab_sheet.py`，不另造工具。
- 盲评关注四项：翻折弹簧感（8–15% 过冲 / ~1s 静止）、行走手感、纸声（pilot 静音）、性能（先满足 `buildMs < 5s`，60fps 为远期目标）。

### 12.2 采纳：组件清单 + 逐组件可测目标
- 在 P5-1~P5-7 每个子任务开头列 3–5 个可测指标（片数 / buildMs / clips / walkPath / 截图路径），与第 8 节验收表对齐，不写「做一个火墙」这种无判据的任务。
- 验收不通过就记入 ITERATIONS 遗留问题，不把「看起来差不多」当通过。

### 12.3 采纳（仅作远期构想）：地块随时序翻起 / 折平
- mpt 里最有长期价值的一条：前方地块从摊开的书页翻起、身后折回平面，与本项目「时间轴 0→100%」天然同构。
- **不在当前 P5 范围**——火焰山是固定场景。已挂进 `docs/BACKLOG.md` 的 P6，火焰山跑通后再开。

### 12.4 明确不采纳
- **Blender/glTF 资产管线**：破坏 `paperMaterial`（MeshLambert 补丁）、确定性时钟（`restart()/step()`）与 `clips()` 互穿检查，等于推倒已选骨架。
- **Codex imagegen 概念图**：本项目并非「没有参考」——papercraft `assets/gallery/` 的五个世界是质量标杆，`assets/css/style.css` 的宣纸设色是现成视觉基准；且禁止引入未授权外部资源。
- **Vite 构建**：破「双击 index.html 即开、零依赖」的承诺。
- **波函数坍缩选地块**：固定场景用不上，纯增复杂度。
- **每组件一个子智能体并行**：与「每轮只做一件小事」冲突，且多 agent 同写文件有覆盖风险。
- **暖主光 + 冷补光**：papercraft 是「一盏暖主光 + 被世界染色的软阴影」，冷补光可能违反材料定律；若试只做极弱环境补光，并用 `?diag=key` 截图校验。
