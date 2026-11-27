/**
 * 纸件印纹样（Q2）。
 *
 * 做法：在每张卡自己的 paint 末尾再落一层「同色系但更深的图案」，用 paperkit-2d 的
 * `P.marks()` 一次性描进一条 path（重叠处读作一层墨），alpha 0.18–0.24，线宽 ≥2 打印像素。
 * 卡面密度由第 49 轮的 CARD_RES / res 决定（悟空 136 px/单位、三人约 124），
 * 2 px 的线在 115 px 宽的躯干上有 1/50 宽，缩到 1256 视口仍能读出材质。
 *
 * 五个样式按件分：cloth（布甲/袍）、hide（毛发）、metal（金箍/腰带/钉钯）、wall（洞壁/门洞/纸灯）、flame（火纸）。
 * 所有样式都不改底色，只叠一层半透明的纹，所以颜色仍是设定图那一族。
 */

// 调试开关：`?print=0` 关掉全部卡面印纹，用来做 A/B（第 50 轮验收用，不影响正常加载）。
const OFF = typeof location !== 'undefined' && /[?&]print=0(&|$)/.test(location.search);

const STYLES = {
  // 纹样尺寸用 units:true 直接给形状单位：卡面 199 print px 对 0.85 单位（≈234 print px/单位），
  // 而主角在 1256 视口只有约 41 屏幕像素/单位。分数尺寸（size*U）到屏幕上不足 2 px，会被重采样抹平；
  // 所以统一按 0.1 形状单位（≈4 屏幕像素）量级画。
  cloth: (P, C) => {
    P.marks('hatch', { color: C.deep, alpha: 0.26, units: true, size: 0.1, width: 6, density: 0.8, angle: 0.32 });
    P.marks('dot', { color: C.ink, alpha: 0.2, units: true, size: 0.045, density: 1.0 });
  },
  hide: (P, C) => {
    P.marks('leaf', { color: C.deep, alpha: 0.28, units: true, size: 0.09, angle: 1.35, density: 0.9 });
    P.marks('tick', { color: C.ember, alpha: 0.24, units: true, size: 0.08, width: 6, density: 0.7 });
  },
  metal: (P, C) => {
    P.marks('rivet', { color: C.deep, alpha: 0.28, units: true, size: 0.11, width: 6, density: 0.7, light: 'rgba(255,246,230,0.5)' });
    P.marks('stripe', { color: C.ochre, alpha: 0.22, units: true, size: 0.09, density: 0.6 });
  },
  wall: (P, C) => {
    P.marks('dab', { color: C.ochreD, alpha: 0.26, units: true, size: 0.09, density: 1.0 });
    P.marks('wave', { color: C.ink, alpha: 0.22, units: true, size: 0.08, width: 6, density: 0.7,
      region: { x0: P.box.x0, y0: P.box.y0, x1: P.box.x1, y1: P.box.y0 + P.box.h * 0.22 } });
  },
  flame: (P, C) => {
    P.marks('wave', { color: C.burnt, alpha: 0.26, units: true, size: 0.1, width: 6, density: 0.8 });
    P.marks('dab', { color: C.ember, alpha: 0.24, units: true, size: 0.08, density: 1.0 });
  },
};

/**
 * 把一层印纹落进已经在画的卡上（调用方负责先 P.fill / 细节，再调用本函数）。
 * style 缺省 wall；未知样式按 wall 处理。
 */
export function printCard(P, C, style = 'wall') {
  if (OFF) return;
  const draw = STYLES[style] || STYLES.wall;
  P.clip();
  draw(P, C);
  P.unclip();
}

/** 包一层 paint：先原样画，再压纹样。 */
export function withPrint(paint, C, style) {
  return (P) => { paint(P); printCard(P, C, style); };
}
