# 火焰山纸模场景 · paper spec

本文件是 `scene.js` 的施工依据（对应 `docs/PAPERCRAFT-IMPLEMENTATION.md` 第 5 节）。改动任何视觉决定前先改这里，
免得代码与设计两处真相。**当前进度：P5-1~P5-7 全部完成（空白纸地面 → 地面/火墙/洞 → T 型纸偶悟空 + 点击寻路 → 三位纸人 + 点人/E 说话的纸片对话 → 主站入口/模态/深链 → 全量验收与模板提炼）。**

```
BRIEF      火焰山 · 三调芭蕉扇。八百里火焰，四周寸草不生，师徒受阻于西行路口。
SUBJECT    主角孙悟空（10–20 片纸模）；罗刹女、牛魔王、猪八戒（纸人）；芭蕉扇；八百里火墙；芭蕉洞。
STOCK      暖赭卡纸，死哑光；厚度 T = H×2%（heroHeight 3.6 → 0.072 units）。
PALETTE    page #f3e7cd / paper-deep #ead8b6 / ink #2a241c / cinnabar #b03a2e（火）/
           cinnabar-deep #8c2b22 / gold #b8934a（金箍）/ azurite #3f6b4a（芭蕉叶）；
           阴影暖赭 #a0602c，禁灰黑、禁纯白。
LIGHT      一盏暖主光 #ffdcb2（强度 3.0，偏侧前上方），软阴影被地面染成赭橙；4096 map / softness 0.26。
LENS       28° FOV，俯角 46°，地面铺满四边；focusBand 0.3 / ramp 0.3；清晰带 36–45%。
FORMAT     16:9（iframe 模态大窗）；scene 留 ?size / ?aspect 入口，便于复用到竖屏。
GROUND     焦赭戈壁，无水；印龟裂纹、焦痕、风卷灰线；远处火墙用 V-fold + 层叠纸片立起来。
LAYOUT     主角从近景起步，向右上走向火墙与洞府；火墙横贯远景，芭蕉洞偏右，三人沿路分布。
MOTION     主角走动四肢绕肩/髋摆动；火苗轻晃；弹起 8–15% 过冲、~1s 静止、错峰 0.05–0.1s。
LIFE       3–5 种纸活物：跳动的火苗、飘灰、乌鸦、沙蜥、风卷纸屑（paper-life）。
TYPES      cross（枯树/旗杆）、V-fold（火苗）、layered flats（远山火墙）、boxFold（芭蕉洞）、
           T 型角色、单卡小物（扇/石）。
SOUND      轻低闷稀疏：纸脚步、火焰低频、扇风一记、纸张翻动（对话出现）；pilot 阶段静音。
BANNED     灰黑阴影、纯白高光、发光描边、HUD 面板、MeshStandardMaterial 塑料感、薄刀片状单卡。
QA         clips() 空；cards() 100–250；focusHeight 0.55–0.75；buildMs < 5s；?diag=key 阴影朝向正确。
```

## 已落地的与 spec 的偏差（逐条记，别让它们变成暗债）

| spec 行 | 现状 | 计划 |
| --- | --- | --- |
| STOCK 厚度 0.072 | harness 的 `popup` 里 `thickness: 0.08`（固定），未改 harness | 接受 0.08（差 11%，肉眼不可辨），不改运行时 |
| SUBJECT 主角 10–20 片 | 已做（第 32 轮）：11 张卡（躯干/躯干侧/头/头侧/金箍/双臂/双腿/虎皮裙/金箍棒），每张 z 唯一；`stride(walked, gait)` 支撑相/摆动相分段 | 主角高 3.6 与正式取景比例未调；火墙遮挡未验 |
| PALETTE 赭石 | 地面 washes 已按 page/paper-deep/赭石；平均色 226,196,131；火墙用 `C.ember` 焰心叠 `C.shadow` 暖带 | 定色完成，亮度靠 `res` 与层数控制 |
| GROUND / 火墙 / 洞 | 已做（第 31 轮）：18 片焦痕、三层 120 片纸焰、`holes` 挖穿洞门 + 纸灯 + 芭蕉叶 | 火墙重叠率偏高待判 |
| 三人（罗刹女/牛魔王/八戒） | 已做（第 33 轮）：各 6 张卡 + `solid` 占位 + 纸片对话 | — |
| LIGHT 强度 3.0 / 4096 map | 用 `lights.json` 的 `day` 预设（`#ffdcb2` / `#f2dcc2`），未单独调强度 | P5-3 再按 `?diag=key` 校阴影朝向 |

## 怎么打开

- 全景：`http://127.0.0.1:8123/scenes/huoyan/index.html`
- 测试卡近景：`...index.html?test`（`flags.TEST` 会把镜头拉近，用来看厚度、裁切边、哑光、阴影）
- 关键数字：`window.__papercraft.{ready, cards(), buildMs, clips(), pieces}`

## §8 验收结果（第 35 轮 P5-7）

| # | 条目 | 结论 | 证据 |
| --- | --- | --- | --- |
| 1 | `clips()` 空 | PASS | `cards 151 / clips []` |
| 2 | `cards()` 100–250 | PASS | 151 |
| 3 | `focusHeight` 0.55–0.75 | PASS | 0.62（overview）/ 0.602（`?diag=key`） |
| 4 | `buildMs < 5s` | PASS | 322 / 337 / 444（iframe 内首建） |
| 5 | 阴影偏侧后、暖赭 | 数值 PASS / 方向未肉眼判 | `shadowHex #81250A`、`warmth 0.673`；key `#581002 / 0.816` |
| 6 | `walkPath()` 全到 | PASS | `reached 3 / of 3 / blockedBy null` |
| 7 | 走动 3–5 帧有变化 | PASS | 三帧，帧差 31.90% / 58.50%，位移 (0,3)→(7.58,0.72) |
| 8 | 三人对话 + Esc + 恢复走动 | PASS | 第 33 轮逐条；第 34 轮复验 Esc 两层 |
| 9 | 主站三档无回归 | PASS | 1440/1200/390：`pins 48 / tab0 1 / ariaCur 1 / seaPaths 64` |
| 10 | 主站 `file://` 双击开 | FAIL | `assets/js/app.js:1432-1433` 的 `fetch()` 在 `file://` 下被拦；转 BACKLOG P4-24 |

`measure.py` 给火焰山 6 项 WARN（`lumaP50 0.765`、`toothRms 0.0098`、`flatPct 98.5`、`printDetail 0.002`、
`localContrast 0.019`、`barePct 98.4`）：纸面上的印花几乎为零，下一轮（BACKLOG P5-8）先补纹样与接触影。
详见 `docs/ITERATIONS/035-p5-7-acceptance.md`。

第 36 轮（P5-8 地面部分）已把其中两项拉回门限：`lumaP50 0.765 → 0.712`、`toothRms 0.0098 → 0.0106`，
WARN 6 → 4；`flatPct 98.5 → 95.9`、`printDetail 0.002 → 0.003`、`localContrast 0.019 → 0.022`、
`barePct 98.4 → 98.3` 仍在外。`printDetail` 量的是清晰带边缘密度（不是印花浓度），荒漠空地面顶不到 0.06，
需靠立更多纸件（BACKLOG P5-9）。详见 `docs/ITERATIONS/036-p5-8-ground-print.md`。
