# 037 · 用户五条：实路显示、站点去均距、古今图切换、站上纸人、进站自动摊开纸模

时间：2026-11-27 11:40（Asia/Shanghai）
改动单元：`U-037-01`（实路 `.on`）、`U-037-02`（43 站坐标重排）、`U-037-03`（古/今底图切换）、
`U-037-04`（站上纸人队列）、`U-037-05`（NPC 头顶名牌 + 走近说话）、`U-037-06`（进站自动开纸模 + 纸幕转场）

## 用户原话（m06216）

1. 「npc 靠近加个对话，人物头上加个名字显示，类似网游里的 id 展示。」
2. 「玄奘实路没有路线展示」
3. 「然后地点分布好均匀，确认下地点是不是都对。」
4. 「地图加一个当代地图的切换，样式保持一致，但是城市和地理信息用现代的。」
5. 「每个地点上面加一个小人展示 … 进入到有纸膜的地图就直接打开纸膜，做一个进入纸膜世界的动效」

## 可测指标

| # | 指标 | 目标 | 实测 |
| --- | --- | --- | --- |
| 1 | 点「玄奘实路」后 `.route-real` 的 computed `opacity` | > 0 | **0.78**（`class="route-real on"`，15 个 `.real-label` 同 `opacity 1`） |
| 2 | 43 站相邻经度差 | 不再恒等于 1.6 / 1.3 / 0.6 | 1.20–3.50°，含 27–29 站一处向东小回折 |
| 3 | 今图：点按钮后 `#stage[data-base]` | `modern`，且 `.regions` 隐藏 | `modern` / `.regions` computed `display:none` / 25 个 `.mcity` 可见 |
| 4 | 站上纸人：`g.party .fig` 总数随队伍增加 | 长安 1 → 流沙河起 5 | 长安 1、两界山 2、鹰愁涧 3、高老庄 4、流沙河起 5（43 站全对，前传 5 站为空） |
| 5 | 场景里 `.pd-tag` 数量与定位 | 3 位 NPC + 1 位主角，且贴着头顶 | 4 枚（罗刹女 899.5/366.5、牛魔王 1139.2/282.3、猪八戒 1597.8/526.3、孙悟空 1276.98/858.13） |
| 6 | 走近 NPC 是否自动开口 | 2.4 步内弹、3.2 步外才重新上膛 | `place(-8.6,-11.2)` → 罗刹女 1/3；close 后 `frozen false`；走远不弹；回来再弹 |
| 7 | 进火焰山站是否自动摊开纸模 | 模态打开 + 纸幕出现再化开 | 图钉/行程表/已选中站再点三条路径 `hidden false` + `.scene-veil` 在 z61 出现，0.9s 后 veil 移除、`ready true`、`cards 156` |
| 8 | 长安站不触发 | 不打开模态 | `hidden true`、hash `#s=5`、无 veil |
| 9 | 时间轴/键盘换站不触发 | 不打开模态 | `ArrowLeft` → `#s=28`、`hidden true` |

## 改了什么

| 文件 | 改动 |
| --- | --- |
| `assets/js/app.js` | ① `refreshFlags()` 开头补 `routeEls.real.classed("on", S.showReal)` 与 `realLabelSel.style("opacity", …)`；② `S.base`、`gModern`、`drawBase()` 追加 `.modern-layer`（25 城 `{name,lon,lat,big}`：圈 + 注记）；`refreshFlags()` 写 `#stage[data-base]` 并切按钮「古图/今图」；`bind()` 接 `data-act="base"`；hash 增 `base=modern`；③ `charColors` + `partyOf(n)` + `drawPins()` 里的 `.party`（每站按队伍人数排一排小纸人，`translate(x*U, 9.4*U) scale(U)`）；`declutter()` 的图钉障碍加 `partyH = 15*U`；④ `enterSceneFor(n)` + `SCENE_STATIONS`、`playSceneEnter()`（纸幕 `.scene-veil` 0.34s 展开 + 0.24s 化开，`prefers-reduced-motion` 跳过）；`select()` 的早退分支与末尾都调 `enterSceneFor`；图钉 click/keydown、行程表项 click 传 `{enter:true}` |
| `assets/js/data.js` | 43 站 `lon/lat` 全部重排（不等距走廊）；新增 `modernCities` 25 条 |
| `index.html` | 工具栏 `data-act="base"` 按钮（在「玄奘实路」前） |
| `assets/css/style.css` | 追加今图层规则（`.modern-layer` 显隐、`.land/.border/.graticule` 换色、`.mcity` 点与字、`.mcity.big` 朱砂）与转场规则（`.scene-veil` 展开/化开、`.scene-sheet` 入场） |
| `scenes/shared/paper-ui.css` | `.pd-tags` / `.pd-tag`（纸签底、细墨框、下指小三角、`.near` 朱砂、`.off` 变淡、`.hero` 无色） |
| `scenes/huoyan/scene.js` | 名牌层 + 每帧投影定位 + `armed` 重新上膛的走近说话 |
| `scenes/huoyan/index.html` | `scene.js?v=37`（模块缓存必须换 URL） |

## 为什么

- **实路**不是没画，是 `refreshFlags()` 只切了 `display`，从没加 `.on`，而 `.route-real{opacity:0}` —— 根因在样式类，不在数据。
- **均距**：原数据是「lon 每站 −1.6」的珠串，读起来像刻度尺；改成按回序节距 1.2–3.5° 并留一段小回折（`xishitong` 在 `xiaoleiyin` 东侧），才像一条被山谷挤得忽宽忽窄的路。
- **今图**：用户要「样式一致、信息现代」。做法是同一套 svg 里多一层 `.modern-layer`，只把底图的陆地描边、境线、注记换成现代的，纸色与朱砂点睛不动；古图的关隘山形与海纹在今图下隐藏（它们在今天没有对应物）。路线本身仍是小说示意，古今切换只换「信息层」——这一点写进按钮 title 与 README。
- **站上纸人**：主站地图缩放很小时，纸人只能几像素高，所以画的是「剪影」而非完整纸偶——梯形身 + 圆头 + 角色色，悟空加一道金箍线，白龙马加颈尾折线。队形按 `characters.from` 的站序累加，和详情卡里的「在场人物」同一份数据，不会两处打架。
- **名牌用 DOM 而不是贴图**：纸片上的字会随纸一起糊；DOM 纸签永远是屏幕上最清楚的一层，也只花一次布局。
- **走近说话要先上膛**：只在「刚进 2.4 步」时弹一次，退到 3.2 步外再上膛 —— 否则关掉对话站在原地会立刻又弹，人被自己的对话锁住。
- **进站自动摊开**：用户要的是「进这张图＝进这个世界」。纸幕从上方铺开盖住屏幕（此时场景已在背后加载），再化开露出立体书 —— 比直接弹模态少一次「突然出现」的硬切。只挂图钉与行程表，不挂时间轴与 ←/→：扫时间轴是看全局，不该一站一弹窗。

## 验证证据

```
node --check assets/js/app.js → APP_OK
node scripts/check-all.mjs → OK：3 项全通过
app.js 65438 B / style.css 42165 B / index.html 8373 B / data.js 38537 B / scenes/huoyan/scene.js 20858 B
主站结构：#s=1 pins 48 / party .fig 186 / tabindex=0 → 1 / aria-current → 1
今图：data-base modern、按钮文案「古图」、hash #s=28&base=modern、.mcity 25
火焰山：pin click → #s=29&scene=huoyan、veil z61、0.9s 后 veil 移除、ready true / cards 156
长安：pin click → #s=5、scene-modal hidden true
键盘：ArrowLeft → #s=28、scene-modal hidden true
搜索「火焰」→ 1 条命中
```

截图：`.tmp/r37-ancient.png`、`.tmp/r37-modern.png`、`.tmp/r37-npc-tags.png`（均 2552×1274）。
区域平均色：古图 (235,226,204) / 今图 (224,217,198) / 场景 (224,188,116) —— 底图确实换了一层，场景仍是纸。

**诚实说明**：本轮仍**没有肉眼判读**（`read_image` 只回元数据），所有结论来自 DOM 计数、computed 样式、投影坐标与区域平均色；「好不好看」这一步没有做，用户可直接开页面看。

## 回滚

1. `assets/js/app.js` 删 `refreshFlags()` 里那两行 → 实路回到「永不显示」。
2. `data.js` 恢复旧 43 站坐标（见 `docs/ITERATIONS/037` 之前版本 / git 无，需手改）。
3. `style.css` 删今图段与转场段；`index.html` 删今图按钮；`app.js` 删 `S.base` 相关。
4. `app.js` 删 `.party` 段与 `declutter()` 的 `partyH`；`enterSceneFor/playSceneEnter` 与三处 `{enter:true}`。
5. `scene.js` 删名牌层块；`paper-ui.css` 删 `.pd-tag*`。

## 遗留

1. **站点仍是示意位置**（`data.js` 顶部注释与 `approx` 标记）：长安、天竺这类可与今地名对齐的站已对齐（西安 108.94/34.34、那烂陀 85.44/25.14 一带），火焰山等按回序摆在西域走廊上，与真实吐鲁番（89.2/42.9）不重合 —— 今图下会与真实城市注记错开，这是「示意」的代价，若要严格对齐需逐站改坐标并接受路线折返。
2. 211 万人口级的现代化底图（高速、铁路、水系）没有做，只做了城市点与境线。
3. 站上纸人只有剪影，没有性别/坐骑细节；队伍人数变化只按 `characters.from` 一次性累加。
4. 纸幕转场只做了「从上铺开」，没有做纸纹/折痕，也没有做音效（项目禁自动音频）。
5. 走近说话是「一人一弹」，两人同时进入 2.4 步时先命中的那位开口，另一位等退出去再上膛。