# STATE · 项目当前状态

> 每轮迭代前先读本文，迭代后必须更新。字段：轮次 / 交付物 / 已知问题 / 环境。

## 迭代记录
### 第 45 轮（2026-11-27）：孙悟空纸偶 v3（铰链版 18 卡）

- `scenes/huoyan/wukong.js` 重写：18 张卡、肩→肘与髋→膝两级转轴（8 个 Group）、配色改用铰链设计图那族。
- 验收：`cards 158`、`clips []`、`buildMs 443–480ms`、脚底 `y=0.000`、髋反相 0.358/−0.438、膝 0.213/0.535、肘静止 −0.10。
- 版本：`wukong.js?v=9`、`scene.js?v=45`。
- 人物观感（像不像参考图）需人工判读，截图 `.tmp/r45-wukong-v3-scene.png` / `-test2.png`。

### 第 46 轮（2026-11-27）：P5-9 前景纸件（77 片 + 近地印刷）

- 新建 `scenes/huoyan/props.js`：16 组、77 片纸件（岩石/枯草/断旗杆/骨片干柴）+ 10 粒碎纸砾，全部落在清晰带 `z ∈ [-16.4, 14.2]`，同簇 z 间隔 0.09、每片 z 唯一，`res 0.8–1.0`、`order 39–53`，不设 solid（不挡走位）。
- `scene.js` 的 `printGround` 追加近地印刷：240 块露石面（硬边 + 淡填）、340 簇砾石、320 条干裂短划，母题线宽按 `nearPx = (ppu/22) * 1.15` 缩放，保证在 1256 宽截图里不被 measure 的重采样糊掉。
- 指标（基线 → 终值）：`printDetail 0.008 → 0.044`、`flatPct 92.5 → 63.4`（PASS）、`barePct 93.2 → 72.9`、`localContrast 0.026 → 0.059`；**17 PASS / 3 WARN**（余 printDetail、localContrast、barePct 三项，书面结论已写进 046）。
- 失败实验并已回退：在近地再加 90 块「深赭第三色阶斑」→ `printDetail` 反跌到 0.013、`flatPct` 升到 85.7；原因是内部纯色、边缘梯度不到 `>0.10` 门限，对 measure 只是更大片平色。删该段后版本抬回 51 复测。
- 不回退：`cards 217`（目标 180–250）、`clips []`、`buildMs 464ms`、`walkPath 3/3`；版本 `props.js?v=2`、`scene.js?v=51`。
- 仍**无肉眼判读**（`bcdp_screenshot`/`read_image` 只回元数据），未做 A/B 盲评。见 `docs/ITERATIONS/046-foreground-props.md`。

### 第 57 轮（2026-11-27）：`file://` 双击即开（Q10）

- 新增 `scripts/build-geo-inline.mjs` → `assets/vendor/geo-inline.js`（638041 B，`window.__XIYOU_GEO = {land, china}`）；
  `index.html` 在 `topojson-client` 之后引入，`loadGeodata()` 优先用内联、缺失时回退 `fetch`。
- 实测 `file://` 与 `http://` 都是：图钉 48、`.land/.province/.nine-dash` 各 1 条、`.border` 0、json 请求 0；
  `#base=modern` 下省界 `display:inline`。README 改回「双击即开」。

### 第 56 轮（2026-11-27）：手机横屏地图带（Q9）

- `buildProjection()` 加短屏档（`top 74 / bottom 100`），矮屏详情卡改 292×108 竖卡，`.pin-label` 字号变量化（矮屏 9.6px），
  `declutter()` 盒模型改读实测字号，新增 `CAND_EXTRA` 十二位与 `pinR` 分档（矮屏 4.6U）。
- 640×360：地图带 215px、浮层重叠 0、可见标签 **9 → 12**；1440 可见 44、390 可见 13，均无出屏。
- 「可见标签 ≥20」实测不可达（图钉障碍设为 0 时上限 26，真实规则下 12），已登记 `D-07` 待用户拍板。

### 第 55 轮（2026-11-27）：中文排版（Q8）

- 纸片 UI 两处字族把平台楷/宋提到 `"Noto Serif SC"` 之前（新增 `--pd-serif` / `--pd-kai`），对话正文改用楷体、名牌仍用宋体；主站 `--serif` 同步调整，3 处硬写字族改 `var(--serif)`。
- 修 `.paper-dialog` 缺 `box-sizing: border-box`：390 视口原先 408 px、左移 −9 px 出屏，现在 370 px、左右各 10。
- 名牌加 `max-width: min(46vw, 220px)` + `text-overflow: ellipsis`；窄屏 `.pd-head` 允许换行、`.pd-sample` 不再 `nowrap`。
- 实测：1256 `[318,620,938]`、390 `[10,370,380]`、1440 `[410,620,1030]`，正文与头部 `scrollWidth ≤ clientWidth`；主站 48 枚 `.pin`；纸模三次 `ready true`。
- 版本：`paper-ui.css?v=3`、`scene.js?v=64`、`style.css?v=56`。文档 `docs/ITERATIONS/055-chinese-typography.md`。

### 第 54 轮（2026-11-27）：逐回在场名单做到回内粒度（Q7）

- `assets/js/data.js`：`away` 支持 `chapter`（单回）与 `chapters: [a,b]`（连回）；新增「第 56–57 回悟空被逐（真身去落伽山）」「第 43 回八戒与唐僧同被鼍龙摄走」两条；`away` 14 条。
- `assets/js/app.js`：`awayChapters()`、`awayAt()` 改「任一回落在站内」；新增 `charStatus(n,cid)` 返回 `null / {kind:"away"} / {kind:"part", back}`；`partyOf()` 带 `away/part/back`；纸人三档 `fig / fig-away / fig-part`（`.62` 透明度 + 点线）；分期行连回写「第 56 – 57 回」、部分离队补「（第 58 回归队）」。回归回号取「最后一个离队回之后的第一个在队回」（首版取站内第一个在队回，把沙僧误标成第 56 回归队，已修）。
- 实测：`#s=28` 真假美猴王 → 两条分期行（沙僧第 57 回、悟空第 56–57 回，都标「第 58 回归队」）、同行只剩唐僧/白龙马/八戒、纸人 `fig-part`；`#s=22` 黑水河 → 唐僧与八戒两条 `fig-away`（整站）；`#s=40` 灭法国 → 无分期行、五人全实。
- 第 76 回「八戒/沙僧是否同被擒」：回目只能读出「木母（八戒）在这一回有戏」，**依据不足，标存疑不写入**。
- 版本：`data.js?v=55`、`app.js?v=56`、`style.css?v=54`。`check-all` 4 项通过。

### 第 53 轮（2026-11-27）：场景小坑收口（Q6）

- `scenes/huoyan/scene.js`：`const EMBED = /[?&]embed=1(&|$)/.test(location.search)` → 命中即把 `#hint` 设 `hidden`；`window.__huoyan` 生产入口只留 `{ dialogOpen(), closeDialog() }`，`people/openPerson/dialog/isFrozen/props` 移进 `if (H.flags.TEST)`。
- `assets/js/app.js`：新增 `isSceneId(id)`（遍历 `SCENE_STATIONS` 的值）；`readHash` 的 `q.scene` 与 `openScene(id)` 首行都过白名单；Esc 改读 `api.dialogOpen()`（不再直接摸 `api.dialog.isOpen()`）。
- 验收：`?embed=1` 下 `hint.hidden true`、钩子 2 个键、`cards 198 / clips 0`；`?test` 下提示条可见、钩子 7 个键、`openPerson` 开后 `dialogOpen() true`、`closeDialog()` 后 `false`；主站 `#scene=nosuch` 不建 iframe（hash 回落 `#s=5`）；`#scene=huoyan` 开在 `scenes/huoyan/index.html?embed=1`、子页 `ready true`，派发 `Escape` 后场景收起、`body.scene-open` 撤掉。
- 版本：`scene.js?v=63`、`app.js?v=54`。`check-all` 4 项通过。

### 第 52 轮（2026-11-27）：芭蕉洞箱折 + 切口描边（Q5）

- 洞口由「暗纸 + 挖洞立面 + 顶边」三层平卡，改成**往洞里退的四层收口**：`arch × 0.66` 实心暗纸（z −19.9）→ `× 0.84` 挖 `× 0.66`（z −19.45）→ `× 0.98` 挖 `× 0.84`（z −19.05）→ 立面 `caveFace` 挖 `arch`（z −18.6）。
- 切口内缘描边同样是「挖」出来的：`arch × 1.09` 挖掉 `arch`，剩下的 0.12 宽深墨环贴在 z −18.63（不是 `stroke` 一条线，宽度按形状单位不外扩）。
- 验收：`cards 199 → 198`（洞里三层被立面挡住）、`clips []`、`buildMs 629 → 608`、`printDetail 0.047 → 0.043`（**原因未判定**：可能是挡地面，也可能是纸纹噪声）、`flatPct 60.7 → 63.8`、`barePct 72.3 → 74.0`、`measure.py` 仍 3 WARN。版本 `scene.js?v=62`。

### 第 51 轮（2026-11-27）：火墙降密 + 焦痕按距取概率（Q4）

- 近层火墙 44 → **26** 片（`flameRows` 第三行）：原间距约 1.2 单位比焰纸自身还窄，糊成实心色带；26 片间距约 2.0，露出焰尖与裁切边。远/中两层 36/40 不动。
- 焦痕重写为拒绝采样：`WALL_Z = -22`，60 个候选点撒在 `x ∈ [-50,50] / z ∈ [-44,-6]`，`d = min(1, |z-WALL_Z|/18)`，`rnd() < d²` 丢弃；`near = 1-d` 决定半径（`2.0+4.2·near+rnd·4.0`）与芯色 alpha，于是贴墙焦黑、远处置零。
- 验收：`cards 217 → 199`（目标 180–230）、`clips []`、`buildMs 629`、`printDetail 0.043 → 0.047`、`localContrast 0.058 → 0.060`、`flatPct 63.9 → 60.7`、`barePct 75.2 → 72.3`；三条 `walkPath` 各 `reached 1/1`；`?test` `cards 95`、`props {77, 16}`。
- 观感（26 片是否过疏）**无法肉眼判读**，回退只需把 `n` 改回 36；版本 `scene.js?v=61`。

### 第 50 轮（2026-11-27）：纸件印纹样（Q2）

- 新建 `scenes/huoyan/print.js?v=5`：`printCard(P, C, style)` / `withPrint(paint, C, style)`，五类母题走 paperkit-2d 的 `P.marks()` —— `cloth`（hatch+dot，悟空躯干/战裙）、`hide`（leaf+tick，头面鬓毛）、`metal`（rivet+stripe，金箍/腰带/棒）、`wall`（dab+wave，洞壁/芭蕉叶/纸灯）、`flame`（wave+dab，火墙三层）。
- 接入：`wukong.js` 的 `card()`（按部件名选样式）、`people.js` 三人卡、`scene.js` 火墙与芭蕉洞四处。
- 关键教训：卡面是 234 打印像素/单位、屏幕只有约 41 像素/单位，`size: 0.05U` 与 `width: 2`（打印像素）到屏幕不足 1 px，全被抹平（三轮试验全无效）。改用 `units: true` 给形状单位（0.09–0.11，≈4 屏幕像素）、线宽 6，才读得出。
- 验收：卡面边缘密度 `0.0734 → 0.1870`（`wukong-torso` 正面 115×183）；`?test` 主角裁框 0.1746 → 0.1760（屏幕只涨 0.0014）；全幅 `printDetail 0.043 / localContrast 0.058` 不变（主角占全幅 <2%）；`clips []`、`cards 217`、`buildMs 586`。
- 结论：全幅 `printDetail` 推不动人物小卡，Q2 按「卡面密度 + 局部裁框」判，理由写进 `docs/ITERATIONS/050-print-motifs.md`。
- 版本：`print.js?v=5`、`scene.js?v=60`；`?print=0` 为 A/B 调试开关。

### 第 49 轮（2026-11-27）：卡面纹理分辨率（Q3，提前到 Q2 之前）

- 原状：悟空 `H.cardOpts(x, z)` 默认 `res=1`、`scale=1` → 40 px/单位，0.84 单位的躯干只有 28×35 px；三人 `scale 0.86–0.95` + `res 0.8` 同样约 28 px。Q2 要求「印花线宽 ≥2 px」，在这个画布上画不出来，故先做 Q3。
- `wukong.js` 新增 `const CARD_RES = 3.4;`、`H.cardOpts(x, z, 1, null, CARD_RES)` → 136 px/单位；`people.js` 的 `res: 0.8 → 2.8` → 约 124 px/单位。版本 `wukong.js?v=12`、`people.js?v=4`、`scene.js?v=55`。
- 实测（1256×774）：躯干 28×35 → **115×183 px**、头 99×120、三人 136×251 / 189×263 / 143×250；`buildMs 464 → 649`（< 2000）、`cards 217` 不降、`clips []`。`measure.py` 3 WARN 不变（印花内容尚未加，Q2 才加）。
- 未肉眼判读（截图只回元数据）。见 `docs/ITERATIONS/049-card-print-res.md`。

### 第 48 轮（2026-11-27）：三个 NPC 的九句台词按回目改写（Q1）

- 用户已授权按回目改写（m07937）。`scenes/huoyan/people.js` 十二行台词段整体重写：罗刹女（第59回记恨借扇 / 第59回扇子功效 / 第60回假扇越扇越旺）、牛魔王（第60回碧波潭赴宴 / 第60回被骗扇 / 第61回被哪吒穿鼻擒住）、八戒（第59回路阻火焰山 / 第61回助力败魔王 / 第61回扇熄过山），**每句句末标回目号**；每人新增 `badge`。
- `scenes/shared/dialog.js`：右上徽标改为 `entry.badge || "示例，待用户确认"`（缺省行为不变，其他场景与模板不受影响）。
- 版本：`scene.js` 的 import 抬 `people.js?v=2` 与 `../shared/dialog.js?v=2`；`scenes/huoyan/index.html` 抬 `scene.js?v=52`。
- 实测：`ready true / cards 217 / clips 0 / buildMs 594ms`；三人徽标分别为「据第59–60回改写，非原文」「据第60–61回改写，非原文」「据第59、61回改写，非原文」；罗刹女 1/3→2/3→3/3（末句按钮变「收起」）→ 收起 `hidden true`；`?test` 仍可开（`buildMs 687 / props 77 片`），`scene.js` diff 仅两行 import。`check-all` 4 项通过。
- 仍无肉眼判读（截图只回元数据）。见 `docs/ITERATIONS/048-npc-lines-by-chapter.md`。

### 第 47 轮（2026-11-27）：时间轴场景签 5 → 8（补空隙）

- 用户说时间轴上的场景签显得空，要再挑三个时间让分布均匀。
- `assets/js/data.js` 的 `keyScenes` 增至 8 条：新增 两界山「心猿归正」（第 14 回，21.3%）、号山「大战红孩儿」（第 40–42 回，44.7%）、狮驼国「狮驼岭」（第 74–77 回，78.7%）；原有五签位置不动，55.3/59.6/61.7 那一簇保持（那三回本身挨着）。
- 间隔由 `8.5 | 27.7 | 19.1 | 4.3 | 2.1 | 38.3` 变成 `8.5 | 12.8 | 14.9 | 8.5 | 10.6 | 4.3 | 2.1 | 17.0 | 21.3`，最大空档 38.3 → 21.3。
- 验证：1256（轴宽 790）/1440（974）/390（312）三档都是 8 签、两两 rect 同行重叠 0；390 下收起为 8.5px 圆点，火焰山落第二行；点击 `data-order=10/21/37` 分别跳到 `#s=10`「第 14 回　心猿归正 · 六贼无踪」、`#s=21`「第 40 – 42 回」、`#s=37`「第 74 – 77 回」，`.tl-key.active` 正确。
- `node --check data.js` 通过、`check-all` 4 项通过；`data.js?v=54`。仍无肉眼判读。见 `docs/ITERATIONS/047-timeline-keys.md`。

## 第 44 轮（U-044-01/02/03）国界：从数据层绕开
- 删 `assets/vendor/countries-110m.json` 与它的 `topojson.mesh` 用法；新增 `china-provinces.json`（DataV，582522 B，35 feature = 34 省级 + 1 条 `100000_JD` 九段线）。
- 今图层画 `.province` + `.nine-dash`；古图层只有 `.land` 海岸线，`.border` 节点数为 0。关于补「边界」段与「并非测绘成果」声明；README 补边界政策与校验说明。
- `scripts/check-china.mjs` 并入 `check-all`：feature 数 35 / 省级 34 / 九段线 1 / 台港澳必须在 / 省级地名不得含「国」/ 代码不得再出现 `countries-110m`、`geoBorders` / 必须真的画了 province 与 nine-dash。
- 实测：`check-all` 4 项全通过；页面 `.province 1 / .nine-dash 1 / .border 0 / .land 1`；切今图后 `data-base=modern`。观感未判读（无视觉通道）。
- 见 `docs/ITERATIONS/044-borders.md`。
### 第 43 轮（U-043-01/02/03）回退悟空 + 人物造型规范
- 用户 m07429 要求回退：`git checkout e831a5f -- scenes/huoyan/wukong.js`，import 前进到 `wukong.js?v=6`、`scene.js?v=42`（版本号只前进不后退，否则吃旧模块）。
- 实测：`ready true / cards 151 / clips [] / buildMs 367`；悟空 11 卡；脚底浮空 0.04（042 修过的髋枢轴调整一并回退）。
- 新增 `docs/PAPERCRAFT-CHARACTER-SPEC.md`：硬约束 13 条（T 结构、层距 ≥2T、肢体枢轴在躯干轮廓外、两腿不互叠、侧卡互不重叠、手持物不横穿手臂、每卡 z 唯一并命名等）、尺寸表、步态、用色、验收 7 步、做不到的部分。
- 见 `docs/ITERATIONS/043-revert-wukong-and-character-spec.md`。
### 第 42 轮（U-042-01/02/03）按设定图重做悟空纸偶：11 卡 → 16 卡
- 配色改设定图量化所得那族：`deep #6d2c15 / ember #b93d20 / emberLit #cf4423 / ochre #c17036 / ochreL #dc9a6e / gold #b8934a / face #f0d3ae`；设定图全无蓝绿，旧版石绿靛青已去。
- 结构 16 卡：躯干、躯干侧、头、头侧、冠、鬓毛×2、披膊×2、臂×2、腿×2、腰带、战裙、金箍棒；深度表 staff −0.54 … crown 0.26。
- `clips()` 首版 5 对互穿 → 头 z 0.16、披膊下移 y 2.14–2.40 与头 y 不相交、战裙顶 1.32 与腰带 y 分开 → `clips []`。
- 实测（1256×774）：`ready true / cards 156 / buildMs 438–473 / clips []`；脚底 0.000（髋枢轴 1.06→1.04）；按住 W 时 `hip-l −0.045 / hip-r 0.067 / shoulder-l −0.054 / shoulder-r 0.054`（反相）。`scene.js?v=41`、`wukong.js?v=5`。
- **未验证**：上色后实际颜色不可判读（截图与纹理采样都对不上 `P.fill` 的色，`material` 为 3 件数组且 `[0]` 只有 28×35 px），形体是否像设定图须用户看 `.tmp/r42-wukong-close.png`。见 `docs/ITERATIONS/042-wukong-sheet-v2.md`。
### 第 41 轮（U-041-01）三人核对：八戒 / 沙僧 / 白龙马
- 入队回核实：八戒第 19 回（云栈洞悟空收八戒）、沙僧第 22 回（木叉奉法收悟净）、白龙马第 15 回（鹰愁涧意马缰绳）；三人 present 各一段，无整段离队。
- 43 站逐站跑数：人数 1→5 严格随入队回递增，无「早于入队」出现。
- `away` 补四条：第 30 回白龙马（化宫女夜战黄袍怪）、第 89 回悟空/八戒/沙僧（同去豹头山计闹，玉华州站同行只剩唐僧与白马）。
- 实测 s18 白马与 s43 三人为 `.fig-away .38`；`data.js?v=53`。待核：第 43 回八戒是否同被摄、第 76 回八戒沙僧是否同被擒。
### 第 40 轮（U-040-01）逐回在场名单（续）：被摄走五条 + 纸人淡态
- `away` 3 → 8 条：第 40 回唐僧（红孩儿枯松涧）、43 回唐僧（黑水河）、49 回唐僧（灵感大王河底水宅）、65 回悟空（金铙）、82 回唐僧（地涌夫人无底洞）。
- `partyOf()` 带 `away` 标记 → `.fig-away`（opacity .38 + 虚线描边）；被摄者从「同行」剔除、在「分期」行点名。
- 实测 s24/s32/s39/s21/s22 各缺其人 + 淡态，s29 五人全实；`?v=52`（style/app）、`data.js?v=51`。
- 真话：仍无肉眼判读，淡度 0.38 未目视确认。

- 第 1 轮（U-001-01）：建立 `docs/` 归档体系。见 `docs/ITERATIONS/001-docs-baseline.md`。
- 第 2 轮（U-002-01 失败 → U-002-02）：标签重叠归零。见 `docs/ITERATIONS/002-label-overlap-zero.md`。
- 第 3 轮（U-003-01）：回目直达（搜 `27` / `第二十七回` 按回目号跳站，空档给最近站）。见 `docs/ITERATIONS/003-chapter-jump.md`。
- 第 4 轮（U-004-01）：人物路线（点人走线）。见 `docs/ITERATIONS/004-character-route.md`。
- 第 5 轮（U-005-01）：窄屏详情卡与时间轴重叠 26 px 归零。见 `docs/ITERATIONS/005-mobile-detail-gap.md`。
- 第 6 轮（U-006-01）：图钉键盘可访问性（Tab / Enter / 空格 / aria-label / 焦点环）。见 `docs/ITERATIONS/006-pin-keyboard-a11y.md`。
- 第 7 轮（U-007-01）：收掉「选中站标签压邻站图钉」（两趟放置：先躲图钉与标签，退一步才压标签、永不压图钉）。见 `docs/ITERATIONS/007-selected-label-clear-pins.md`。
- 第 8 轮（U-008-01）：海洋纹样加密（20 → 32 簇，坐标经 `d3.geoContains` 水面校验）。见 `docs/ITERATIONS/008-sea-marks-denser.md`。
- 第 9 轮（U-009-01）：图钉 `aria-current` 与 roving tabindex（Tab 序列 48 → 1 个落点，读屏器可读当前站）。见 `docs/ITERATIONS/009-pin-roving-tabindex.md`。
- 第 10 轮（U-010-01）：标签候选位加「必须完整在屏内」守卫（`EDGE = 4`），390 宽下不再出现贴边半截字。见 `docs/ITERATIONS/010-label-onscreen-guard.md`。
- 第 11 轮（U-011-01 / 02 / 03）：浮层面板纳入标签避让（`declutter()` 量 7 处面板矩形作障碍，第一趟躲面板；详情卡开合与 Esc 后重排）。见 `docs/ITERATIONS/011-label-avoid-panels.md`。
- 第 12 轮（U-012-01）：海纹坐标的构建期校验 `scripts/check-seamarks.mjs`（落陆/点数/超范围非零退出，重复坐标只警告；坐标从 `app.js` 抠字面量，保持单一真相）。见 `docs/ITERATIONS/012-seamarks-check-script.md`。
- 第 13 轮（U-013-01）：「随行」按钮补 `aria-pressed`（`buildChars()` 给初值 `false`，`refreshFlags()` 与 `.on` 共用同一判断同步）。见 `docs/ITERATIONS/013-chars-aria-pressed.md`。
- 第 14 轮（U-014-01）：关于模态补「虚构地名比例」（按 `modern` 字段现算出今地可考 8 / 虚构 15 / 小说地名 24 / 灵山 1，虚构合计 81.3%，逐档列举站名）。见 `docs/ITERATIONS/014-about-fictional-ratio.md`。
- 第 15 轮（U-015-01）：标签在面板里无位可放时退化显示（`declutter()` 的 `MODES` 三档退让 + `.pinlabel.paneled` 纸底描边；第一版对所有站放开导致 900×420 下 35 条标签糊住详情卡正文，收窄为仅选中站）。见 `docs/ITERATIONS/015-label-paneled-fallback.md`。
- 第 16 轮（U-016-01）：窄屏详情卡改为默认收起（`S.detailExpanded` + 卡内「展开」小键；390×844 收起态高 77px，最大连续可用地图带 220 → 516px，可见标签 11–17 → 31；顺手修掉回目被关闭叉压住 7px）。见 `docs/ITERATIONS/016-mobile-detail-collapsed.md`。
- 第 17 轮（U-017-01）：窄屏展开态详情卡压到 34vh（`.detail.expanded { max-height: 34vh; }`，正文与翻页键改在卡内滚）。390×844 展开态 371 → 287px、地图可用带 273 → 305px，滚到底翻页键完整露出、`obscured=0`；1440 / 640 不受影响。见 `docs/ITERATIONS/017-mobile-detail-expanded-shorter.md`。
- 第 18 轮（U-018-01）：详情卡的收起边界从 620 放宽到 900（收起骨架上移到 `@media (max-width: 900px)`，620 只留尺寸收紧；`renderDetail()` 的 `narrow` 改 `sheet = W <= 900`）。640×844 收起态 388 → 73px、可用带 513px、可见标签 12 → 47；展开态仍 388px 卡内可滚；390 / 1200 / 1440 未受影响。见 `docs/ITERATIONS/018-sheet-collapse-to-900.md`。
- 第 19 轮（U-019-01）：收起态详情卡补「难号徽标」（`nanBadgeLabel()` 压成紧凑区间，徽标塞进 `h3.d-name`、只在 `.detail:not(.expanded)` 显示，站名 `aria-label` 带上难号；前传五站不出）。390×844 收起态仍 78px、徽标「第 47 – 49 难」右 259 vs 关闭叉 343 不交；640×844 仍 73px；1440 徽标 `display:none`、卡片仍 644px。见 `docs/ITERATIONS/019-detail-nan-badge.md`。
- 第 20 轮（U-020-01）：新增 `scripts/check-stations.mjs`，把「关于」里的 8/15/24 分类数字与 `data.js` 的 `modern` 现算结果逐项比对（不一致非零退出），并固化 48 站 / 100 回目 / 1–81 难无缺无重 / 回目沿站序单调等检查；三则反例（文案改数字、长安改分类、灵山漏一难）均 `exit=1` 且可还原。见 `docs/ITERATIONS/020-stations-check-script.md`。
- 第 21 轮（U-021-01、U-021-02）：窄屏展开态让「回目 + 站名」吸顶（`.detail.expanded .d-head{position:sticky;top:0}`，把 `.detail` 的 22px 上内边距挪给卡头，左右 -24px 撑满）；今地与站/妖标签拆进 `.d-meta` 随正文滚（整块吸顶时卡头高 194px、287px 的卡只剩 93px）；关闭叉与展开键移入 `.d-head`，否则绝对定位会跟着内容滚走（滚到底时从 y446 跑到 y149）。见 `docs/ITERATIONS/021-detail-head-sticky.md`。
- 第 22 轮（U-022-01、U-022-02）：621–900 段展开态由 46vh 压到 40vh（700 高 322 → 280px、844 高 388 → 338px），并把第 21 轮只作用于 ≤620 的卡头吸顶整段上移到 900 断点——抽屉的边界在哪，吸顶就跟到哪。1440 / 1256 / 390 均未受影响。见 `docs/ITERATIONS/022-sheet-expanded-40vh-sticky.md`。
- 第 23 轮（U-023-01）：收起态难号徽标的对比度量化，新增 `scripts/check-contrast.mjs`。文字本就达标（最差 4.91:1），边框 `rgba(176,58,46,.42)` 只有 1.87–1.92:1，提到 `.8` 后最差 3.63:1。见 `docs/ITERATIONS/023-nanbadge-contrast.md`。
- 第 24 轮（U-024-01）：三条构建期校验合成 `scripts/check-all.mjs`（一条命令跑完 + 汇总表 + 任一失败非零退出、不短路）。见 `docs/ITERATIONS/024-check-all.md`。
- 第 25 轮（U-025-01）：边框对比度**分级**（全站零 A 级——每个可点控件里都有文字或字形承担识别，`--rule` 的 1.47–1.49:1 属 B 级，不提亮以免毁掉淡墨基调）+ 81 难格子未行数字 `--ink-faint` 3.03:1 → `--ink-soft` 5.84:1；`check-contrast.mjs` 扩成两段（徽标 + 格子三态），把字色改回去会 `exit=1`。见 `docs/ITERATIONS/025-nan-grid-contrast.md`。
- 第 26 轮（U-026-01）：手机横屏（640×360）浮层叠在一起——「随行」条 `top:152` 与详情卡顶 `157` 叠 31px。新增 `@media (max-height: 480px)` 矮屏断点：时间轴 118→84px、卡片底边 130→96px、随行条挪到搜索框上方（`top:68`）、展开态压到 30vh（40vh 会压搜索框）。640×360 连续地图带 0→52px、可见标签 8→14；390 / 1440 不命中该断点、无回归。见 `docs/ITERATIONS/026-landscape-short-viewport.md`。
- 第 27 轮（U-027-01）：矮屏「八十一难」抽屉的可滚动性**结论为可用**，无代码改动——两次「矛盾数据」都是量错了容器：`document.querySelector(".drawer-body")` 取到的是行程表抽屉（1694/289），难抽屉另有自己的一份（657/289）。改用 `#drawer-nan .drawer-body` 后，`scrollTop` 0→368 时末格 `rect.top` 477→109，`.nan-foot` 停在 263，末格与进度条同屏；`scrollIntoView` + `elementFromPoint` 命中 `BUTTON.nan-cell.last`。见 `docs/ITERATIONS/027-drawer-scroll-verdict.md`。
- 第 28 轮（U-028-01）：矮屏抽屉表头**前提纠正 + 压缩**——P4-23 说「表头不吸顶」，实测表头是滚动区 `.drawer-body` 的兄弟、`position: static` 却恒定在 y0（`closeHit true`），根本不会滚走；真问题是它 71px 占了 360 高的五分之一。在 `@media (max-height: 480px)` 里把 `padding: 26px 26px 16px` 压成 `10px 18px 8px`、关闭叉内边距收窄：640×360 表头 71 → **45px**、正文 289 → **315px**，行程表需滚 1405 → 1379px，难簿末格与 `.nan-foot` 仍同屏；390×844 与 1440×900 不命中断点、表头仍 71px。见 `docs/ITERATIONS/028-drawer-head-compact-short.md`。
- 第 29 轮（U-029-01 / 02 / 03）：**主线转向 P5 纸模，P5-1 骨架跑通**。three r187（`three.module.js` + 必需的 `three.core.js`）与 papercraft 运行时（harness 原样未改 + 五个 lib + lights.json）本地化到 `scenes/vendor/`；`scenes/huoyan/{index.html,scene.js}` 印出焦赭纸地面（三层淡染 + 520 条龟裂纹 + 26 条风卷灰线）并立起一枚占位立牌，浏览器实测 `__papercraft.ready === true`、`cards() = 1`、`buildMs 168`、`clips()` 空、资源 host 只有 `127.0.0.1:8123`（无 CDN）。踩坑：只放 `three.module.js` 会整页白屏，因为 r187 里有 `import './three.core.js'`，且模块解析失败不触发 `try/catch`。地面 washes 由四色 0.3/0.2/0.12 调到两色 0.16/0.10/0.05，平均色 219,179,102 → 226,196,131（仍比宣纸深一档，是暖主光所致，P5-3 定色）。见 `docs/ITERATIONS/029-p5-1-paper-skeleton.md`。
- 第 30 轮（U-030-01）：**P5-2 定稿 paper spec 与测试卡**。`scenes/huoyan/README.md`（41 行）写入实现文档 §5 的 15 行 spec 原文，并附「已落地与 spec 的偏差表」（厚度 0.08 vs 0.072、占位立牌 vs 10–20 片等）与三种打开方式；`scene.js` 加 `if (H.flags.TEST)` 分支印三张小方卡（单色看哑光 / 双色看裁切接缝 / `holes` 挖孔看切口），实测 `?test` 下 `cards() = 4`、`pieces = 4`、`buildMs 224`、`clips()` 空、host 仅本地；普通入口仍 `cards() = 1`。首版把卡放 `z=6` 落在 `?test` 取景框外（`cards()` 只有 1），移到 `z=0` 才进框。Pillow 量化：纸面平均 221,188,124、暗部 5.98%、近纯白像素 0.00%。**视觉通道本轮不可用**（`read_image` 只回元数据），故厚度/裁切边的肉眼判读留待下轮，记录里已注明未杜撰。见 `docs/ITERATIONS/030-p5-2-paper-spec-test-cards.md`。
- 第 31 轮（U-031-01）：**P5-3 地面焦痕 + 八百里火墙 + 芭蕉洞**。`scene.js` 10951 B / 206 行：地面加 18 片径向渐变焦痕（`rgba(140,43,34,.10–.20)`，`z ∈ [-44,-18]`）；9 点纸焰轮廓 `flamePts` + `flamePaint`（`C.ember` 底、焰心 `C.shadow` 竖带、`innerShade(C.burnt,.5)`）按三层 × 36/40/44 片铺满 `x ∈ [-34,34]`（`z -28/-25/-22`，`res 0.5/0.55/0.6`）；芭蕉洞（拱门 `holes` 挖穿 + 背后暗纸 + 洞顶压边 + 两盏纸灯 + 两片石绿芭蕉叶）。调色板补 `shadow/gold/jade`。实测 `cards 123 / pieces 128 / buildMs 281 / clips []`、host 仅本地；Pillow 色带 y40 (117,51,20) → y240+ (226,198,132)、火色 11.07%、近纯白 0.00%。两轮参数纠偏都是取景问题（首版 `z=-42` 那排全出框，`cards` 仅 34）。遗留：火墙重叠率偏高有糊成「红幕」的风险（无肉眼结论）、焦痕未做密度加权、洞仍三层平卡未 boxFold。见 `docs/ITERATIONS/031-p5-3-firewall-cave.md`。
- 第 32 轮（U-032-01）：**P5-4 T 型纸偶悟空 + 点击寻路**。新建 `scenes/huoyan/wukong.js`（238 行 / 11581 B）——11 张卡（躯干/躯干侧/头/头侧/金箍/双臂/双腿/虎皮裙/金箍棒，每张 z 唯一）+ `stride(walked, gait)`（半步 1.044、摆幅上限 0.5 rad、支撑相线性/摆动相 smoothstep、臂反相 0.34、起伏 3.3% H）；`scene.js` 12577 B / 235 行接入纸偶、删占位立牌，并加点击寻路（`Raycaster` + 水平 `Plane` → 落点夹进 `walkArea` 内缩 0.6，`H.onStep` 每帧 `__papercraft.steer`，距离 < 0.35 松杆）。实测 `cards 133 / pieces 127 / buildMs 337 / clips []`、`walkPath` `reached 3 / of 3 / blockedBy null`、点击 (62%,72%) 后 `(0,3) → (4.54,3.39)` 停住、host 仅本地；走动三帧墨色占比 0.719 / 0.702 / 0.674%，帧间差 5.80% 与 5.70%（证明四肢在动）。`clips()` 初版 4 对互穿，靠「裙 z 0.06→0.14、裙 0.44→0.40、肩 0.56→0.60、棒 −0.34→−0.50」归零。三个坑：`setHero` 要句柄 `{group,pivot}` 不是 Group；`heroPos`/`steer` 只挂在 `window.__papercraft` 上、`H` 上没有；`play:false` 时 `flags.WALK` 为 false 导致点击与 WASD 都不动。见 `docs/ITERATIONS/032-p5-4-wukong-walk.md`。
- 第 33 轮（U-033-01）：**P5-5 三个人与纸片对话**。新建 `scenes/huoyan/people.js`（300 行 / 12009 B）——罗刹女（石绿长裙 + 朱砂腰带 + 墨髻 + 芭蕉扇）、牛魔王（赭石甲 + 朱砂披风 + 双角）、猪八戒（灰袍 + 大耳 + 九齿钉耙），各 6 张卡，`H.popup` 摆到 `(−9.2,−12) / (−3.4,−14.6) / (7.4,−6.2)`，每人躯干一张 `solid`（0.5–0.62）防穿模，每张卡 `group.userData.personId` 供拾取；新建 `scenes/shared/paper-ui.css`（3338 B，卡纸纤维 + 双细墨框 + 三条影子 + 从下方抽出 0.34s 动效）与 `scenes/shared/dialog.js`（4190 B / 121 行，逐字 26ms、点击/Enter/空格翻页、Esc 关闭、末句「收起」、`onClose` 恢复走动）；`scene.js`（15282 B / 303 行）接入拾取优先级（人物 > 地面）、`frozen` 截断走动（并 `steer(0,0)`）、`E` 键说最近的人（3.4 步内）、`window.__huoyan` 验收钩子；`index.html`（1764 B）引样式并改提示。实测 `cards 133 → 151 / pieces 145 / buildMs 372 / clips []`，点 `(816,383)` 命中猪八戒且主角未移动，对话开着点地面 `(0,3)` 不动、关后走到 `(9.8,3.17)`，`place(-8.6,-11.2)+E` 开罗刹女，翻页 1/3→2/3→3/3→关闭。三句台词均标「示例台词，待用户确认」并注原著回目。**视觉通道仍不可用**（`read_image` 只回元数据），无肉眼判读与 A/B 盲评。见 `docs/ITERATIONS/033-p5-5-people-dialog.md`。
- 第 34 轮（U-034-01）：**P5-6 主站集成**。火焰山详情卡多一个「进入纸模场景 / 3D · 需 WebGL」按钮（`renderDetail()` 里 `n.id === "huoyan"` 才拼）；点开是 96vw×90vh 的纸色模态（`.scene-modal` + `.scene-sheet`，40px 头 + iframe + 操作提示条），iframe 平时无 `src`、关闭写 `about:blank` 卸掉 WebGL；深链 `#s=29&scene=huoyan` 自动进场景；场景开着时父文档键盘只认 Esc，且 Esc 分两层（先收场景内纸片对话，再关模态）；关掉焦点交还按钮。实测 1440 sheet `[29,45,1382,810]`、canvas 1380×742、`ready true / cards 156 / buildMs 444 / clips []`；1200 `[24,37,1152,666]`；390 全屏 `[0,0,390,844]`；三档均 `pins 48 / tab0 1 / ariaCur 1 / seaPaths 64`、行程表 48 项、难簿 81 格、人物 5 条；点火前 `threeReqs []`；Pillow：sheet 头 (243,231,205)=纸色、遮罩 (113,102,86)、火墙带 (139,47,17)、近纯白 0.00%。**视觉通道仍不可用**，无肉眼判读与 A/B 盲评。见 `docs/ITERATIONS/034-p5-6-host-integration.md`。
- 第 35 轮（U-035-01）：**P5-7 全量验收 + 模板提炼**。§8 十条：**9 PASS / 1 FAIL**——第 10 条「主站 `file://` 双击打开」不成立：ego 打开 `file:///…/index.html` 直接落到 `chrome-error://chromewebdata/`，且 `assets/js/app.js:1432-1433` 用 `fetch()` 取 `land-110m.json` / `countries-110m.json`，`file://` 下会被浏览器拦，只剩空地图；P5-7 不许动 `assets/`，故只把 README 的「双击即开」改成「需要本地静态服务器」并写明修法建议（把两份 topojson 包成 `window.__LAND` / `__COUNTRIES` 的 js）。其余九条 PASS：`cards 151 / clips []`、`buildMs 322–444 < 5s`、`focusHeight 0.62 / 0.602`（0.55–0.75）、`shadowHex #81250A / #581002`（暖赭，方向未肉眼判）、`walkPath 3/3 blockedBy null`、走动三帧帧差 31.90% / 58.50%、三人对话与 Esc 两层、主站三档 48/1/1/64 无回归。`measure.py` 六项 WARN（`lumaP50 0.765`、`toothRms 0.0098`、`flatPct 98.5`、`printDetail 0.002`、`localContrast 0.019`、`barePct 98.4`）指向同一件事：**纸面上的印花几乎为零**，下一轮最该做的是给每片纸印纹样与压曝光，而不是再加纸片。新建 `scenes/_template/`（`index.html` 1724 B / `scene.js` 9.6 K / `README.md`）——四处「改这里」+ 十条验收清单 + 基线数字；模板实测 `ready true / cards 7 / buildMs 166 / clips []`、`walkPath 3/3`，首版手臂与躯干互穿（卡宽 ±0.14、肩 ±0.52），改 ±0.12 / ±0.60 / `dz -0.24` 后归零。`capture.py` 依赖 Playwright，本机没装，本轮截图走浏览器手工截；**`read_image` 仍只回元数据，无肉眼判读与 A/B 盲评**。见 `docs/ITERATIONS/035-p5-7-acceptance.md`。
- 第 36 轮（U-036-01）：**P5-8（半）地面印花 + 压曝光**。`H.printGround` 里 `washes` 由两色 0.16/0.10/0.05 改成三色 0.22/0.14/0.07（最粗档落赭石深染），并加四层印：140 片中尺度色斑（浅赭/深赭交替 α0.10–0.22）、200 处砾石簇（每簇 4–8 颗，径 1.0–2.9 px，α0.18–0.48）、760 条风蚀短划、1200 粒纸纤维。实测 `lumaP50 0.765→0.712`（回门限内）、`toothRms 0.0098→0.0106`（回门限内），WARN 6→4；`flatPct 98.5→95.9`、`printDetail 0.002→0.003`、`localContrast 0.019→0.022`、`barePct 98.4→98.3` 仍在外。**关键发现**：`measure.py:608-618` 的 `printDetail = mean(梯度>0.10)` 量的是**清晰带里的边缘密度**，不是印花浓度；荒漠这张纸下半部是空地面，靠印纹顶不到 6%，正路是「在清晰带里立更多不同的纸片」（转 BACKLOG P5-9）。中间版（1 px 细砂 α≤0.18）`printDetail` 一点没动——截图 1256 宽被 `measure` 重采样到 1600 反而糊掉，母题必须 ≥2 px 或按 1600 出图。无回退：`cards 151 / clips [] / buildMs 442`、`walkPath 3/3`、`E` 开牛魔王 `1/3` 且关后 `frozen false`。**仍无肉眼判读**（`read_image` 只回元数据），未做 A/B。见 `docs/ITERATIONS/036-p5-8-ground-print.md`。
- 第 37 轮（U-037-01~06）：**用户五条**。① 玄奘实路：`refreshFlags()` 补 `.classed("on", S.showReal)` 与 `.real-label` opacity（原来只有 `drawRoutes()` 挂 `.on`，`.route-real{opacity:0}` 故永不可见）；② 43 站 `lon/lat` 按回序重排为 1.2–3.5° 不等距走廊（含 27–29 站向东小回折）；③ 古/今底图切换：`#stage[data-base]` + `.modern-layer`（25 个 `modernCities` 点、境线/陆地换色、古图山形与海纹在今图隐藏）+ hash `base=modern`；④ 站上纸人：`partyOf(n)` 按 `characters.from` 累加，`.party` 每站一排剪影（长安 1 → 流沙河起 5），`declutter()` 图钉障碍加 `partyH = 15*U`；⑤ NPC 头顶名牌（`.pd-tags` DOM 纸签，每帧 `project` 定位）+ 走近 2.4 步自动开口、3.2 步重新上膛；进火焰山站自动摊开纸模（`enterSceneFor`/`SCENE_STATIONS`/`playSceneEnter`，`.scene-veil` 0.34s 铺开 0.24s 化开，图钉/行程表/已选中站三条路径传 `{enter:true}`，键盘与时间轴不触发）。实测：`app.js 65438 B`、`style.css 42165 B`、`data.js 38537 B`；pins 48 / party .fig 186 / tab0 1 / aria-current 1；今图 `.mcity 25`、`.regions` 隐藏；火焰山 `#s=29&scene=huoyan`、veil z61 后移除、`ready true / cards 156`；长安 `#s=5` 不开模态；ArrowLeft `#s=28` 不开模态。**仍无肉眼判读**（`read_image` 只回元数据），未做 A/B。见 `docs/ITERATIONS/037-user-five-requests.md`。**第 37 轮补充（U-037-07）**：按用户澄清，站上小人从「每站都摆」改成「只站在当前站」——`.pin .party{display:none}` + `.pin.active .party{display:inline}`，`declutter()` 的 `partyH` 也只对当前站计；另给 `partyOf()` 加 `absent` 回目区间，悟空 `[[27,30],[56,57]]`（第二十七回被逐/第三十一回归，第五十六回被逐/第五十八回归）。实测：白虎岭 4 人、平顶山 5 人、真假美猴王 4 人、火焰山 5 人，可见 party 组恒为 1。
- 第 38 轮（U-038-01）：**纪年层走 A+C**（用户确认「走 A + C」）。`S.showEra` 默认 true（关着才在 hash 写 `era=0`，`readHash` 只认 `era=0`）；`D.era.compare` 记小说「贞观十三年 → 二十七年 · 十四年」与史实「贞观三年 → 十九年 · 约十七年（629—645）」及 note「「贞观二十七年」史无此年：太宗崩于贞观二十三年。两轨不可互算。」；`buildTimeline()` 追加 `.tl-era-cap`（`right:0; top:-13px`，10px 朱砂短线前缀），末端锚点（`pct>=97`）加 `end` 类右对齐，免得居中压到对照行；`renderDetail()` 的 `.d-era` 只在 `showEra` 时输出，长安/灵山另加 `.d-era-note`。关于弹窗补「轴是回序轴，不是历法轴」一段，并把原句「往返十九年」订正为「约十七年（贞观三年出、十九年归）」。实测（1256）：锚点 `10.6383%` / `100%` 两枚，`.tl-era-cap` 358×11px 在 `[714,661]–[1072,672]`，与两锚点、五枚场景签零重叠；`#s=5&era=0` 硬载后 `era-on=false`、`.tl-era` opacity 0、`.d-era` 消失；390 视口 `.tl-era-cap` 计算样式 `display:none`、锚点 2 枚、pins 48、重点签 5。**仍无肉眼判读**（`read_image`/`bcdp_screenshot` 只回元数据）。见 `docs/ITERATIONS/038-era-dual-track.md`。
- 下一轮候选：**站点与真实地理对齐**（先问用户：逐站改坐标 vs 加真实参照副标注，30 min）/ 名牌中文字体栈确认（15 min）/ P5-9 前景纸件（25 min）/ 给 11 张悟空卡与 18 张人物卡印纹样 / 主站 `file://` 内联 topojson（P4-24）/ `capture.py` 无 Playwright 路径（P4-25）/ 深链场景 id 白名单 / `?embed=1` 行为化 / P4-22 640×360 地图带 / `check-all` 识别新增脚本 / 格子 10→11px。

## 项目定位

《西游记》一百回读成一条时间线：底部回目刻度推进 → 朱砂取经路线随之生长 → 点站点展开回目、难数、妖怪、情节与原句。
纯静态站点，无构建、无后端、无 CDN（d3 v7 + topojson-client 与 Natural Earth 110m 均本地化）。

### 第 39 轮（U-039-01/02/03，2026-11-27 13:26）逐回在场名单：分期

- 用户「好，继续」之后接着做逐回名单。`present` 只能回答「在不在取经队伍」，粒度是整回；平顶山跨 32–35 回、
  八戒只在第 32 回单独去巡山，用一条整段区间说不清。另立 `away`：`{chapter, who, what, why}`。
- `assets/js/data.js` 新增 `away` 三条（32 八戒巡山被莲花洞拿、57 沙僧去花果山讨行李、72 唐僧独自化斋被拿），
  并在 `chapters` 上方补注「第 9 位是附录（陈光蕊/江流僧），难 1–4 出于此回；第 12 位起与通行本对齐」。
- `assets/js/app.js` 新增 `awayAt(n)`（回目区间取交集）；`renderDetail()` 出 `.d-away` 行（`title` 放「为什么」），
  并把分期者从「同行」里剔除。`assets/css/style.css` 新增 `.d-away`（左侧朱砂细线，10px×--u）。
- 实测（`?t=away3#s=35`）：平顶山「同行：唐僧 · 悟空 · 白龙马 · 沙僧」+「第 32 回 八戒 · 独自巡山，被莲花洞拿了」；
  真假美猴王同行无沙僧；盘丝洞同行无唐僧；长安、火焰山无「分期」行；详情卡 356×518 未溢出。
- `index.html` 资源版本抬到 `?v=48`（style.css/data.js）与 `app.js?v=50`；`node --check` 通过。
- 全程无肉眼判读（截图工具只回元数据），结论来自 DOM 与计算样式。

## 交付物清单（截至第 55 轮）

| 路径 | 内容 | 规模 |
| --- | --- | --- |
| `index.html` | 单页骨架：#stage > svg#map、纸纹 feTurbulence、印章标题、工具栏、搜索、人物条、图例、详情卡、时间轴、行程表抽屉、八十一难抽屉、关于模态（含 48 站虚构比例一段）、**纸模场景模态 `#scene-modal`（P5-6）** | 163 行 / 9935 B（含工具栏「今图」「纪年」按钮、时间轴场景签层、纸模场景模态） |
| `assets/js/data.js` | `window.XIYOU_DATA`：100 回目、81 难、5 站前传、43 站西行、`characters` 5 人入队站、玄奘实路 23 点、14 条地名注记、6 组山形折线 | 739 行 / 44649 B（含 `modernCities` 25 城、`away` 14 条分期（含连回与部分离队）、`era`、`keyScenes` 8 条） |
| `assets/js/app.js` | 投影、底图（含 32 簇海纹）、路线（含人物行迹层）、图钉（含键盘可达性）、标签避让（三档退让 + 在屏守卫 + 浮层面板障碍 + `.paneled` 退化）、时间轴、详情、搜索（含回目号直达）、人物过滤、抽屉、深链、缩放、图钉 roving tabindex 与 `aria-current`、「随行」按钮 `aria-pressed`、窄屏详情卡收起/展开（≤900 横铺时收起）、收起态难号徽标 `nanBadgeLabel()`、**纸模场景入口与 iframe 模态（`openScene/closeScene`、`#s=&scene=` 深链、Esc 两层、关闭卸 WebGL）** | 1812 行 / 78949 B（含古/今底图、站上纸人、进站开纸模、逐回在场名单与分期、回内粒度的 `charStatus`/`fig-part`） |
| `assets/css/style.css` | 宣纸设色（赭石/石青/石绿）、竖排宋楷注记、印章式标记、人物行迹石绿线、图钉焦点环、面板退化标签描边、详情卡收起骨架在 900 断点（收起 73–78px、展开 40vh 且卡头吸顶）、620 只收紧尺寸（展开 34vh）、收起态难号徽标（边框 alpha 0.8，对比度 3.54:1 起）、81 难格子未行字色 `--ink-soft`（5.84:1）、矮屏（≤480 高）断点（时间轴 84px、卡片底边 96px、随行条 top 68、展开 30vh、抽屉表头 45px）、**纸模场景模态（遮罩 blur、纸色 sheet 96vw×90vh、40px 头、提示条、`.d-scene-btn`、620px 全屏）** | 1613 行 / 48539 B（含今图层、纸幕转场、8 枚场景签、纪年锚点、`.d-away`/`.d-away-part`；`--serif` 平台字体优先） |
| `#scene-modal`（P5-6 新增） | 纸模场景模态：遮罩 + 纸色 sheet（96vw×90vh，620px 下全屏）+ 40px 标题栏 + iframe 视口 + 操作提示条；`.d-scene-btn` 入口按钮 | `index.html` + `style.css` 内 |
| `assets/vendor/` | d3.min.js 7.9.0、topojson-client.min.js 3.1.0、land-110m.json、china-provinces.json（DataV 省界，35 feature = 34 省级 + 九段线；原 `countries-110m.json` 已于第 44 轮删除） | — |
| `README.md` | 运行法、「西游记有地图吗」三问三答、快捷键表（含回目直达、人物行迹、窄屏收起、手机横屏）、数据来源（含三条构建期校验与 `check-all` 一把跑）、结构说明 | 76 行 / 7107 B |
| `scripts/check-seamarks.mjs` | 海纹坐标的构建期校验：从 `app.js` 抠 `seaMarks` 字面量，用 `land-110m.json` + `d3.geoContains` 判陆地，落陆/点数≠32/超范围非零退出 | 115 行 |
| `scripts/check-stations.mjs` | 站点一致性校验：48 站 / 100 回目 / 1–81 难无缺无重、回目沿站序单调、经纬度在图幅内，并把「关于」里的 8/15/24 分类数字与 `modern` 现算结果比对 | 156 行 / 8017 B |
| `scripts/check-contrast.mjs` | 对比度校验两段：① 徽标（从 `style.css` 现读 `--paper`、徽标色/边框 alpha、详情卡渐变两端与吸顶卡头实色，四种底色取最差，文字 < 4.5:1 或边框 < 3:1 非零退出）② 81 难格子三态（未行/已行/当前的字色与底色现读，抽屉渐变两端取更差） | 183 行 / 8326 B |
| `scripts/check-all.mjs` | 一次跑完上面三条校验：`spawnSync` 逐条执行、原样转印输出、末尾汇总表；任一失败 `exit 1`，但不短路（其余照跑） | 58 行 / 2650 B |
| `docs/` | STATE / BACKLOG / CHANGELOG / ITERATIONS 四件套 | 迭代协议要求的归档 |
| `scenes/vendor/` | three r187（`three.module.js` 658900 B + `three.core.js` 1474799 B）、papercraft 运行时 `papercraft/{harness.js(原样未改), lib/{paperkit-2d,paperkit-3d,paper-motion,paper-life,paper-sound}.js, lights.json}` | 全部本地，无 CDN |
| `scenes/huoyan/` | P5-1~P5-5：本地 importmap、纸色底、WebGL 失败兜底；`scene.js` 印焦赭戈壁（赭石淡染 + 520 条龟裂 + 26 条风卷灰线 + 18 片焦痕）、三层纸焰火墙（120 片）、芭蕉洞（`holes` 门洞/纸灯/芭蕉叶）、11 张卡 T 型纸偶悟空 + stride 步态 + 点击地面寻路、**三位纸人（罗刹女/牛魔王/八戒，各 6 卡）+ 点人或按 E 弹纸片对话**，`?test` 下印三张测试卡 | `index.html`（`scene.js?v=37`）/ `scene.js` 20858 B（含第 36 轮地面印花 + 第 37 轮 NPC 名牌与走近说话）/ `wukong.js` 11581 B（238 行）/ `people.js` 12226 B（303 行，第 48 轮台词按回目改写）/ `README.md`（15 行 spec + 偏差表 + §8 验收表） |
| `scenes/_template/` | **P5-7 提炼的场景模板**：`index.html`（本地 importmap、纸色底、WebGL 兜底）+ `scene.js`（四处「改这里」：PALETTE / `printGround` 地面印花 / T 型纸偶 HERO / `bounds·walkArea·camBox·view`；含 `onStep` 逐帧 steer 与 pointerdown 射线落点）+ `README.md`（复制步骤、改动表、十条验收清单、基线数字、互穿坑） | `index.html` 1724 B / `scene.js` 约 9.6 K / `README.md`；实测 `ready true / cards 7 / buildMs 166 / clips [] / walkPath 3/3` |
| `scenes/shared/` | 纸片 UI 与对话：`paper-ui.css`（纸色卡、双细墨框、`.pd-tag` 名牌）、`dialog.js`（逐字、Enter/空格翻页、Esc 收起） | `paper-ui.css` 5190 B / `dialog.js` 4326 B（第 48 轮徽标可配） |
| `scripts/papercraft/` | 纸模配套工具（原样取自 skill）：`capture.py` / `measure.py` / `ab_sheet.py` / `paper_textures.py`，P5-2 起接入验收 | — |
| `docs/papercraft-skill/` | skill 参考资料副本：`SKILL.md` + `references/` 15 篇（材料定律、光、结构、动效、格式等），供 P5-2~P5-5 查阅 | 508 K |

## 已实现能力（逐条可验）

1. **时间线**：底部回目刻度 0→100% 扫描，拖动/点击/空格自动巡礼（2500 ms 一站），路线分「已行（朱砂实线）/ 未行（淡朱砂虚线）/ 归途（上拱）」三段生长。
2. **站点**：48 站（前传 5 + 西行 43），图钉反缩放保持屏幕尺寸，点选 → `diveTo` 放大居中，右详情卡展开回目、现代地名、标签、情节、引句与出处、此站之难、前后站翻页。
3. **八十一难**：9×9 难格，已渡朱砂、当前金框，进度条 + 已渡计数；难名悬挂到对应站点，`stationByNan` 反查。
4. **玄奘实路**：23 点真实西行线叠加对照，与小说路线在葱岭以西西分道。
5. **前传**：花果山 · 灵台方寸山 · 东海龙宫 · 幽冥界 · 天庭 五站虚线轨迹，可开关。
6. **搜索**：站名/别名/今地名/妖怪/回目名/难名，外加**回目号直达**（`27`、`第27回`、`第二十七回` 均认，`cnToNum` 转汉字数字，`stationByChapter` 按 `chapter` 区间反查，等距取靠后一站；该回无独立站点时提示「最近为某站」，越界给 1–100 提示），最多 8 条命中，回车跳站。
7. **深链**：`#s=<order>`、`&real=1`、`&pro=0` 可分享定位。
8. **键盘**：← → 换站、空格播放、/ 聚焦搜索、Esc 关闭层。
9. **响应式**：`U = clamp(0.82, 1.9, min(W/1340, H/800))` 写进 `--u`，全部尺寸随视口缩放；≤900 px 详情卡改横铺底部条并**默认收起**（只留回目 + 站名 73–78px，卡内「展开」升到 40vh，卡头 sticky 常驻）；≤620 px 再收紧（隐藏印章标题、工具栏横滚、展开态 34vh），下钻焦距 k=1.55 且抬到 y=236。
10. **标签避让**：图钉方框（`pinR = 7.2 * U`）先占位当障碍，12 个候选位贪心试放，全撞才隐藏，选中站强制显示。图钉障碍与标签障碍**分两个数组**，选中站只清标签框；`text-anchor` 必须用行内样式写（CSS 里有 `.pin-label { text-anchor: middle }`）。选中站走**两趟**：第一趟既不压图钉也不压标签，找不到才退到第二趟（允许压标签、永不允许压图钉 —— 图钉是唯一可点的靶心）。每趟还要过两道额外关：候选位必须**完整落在视口内**（四边各留 4px），且不能落进 7 处**浮层面板**（`.masthead` / `.toolbar` / `.search` / `.chars` / `.legend` / `#detail` / `.timeline`）。
11. **人物行迹**：图例上方「随行」一条 5 个按钮（唐僧 / 悟空 / 白龙马 / 八戒 / 沙僧）。点选后队伍外站点淡出（`.pin.off` 0.22、标签 0.16），自入队站起画石绿实线到灵山；悟空额外带前传五站虚线（`.route-char.pro`）；再点同一人取消。`characters` 只记可考入队站（14 / 15 / 19 / 22 回），不逐站标在场人物。深链 `&c=<id>` 可分享。
12. **海纹**：32 簇波浪线（黄海·东海 5 / 南海 10 / 孟加拉湾 8 / 阿拉伯海 5 / 补充 4），每簇两行 `q` 弧；弧宽与行距按序号微抖动避免排成网点。坐标经 `d3.geoContains` 对 Natural Earth 陆地轮廓逐点校验，全部落在水面上（校验法见 `docs/ITERATIONS/008-sea-marks-denser.md`）。

## 已知问题（实测数据）

- **手机横屏（≤480 高）已让开，但仍挤**：640×360 下五个浮层不再重叠、连续地图带 52px、可见标签 14（改前 8、且随行条压住卡片）。52px 仍是「一屏半条街」的量，搜索框并进工具栏才能再挤出一段（候选）。
- **矮屏「八十一难」抽屉：可用（第 27 轮实测纠正）**。可滚的是内部的 `.drawer-body`，而且有**两份**——`document.querySelector(".drawer-body")` 取到的是行程表那份（`1694/289`），难抽屉另有一份（`#drawer-nan .drawer-body`，`657/289`）；此前两次「矛盾数据」都是量错了容器。改用作用域选择器后 `scrollTop` 0→368、末格 `rect.top` 477→109、`.nan-foot` 停在 263（与末格同屏），`scrollIntoView` + `elementFromPoint` 命中 `BUTTON.nan-cell.last`。第 28 轮又把表头 71→45px，正文 289→315px。

- **标签重叠：已归零（第 2 轮）**。1440×900（`--u`=1.0746）、1200×740（`--u`=0.8955）、390×844（`--u`=0.82）三档实测 `overlapPairs=0`、`pinBite=0`，48 个标签全可见；放大态（`scale(1.85)`，37 在屏）同为 0/0。判据脚本见 `docs/ITERATIONS/002-label-overlap-zero.md`。
- **窄屏隐藏标签**：390 宽 k=1（全图）时 48 站挤在约 60 px 带内，只有 26 个标签能放下，其余隐藏。这是取舍不是 bug；下钻到 k=1.55 后当前站与周边站可读。
- **窄屏详情卡与时间轴重叠：已归零（第 5 轮）**。620px 断点下 `.detail` `bottom` 92→124px、`.timeline` 高 118→100px；390×844 实测卡底 720、时间轴从 744 起，间隙 24 px，滚到底「此站之难」与 `←/→` 翻页按钮完整落在卡内。1440 / 800 / 620 三档 `gap` 分别为 0 / 12 / 24，均无重叠。
- **无逐站在场人物表**：人物只区分「入队先后」，不区分谁在哪一站离队/单独行动（如悟空三次被逐回花果山）。要做这一层需 48 站 × 多人的可考依据，属新条目，未做。
- **可访问性（第 6 / 9 / 13 轮）**：图钉有 `role="button"`/`aria-label`，Tab 按叙事顺序聚焦、Enter 与空格选中、焦点环为朱砂双环；`tabindex` 走 roving（全图只 1 个 Tab 落点，落在当前站），当前站带 `aria-current="true"` 且换站后焦点跟随；「随行」五个按钮带 `aria-pressed`。未跑真实读屏器（NVDA / VoiceOver），标为待核。
- **选中站标签压邻站图钉：已归零（第 7 轮）**。`declutter()` 把 `hits()` 拆成 `pinHit` / `labelHit`，选中站两趟放置（第一趟全躲，第二趟才允许压标签、永不压图钉）。1440×900 / 1200×740 / 390×844 三档逐站遍历 48 站：标签缺失 0、`overlapPairs=0`、`pinBite=0`。复查顺带纠正旧口径：早先 `#s=29` 的 `pinBite=1` 样本是一条 `left=-60` 的**屏外**标签，不在可见区。
- **屏外标签仍占候选位：已归零（第 10 轮）**。候选位改为必须完整落在视口内（四边各留 4px `EDGE`），390 `#s=0` 的 `minLeft` 由 `-15.6` 收到 `6.9`。见 `docs/ITERATIONS/010-label-onscreen-guard.md`。
- **标签被浮层面板压住：已归零（第 11 轮）**。`declutter()` 把 `.masthead` / `.toolbar` / `.search` / `.chars` / `.legend` / `#detail` / `.timeline` 的矩形（外扩 3px）当障碍，第一趟放置躲面板；1440 / 1200 / 390 三档逐站实测 `obscured=0`、`pairs=0`、`offscreen=0`。详见 `docs/ITERATIONS/011-label-avoid-panels.md`（内含「临时短路 `panelHit` 时 `obscured` 立刻变 2」的直接证据，证明障碍确实生效）。踩坑记录：**动画过渡期的 `opacity` 不能用来判断元素是否可见**，`.detail` 刚加 `.open` 时 `opacity` 仍读到 `"0"`，导致面板被误判为不存在。
- **窄屏详情卡默认收起：已做（第 16 轮）**。390×844 点图钉后卡片只露「回目 + 站名」（高 77px，y 642–719），点卡内「展开」或键盘 Enter 才升到 371px；换站、关闭叉、Esc 都把展开状态复位。收起态最大连续可用地图带 220 → 516px、可见标签 11–17 → 31。详见 `docs/ITERATIONS/016-mobile-detail-collapsed.md`。
- **展开态仍占 287px（第 17 轮已压）**：390×844 展开态由 371px 压到 287px（`.detail.expanded { max-height: 34vh }`），可用带 273 → 305px，正文与翻页键在卡内滚、滚到底 `.d-nav` 完整露出。仍未做到「边看图边读情节」，再压会牺牲正文可读性。见 `docs/ITERATIONS/017-mobile-detail-expanded-shorter.md`。
- **620–900 段收起：已做（第 18 轮）**。收起骨架整体上移到 `@media (max-width: 900px)`（那是卡片 `left/right:12px` 横铺的起点），620 断点只把尺寸再收紧一档。640×844 收起态 388 → **73px**、地图可用带 513px、可见标签 12 → **47**；展开态原 46vh（388px），第 22 轮已压到 40vh（338px，卡内可滚）；800×700 收起 73px / 47 标签 / 可用带 369px；390 仍 78 / 31，1200 与 1440 仍是完整卡（`.expand` = `none`）。见 `docs/ITERATIONS/018-sheet-collapse-to-900.md`。
- **621–900 段展开态：已压到 40vh（第 22 轮）**。800×700 展开 322 → **280px**、卡内可滚（`scrollHeight 395 > clientHeight 278`）、`.d-nav` 底 551 ≤ 卡底 570；640×844 388 → 338px；两档的 `.d-head` 均为 `sticky`、滚到底与卡顶差 **1px**、关闭叉可用 `elementFromPoint` 命中（此前 621–900 段卡头不吸顶、按钮会随内容滚走）。1440 卡仍 644px、`.expand` 为 `none`、`.d-head` 为 `static`。遗留：640–900 展开态仍占近半屏，横屏 640×360 未测。见 `docs/ITERATIONS/022-sheet-expanded-40vh-sticky.md`。
- **对比度：徽标已补、格子已补（第 23 / 25 轮）**。文字 `#b03a2e` 对底最差 4.91:1（11px 常规字重需 4.5）；边框 `rgba(176,58,46,.42)` 只有 1.87–1.92:1，提到 `.8` 后最差 3.63:1（需 3:1）。四底色（纸底 / 卡顶渐变 / 卡底渐变 / 吸顶卡头）逐一算过，算法固化为 `scripts/check-contrast.mjs`（改样式不达标即 `exit 1`）。未量观感。全站其它 `.13–.45` 的次要边框已在第 25 轮分级：**没有一条是 A 级**（每个可点控件内都有文字或字形承担识别），故不强制 3:1、也不提亮；同轮把 81 难格子未行数字从 3.03:1 提到 5.84:1。见 `docs/ITERATIONS/023-nanbadge-contrast.md`、`docs/ITERATIONS/025-nan-grid-contrast.md`。
- **收起态难号徽标：已做（第 19 轮）**。收起态站名行右侧显示紧凑难号（`第 47 – 49 难`），展开态自动隐去；390×844 徽标 `[172,688,87,18]` 右界 259 vs 关闭叉左界 343，不交；640×844 徽标右 257 vs 叉 593；前传五站无难号不出徽标。读屏器靠 `h3[aria-label]`（「火焰山，第 47 – 49 难」）听到，未跑真实读屏器标待核。见 `docs/ITERATIONS/019-detail-nan-badge.md`。

## 环境约束（踩过的坑）

- 本项目已是 git 仓库（remote `https://github.com/liudengxing/xiyou-map.git`），回滚仍优先用 U-ID + 前向回退，`git checkout` 只作兜底。
- `ops_bash` 在本机 workspace-write 下必失败（`SetNamedSecurityInfoW failed (Win32 5)`），凡 bash 需按次 `danger-full-access`。
- 预览：`python -m http.server 8123 --bind 127.0.0.1`（后台 job，会吊住），页面 `http://127.0.0.1:8123/`。
- 浏览器 ego-browser 视口固定 2552×1274 不可改，只能靠 `.tmp/frame*.html` 的 iframe 包装造 1440/1200/390 等真实版式；截图用 `bcdp_screenshot({selector:"iframe"})`。
