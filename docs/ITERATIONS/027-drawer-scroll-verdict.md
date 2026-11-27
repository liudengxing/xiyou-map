# 027 · 矮屏「八十一难」抽屉的可滚动性：判据换法后结论为「可用」

日期：2026-11-27
改动单元：`U-027-01`（**无代码改动**；本轮只改正测量口径、更新结论与队列）

## 本轮目标

第 26 轮留下一句「矮屏抽屉可滚动性待核」，理由是两次量测互相矛盾：设 `scrollTop` 到底，末格 rect 却一动不动。本轮只做一件事：把判据换成「`scrollIntoView` 之后 `elementFromPoint` 是否命中该格」，给出**可用 / 不可用**的二值结论。

## 结论

**可用。** 不需要改代码。两次矛盾都是**测量错误**：`document.querySelector(".drawer-body")` 命中的是**行程表**抽屉的 body（DOM 里在前），而「八十一难」抽屉有自己的一份 `.drawer-body`。我一直把 `scrollTop` 写在行程表那份上，当然看不到难格移动。

## 证据（640×360，`.tmp/frame.html?w=640&h=360&h2=s=29`，先点「八十一难」）

1. **可达性**：对 `cells[80]`（文本 `81`）调 `scrollIntoView({block:"center"})`，等 700ms 后 `elementFromPoint(中心)` 命中 `BUTTON.nan-cell.last`，`hitIsCell true`。
2. **容器分离**（根因）：
   - `#drawer-nan .drawer-body`：`scrollHeight 657 / clientHeight 289 / scrollTop 368`（最大滚动量 368）
   - `#drawer-trip .drawer-body`：`scrollHeight 1694 / clientHeight 289 / scrollTop 368`
   - `document.querySelector(".drawer-body")` 取到的是后者 —— 上一轮读到的 `1694`、`1405` 全部来自这张 49 行的行程表。
3. **滚动的确是滚动**（改用带作用域的选择器）：`#drawer-nan .drawer-body` 的 `scrollTop` 由 0 → 368 时，末格 `rect.top` 由 **477 → 109**（`moved true`），`.nan-foot` 停在 **263**（视口 360 内）——**末格与难号进度条可以同屏**，并非「要再滚一屏」。
4. **肉眼**：`.tmp/r27-640-drawer-bottom.png`（640×360 界面，1920×1080 画布内）滚到底后可见第 64–81 格（`81` 金框）、「九九归真」难详情与出处说明，抽屉表头（「八十一难 / 第九十九回难簿 / ×」）始终固定。

## 为什么这轮不改代码

抽屉本身没问题，问题在判据。把「读 `getBoundingClientRect` 判滚动」换成「`scrollIntoView` + `elementFromPoint`」就够了；此时任何改动都只是给正确的行为加补丁，违反「一次只推进一条、不顺手改」。

## 为什么不把这次当「已修 bug」写

没有 bug 被修。本轮交付的是**测量口径**：在 `docs/STATE.md` 的「已知问题」里删掉「矮屏抽屉可滚动性待核」，并在 `docs/BACKLOG.md` 把 P4-21 标记为「结论：可用（测量方法问题）」，附上作用域选择器的写法，避免下次重犯。

## 回滚

无代码改动，无需回滚。若要把结论撤回，把 P4-21 改回 `- [ ]` 即可（同样写成前进式的一次新记录）。

## 遗留

- 行程表（49 行）在 640×360 下需滚 1405px，且表头不吸顶 —— 滚到中段就看不到「行程表」标题。已立 P4-23（10 min）。
- 难详情面板（`#nan-detail`）展开后会让 `.drawer-body` 内容变高（657 → 1694 不是它、但难详情确实会增高），矮屏下「看完详情回头找格子」要多滚一段；观感问题，未立条目。
