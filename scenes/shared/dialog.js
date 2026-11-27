// scenes/shared/dialog.js —— 纸片对话框（P5-5）。
// 只用 DOM 文本（可选中、可读屏），不把字烘进 canvas；一次显示一位人物的一段话。
// 交互：点击卡面 / Enter / 空格 → 显示下一句（或逐字未打完时立刻打完）；Esc → 关闭。
// 关闭时回调 onClose，由场景恢复走动。文案由调用方提供，必须自带「示例」标注。

const TYPE_MS = 26;

export function createDialog({ onClose } = {}) {
  let root = null;
  let textEl = null;
  let moreBtn = null;
  let state = { entry: null, index: 0, typing: false, timer: 0, shown: '' };
  let onOpen = null;

  function ensure() {
    if (root) return root;
    root = document.createElement('div');
    root.className = 'paper-dialog';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'false');   // 场景本身还在走，不是模态
    root.setAttribute('aria-live', 'polite');
    root.innerHTML =
      '<div class="pd-head">' +
        '<span class="pd-name"></span>' +
        '<span class="pd-role"></span>' +
        '<span class="pd-sample">示例，待用户确认</span>' +
      '</div>' +
      '<p class="pd-text"></p>' +
      '<div class="pd-foot">' +
        '<span class="pd-hop"></span>' +
        '<button class="pd-more" type="button">继续 ›</button>' +
      '</div>';
    document.body.appendChild(root);
    textEl = root.querySelector('.pd-text');
    moreBtn = root.querySelector('.pd-more');
    moreBtn.addEventListener('click', (ev) => { ev.stopPropagation(); advance(); });
    root.addEventListener('click', advance);
    document.addEventListener('keydown', onKey);
    return root;
  }

  function onKey(ev) {
    if (root.hidden) return;
    if (ev.key === 'Escape') { ev.preventDefault(); close(); return; }
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); advance(); }
  }

  function paint() {
    const e = state.entry;
    if (!e) return;
    root.querySelector('.pd-name').textContent = e.name;
    root.querySelector('.pd-role').textContent = e.role || '';
    root.querySelector('.pd-hop').textContent = (state.index + 1) + ' / ' + e.lines.length;
    moreBtn.textContent = state.index >= e.lines.length - 1 ? '收起' : '继续 ›';
    textEl.innerHTML = '';
    const span = document.createElement('span');
    span.className = 'body';
    textEl.appendChild(span);
    type(e.lines[state.index], span);
  }

  // 逐字写出来（纸上的墨一行行显形），途中再按一次键立刻写完
  function type(line, span) {
    window.clearTimeout(state.timer);
    state.typing = true;
    state.shown = '';
    let i = 0;
    const tick = () => {
      if (!state.typing) return;
      i += 1;
      span.textContent = line.slice(0, i);
      if (i >= line.length) { state.typing = false; return; }
      state.timer = window.setTimeout(tick, TYPE_MS);
    };
    state.timer = window.setTimeout(tick, TYPE_MS);
  }

  function flush() {
    const e = state.entry;
    if (!e) return;
    window.clearTimeout(state.timer);
    state.typing = false;
    textEl.querySelector('.body').textContent = e.lines[state.index];
  }

  function advance() {
    if (!state.entry) return;
    if (state.typing) { flush(); return; }
    if (state.index < state.entry.lines.length - 1) { state.index += 1; paint(); return; }
    close();
  }

  function open(entry, opts = {}) {
    ensure();
    state = { entry, index: 0, typing: false, timer: 0, shown: '' };
    onOpen = opts.onOpen || null;
    root.hidden = false;
    document.body.classList.add('dialog-open');
    paint();
    if (onOpen) onOpen(entry);
  }

  function close() {
    if (!root || root.hidden) return;
    window.clearTimeout(state.timer);
    state.typing = false;
    root.hidden = true;
    document.body.classList.remove('dialog-open');
    const e = state.entry;
    state.entry = null;
    if (onClose) onClose(e);
  }

  return {
    open,
    close,
    isOpen: () => !!root && !root.hidden,
    current: () => state.entry,
  };
}
