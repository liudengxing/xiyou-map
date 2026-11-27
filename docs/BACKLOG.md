# BACKLOG · 待办池

> 每轮从本表取**一件**可验证的小事做，做完划掉并写进 CHANGELOG。
> 优先级：P0 骨架 > P1 内容 > P2 交互 > P3 美学 > P4 打磨。每项须能在约 20 分钟内完成并验证。

## P2 交互

- [x] **P2-1 人物路线（点人走线）** ✅ 第 4 轮完成（U-004-01）
  - 结果：`data.js` 增 `characters` 5 条（只记可考入队站：唐僧长安 12 回、悟空两界山 14 回、白龙马鹰愁涧 15 回、八戒高老庄 19 回、沙僧流沙河 22 回）；图例上方「随行」一条按钮，点选后队伍外站点淡出、自入队站起画石绿实线到灵山，悟空另带前传五站虚线；再点取消；深链 `&c=<id>`。
  - 实测：1440 下唐僧 43/5、悟空 43/5、白龙马 37/11、八戒 35/13、沙僧 33/15（保留/淡出）；标签 `pairs 0 / bite 0` 未回归；390 下人物条 y 96–127 与搜索框、详情卡均不重叠。
  - 详见 `docs/ITERATIONS/004-character-route.md`。

- [x] **P2-2 回目直达** ✅ 第 3 轮完成（U-003-01）
  - 结果：`parseChapterQuery` 三态返回（数字 / NaN 越界 / null 非回目号）+ `cnToNum` 汉字数字 + `stationByChapter` 区间反查（等距取靠后一站）。
  - 实测：`27`/`第27回`/`第二十七回` → 白虎岭 `#s=17`；`100`/`一百` → 灵山 `#s=47`；`8` → 天庭（空档提示）；`0`/`101` → 1–100 提示。
  - 详见 `docs/ITERATIONS/003-chapter-jump.md`。

## P3 美学

- [x] **P3-1 标签重叠归零** ✅ 第 2 轮完成（U-002-02）
  - 结果：拆 `pinBoxes` / `labelBoxes` 两个障碍数组、`text-anchor` 改行内样式、盒模型实测校准 + 0.08em 余量。
  - 实测：1440 / 1200 / 390 三档 `overlapPairs=0`、`pinBite=0`、48 标签全可见；放大态 0/0。
  - 详见 `docs/ITERATIONS/002-label-overlap-zero.md`。

- [x] **P3-2 海洋纹样加密** ✅ 第 8 轮完成（U-008-01）
  - 结果：`seaMarks` 20 → 32 簇（黄海·东海 5 / 南海 10 / 孟加拉湾 8 / 阿拉伯海 5 / 补充 4），绘制循环加 `(si%2)*0.8` 弧宽抖动与 `(si%3)*0.5` 行距抖动，避免 32 簇排成网点。
  - 新增判据：**水面校验**——用项目自带 `assets/vendor/land-110m.json` + `d3.geoContains` 逐点判断，剔掉落在台湾岛 `[120.6,22.4]` 与越南沿海 `[108.6,12.6]` 的两点，最终 `onLand=[]`。
  - 实测：1440/1200/390 三档 `g.sea-mark path` 均 64；可见标签 48/48/26、`overlapPairs=0`、`pinBite=0`、无横向溢出；`node --check` SYNTAX_OK。
  - 详见 `docs/ITERATIONS/008-sea-marks-denser.md`。
  - 遗留：加密靠手挑经纬点，未做构建期校验脚本（第 12 轮已补 `scripts/check-seamarks.mjs`）。

- [x] **P3-3 海纹坐标的构建期校验** ✅ 第 12 轮完成（U-012-01）
  - 结果：新增 `scripts/check-seamarks.mjs`（115 行，无 npm 依赖）。从 `assets/js/app.js` 抠出 `seaMarks` 字面量（`indexOf("var seaMarks = [")` → 配对 `];` → 去行注释 → `new Function("return " + body)()`），保持单一真相；用项目自带 `assets/vendor/land-110m.json` + `d3.geoContains` 逐点判陆地。四类检查：落陆（错误）/ 点数 ≠ 32（错误）/ 超范围 `lon [50,140] lat [-5,50]`（错误）/ 重复坐标（仅警告）。UMD 包在 node 里用 `createRequire` + `require()` 取（`vm.runInContext` 拿不到 `ctx.d3`）。
  - 验收（正反往返）：正常跑 `OK：全部落在水面上` exit=0；`sed` 把第一点改成 `[120.6, 22.4]`（台湾岛）后打印 `❌ 1 个点有问题：#0 [120.6,22.4] —— 落在陆地上` + `FAIL`、exit=1；还原后 exit=0 且 `grep -c "120.6, 22.4"` = 0。
  - 页面未受影响：1440 重载后 `g.sea-mark path` 64、`g.pin` 48、可见标签 47、`errs []`。
  - 详见 `docs/ITERATIONS/012-seamarks-check-script.md`。
  - 遗留：只判「点在心不在陆地」，判不出「离海岸不到 1px 看着像压线」；32 写死在脚本里（改密度要同步改 `EXPECT_COUNT`）；未接 CI（项目无 `package.json`），是手工命令。

- [x] **P4-19 边框对比度分级 + 81 难格子字色** ✅ 第 25 轮完成（U-025-01）
  - 结果：先分级——A 级（边框是控件唯一可辨形态，需 3:1）**全站为零**：`.tbtn` 1.47:1、`.d-nav button` 1.49:1、`.nan-cell` 1.23:1、`.tl-play` 2.05:1、`.nan-cell.done` 1.49:1，但每个控件内都有文字或字形承担识别，故全部归 B 级、**不提亮**（提到 3:1 需 alpha 0.62，整页多出一圈深褐细框，与淡墨基调冲突）。
  - 真问题在文字：`.nan-cell` 未行数字 `--ink-faint` 在格子底上只有 **3.03:1**（10px 正文按 AA 需 4.5），改 `--ink-soft` 后 **5.84:1**；已行 5.72:1、当前 5.46:1 本就达标。
  - 校验：`check-contrast.mjs` 扩成两段，格子三态的字色与底色都从样式表现读、抽屉渐变两端取更差；把字色改回 `--ink-faint` → `❌ 3.03:1`、`exit=1`，改后 `OK：…81 难格子文字最差 5.46:1`。
  - 实测：1440 下 81 格、未行 `color rgb(107, 92, 72)`、格 `31×31`、`docW [1440,1440]`；抽屉截图 `.tmp/r25-nan-grid-drawer.png`（372×774，108289 B）。
  - 遗留：`.tag` / `.trip-item` 等 B 级边框未逐条记数；真实读屏器与 `forced-colors` 未验（标待核）；10px 字号未动。
  - 详见 `docs/ITERATIONS/025-nan-grid-contrast.md`。

## P4 打磨

- [x] **P4-1 图钉可访问性** ✅ 第 6 轮完成（U-006-01）
  - 结果：`g.pin` 加 `tabindex="0"` / `role="button"` / `aria-label`（含「前传第 N 站 / 西行第 N 站」与回目区间，单回目站不写成「27 – 27」），`keydown` 接 Enter 与空格（`stopPropagation` 挡住全局「空格=播放」），`focus` 时强显本站标签（避免聚焦到一个无名圆点）；CSS `.pin:focus` 用朱砂加粗环 + 虚线外环 + 标签加粗替代被清掉的 `outline`。
  - 实测：1440 下 Tab 从长安前进到法门寺（`g.pin.journey.past`）；Enter `#s=5`→`#s=10`（两界山）、空格 `#s=10`→`#s=12`（黑风山）且 `.tl-play` 未进入播放态；焦点态 `ring` 的 `stroke rgb(176,58,46)` / `stroke-width 2px`、`halo` 虚线 `2px,2px`；复位后 48 标签 / pairs 0，火焰山放大态 37 标签 / pairs 0 / bite 0；390 下同样可用。控制台 `errs []`。
  - 详见 `docs/ITERATIONS/006-pin-keyboard-a11y.md`。

- [x] **P4-5 图钉 `aria-current` 与 roving tabindex** ✅ 第 9 轮完成（U-009-01）
  - 结果：`drawPins()` 的 `tabindex` 由常量 `0` 改为「当前站 `0` / 其余 `-1`」；`updatePins()` 每次换站搬 `tabindex` 与 `aria-current="true"`，并在**焦点原本就在图钉层**时把焦点一并搬到新站（守卫 `document.activeElement.closest("g.pin")`，不抢搜索框与工具栏的焦点）。
  - 实测：1440 下 `g.pin` 48 个、`tabindex="0"` 恰 1 个、`aria-current` 恰 1 个；`ArrowRight` 使 `#s=5`→`#s=6` 且焦点自动跟到法门寺；`Enter` 后旧站 `aria-current` 已移除（`otherCurrent=0`）；焦点在页面空白或工具栏时方向键换站不会抢焦点；火焰山放大态标签 `48/0/0` 未回归；390 下同样只有 1 个落点。
  - 详见 `docs/ITERATIONS/009-pin-roving-tabindex.md`。
  - 遗留：未做 `Home`/`End`（会与浏览器滚动键冲突，需单独一轮且只在地图内拦截）；「随行」按钮的 `aria-pressed` 已由第 13 轮 P4-7 补上；未跑真实读屏器（NVDA / VoiceOver），标为待核。

- [x] **P4-7 「随行」按钮补 `aria-pressed`** ✅ 第 13 轮完成（U-013-01）
  - 结果：`buildChars()` 渲染按钮时带 `aria-pressed="false"`；`refreshFlags()` 里算出 `var on = b.getAttribute("data-char") === S.focusChar;`，同时驱动 `.classList.toggle("on", on)` 与 `b.setAttribute("aria-pressed", on ? "true" : "false")` —— 两处共用同一判断，避免视觉态与语义态分叉。
  - 实测：1440 冷启动 5 个按钮全 `false`；点「悟空」→ `#s=5&c=wukong`、`pressedCount 1`（就是悟空）、其余 `false`；再点 → `pressedCount 0`、`onCount 0`、hash 回 `#s=5`。深链 `#s=5&c=wukong` 冷启动 `pressed: ["悟空"]`、`offPins 5`、`routeOn true`、`visible 47 / pairs 0`、`tab0 1 / cur 1`、`errs []`。390×844 点「八戒」→ `pressedCount 1`、`offPins 13`、`docW [390,390]`，再点回 0。
  - 未做：`#chars` 容器没有 `role="toolbar"` + 分组名（可选增强）；未跑真实读屏器，标为待核。
  - 详见 `docs/ITERATIONS/013-chars-aria-pressed.md`。

- [x] **P4-3 选中站标签压邻站图钉** ✅ 第 7 轮完成（U-007-01）
  - 结果：`declutter()` 的 `hits()` 拆成 `pinHit` / `labelHit`，选中站改为两趟放置 —— 第一趟要求既不压图钉也不压标签，第二趟才允许压标签、**永不允许压图钉**；非选中站仍只有一趟（行为不变）。`pinBoxes` 仍永不清（第 2 轮 bug1 结论保留）。
  - 复查纠正：旧记录里「`#s=29` 火焰山 `pinBite=1`、压 2.55 px」的样本其实是一条 `left=-60` 的**屏外**标签（「黄风岭」撞「流沙河」），不在可见区，属测量口径不严；真实可见区内本来就无压钉。
  - 实测：1440×900 / 1200×740 / 390×844 三档逐站遍历 48 站，标签缺失 0、`overlapPairs=0`、`pinBite=0`；火焰山单点 `visible 48 / pairs 0 / bite []`。
  - 详见 `docs/ITERATIONS/007-selected-label-clear-pins.md`。

- [x] **P4-6 屏外标签占用候选位** ✅ 第 10 轮完成（U-010-01）
  - 结果：`declutter()` 的放盒循环在 `pinHit(box)` 之前插入 `var EDGE = 4;` 四边裁切判断（`box.x < EDGE || box.x + box.w > W - EDGE || box.y < EDGE || box.y + box.h > H - EDGE` → `continue`），屏外与只剩半截的候选位一律作废；候选位本身一个没删（`dx: ±22` 在中段仍有效）。
  - 实测：390×844 `#s=0` 改前 `minLeft -0.7 / -15.6`（「两界山」「鹰愁涧」两个半截字），改后 `minLeft 6.9`、`offscreen 0`、可见 11 条；`#s=5` 20 → 18（少掉的正是那两枚贴边半截字）；`#s=29` 36 条、`#s=47` 36 条，均 `pairs 0 / bite 0 / offscreen 0`。1440×900 `#s=5` 仍 48 可见 / 0 / 0，`#s=29` 48 / 0 / 0，`#s=17` 38 / 0 / 0；1200×740 48 / 0 / 0 且 `sea 64`。控制台 `errs []`，`tab0 1`、`aria-current` 1 未回退。
  - 详见 `docs/ITERATIONS/010-label-onscreen-guard.md`。
  - 遗留：守卫只保证「盒不越界」，不保证「字不被浮层面板压住」（390 宽下工具栏 / 搜索框 / 随行条 / 时间轴都会盖住地图）—— 另立 P4-8。

- [x] **P4-8 把浮层面板矩形纳入标签避让** ✅ 第 11 轮完成（U-011-01 / 02 / 03）
  - 结果：`declutter()` 里新增 `panelRect()`（用 `offsetLeft/offsetTop` 累加，避开 transform 过渡）与 `panels` 快照（`.masthead` / `.toolbar` / `.search` / `.chars` / `.legend` / `#detail` / `.timeline`，外扩 `PANEL_PAD = 3`），`panelHit(box)` 作为第三个谓词，第一趟放置时躲开；`renderDetail()` 加 `.open` 之后、`.close` 回调、以及 Esc 分支各补一次 `declutter()`，使开合后的可行区立即重排。
  - **真因（三轮才定位）**：第一版用 `getComputedStyle(el).opacity === "0"` 过滤不可见面板，而 `.detail` 的 `.open` 是 `opacity` + `transform` 过渡，`declutter()` 在过渡起步时读到 `opacity: "0"`，面板被判为不存在。删掉 opacity 判断后 `panelHits` 立刻 0。教训：**过渡期的 opacity 不能当可见性判据**。
  - 实测：1440 `#s=5` 47 可见 / `pairs 0` / `obscured 0` / `offscreen 0`（隐藏 1 条「东海」，它原本就被详情卡压住）；`#s=29` 47 / 0 / 0；`#s=17` 22 / 0 / 0；1200×740 `#s=5` 47 / 0 / 0、`#s=29` 45 / 0 / 0；390×844 `#s=5` 17 / 0 / 0（`topBand 0 / botBand 0`）、`#s=29` 25 / 0 / 0、`#s=0` 11 / 0 / 0（`minLeft 6.9`）。可见数 48→47（97.9%）、390 下 18→17（94.4%），均高于 90% 门槛。
  - 直接证据：临时把 `panelHit` 短路后同页重排，1440 `#s=29` 的 `obscured` 立刻变 2（「花果山」「东海」），恢复后回 0；校验开关已删除（`grep '__noPanel'` 无命中）。
  - 未回退：`g.pin` 48、`tabindex="0"` 1 个、`aria-current` 1 个、`g.sea-mark path` 64、控制台 `errs []`、`node --check` SYNTAX_OK。
  - 详见 `docs/ITERATIONS/011-label-avoid-panels.md`。
  - 遗留：现在「12 个候选位全在面板里」的站会整条消失，而不是退化到「压住面板但可见」；390 下浮层把可用区切成两段，全图态仅 11–17 条标签 —— 已由第 16 轮 P4-9 收起详情卡解决（可用带 516px、可见 31 条）。

- [x] **P4-9 窄屏详情卡改为默认收起** ✅ 第 16 轮完成（U-016-01）
  - 结果：`S` 加 `detailExpanded`；`renderDetail()` 在关闭叉后插 `<button class="expand" aria-expanded aria-controls="detail">`，`syncExpanded()` 只在 `W <= 620` 时切 `.expanded`（宽屏自动复位，不带状态过去）；收起态只留「回目 + 站名」，换站、关闭叉、Esc 三处都复位。CSS 在 620 断点内给 `.detail:not(.expanded)` 收 padding、隐藏 `.d-modern/.d-tags/.d-sec-title/.d-body/.d-quote/.d-note/.d-nan/.d-nav`。
  - 实测：390×844 `#s=29` 收起态 `#detail` `[12,642,366,77]`（高 77 < 120）、最大连续可用地图带 **516px ≥ 400**、可见标签 **31 ≥ 20**（改前 11–17）；展开态 `[12,348,366,371]`、与时间轴间隙 24px；1440 `#s=29` 卡仍 `[1058,108,356,644]`、`.expand` 为 `none`、可见 47 / pairs 0 / obscured 0；1200 45/0/0；800×700 与 640×844 `.expand` 亦为 `none`（620–900 段行为不变）。键盘真按 Enter 可展开（`aria-expanded="true"`、焦点仍在按钮）。
  - 顺手修：回目文字从右上角关闭叉底下穿过去（390 展开态回目 ink 右界 340 vs 叉左 333，压 7px）→ 窄屏 `.d-chapter` 加 `padding-right:24px`，改后 318 vs 333；1440 无此问题，故只加在断点内。
  - 截图：`Z:\build-tmp\r16-final-390-collapsed.png`、`r16-final-390-expanded.png`。
  - 遗留：展开态 371px 仍盖半图（另立 P4-11）；620–900 段未收起（P4-12）；收起态看不到难号（P4-13）。
  - 详见 `docs/ITERATIONS/016-mobile-detail-collapsed.md`。

- [x] **P4-11 展开态详情卡仍占 371px（窄屏）** ✅ 第 17 轮完成（U-017-01）
  - 结果：620 断点内加 `.detail.expanded { max-height: 34vh; }`，配合 `.detail` 原有的 `overflow: auto` 让正文与翻页键在卡内滚；收起机制（第 16 轮）与 620–900 段均未动。
  - 实测：390×844 展开态 **371 → 287px**（卡顶 348 → 433，卡底仍 720），地图可用带 273 → **305px**；`scrollHeight 582 > clientHeight 285`、`scrollTop` 到底后 `.d-nav` 底边 701 ≤ 卡底 720；难按钮 3 枚齐在、`obscured 0`、可见标签 31、pairs 0、与时间轴间隙 24px；收起态仍 78px 且「展开 ↔ 收起」往返正常；1440 卡仍 644px、`.expand` 为 `none`、可见 47 / pairs 0；640×844 仍 388px / 12 标签（未动）。
  - 与验收口径的差异：判据原写「`.d-body` 可滚」，实际改为**整张卡滚动**（更少嵌套、避免手机双滚动嵌套），验收改记在本文与 `docs/ITERATIONS/017-mobile-detail-expanded-shorter.md`。
  - 遗留：头部不吸顶（滚动时回目/站名会滚走）；再压到 28vh 会牺牲正文；620–900 段另立 P4-12。
  - 详见 `docs/ITERATIONS/017-mobile-detail-expanded-shorter.md`。

- [x] **P4-12 620–900 段详情卡是否也该收起** ✅ 第 18 轮完成（U-018-01）
  - 结果：收起骨架整体上移到 `@media (max-width: 900px)`（那里卡片已是 `left/right:12px` 横铺，收起边界跟着抽屉走），620 断点只保留尺寸再收紧（padding 8/24/10、站名 19px、展开态 34vh）；`renderDetail()` 里 `narrow = W <= 620` 改 `sheet = W <= 900`。
  - 验收达成：640×844 `#detail` 高 **73 < 200** ✅、可见标签 **47 ≥ 20** ✅、可用带 513px、pairs 0、obscured 0；展开态 388px 且 `scrollHeight 437 > clientHeight 386` 卡内可滚；800×700 收起 73px / 47 标签；390×844 仍 78 / 31；1200×740 与 1440×900 仍是完整卡（`.expand` = `none`、可见 45 / 47）。
  - 顺手去重：上一轮把 `.detail.expanded` 与 `.d-chapter{padding-right}` 同时写在 620 与 900 两个断点里，本轮删掉 620 里的副本，避免两处真相。
  - 遗留：620–900 展开态仍是 46vh（844 高下 388px），700 高窗口下占 322px（可用带 369px 尚可）；收起态 `.expand` 与关闭叉垂直只差 2px，观感略挤。
  - 详见 `docs/ITERATIONS/018-sheet-collapse-to-900.md`。

- [x] **P4-14 「关于」里的地名分类数字跑成脚本** ✅ 第 20 轮完成（U-020-01）
  - 结果：新增 `scripts/check-stations.mjs`（156 行 / 8017 B，无 npm 依赖）。从 `data.js` 现算 48 站，按 `modern` 分五桶（判定顺序 小说虚拟 → 虚构 → 小说地名/无确指/示意位置 → 今/多比定 → 其余），再抠 `index.html` 的 `<b>N站</b>` 三段中文数字逐个比对，并要求虚构占比 ≥80%、三段 + 灵山 1 = 48。同时固化：48 站 / `chapters` 101 项 / 难簿 81 条、1–81 逐条挂站且不重挂、每站 `chapter` 与经纬度合法、西行段回目起点沿站序单调不减。
  - 验收达成：正常 `exit=0`；「八站」改「九站」→ `exit=1`（`文案「今地可考 9 站」，数据算出 8 站` + `⚠ 9+15+24+1 = 49 ≠ 48`）；长安 `modern` 改成小说地名 → `exit=1`（可考 8→7、小说地名 24→25）；灵山 `nan:[80]` → `exit=1`（`第 81 难没有挂到任何一站`）。三则均备份还原后 `exit=0`。
  - 关键取舍：判定顺序不能颠倒（西梁女国写「小说虚构 · 一说今新疆库车一带」，含「今」仍归虚构）；从页面抠数字而不在脚本里再写常量，否则变成「两个常量互相对」，测不出文案改错。
  - 遗留：分类靠 `modern` 字面关键词，改词就换桶（更稳的做法是给数据加显式 `kind` 字段，本轮不动数据模型）；文案括号里点名的地名清单未逐一对账；未接 CI，`scripts/` 两个脚本尚无合入口。
  - 详见 `docs/ITERATIONS/020-stations-check-script.md`。

- [x] **P4-15 详情卡头部吸顶** ✅ 第 21 轮完成（U-021-01、U-021-02）
  - 结果：`@media (max-width: 620px)` 里 `.detail.expanded{padding-top:0}` + `.detail.expanded .d-head{position:sticky;top:0;z-index:1;margin:0 -24px;padding:20px 24px 10px;background:#f9f2e2;border-bottom:1px solid var(--rule-soft)}`；整块 `.d-head` 吸顶实测 194px（287px 的卡只剩 93px），故把今地与站/妖标签拆进新块 `.d-meta`（随正文滚），卡头压到 106px、可读区 181px；关闭叉与展开键原本绝对定位在 `#detail` 上会跟内容滚走（滚到底 y446 → y149），已移入 `.d-head`。宽屏分隔线改挂在 `.d-meta` 底下，位置与改前一致。
  - 实测：390×844 `#s=29` 收起 78px / 展开 287px / 滚到底 headTop 434 = 卡顶 433 + 1px / 关闭叉 446、展开键 444 均可 `elementFromPoint` 命中 / `.d-nav` 底 701 ≤ 卡底 720；640×844 收起 73px、可见 47、pairs 0；1440×900 卡 `[1058,108,356,644]` 与改前一致、head border 0px + meta border 1px；`errs 0`。
  - 截图：`.tmp/r21-sticky-390.png`。
  - 遗留：回目行在 390 下折两行、吸顶略占地方；640–900 展开态未吸（随 P4-16 决定）；未跑真实读屏器，标「待核」。
  - 详见 `docs/ITERATIONS/021-detail-head-sticky.md`。

- [x] **P4-16 640–900 展开态是否再压到 40vh** ✅ 第 22 轮完成（U-022-01、U-022-02）
  - 结果：`@media (max-width: 900px)` 里加 `.detail.expanded { max-height: 40vh; padding-top: 0; }`；同时把第 21 轮只写在 620 断点的吸顶三件套（`.detail.expanded .d-head{position:sticky;top:0;…}`、`.close/.expand{z-index:3}`）整段上移，620 只留 `.detail.expanded{max-height:34vh}`。理由：抽屉（卡片横铺盖图）的边界就是 900，吸顶该跟它走；621–900 展开态同样会滚过卡口，问题同型。
  - 实测：800×700 展开 **280px**（=`40vh`）、卡内可滚 395/278、`.d-nav` 底 551 ≤ 卡底 570、`.d-head` `sticky` 且与卡顶差 1px、关闭叉 top 303 命中；640×844 388 → **338px**、头 sticky 1px、叉 389 命中；390×844 仍 78 / 287、1440 仍 644 且 `.expand` = `none`、`.d-head` = `static`；`errs 0`、两脚本 `exit=0`。
  - 截图：`.tmp/r22-800-expanded.png`（800×700 展开态滚 150px）。
  - 遗留：640–900 展开态仍占近半屏；横屏 640×360 未测；未跑真实读屏器（sticky 卡头的朗读顺序待核）。
  - 详见 `docs/ITERATIONS/022-sheet-expanded-40vh-sticky.md`。

- [x] **P4-17 收起态难号徽标的对比度量化** ✅ 第 23 轮完成（U-023-01）
  - 结果：新增 `scripts/check-contrast.mjs`（从 `style.css` 现读色值，按 WCAG 相对亮度算，四种底色取最差）；量出文字最差 **4.91:1**（达标）、边框 `rgba(176,58,46,.42)` 只有 **1.87–1.92:1**（需 3:1），把边框 alpha 提到 **0.8** → 最差 **3.63:1**。
  - 实测：改前脚本 `exit=1` 并打印「边框对比度最差 1.87:1 < 3:1」，改后 `OK：文字最差 4.91:1、边框最差 3.54:1`、`exit=0`；390×844 徽标 rect `[172,259,688,18]`、`borderTopColor rgba(176, 58, 46, 0.8)`、收起态仍 78px、`docW [390,390]`、`errs 0`；`check-stations` / `check-seamarks` / `node --check` 全通过。
  - 截图：`.tmp/r23-badge-contrast.png`。
  - 遗留：只量比色未量观感；同页其它 `rgba(176,58,46,.28–.45)` 的次要边框未纳入；未测 `forced-colors` 高对比模式。
  - 详见 `docs/ITERATIONS/023-nanbadge-contrast.md`。

- [x] **P4-18 三条校验脚本合成一把跑** ✅ 第 24 轮完成（U-024-01）
  - 结果：新增 `scripts/check-all.mjs`（58 行 / 2650 B，无依赖）——`spawnSync` 逐条跑 `check-stations` / `check-seamarks` / `check-contrast`，原样转印输出，末尾 `✅/❌ 文件名 通过|退出码 N` 汇总表，任一失败 `exit 1` 且不短路。
  - 实测：正向 `OK：3 项全通过`、`exit=0`；把海纹首点改成台湾岛 `[120.6,22.4]` → `❌ check-seamarks.mjs 退出码 1`、另两条仍 ✅、`exit=1`；还原后 `grep -c '120.6, 22.4'` = 0 且再次全通过。
  - 取舍：不 import 三条脚本（它们生来是「打印 + exit code」），包进程让「单跑」与「合跑」走同一条路径；不加 `package.json`（纯静态站，会误导以为要 install）。
  - 遗留：未接 CI / pre-commit；汇总表不带警告级；新增脚本需手动往 `CHECKS` 加一行（故意，避免把临时调试脚本也跑进去）。
  - 详见 `docs/ITERATIONS/024-check-all.md`。

- [x] **P4-13 收起态补「难号徽标」** ✅ 第 19 轮完成（U-019-01）
  - 结果：新增 `nanBadgeLabel(n)` 把 `n.nan` 压成紧凑区间（连续 → `第 47 – 49 难`，不连续 → `第 36 – 38 · 81 难`），徽标 `<span class="d-nanbadge">` 塞进 `h3.d-name` 内部，只在 `.detail:not(.expanded)` 显示（展开态正文已有「此站之难」三个按钮）；`h3` 加 `aria-label="站名，第 N 难"`；前传五站无难号不出徽标。
  - 验收达成：390×844 `#s=29` 收起态可见「第 47 – 49 难」，徽标 `[172,688,87,18]` 右界 259 vs 关闭叉左界 343（`getBoundingClientRect` 不相交）；卡片仍 78px、可见标签 31、pairs 0。640×844 `#s=47` 徽标「第 80 – 81 难」右 257 vs 叉 593、卡片仍 73px、可见 46。1440×900 徽标 `display:none`、卡片仍 644px、可见 47。
  - 未复用 `nanLabel()` 的原因：它生成「第 36 – 38 难 · 第 81 难（回程）」18 字，塞不进 22px 站名行。
  - 遗留：徽标只写难号不写难名（收起态塞不下）；未跑真实读屏器标待核；11px 徽标对宣纸底的对比度未量化。
  - 详见 `docs/ITERATIONS/019-detail-nan-badge.md`。

- [x] **P4-10 标签在面板里无位可放时退化显示** ✅ 第 15 轮完成（U-015-01）
  - 结果：`declutter()` 的「两趟」改成显式模式表 `MODES` —— 选中站三档（严格 → 允许压别的标签 → 允许压面板），其它站仍只有严格一档；压到面板上的标签打 `.paneled` 类，`assets/css/style.css` 里 `.pinlabel.paneled .pin-label` 把描边 3px→4.4px×U、字色压暗，让字从半透面板上「挖」出来。
  - 关键取舍（第一版失败）：初版把第 2 档对**所有站**开放，900×420 实测 `visible 35 / obscured 35 / paneled 35` —— 35 条标签全糊在详情卡正文上，比藏起来更难读。收窄成仅选中站后同一视口 `visible 1 / obscured 1（=火焰山自己）/ paneled [29]`。
  - 实测：900×420 `#s=29` 选中站标签 `display` 非 none、带 `.paneled`，计算样式 `stroke-width 3.608px`、`stroke rgba(249,242,227,0.99)`、`fill rgba(43,31,16,0.94)`；1440 `#s=5` 47/0/0/0、1440 `#s=29` 25/0/0/0、1200 45/0/0/0、390 17/0/0/0（pairs/obscured/offscreen 全 0）；`g.pin` 48、`tabindex="0"` 1、`aria-current` 1、`.sea-mark path` 64、`errs []`；`node --check` SYNTAX_OK。截图 `Z:\build-tmp\r15-900x420.png`（失败版）、`r15-paneled.png`（最终版）。
  - **判据修订（本轮自行改判，记录在案）**：原验收写「`obscured` 允许 > 0 但每条在屏标签都显示」，实测证明这条判据是错的 —— 900×420 下 35 条标签全部压到详情卡正文上，读者什么也读不出。改成「极端视口下**选中站**的标签必须可见且带 `.paneled`，其余站照旧隐藏」，验收见上。
  - 遗留：`.paneled` 未做 WCAG 对比度量化（标待核）；极端视口下只有选中站 1 条标签可见，窄屏「可用地图面积被浮层切碎」的根因仍在 P4-9。
  - 详见 `docs/ITERATIONS/015-label-paneled-fallback.md`。

- [x] **P4-2 关于模态补「虚构地名比例」** ✅ 第 14 轮完成（U-014-01）
  - 结果：按 `data.js` 的 `modern` 字段现算出 48 站分类 —— 今地可考 8（花果山、长安、法门寺、巩州、河州卫、通天河、火焰山、天竺国）、虚构境域与国度 15（方寸山/东海/幽冥界/天庭 + 宝象/乌鸡/车迟/西梁女/祭赛/朱紫/比丘/灭法/凤仙/玉华/金平）、小说地名 24、灵山另有出典 1，虚构合计 81.3%。在「今天能见到的取经路线图都是后人画的」之后新增一段逐档列举站名的说明，写「八站 / 十五站 / 二十四站」「八成以上」。
  - 教训：初稿心算写成「二十五站…六成以上」，跑 node 统计脚本核出后改正 —— 文案数字必须跑脚本。
  - 实测：1440 `.modal-card` `[top 113, h 693]`、`scrollHeight 691 = clientHeight 691` 不溢出、末段 bottom 763 < 卡底 806、`errs []`；390 `.modal-card` `[12,111,366,641]`、`scrollHeight 1191 > clientHeight 639` 走既有 `overflow-y:auto` 卡内滚、`docW [390,390]`、`errs []`。截图 `Z:\build-tmp\r14-about-1440.png`、`r14-about-390.png`。
  - 遗留：「八站」里花果山与天竺国的比定有异说，属待核；分类口径未脚本固化（可选加 `scripts/check-about-stats.mjs`）。
  - 详见 `docs/ITERATIONS/014-about-fictional-ratio.md`。

- [x] **P4-4 窄屏详情卡与时间轴重叠 26 px** ✅ 第 5 轮完成（U-005-01）
  - 结果：620px 断点下 `.detail` 的 `bottom` 92→124px、`.timeline` 高 118→100px（并删掉该断点里重复的 `.timeline { padding: … }` 声明）。两侧同时让，卡片净让出 32px、时间轴退 18px。
  - 实测：390×844 下 `#detail` `[12,349,366,371]`（底 720）、`.timeline` `[0,744,390,100]`、间隙 24px；`elementFromPoint(195,745)` 由改前的渐变层变成 `svg`（地图）；滚到底 `.d-nav` y 651–700 全在卡内、「此站之难」y 584–631 完整可见。1440 gap=0、800 gap=12、620 gap=24，标签仍 48/0/0。
  - 详见 `docs/ITERATIONS/005-mobile-detail-gap.md`。

- [x] **P4-20 手机横屏（640×360）浮层叠在一起** ✅ 第 26 轮完成（U-026-01）
  - 结果：`assets/css/style.css` 新增 `@media (max-height: 480px)`（放在 620 断点之前）：`.timeline { height: 84px }`、`.detail { bottom: 96px }`、`.detail.expanded { max-height: 30vh }`、`.chars { top: 68px }` + `.chars-hint { display: none }`。问题不是「小屏」而是「矮屏」：900 断点把卡片放底部、`bottom:130px` 给 118px 的时间轴让路，360 高时「随行」条（900 断点写死 `top:152`）正好压在卡片顶（157）上，叠 31px。
  - 实测 640×360（`.tmp/frame.html?w=640&h=360&h2=s=29`）：工具栏 34–64、随行条 68–100、搜索框 108–139、收起卡 191–264（73px）、时间轴 276–360（84px）；四处间隙 4 / 8 / 52 / 12。连续地图带 0 → **52px**、可见标签 8 → **14**、pairs 0、`docW [640,640]`。展开态 108px / top 156 / 与搜索框 17px / 卡内可滚 446>106 / 卡头 sticky 差 -2px / 收起回 73。
  - 无回归：390×844 卡 `[12,642,366,78]`、时间轴 `100px @744`、可见 31；1440×900 卡 `[1058,108,356,644]`、时间轴 118、随行条 `[34,620,268,36]`、可见 47、`.expand` none。
  - 试过又回退：给 `.drawer` 加 `overflow-y:auto` + `.drawer-head` 吸顶（实测抽屉自身 `scrollHeight` 仍 360，滚动其实发生在内部 `.drawer-body`，属无效猜测；且 sticky 头用了非调色板的 `#f7eedb`）。
  - 截图 `.tmp/r26-640x360.png`（640×360，274712 B，sha256 bfddc7c3…）。本轮结论以数值为准，未逐像素判读截图。
  - 详见 `docs/ITERATIONS/026-landscape-short-viewport.md`。

- [x] **P4-21 矮屏（≤480 高）「八十一难」抽屉的可滚动性 ✅ 第 27 轮结论：可用（U-027-01，无代码改动）**
  - 结论：抽屉能滚、末格可达，`scrollIntoView` + `elementFromPoint` 命中 `BUTTON.nan-cell.last`（文本 `81`）。
  - 根因（为什么上一轮两次数据矛盾）：`document.querySelector(".drawer-body")` **命中的是行程表**抽屉的 body（`1694 / 289`），难抽屉另有自己的一份（`657 / 289`）。`scrollTop` 写错容器，难格当然不动。
  - 换作用域选择器后的实测（640×360）：`#drawer-nan .drawer-body` 的 `scrollTop` 0 → 368，末格 `rect.top` **477 → 109**；`.nan-foot` 停在 **263**（视口 360 内）——**末格与进度条同屏**，不需要再滚一屏。
  - 肉眼：`.tmp/r27-640-drawer-bottom.png` 滚到底可见 64–81 格（`81` 金框）、「九九归真」详情与出处，抽屉表头固定。
  - 详见 `docs/ITERATIONS/027-drawer-scroll-verdict.md`。

- [x] **P4-23 矮屏抽屉表头 ✅ 第 28 轮完成（U-028-01）——前提纠正：表头本来就固定**
  - 纠正：`.drawer` 是 flex 列，`.drawer-head` 与滚动区 `.drawer-body` 是兄弟，`position: static` 却恒定在 y0；`elementFromPoint` 命中关闭叉（`closeHit true`），滚 900px 也不动。原条目「滚到中段看不到标题」不成立。
  - 真问题：表头 71px（`padding: 26px 26px 16px`）在 360 高的屏上吃掉五分之一，正文只剩 289px。
  - 改动：`@media (max-height: 480px)` 里 `.drawer-head { padding: 10px 18px 8px }` + `.drawer-head .close { padding: 2px 0 2px 10px }`（标题字号不动）。
  - 实测 640×360：表头 71 → **45px**、正文 289 → **315px**、行程表需滚 1405 → 1379px、难簿末格 109–139 与 `.nan-foot` 263–322 仍同屏（`isLast true`）。
  - 无回归：390×844 与 1440×900 不命中断点，`padding` 仍 `26px 26px 16px`、表头仍 71px。
  - 截图 `.tmp/r28-640-trip-head.png`；详见 `docs/ITERATIONS/028-drawer-head-compact-short.md`。

- [ ] **P4-22 640×360 的地图带还能再挤一段**（25 min）
  - 现状：52px（搜索框底 139 → 卡顶 191）。改法候选：矮屏把搜索框并进工具栏（`#q` 缩成图标，点开才展开）、随行条缩成 5 个只含首字的方钮、收起卡再压到 64px。
  - 验收：640×360 下地图带 ≥ 96px、可见标签 ≥ 20、五个浮层仍不重叠、1440 / 390 不受影响。
  - 风险：搜索框收起会削弱「回目直达」的可发现性（第 3 轮），需保留图标与 title。

- [x] **P5-1 安装与骨架** ✅ 第 29 轮完成（U-029-01 / 02 / 03）
  - 结果：`scenes/vendor/` 本地化 three r187（`three.module.js` 658900 B + **`three.core.js` 1474799 B**）与 papercraft 运行时（`papercraft/harness.js` 原样未改、五个 `lib/*.js`、`lights.json`）；`scenes/huoyan/{index.html,scene.js}` 打开即空白纸地面。
  - 实测（ego 1256×774）：`__papercraft.ready === true`、`cards() = 1`（占位立牌）、`buildMs 168`、`pieces 1`、`clips() = []`、canvas + webgl2 true、`#fallback.hidden true`；`performance` 资源 host 集合 = `{127.0.0.1:8123}`，无 CDN。
  - 踩坑：只放 `three.module.js` 会整页白屏——r187 的 `three.module.js` 里有 `import './three.core.js'`，且模块解析失败时模块体不执行，`try/catch` 与 `#fallback` 都不会触发；判断法：`performance` 里看得到 `three.core.js` 被请求、但页面无 canvas。
  - 地面：三层淡染 + 520 条两折龟裂 + 26 条风卷灰线；washes 由四色（0.3/0.2/0.12）调成两色（0.16/0.10/0.05），平均色 219,179,102 → **226,196,131**（仍比宣纸深一档，暖主光所致，P5-3 定色）。
  - 占位立牌：人形轮廓 8 点 + 朱砂金箍 / 赭红腰带两道带，`H.popup(...standee(), {x:0,z:3,scale:3.6/3.24})` + `H.setHero(hero,{stride:()=>{}})`——**`H.start()` 没有 hero 会 throw**，所以骨架页也得先有个可挂载对象；P5-4 换成 T 型悟空。
  - 截图 `Z:/build-tmp/r29-p5-1-paper.png`（调后）与 `r29-p5-1-blank.png`（调前）；详见 `docs/ITERATIONS/029-p5-1-paper-skeleton.md`。
- [x] **P5-2 paper spec 与测试卡** ✅ 第 30 轮完成（U-030-01）
  - `scenes/huoyan/README.md`（41 行）写入实现文档 §5 的 15 行 spec 原文 + 「已落地与 spec 的偏差表」+ 三种打开方式。
  - `scene.js` 的 `if (H.flags.TEST)` 印三张 `scale:1.6` 方卡：①单色 `C.deep`（哑光/纸纹）②双色 `deep`+`ochre`（裁切接缝）③`C.ember` + `holes`（切口内缘）；坐标 `z=0, x=-5/0/5`（首版 `z=6` 落在 `?test` 取景框外，`cards()` 只有 1）。
  - 实测：`?test` → `cards 4 / pieces 4 / buildMs 224 / clips [] / host 仅本地`；普通入口 `cards 1 / buildMs 170`。Pillow：纸面平均 221,188,124、暗部 5.98%、近纯白 0.00%。
  - **遗留**：厚度 harness 固定 0.08 vs spec 0.072（差 11%，先接受）；本轮 `read_image` 只回元数据、像素未进上下文，厚度/裁切边的肉眼判读**未完成**（记录里已注明未杜撰），下轮补判。详见 `docs/ITERATIONS/030-p5-2-paper-spec-test-cards.md`。

- [x] **P5-3 地面与八百里火墙 + 芭蕉洞** ✅ 第 31 轮完成（U-031-01）
  - 落地：地面 18 片径向渐变焦痕（`z ∈ [-44,-18]`，集中在火墙前）；火墙是「9 点纸焰轮廓 × 三层 36/40/44 片」，`z -28/-25/-22`、`res 0.5/0.55/0.6`；芭蕉洞 = 拱门 `holes` 挖穿的赭石立面 + 背后一张暗纸 + 洞顶压边 + 两盏 `C.gold` 纸灯 + 两片 `C.jade` 芭蕉叶（`x 22 / z -18.6`）。
  - 实测：`ready true`、`cards 123`（验收区间 100–250 ✅）、`pieces 128`、`buildMs 281`（< 5 s ✅）、`clips []`、host 仅 `127.0.0.1:8123`；Pillow：y40 (117,51,20) → y240+ (226,198,132)、火色 11.07%、近纯白 0.00%，截图 `Z:/build-tmp/r31-p5-3-wall-2.png`。
  - 纠偏：首版火墙放 `z=-42/-37/-33, halfW 46` 整片出框（`cards 34`）→ 收进视野才 123。教训：**验收指标是「取景框内的立卡数」，不是总片数**，摆位先按 `dist 66 / pitch 46 / fov 28` 估视锥。
  - 遗留：① ✅ 第 51 轮近层 44→26（`cards 199`、`printDetail 0.047`，观感待判读）；② ✅ 第 51 轮焦痕改拒绝采样按距取概率；③ ✅ 第 52 轮改四层收口箱折；④ ✅ 第 52 轮切口内缘挖出 0.12 描边环。
  - 详见 `docs/ITERATIONS/031-p5-3-firewall-cave.md`。

- [x] **P5-4 T 型悟空纸模 + 走动寻路**（20 min）✅ 第 32 轮完成（U-032-01）
  - 落地：新建 `scenes/huoyan/wukong.js`（238 行 / 11581 B）11 张卡（躯干 / 躯干侧 / 头 / 头侧 / 金箍 / 双臂 / 双腿 / 虎皮裙 / 金箍棒，每张 z 唯一）+ `stride(walked, gait)`（半步 1.044、摆幅上限 0.5 rad、支撑相 `A*(3-2u)` 线性 / 摆动相 smoothstep、臂反相 0.34、起伏 3.3% H、躯干滞后）；`scene.js` 12577 B / 235 行接入纸偶（删掉 `standee()` 占位立牌，不留死代码）+ 点击寻路（`Raycaster` + 水平 `Plane` → 落点夹进 `walkArea` 内缩 0.6；`H.onStep` 每帧 `__papercraft.steer`，距离 < 0.35 松杆）。
  - 实测（ego 1256×774）：`ready true / cards 133 / pieces 127 / buildMs 337 / clips []`；`walkPath([[0,3],[6,1],[-6,-10]])` → `reached 3 / of 3 / blockedBy null / on "page"`；点击 canvas (62%,72%) 后 `(0,3) → (3.12,3.27) → (4.54,3.39)` 停住；host 仅 `127.0.0.1:8123`。
  - 互穿归零：初版 `clips()` 4 对，靠「裙 z 0.06→0.14（离开躯干层）、裙外扩 0.44→0.40、肩枢轴 0.56→0.60（手臂内缘 0.47 与裙 0.40 留 0.07）、金箍棒 z −0.34→−0.50」修掉。
  - 三个 API 坑（写进记录）：① `H.setHero(h)` 的 `h` 必须是句柄 `{ group, pivot }`（Group 会报 `reading 'position'` 整页兜底）；② `heroPos` / `steer` 只挂在 `window.__papercraft`，`H` 上没有；③ `play: false` 时 `flags.WALK` 为 false，`walkStep` 不跑 → 点击与 WASD 都不动，必须 `play: true`。
  - 走动三帧 `Z:/build-tmp/r32-walk-{a,b,c}.png`，墨色占比 0.719 / 0.702 / 0.674%，帧间差 5.80% 与 5.70%（证明四肢在动）。**`read_image` 仍只回元数据，未做肉眼判读与 A/B 盲评**（上一轮无主角、构图对象不同）。
  - 遗留：火墙遮挡主角未验（`sight()` 报 `plain 0 / blockers 0`，火墙未登记）；主角 3.6 与正式取景比例未调；寻路是单点直线（遇 solid 会停，绕行要用 `walkPath`）；`look()` 后相机跟随未验。详见 `docs/ITERATIONS/032-p5-4-wukong-walk.md`。
- [x] **P5-5 人物与纸片对话**（20 min）✅ 第 33 轮完成（U-033-01）
  - 落地：`scenes/huoyan/people.js`（罗刹女/牛魔王/猪八戒各 6 张卡，`H.popup` + 躯干 `solid` 防穿模 + `userData.personId` 供拾取）；`scenes/shared/paper-ui.css`（纤维贴图 / 双细墨框 / 厚度+接触+远影三条 box-shadow / 从下方抽出 0.34s / `prefers-reduced-motion` / 520px 窄屏）+ `dialog.js`（逐字 26ms、点击/Enter/空格翻页、Esc 关闭、末句「收起」、`onClose` 恢复走动）；`scene.js` 拾取优先级（人物 > 地面）、`frozen` 截断走动并 `steer(0,0)`、`E` 说最近的人（3.4 步内）、`window.__huoyan` 验收钩子。
  - 实测：`cards 133 → 151 / pieces 145 / buildMs 372 / clips []`；点 `(816,383)` 命中猪八戒且主角未动（`(0,3)`）；对话开着点地面不动，关后走到 `(9.8,3.17)`；`place(-8.6,-11.2)+E` → 罗刹女；翻页 1/3→2/3→3/3（收起）→关闭，`frozen false`；截图 `Z:/build-tmp/r33-dialog-{luocha,niujia,bajie}.png` + `r33-overview.png`。
  - 遗留：三句台词都标「示例台词，待用户确认」并注回目（不是原文）；说话人不转向主角；≤520px 对话框与 walkArea 下半重叠未验；`window.__huoyan` 正式页也暴露（P5-6 应收成只读或 `?test` 下才给）；**无肉眼判读与 A/B 盲评**（`read_image` 只回元数据）。详见 033。
- [x] **P5-6 主站集成**（20 min）✅ 第 34 轮完成（U-034-01）
  - 落地：`renderDetail()` 里火焰山专属 `.d-scene-btn`（「进入纸模场景 / 3D · 需 WebGL」）；`index.html` 加 `.scene-modal#scene-modal[hidden] > .scene-sheet`（40px 头 + `.scene-frame` + 提示条）；`app.js` 新增 `openScene/closeScene`（惰性 iframe、`?embed=1`、`body.scene-open`、`writeHash` 增删 `scene=`、关闭写 `about:blank` 卸 WebGL、焦点回收）；`readHash/init` 支持 `#s=29&scene=huoyan` 深链；父文档键盘在场景开着时只认 Esc 且**分两层**（先收场景内纸片对话）。
  - 实测：1440 sheet `[29,45,1382,810]`、canvas 1380×742、`ready true / cards 156 / buildMs 444 / clips []`；1200 `[24,37,1152,666]`；390 全屏 `[0,0,390,844]`；三档 `pins 48 / tab0 1 / ariaCur 1 / seaPaths 64`；行程表 48 项 + 2 组、难簿 81 格、人物 5 条；点火前 `threeReqs []`；关掉后 `hash #s=29`、`src about:blank`、焦点回按钮；Pillow sheet 头 (243,231,205)、遮罩 (113,102,86)、火墙带 (139,47,17)、近纯白 0.00%。
  - 遗留：没看见画面（`read_image` 只回元数据，无 A/B 盲评）；390 全屏是假设（规格是 96vw×90vh）；`?embed=1` 尚无行为差异；深链给不存在的场景 id 会加载 404 不兜底；`window.__huoyan` 嵌入时仍暴露。详见 034。
- [x] **P5-7 验收与归档**（25 min）✅ 第 35 轮完成（U-035-01）
  - 落地：`docs/ITERATIONS/035-p5-7-acceptance.md`（§8 十条逐条结论 + 三张图的 `measure.py` 表 + 模板说明）；`scenes/_template/`（`index.html` 1724 B / `scene.js` 约 9.6 K / `README.md`：四处「改这里」+ 十条验收清单 + 基线数字 + 互穿坑）；`README.md` 把「双击 `index.html` 即可打开」改成「需要本地静态服务器」并写明原因。
  - §8 结果：**9 PASS / 1 FAIL**。PASS——`cards 151 / clips []`、`buildMs 322–444`、`focusHeight 0.62 / 0.602`、`shadowHex #81250A / #581002`（暖赭，方向未肉眼判）、`walkPath 3/3 blockedBy null`、走动三帧帧差 31.90% / 58.50%、三人对话 + Esc 两层、主站三档 48/1/1/64 无回归、无 CDN。FAIL——第 10 条「主站 `file://` 双击打开」：ego 打开 file:// 直接落 `chrome-error://`，且 `assets/js/app.js:1432-1433` 的 `fetch()` 在 `file://` 下被拦，地图空白。
  - 模板实测：`ready true / cards 7 / buildMs 166 / clips []`、`walkPath 3/3`；首版 `clips()` 报 `hero-torso/hero-arm-l through` 与 `hero-arm-r overlap`，卡宽 ±0.14→±0.12、肩 ±0.52→±0.60、`dz -0.24` 后归零。
  - 遗留：`measure.py` 六项 WARN（`lumaP50 0.765`、`toothRms 0.0098`、`flatPct 98.5`、`printDetail 0.002`、`localContrast 0.019`、`barePct 98.4`）= 纸面印花几乎为零；`capture.py` 需 Playwright（本机没装，截图手工截，`ab_sheet.py` 未跑）；390 全屏仍未肉眼确认。详见 035。
- [x] **P5-8 给纸面印纹样 + 压曝光**（20 min）✅ 第 36 轮完成一半（U-036-01，地面部分）
  - 落地：`H.printGround` 的 `washes` 由两色 0.16/0.10/0.05 改三色 0.22/0.14/0.07（最粗档落 `C.ochreD`）；新增四层印——140 片中尺度色斑、200 处砾石簇（每簇 4–8 颗，径 1.0–2.9 px，α0.18–0.48）、760 条风蚀短划、1200 粒纸纤维。
  - 实测：`lumaP50 0.765→0.712` ✅、`toothRms 0.0098→0.0106` ✅（两项回门限内，WARN 6→4）；`flatPct 98.5→95.9`、`printDetail 0.002→0.003`、`localContrast 0.019→0.022`、`barePct 98.4→98.3` 仍在外。不回退：`cards 151 / clips [] / buildMs 442`、`walkPath 3/3`、`E` 开牛魔王 `1/3` 关后 `frozen false`。
  - 结论（写进 036）：`printDetail` 量的是**清晰带边缘密度**（`mean(梯度>0.10)`），荒漠空地面靠印纹顶不到 0.06；且截图 1256 宽被 `measure` 重采样到 1600，1 px 细砂会糊掉——母题必须 ≥2 px 或按 1600 出图。
  - [x] **第 50 轮补齐**：纸件本身（悟空 18 卡 / 三人 18 卡 / 火墙 120 片 / 洞 3 层）已印纹样（`print.js?v=5`），卡面边缘密度 0.0734 → 0.1870；
  - 遗留：`printDetail`/`localContrast`/`barePct` 需靠立更多纸件（见 P5-9）；无肉眼判读、无 A/B。详见 036。
- [ ] **P5-4c 按设定图重做悟空（第 45 轮已出铰链 v3，待人工判读）**（25 min）：042 的 16 卡版本在 `9d988df`（`git checkout 9d988df -- scenes/huoyan/wukong.js`）。重做前先读 `docs/PAPERCRAFT-CHARACTER-SPEC.md`；缺口是视觉通道——要么由人给逐条文字描述（冠形/上衣层数/下摆/持棒方式/主色），要么等能看图。顺带把回退丢掉的「髋枢轴 1.06→1.04」重新带上（脚底 0.04 → 0.000）。
- [ ] **P5-4d 悟空 v3 的观感回归**（15 min）：第 45 轮的铰链版（18 卡）已过全部可量化门槛，但使用者的判读还没回填。要看就看 `.tmp/r45-wukong-v3-scene.png` 与 `-test2.png`；若嫌比例偏卡通，先调头/躯干的高度比（头 0.88 高，躯干 1.34），再调披膊外缘 0.74。

- [x] **P5-4b 按设定图重做悟空纸偶**（第 42 轮 U-042-01）✅ 11 卡 → 16 卡、配色换暖红褐族、`clips []`；**上色成像未验证**（图像通道只回元数据），形体像不像需用户看图定。
  - 遗留：卡面纹理仅 28×35 px（`ppu 22` 量级）——**已由第 49 轮解决**（U-049-01/02）：悟空 `CARD_RES=3.4`（136 px/单位，躯干 115×183）、三人 `res 2.8`（136–189 px 宽），`buildMs 649 < 2000`、`cards 217`、`clips []`；只剩小腿这类窄卡（0.34 单位宽）仍只有 47×79 px，属卡片尺寸所限。
- [x] **P5-9 前景纸件（清晰带里的成组体块）**（第 46 轮完成）：`scenes/huoyan/props.js` 16 组 77 片（岩石/枯草/断旗杆/骨片）+ 10 粒碎纸砾，`scene.js` 近地印刷 240 石面 / 340 簇砾石 / 320 条干裂划。实测 `printDetail 0.008 → 0.044`、`flatPct 92.5 → 63.4`（PASS）、`barePct 93.2 → 72.9`、`localContrast 0.026 → 0.059`，**17 PASS / 3 WARN**；`cards 217`、`clips []`、`buildMs 464`、`walkPath 3/3`。未达 0.06：按验收允许的另一条路，已在 `docs/ITERATIONS/046-foreground-props.md` 写下「这条门限为何不适用于空场荒漠」的书面结论（四点论证）。版本 `props.js?v=2`、`scene.js?v=51`。
- [ ] **P4-24 主站 `file://` 双击可开**（25 min，需改 `assets/`）：把 `assets/vendor/{land,countries}-110m.json` 包成 `assets/vendor/geo-inline.js`（`window.__LAND` / `window.__COUNTRIES`），`loadGeodata()` 优先读全局变量、缺了再 `fetch`；`index.html` 加一行 `<script src="assets/vendor/geo-inline.js">`。验收：`file://` 打开有底图、48 图钉、控制台无 CORS 报错；http 下与现在等价（`check-all` 3 项仍通过）。
- [ ] **P4-25 给 `capture.py` 补不依赖 Playwright 的路径**（15 min）：本机 `python` 无 playwright，`scripts/papercraft/capture.py` 跑不起来。加 `--from-dir` 模式（读现有截图，只做裁切/并排/量化），`ab_sheet.py` 也才有输入。验收：`capture.py --help` 有该参数，给 `.tmp/r35-overview.png` 能出一张并排图。
### 用户五条（第 37 轮，2026-11-27）

- [x] **U-037-01 玄奘实路显示**：根因不在数据——`drawRoutes()` 只在重画时挂 `.on`，`refreshFlags()` 只切 `display`；`.route-real{opacity:0}`。在 `refreshFlags()` 补 `.classed("on", S.showReal)` 与 `.real-label` 的 opacity。验证：`class="route-real on"`、computed `opacity 0.78`、15 个标签 `opacity 1`。
- [x] **U-037-02 站点不再均距**：43 站 `lon/lat` 按回序重排为 1.2–3.5° 不等距走廊（含 27–29 站向东小回折）。已知取舍：仍是**示意位置**，与真实地理不完全重合（见 P5 之外的新条目「站点与真实地理对齐」）。
- [x] **U-037-03 古图/今图切换**：同一 svg 多一层 `.modern-layer`（25 个现代城市点 `modernCities` + 境线/陆地换色），古图的山形与海纹在今图隐藏；`#stage[data-base]` + 按钮「古图/今图」+ hash `base=modern`。验证：`data-base modern`、`.mcity 25`、`.regions` 隐藏、西安/宝鸡/兰州…投影坐标正确。
- [x] **U-037-04 站上纸人队列**（**U-037-07 修正**：用户 2026-11-27 明确「不是每站都摆，而是行进到哪站就在哪站显示此刻有几人」）→ `.party` 默认 `display:none`、`.pin.active .party{display:inline}`，`declutter()` 的 `partyH` 只对当前站计 15*U；`partyOf(n)` 支持 `characters[].absent` 回目区间（悟空 `[[27,30],[56,57]]`：第二十七回被逐、第三十一回归；第五十六回被逐、第五十八回归）。验证：白虎岭（第 27 回）4 人（无悟空）、平顶山（第 32 回）5 人、真假美猴王（第 56–58 回）4 人、火焰山 5 人；任意时刻可见的 `.party` 只有 1 组。
- [x] **纪年层（A+C）** ✅ 第 38 轮完成（U-038-01，用户「走 A + C」）。两处硬锚点（贞观十三年·长安出关 / 历十四年·五千零四十八日·抵灵山）+ 双轨对照行「小说 13→27 · 十四年 | 史实 629—645 · 约十七年」；默认开，`#s=&era=0` 可关；长安/灵山详情卡带「史无此年」注；关于弹窗补「回序轴不是历法轴」并订正「十九年→约十七年」。实测：锚点 2 枚、对照行 358×11px 与锚点/场景签零重叠、390 下对照行收起、`era=0` 深链生效。详见 `docs/ITERATIONS/038-era-dual-track.md`、`docs/RESEARCH-chronology.md`。
- [x] **逐回在场名单（首批）** ✅ 第 39 轮完成（U-039-01/02/03）
  - 做法：`characters[].present` 记「在不在取经队伍」（含端点回目区间，已含悟空两段被逐）；另立 `away` 记「第几回、谁、去做什么」的**暂时分期**，详情卡按站点回目区间取交集显示「分期」一行，且分期者在那一站不计入「同行」。
  - 首批三条：第 32 回 八戒独自巡山（莲花洞木母逢灾）、第 57 回 沙僧独自去花果山讨行李、第 72 回 唐僧独自化斋（盘丝洞七情迷本）。
  - 实测：平顶山同行无八戒 / 真假美猴王同行无沙僧 / 盘丝洞同行无唐僧；长安、火焰山无「分期」行。详见 `docs/ITERATIONS/039-away-roster.md`。
  - 遗留：一站跨多回时仍按整站标一笔（每条已写明「第几回」）；「同行」按整站区间求交，真假美猴王 56–58 里悟空 58 才归队却算在场。
- [x] **逐回在场名单（续）** ✅ 第 40 轮补被摄五条 + 纸人 `away` 态；✅ 第 54 轮做到**回内粒度**（`chapters` 连回 + `charStatus` 部分离队 + 纸人三档 + 「第 58 回归队」）。
  - 结论：真假美猴王 56–57 回无悟空、58 回归队；第 43 回唐僧与八戒同被鼍龙摄走（回目「黑河妖孽擒僧去」）。
  - **存疑未决**：第 76 回八戒、沙僧是否同被擒 —— 回目「心神居舍魔归性　木母同降怪体真」只能读出八戒有戏，读不出是否被擒，按不杜撰的规矩**不写入 `away`**，待能逐字核第 76–77 回原文时补。
- [x] **U-037-05 NPC 名牌 + 走近说话**：`.pd-tags` DOM 纸签层，每帧 `project` 定位；2.4 步自动弹、3.2 步重新上膛。验证：4 枚名牌坐标合理；`place(-8.6,-11.2)` → 罗刹女 1/3；关闭后不重弹、走远再回来又弹。
- [x] **U-037-06 进火焰山站自动摊开纸模 + 纸幕转场**：`enterSceneFor` + `SCENE_STATIONS` + `playSceneEnter`（`.scene-veil` 0.34s 铺开 / 0.24s 化开，`prefers-reduced-motion` 跳过）；图钉、行程表、已选中站再点三条路径都传 `{enter:true}`。验证：三条路径 `#s=29&scene=huoyan`、veil z61 出现后移除、`ready true / cards 156`；长安与键盘/时间轴不触发。
- [ ] **站点与真实地理对齐**（30 min）：火焰山（真实吐鲁番 89.19/42.95）、车迟/西梁女国等若要对齐需逐站改并接受路线折返；也可给每站加「真实参照点」副标注而不动路线。先确认用户要哪种。
- [x] **台词按回目改写** ✅ 第 48 轮完成（U-048-01/02/03）：九句台词按第 59–61 回情节重写、每句句末标回目；对话徽标由「示例，待用户确认」改为按人物写「据第 59–60 回改写，非原文」（`dialog.js` 新增 `entry.badge`，缺省仍为示例）；`people.js?v=2`、`dialog.js?v=2`、`scene.js?v=52`。实测三人徽标与首句、罗刹女 1/3→3/3→收起、`?test` 仍可开（cards 106/217 视取景）、`check-all` 4 项通过。详见 `docs/ITERATIONS/048-npc-lines-by-chapter.md`。
- [x] **名牌与纸片对话的中文排版**（第 55 轮，Q8）：两处字族改成「平台楷/宋在前、Noto 在后」（`--pd-serif` / `--pd-kai`），对话正文用楷、名牌用宋；顺带修 `.paper-dialog` 缺 `box-sizing` 导致390 视口下 408 px 出屏 18 px；名牌加 `max-width: min(46vw,220px)` + 省略号。**遗留**：字形本身无肉眼判读（本机 canvas 对任意字族都回同一宽度），只证了声明顺序与不溢出。

- [x] **国界线（争议）**（第 44 轮）：删 `countries-110m.json`，今图只画 34 省级轮廓 + 九段线，古图不画疆域界线；`check-china.mjs` 兜底。

## P6 其它场景（用户 m07937 授权加入）

> 纸模模板在 `scenes/_template/`，火焰山为样板（`scenes/huoyan/`）。一个场景约 2–3 轮：骨架+地面/主景 → 人物（2–3 人各 6 卡）→ 台词/名牌/验收。
> **场景选择待定**（见 `docs/DECISIONS-PENDING.md` D-04）：默认按下列四站做，若要换站在开工前改本表即可。

- [ ] **P6-1 黑风山（第 16–17 回）**（2–3 轮）：黑熊精 + 观音院；主景=烧塌的禅院与黑风洞；色调最暗（夜色纸）。
- [ ] **P6-2 白虎岭（第 27 回）**（2–3 轮）：白骨精三变 + 悟空被逐；主景=白骨堆与三具假尸；最省场景（无人可对话也行，只做悟空）。
- [ ] **P6-3 盘丝洞（第 72–73 回）**（2–3 轮）：蜘蛛精 + 濯垢泉；主景=丝网与泉池；需要「丝」的纸片层，最出效果。
- [ ] **P6-4 狮驼岭（第 74–77 回）**（2–3 轮）：青狮白象大鹏 + 阴阳二气瓶；主景=岭上三妖；人物最多，最费时。

### 待推记录

- 第 50 轮末 `git push` 失败（`Recv failure: Connection was reset`），提交 `96777de`（Q2 印纹样）待推。
## 交付与外部

- [ ] **小米交付包按当前代码重打**（10 min）：`西游记时序图-小米 vibeCoding 大赛/西游时序-取经路线交互舆图.zip` 是 14:21 旧包（无 `china-provinces.json`、`app.js` 还是剔除国界层的变体）。
- [x] **推送 GitHub** ✅ 第 49 轮末尾推送成功（`cd6948e..46c243e`）：第 48 轮 `eeed6d3`、`4db61a3` 与第 49 轮 `46c243e` 已上台，`main...origin/main` 同步。链路时通时不通，之后每轮末尾仍试一次，失败只记「待推」。
- [x] **时间轴场景签补到 8 个** ✅ 第 47 轮完成（U-047-01/02）：补 两界山「心猿归正」（14 回 21.3%）、号山「大战红孩儿」（40–42 回 44.7%）、狮驼国「狮驼岭」（74–77 回 78.7%）；最大空档 38.3 → 21.3，中段 55.3/59.6/61.7 一簇不动。三档宽度下 0 同行重叠，点击跳站验通。详见 `docs/ITERATIONS/047-timeline-keys.md`。
