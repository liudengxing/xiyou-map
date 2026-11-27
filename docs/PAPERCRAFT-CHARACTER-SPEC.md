# 纸模人物造型：要求与限制

> 适用：`scenes/huoyan/`（火焰山）及后续复制场景里的人物纸偶。
> 依据：`docs/papercraft-skill/references/mechanisms.md` §12「Characters from cards」原文 + 本项目实测参数（第 32 / 42 轮）。
> 一句话：**人物是 10–20 张纸卡的铰链模型，不是一张立牌。**

## 一、硬约束（逐条可机检）

| # | 约束 | 判据 | 出处 |
| --- | --- | --- | --- |
| 1 | 卡数 10–20 张 | `cards()` 只数取景框内立卡，别拿它当总片数；人物专用卡按 `mesh.name` 前缀数 | §12 首段 |
| 2 | 每个部件是「T」：一张正面卡 + 一张紧贴其后的侧卡 | 侧卡中平面在正卡背面之后 1 个卡厚 + 一点空气，**绝不穿透** | §12 `Every part is a T of two cards` |
| 3 | 侧卡顶端低于正卡顶端 | 否则高机位会从脸上方露出一个「耳朵」尖 | 同上 |
| 4 | 重叠的部件各自占一层，中平面相距 ≥ 2 个卡厚 | 本项目 `clips()` 判据：x/y 有重叠 **且** z 差 < 0.08 即 `overlap` | §12 `Layers` |
| 5 | 会摆动的肢体，其枢轴必须落在躯干正视图轮廓**之外** | 从正面看，手臂/腿的卡与躯干卡不重叠 | §12 `Limbs beside the body` |
| 6 | 两条腿互不重叠 | 它们摆动时会剪叉（scissor），重叠就是每走一步穿一次 | 同上 |
| 7 | 同一中平面上的侧卡互不重叠 | 两条路：把卡裁形（`makeCard({ geomPts })`，印纹照留），或错开约 1.2 个卡厚 | §12 `One plane, no overlap` |
| 8 | 背上的东西（包、葫芦）要站在躯干侧卡之后 | 否则从正面会穿出来 | §12 `Things on the back` |
| 9 | 手持物垂在手边或下方，**不横穿手臂** | 金箍棒这类长条最容易犯 | §12 `carried things` |
| 10 | 每张卡 z 唯一；`mesh.name` 必须起 | `clips()` 报告靠名字读，匿名卡报出来没法定位 | §12 `Name your cards` |
| 11 | 模型面朝 +z，由 harness 负责转向 | 不要自己 `rotation.y` 去「面向镜头」 | §12 `faces +z and yaws` |
| 12 | 卡是手剪的厚板：厚度 = 身高 1.5–3% | 本项目 H=3.6，harness 固定 T=0.08 → 2.2%，合规 | §12 前段 |
| 13 | 不要薄片、不要尖刺；剪影要「块」 | 从各个允许的视角都得读得出来 | §12 `A few big mechanisms…` |

**互穿是纸模的头号事故**：两张卡在运动中穿过对方，渲染出来是一条会滑动的切线；共面重叠则会 z-fighting 闪烁——真纸两样都做不到。所以 `clips()` 必须为空，**站立 + 两个步态循环**都要查（harness 自己也会在启动时检查）。

## 二、尺寸与比例（本项目已落地的数值）

| 项 | 数值 | 说明 |
| --- | --- | --- |
| 身高 `HERO_H` | 3.6 | 场景里最大的纸件是火墙，人物约占其 0.4–0.5 |
| 卡厚 T | 0.08（harness `cardOpts`） | spec 写 0.072，差 11%，已接受 |
| 躯干 | y 1.06–2.44，半宽 0.36→0.44 | 下窄上宽，肩部留出披膊位 |
| 头 | y 2.44–3.30，半宽 0.34 | 头身比约 1:3.3，卡通比例（spec：头约 1.3 倍自然大小） |
| 肩枢轴 | `(±0.62, 2.38, −0.20)` | 在躯干轮廓（半宽 0.44）之外 0.18 |
| 髋枢轴 | `(±0.21, 1.04, −0.16)` | 腿卡 y −1.04…−0.02，脚落 y=0 |
| 摆幅 `MAX_A` | 0.42 rad（约 24°） | 越大越容易撞躯干，0.5 是上限里的上限 |

## 三、步态

- 相位 `phase = walked / STEP * π`，`STEP = H * 0.58 / 2`（一步 0.58H）。
- 支撑相线性 `A*(3-2u)`，摆动相 smoothstep `A*(2e-1)`；
  `A = min(0.5, gait*STEP*2/(2*LEG))`。
- 双臂与同侧腿**反相**（±0.32 rad）；身上带东西的那只手臂摆幅 ×0.2–0.4，东西挂在手上。
- 抬升 hop 约 3.2–3.3% H。
- 本项目实测（第 42 轮，按住 W 读枢轴）：`hip-l −0.045 / hip-r 0.067 / shoulder-l −0.054 / shoulder-r 0.054 / body 0.015`。

## 四、表面与用色

- **每张卡都必须印**（`printCard` 那套分层印纹），不能是平涂；背面也要印（头发、衣背）。
- 颜色要与地面、布景拉开**色相与明度**差；人物站在最清晰的那几排，允许被前景纸件压一点。
- 脸要比「白天画的时候再亮一档」——纸和阴影会再吃掉一层；五官用深色、底色用浅色，在游戏视距下要能读。
- **本项目实测的成像损耗**：正面填 `#b93d20`，纹理采样读到 `#753319`（约 0.62 倍亮度）。所以我给战袍正面用更亮的 `#cf4423`——**这是经验值，没有实测支撑**（见第六节）。
- 印花母题的线宽 **≥ 2 px**、透明度 **α ≥ 0.18**，否则被 1600 宽的重采样糊掉（`scripts/papercraft/measure.py` 量的）。
- 卡面纹理只有 **28×35 px 量级**（`ppu 22`，卡面 0.88×1.38），1.8 px 的细节线在纹理里就已经是糊的——细线条、小字、密纹样在这个分辨率下没有意义。

## 五、验收清单（改完照抄执行）

1. `node --check scenes/huoyan/wukong.js`；
2. 开 `http://127.0.0.1:8123/scenes/huoyan/index.html?v=<新版本>`（**必须抬版本号**：`index.html` 的 `scene.js?v=` 与 `scene.js` 里 `import './wukong.js?v='` 是两条独立缓存）；
3. `__papercraft.ready === true`、`buildMs < 5000`；
4. `__papercraft.clips()` 返回 `[]`（不空就按名字查：x/y 重叠 + z 差 < 0.08）；
5. 脚底：腿卡的世界最低点 ≈ 0（本项目 v1 是 0.04，v2 修到 0.000）；
6. 步态：用 CDP 按住 W 再读 `wukong-hip-*` / `wukong-shoulder-*` 的 `rotation.x`，两对必须反相；
   **不要**用 `__papercraft.walkPath([...])`——它是瞬移（还会被 `walkArea` 夹住），采样永远读到 0。
7. 截图留档，交给**人**看形体。

## 六、明确做不到的部分（避免下次又踩）

- 图像通道只回元数据（尺寸、字节、sha256），**像素不进上下文**：设定图没法「照着描」，只能用 Pillow 取色（调色板可信），形体反推不出来（满幅手绘没有留白，`ink` 92%、`red` 59%）。
- 上色后的实际成像也判读不了：截图紧容差量不到主色，逐材质读纹理读到的是 28×35 px 的边缘图、与 `P.fill` 的色对不上。
- 所以「像不像设定图」只能由人看图给出**一句具体的话**（「冠太高」「袍子太暗」），再按那句话改一个量。

## 七、原文出处（可核对）

> “**Every part is a T of two cards:** a frontal card and a profile card standing right behind it … Keep each profile card's top below its frontal card's top.”
> “**Layers.** Parts that overlap get their own depth, front to back, mid-planes ~2 card thicknesses apart.”
> “**Limbs beside the body.** A limb that swings about its hip or shoulder must not overlap the body's outline seen from the front … Two legs never overlap each other: they scissor as they swing.”
> “**Check it**: `__papercraft.clips()` poses him standing and through two stride cycles and lists the pairs that cut into each other.”

完整原文见 `docs/papercraft-skill/references/mechanisms.md` §12（另参 §13「Never edge-on」：别让卡正对镜头成一条线）。