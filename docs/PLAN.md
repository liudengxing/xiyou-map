# PLAN · 执行队列（用户 m07937 定：按序执行，需决策的先记 DECISIONS 再跳过）

> 每轮只做一件、20–30 分钟、做完写文档再提交。队列行状态：`[ ]` 待做 · `[x]` 完成 · `⏸` 被决策阻塞（跳过）。
> 项目已完成 P0–P4 主站与 P5-1…P5-9 火焰山纸模（共 46 轮）。**当前进度见 `docs/STATE.md`**。

## 队列

| # | 事项 | 主要文件 | 验收 |
| --- | --- | --- | --- |
| Q1 ✅（第 48 轮） | 三个 NPC 台词按回目改写（已授权） | `scenes/huoyan/people.js` | 九句台词每句标回目、不冒称原文；对话卡仍能翻页收起；`?test` 三卡仍在 |
| Q2 | 给纸件印纹样（悟空 18 卡 / 三人 18 卡 / 火墙 / 芭蕉洞） | `wukong.js`、`people.js`、`scene.js` | `measure.py` 的 `printDetail` 与 `localContrast` 上升；`clips []`；印花线宽 ≥2 px、α≥0.18 |
| Q3 | 卡面纹理分辨率（现 28×35 px） | `harness` 调用处的 `res` / `cardOpts` | 卡面纹理边长 ≥ 96 px；`buildMs < 2000`；`cards` 不降 |
| Q4 | 火墙降密（近层 44→26）+ 焦痕按距火墙概率 | `scene.js` | `cards` 回落到 180–230；`printDetail` 不掉；肉眼风险写进文档（无法判读要注明） |
| Q5 | 芭蕉洞 boxFold + `holes` 切口内缘描边 | `scene.js` | 洞口由 3 层平卡改 4 层带折角；切口内缘有 1 圈描边；`clips []` |
| Q6 | 场景小坑收口：`?embed=1` 行为、深链白名单、`window.__huoyan` 收口 | `scene.js`、`app.js` | `?embed=1` 不显示提示条；未知 `scene=` 不加载 404；非 `?test` 下不暴露调试钩子 |
| Q7 | 逐回在场名单（续）：回内粒度 | `data.js`、`app.js` | 真假美猴王 56–57 无悟空、58 有；第 43 回 / 第 76 回待核条目给出结论或标「存疑」 |
| Q8 | 名牌与纸片对话中文排版 | `scenes/shared/paper-ui.css`、`style.css` | 实际字族落到楷/宋而非 Noto；390 与 1440 不溢出 |
| Q9 | P4-22 640×360 地图带再挤 | `index.html`、`style.css`、`app.js` | 640×360 地图带 ≥96px、可见标签 ≥20、五浮层不重叠、1440/390 无回归 |
| Q10 | P4-24 `file://` 双击可开 | `assets/vendor/geo-inline.js`（新）、`app.js`、`index.html` | `file://` 下有底图与 48 图钉、控制台无 CORS；http 下等价；`check-all` 通过 |
| Q11 | P4-25 `capture.py --from-dir` | `scripts/papercraft/capture.py` | `--help` 有该参数；给一张现有截图能出并排图 |
| Q12 | 小米交付包按当前代码重打 | `西游记时序图-小米 vibeCoding 大赛/…zip` | 包内含 `china-provinces.json`、`app.js` 有 `province`；双击 index 走本地服务说明在包内 README |
| Q13 | P6-1 黑风山（16–17 回） | `scenes/heifengshan/` | `ready true`、`cards 100–250`、`clips []`、`buildMs < 5000` |
| Q14 | P6-2 白虎岭（27 回） | `scenes/baihuling/` | 同上 |
| Q15 | P6-3 盘丝洞（72–73 回） | `scenes/pansidong/` | 同上 + 丝网纸片层 |
| Q16 | P6-4 狮驼岭（74–77 回） | `scenes/shituoling/` | 同上 + 三妖 |

- 每轮末尾试一次 `git push`；失败只记「待推」。
- 被决策阻塞的项（见 `docs/DECISIONS-PENDING.md`）：P5-4c/P5-4d（D-01）、真实地理对齐（D-02）、周边注记（D-03）、P6 场景选择若换站（D-04）。

## 可直接粘贴的 Plan 提示词

```text
你是《西游记时序图》纯静态站的长期执行 agent。仓库根：F:\VibeCoding Project\西游记时序图（git，remote https://github.com/liudengxing/xiyou-map.git）。P0–P4 主站与 P5 火焰山纸模已完成 46 轮，现在按 docs/PLAN.md 的队列 Q1→Q16 顺序执行，一轮只做一件。

【每轮开工先读】docs/STATE.md → docs/PLAN.md（队列与验收）→ docs/BACKLOG.md → docs/CHANGELOG.md 最后 3 条 → docs/ITERATIONS/ 最大编号那份；涉及纸模再加 docs/PAPERCRAFT-CHARACTER-SPEC.md 与 scenes/huoyan/README.md（scenes/vendor/ 与 harness.js 只读，永不改）。轮次号 N = ITERATIONS 文件数 + 1。

【一轮的边界】只做队列下一项，20–30 分钟做完，结束时页面必须能跑（主站能开、纸模 window.__papercraft.ready === true）。不顺手重构、不扩范围（无后端/登录/爬取）、不用 CDN、不自动播放音频、不用 alert/confirm、不留注释掉的死代码。

【改完必做】① 抬缓存版本：改 assets/js/*、assets/css/*、index.html 就改 index.html 里对应 ?v=；改 scenes/huoyan/*.js 就改 index.html 的 scene.js?v=，并同步改 scene.js 里 import 的 ./xxx.js?v=（只抬一处等于没改）。② 自检：node --check + node scripts/check-all.mjs（须 OK：4 项全通过；本项新增数据或脚本就给 check-all 补一条）。③ 浏览器实测（ego 1256×774）：主站数 DOM 数量/计算样式/路径长度，纸模读 ready / cards() / clips() / buildMs / walkPath；不要以截图判读（截图只回元数据）。④ 场景观感用 scripts/papercraft/measure.py，记录 PASS/WARN 前后值。

【每轮末文档，缺一不可】新建 docs/ITERATIONS/<NNN>-<slug>.md（做了什么、为什么、验收数字、改动文件、遗留、前向回滚步骤）；docs/CHANGELOG.md 追加 | NNN | 日期 时间 | 一句话 | 涉及文件 | U-NNN-01/02 |；更新 docs/STATE.md（第 N 轮 + 交付物尺寸）；docs/BACKLOG.md 打勾并写结论；docs/PLAN.md 队列行改 ✅。改动单元 ID 用 U-NNN-NN；回退只前向（写成「U-NNN-01（回退 U-MMM）」），禁止删除历史。

【需要用户决策时】不要停下来问、也不要自己拍板：往 docs/DECISIONS-PENDING.md 追加一条 D-xx（为什么必须用户定 + 不定时的默认做法），队列该项标 ⏸ blocked-D-xx，然后直接做下一项。已有 D-01（悟空观感）、D-02（真实地理对齐方式）、D-03（周边政权注记）、D-04（P6 场景选择）未答前一律跳过，不要重复追问。

【提交】每轮 git add -A + git commit（中文，一句话说清做了什么）。末尾试一次 git push；失败（github 443 不通）就记一笔「待推」继续，不重试、不改远端配置、不 force push。

【每轮收尾输出 ≤6 行】第 N 轮 | 做了什么 | 改了哪些文件 | 验证方式与关键数字 | 下一步 | U 编号。若本轮是跳过，写清跳的是哪项、卡在哪条 D。

【停止条件】队列全部 ✅ 或全部 ⏸ 时停，给一次总结：做过什么、还卡着哪些决策、哪些提交待推。
```
