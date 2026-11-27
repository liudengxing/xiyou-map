# 021 · 窄屏展开态：卡头吸顶

- 时间：2026-11-26 23:52
- 对应 BACKLOG：P4-15 详情卡头部吸顶（20 min）
- 改动单元：U-021-01（卡头 sticky + 按钮移入卡头）、U-021-02（拆出 `.d-meta`）

## 本轮目标

390×844 展开态滚到「此站之难」时，回目与站名要一直挂在卡顶，且不遮住正文首行。

## 改了什么

**`assets/css/style.css`**（`@media (max-width: 620px)` 内，紧跟 `.detail.expanded`）
```css
.detail.expanded { padding-top: 0; }
.detail.expanded .d-head {
  position: sticky; top: 0; z-index: 1;
  margin: 0 -24px; padding: 20px 24px 10px;
  background: #f9f2e2; border-bottom: 1px solid var(--rule-soft);
}
.detail.expanded .close, .detail.expanded .expand { z-index: 3; }
```
配套：`.d-head` 的 `border-bottom / padding-bottom / margin-bottom` 挪到新块 `.d-meta`（今地 + 站/妖标签）底下 —— 分隔线在宽屏仍落在同一个位置，视觉不变；窄屏展开态 `.d-head` 只剩「回目 + 站名」，`.d-meta` 随正文滚走。

**`assets/js/app.js` · `renderDetail()`**
1. `innerHTML` 里把 `.d-modern` 与 `.d-tags` 包进 `<div class="d-meta">`，`.d-head` 只留回目与站名。
2. `innerHTML` 之后把 `.close` 与 `.expand` 移进 `.d-head`：两者原本是 `#detail` 的直接子元素，绝对定位让它们**跟着内容一起滚**（实测滚到底时关闭叉从 y446 跑到 y149），而 `.d-head` 改成 sticky 就是 positioned，移进去后自然跟住卡头。宽屏 `.d-head` 不是 positioned，包含块仍是 `#detail`，位置一分不变。

## 为什么这么改

- **为什么先挪内边距**：`.detail` 自己是 `overflow:auto` 的滚动容器，sticky 相对它的 **padding box** 定位；`.detail` 的 `padding: 22px 24px 18px` 会让卡头顶在 22px 之下，滚动的正文从那条缝里透出来。把 22px 挪给 `.d-head` 自己做 `padding-top`，卡头才真正贴到卡顶。
- **为什么左右 -24px**：不撑满的话，滚动内容会从两侧 24px 内边距里露出来，卡头看起来像被切了一刀。
- **为什么拆 `.d-meta`**：第一版整块 `.d-head` 吸顶，实测 head 高 **194px**，287px 的卡里只剩 93px 读正文 —— 等于把上一轮省下来的地图面积又还回去了。只吸「回目 + 站名」后 head 高 **106px**，可读区 **181px**。
- **为什么用实色而不是渐变底**：渐变尾部半透明，滚上去的正文在尾部会半透出来，像没盖住。

## 验证证据

| 视口 | 站点 | 状态 | 结果 |
| --- | --- | --- | --- |
| 390×844 | `#s=29` 火焰山 | 收起 | `#detail` 高 **78**，`.d-meta` `display:none` |
| 390×844 | 同上 | 展开 | 卡高 **287**；`.d-head` 高 **106**；滚到底（scrollTop 306/306）后 headTop 434 = 卡顶 433 + **1px** |
| 390×844 | 同上 | 展开·滚到底 | 关闭叉 top **446**、展开键 top **444**，`elementFromPoint` 分别命中 `.close` / `.expand`（不再被卷走） |
| 390×844 | 同上 | 展开·滚到底 | 可读区 **181px**；`.d-nav` 底边 701 ≤ 卡底 720 |
| 640×844 | `#s=29` | 收起 | 卡高 **73**、可见标签 **47**、pairs **0**、徽标右界 283 < 关闭叉左 593 |
| 1440×900 | `#s=29` | 宽屏 | 卡 `[1058,108,356,644]` 与上一轮完全一致；`.expand` `display:none`；head border 0px / meta border 1px（分隔线位置不变）；可见 47 / pairs 0 |
| 390×844 | 同上 | 展开·滚 150px | 卡头之下 `elementFromPoint` 命中 `.d-body`，卡头之内命中 `.d-head`（实色底确实挡住了正文） |

- `node --check assets/js/app.js` → SYNTAX_OK（1381 行 / 56701 B）。
- 控制台 `errs 0`；页面重载后 `g.pin 48`、`tabindex="0"` 1。
- 截图：`.tmp/r21-sticky-390.png`（390×844，展开态滚到 150px，卡头挂着「第 59 – 61 回 · 火云洞 · 牛魔王 / 火焰山 / 第 47 – 49 难」）。

## 回滚方法

前向回退记为 `U-022-01（回退 U-021-02）`、`U-022-02（回退 U-021-01）`：

1. `assets/js/app.js` 的 `renderDetail()`：删掉移动 `.close`/`.expand` 的那段 `headEl` 代码；把 `.d-meta` 拆掉，`.d-modern`/`.d-tags` 放回 `.d-head` 内。
2. `assets/css/style.css`：`.d-head` 恢复 `border-bottom:1px solid var(--rule-soft);padding-bottom:14px;margin-bottom:14px`；删掉 `.d-meta` 规则、删掉 `.detail.expanded{padding-top:0}` 与 `.detail.expanded .d-head{…}` 与 `.detail.expanded .close/.expand{z-index:3}`；900 断点的隐藏列表里删掉 `.d-meta`。
3. 恢复验证：390 展开态滚到底，`.d-head` 的 `getBoundingClientRect().top` 应远离卡顶（改前是滚出视口），关闭叉同样滚走。

## 遗留问题

- 卡头 106px 里回目那行在 390 下折成两行（「第 59 – 61 回 · 火云洞 · 牛魔王」），吸顶时略显占地方；可考虑展开态把回目收成一行 `text-overflow: ellipsis`（未做，怕藏掉牛魔王这样的关键信息）。
- 吸顶只在 ≤620 展开态；640–900 展开态仍是整块随内容滚，待 P4-16（展开态压到 40vh）一并决定是否也吸。
- 未跑真实读屏器验证 sticky 头部的阅读顺序，标「待核」。
