# 第 13 轮 · 「随行」按钮补 `aria-pressed`（P4-7）

## 本轮目标

BACKLOG P4-7。第 4 轮做「点人走线」时，`#chars .cbtn` 的选中态只有一个 `.on` 类（反白底 + 石绿描边），
视觉上能看出「悟空」被选中，但读屏器听到的始终是五枚普通按钮 —— 按没按下去无从判断。

判据（写在 BACKLOG 里的两条）：

1. `document.querySelectorAll('#chars .cbtn[aria-pressed="true"]').length === (S.focusChar ? 1 : 0)`；
2. 点「悟空」后该按钮 `aria-pressed="true"`、其余 `false`；再点一次全部回 `false`。

## 改了什么

### `assets/js/app.js`

1. `buildChars()`（约 `:1152`）渲染按钮时补初值：

```js
return '<button class="cbtn" data-char="' + c.id + '" aria-pressed="false" title="' + c.note + '">' + c.short + "</button>";
```

2. `refreshFlags()`（约 `:1146`）同步，与 `.on` 类共用同一个判断，避免两处真相：

```js
document.querySelectorAll("#chars .cbtn").forEach(function (b) {
  var on = b.getAttribute("data-char") === S.focusChar;
  b.classList.toggle("on", on);
  // 反白底只有视觉意义；读屏器要靠 aria-pressed 才知道这一枚是不是「已按下」
  b.setAttribute("aria-pressed", on ? "true" : "false");
});
```

文件 1300 行 / 50568 B → 1303 行 / 50780 B。`node --check assets/js/app.js` → `SYNTAX_OK`。

### 没改的地方

- 不加 `role="button"`：`<button>` 原生已是 button。
- 不加 `aria-label`：`title` 里那句 `note`（「第一至七回前传；第十四回两界山归正入队」）是补充说明，
  按钮可读名就是「悟空」这种两三个字，读屏器读「悟空，切换按钮，未按下」已经够清楚；把 `note` 塞进
  `aria-label` 会让每次 Tab 都念一长串回目。
- 不改 CSS：`:focus-visible` 用户代理默认环还在（只用 `.cbtn` 的 `:hover` / `.on`），无 a11y 回退。

## 为什么这么改

- **为什么用 `aria-pressed` 而不是 `aria-checked`**：这几个按钮不是一组互斥的「单选」（可以全不选，
  也可以只选一个），语义更接近工具栏上的「切换按钮（toggle button）」，`aria-pressed` 是它的标准属性。
- **为什么在 `refreshFlags()` 里同步而不是在点击回调里**：`S.focusChar` 有三个入口 —— 点按钮、
  深链 `&c=<id>` 冷启动、以后可能加的时间轴联动。放在 `refreshFlags()` 这一个出口上，三个入口自动都有。
- **为什么初值写 `"false"` 而不是省略**：属性缺失和 `"false"` 在多数读屏器上等价，但缺失时
  第 2 条判据（`[aria-pressed="true"]` 计数）之外的调试查询会拿到 `null`，显式写死更省事。

## 验证证据

`node --check assets/js/app.js` → `SYNTAX_OK`。

### 1440×900（`.tmp/frame1440.html`，强制重载 `#s=5`）

初始：

```
n: 5
pressed: 0
attrs: ["唐僧:false","悟空:false","白龙马:false","八戒:false","沙僧:false"]
```

点「悟空」：

```
hash: "#s=5&c=wukong"
on: ["悟空"]
pressed: ["悟空"]
pressedCount: 1
```

再点一次「悟空」：

```
hash: "#s=5"
pressedCount: 0
onCount: 0
```

### 深链冷启动 `#s=5&c=wukong`

```
hash: "#s=5&c=wukong"
pressed: ["悟空"]        pressedCount: 1
onCount: 1               offPins: 5      routeOn: true
visible: 47              pairs: 0        pins: 48
tab0: 1                  cur: 1          errs: []
```

即：`aria-pressed` 与 `.cbtn.on` 在深链入口上是同步的；第 11 轮的可见标签 47、第 9 轮的
`tabindex="0"` 恰 1 个、`aria-current` 恰 1 个都没有回归。

### 390×844（`.tmp/frame390.html`，两层 iframe）

点「八戒」：

```
hash: "#s=5&c=bajie"
pressed: ["八戒"]        pressedCount: 1     onCount: 1
offPins: 13              routeOn: true
docW: [390, 390]         errs: []
```

再点一次：

```
pressedCount: 0          hash: "#s=5"
```

`offPins: 13` 与第 4 轮记录的「1440 下八戒 35/13」一致，人物态没有因为本轮改动而错位。

## 回滚方法

前向回退，记为 `U-014-01（回退 U-013-01）`：

1. `buildChars()` 里删掉 `aria-pressed="false" ` 这段属性；
2. `refreshFlags()` 的 `forEach` 恢复成单行 `b.classList.toggle("on", b.getAttribute("data-char") === S.focusChar);`
   （连同上方那行注释一起删）；
3. 恢复验证：`document.querySelectorAll('#chars .cbtn[aria-pressed="true"]').length` 回到 `0`、
   `document.querySelectorAll('#chars .cbtn[aria-pressed]').length` 回到 `0`（属性完全消失）；
   点「悟空」仍能得到 `hash #s=5&c=wukong`、`offPins 5`、`routeOn true`。

## 遗留问题

- 未做 `role="toolbar"` + `aria-label` 给 `#chars` 容器：现在是一条 `div` 里五个按钮加一个「随行」提示，
  读屏器按 Tab 走也能到，但没有「这是一组」的分组语义。属可选增强，不单独立条。
- 未跑真实读屏器（NVDA / VoiceOver）：`aria-pressed` 的行为是照 ARIA 规范写的，
  但「读出来是什么语序」只能真机听，标为**待核**。
- 「随行」这条控件在 620px 以下靠 `top: 96px` 定位，若以后再加人物（超过 6 个）会横向溢出容器；
  当前 5 个 + 提示在 390 宽实测 `199px` 宽，余量充足。
