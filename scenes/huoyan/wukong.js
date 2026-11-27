// 火焰山纸模 · 主角孙悟空（T 型纸偶，11 张卡）
//
// 做法照 docs/papercraft-skill/references/mechanisms.md 第 12 节「Characters from cards」：
//   每一部分都是两张卡（正面卡 + 紧跟其后的侧面卡）拼出的 T；四肢用髋/肩枢轴摆动；
//   分层从前往后是 脸 → 身体 → 手臂 → 腿，层与层之间至少隔一张卡厚（0.08），否则走动时会互穿。
// 硬约束（都被 clips() 检查）：
//   ① 手臂、腿的轮廓在**正面**上不能压住身体轮廓（否则摆动时扫过身体那一层）；
//   ② 侧面卡整张在正面卡之后，绝不可穿过它；
//   ③ 每张卡都有唯一 z（不出现两个相等深度，转角时不会闪）。
import * as THREE from 'three';
import { makeCard } from 'papercraft/lib/paperkit-3d.js';

const C = {
  page: '#f3e7cd', deep: '#ead8b6', ochre: '#d7bd93', ochreD: '#bfa072',
  burnt: '#8c2b22', ember: '#b03a2e', gold: '#b8934a', jade: '#3f6b4a',
  ink: '#2a241c', face: '#efdcc0', faceD: '#dcc39c',
};

// 主角总高（与 createHarness 的 heroHeight 一致）
export const HERO_H = 3.6;

/**
 * 拼一只孙悟空，返回 { rig, parts, stride }。
 * rig 直接交给 H.setHero(rig, { stride })，由 harness 负责行走、转向与前倾。
 * 局部坐标：y 向上、单位与世界一致（脚底 y=0，头顶 3.6），面朝 +z。
 */
export function buildWukong(H, { x = 0, z = 3 } = {}) {
  const rig = new THREE.Group();
  rig.name = 'wukong';
  rig.position.set(x, 0, z);

  // 上身（躯干 + 头 + 金箍 + 手臂 + 虎皮裙）挂在 body 上：走起来整体轻微起伏，腿不跟着升
  const body = new THREE.Group();
  body.name = 'wukong-body';
  rig.add(body);

  /** 造一张卡：pts 用局部坐标（y 向上），dz 是本层深度。 */
  const card = (name, pts, paint, dz, parent = body) => {
    const m = makeCard(pts, { ...H.cardOpts(x, z), paint, thickness: 0.08, edgeWidth: 0.08, folds: ['bottom'] });
    m.name = name;
    m.position.z = dz;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ---- 躯干（赭石短打 + 朱砂腰带）----------------------------------------------
  // 半宽容到 0.42，是为了让两只手臂（内缘 0.44）在正面上永远不压住躯干。
  const torsoPts = [[-0.38, 1.12], [0.38, 1.12], [0.42, 2.10], [0.40, 2.46], [-0.40, 2.46], [-0.42, 2.10]];
  card('wukong-torso', torsoPts, (P) => {
    const { g, box } = P;
    P.fill(C.ochre);
    // 斜襟的墨线：从右肩到左腰
    g.strokeStyle = C.ink; g.globalAlpha = 0.55; g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(box.x0 + box.w * 0.74, box.y0 + box.h * 0.92);
    g.lineTo(box.x0 + box.w * 0.34, box.y0 + box.h * 0.06);
    g.stroke(); g.globalAlpha = 1;
    // 朱砂腰带（横贯下三分之一）
    g.fillStyle = C.ember;
    g.fillRect(box.x0 + box.w * 0.02, box.y0 + box.h * 0.20, box.w * 0.96, box.h * 0.10);
    // 腰带上两枚金扣
    g.fillStyle = C.gold;
    g.beginPath();
    g.arc(box.x0 + box.w * 0.30, box.y0 + box.h * 0.25, box.w * 0.05, 0, Math.PI * 2);
    g.arc(box.x0 + box.w * 0.70, box.y0 + box.h * 0.25, box.w * 0.05, 0, Math.PI * 2);
    g.fill();
    P.innerShade(C.ochreD, { alpha: 0.42, blurPx: 9 });
  }, 0);

  // 侧面卡：整张在正面卡之后（z = -0.10），顶低于正面卡领口
  card('wukong-torso-side', [[-0.26, 1.18], [0.26, 1.18], [0.26, 2.40], [-0.26, 2.40]], (P) => {
    P.fill(C.ochreD);
    P.innerShade(C.burnt, { alpha: 0.22, blurPx: 8 });
  }, -0.10);

  // ---- 头（脸 + 紧贴身后的侧面 + 金箍）---------------------------------------
  // 头约 1.3 倍自然比例：从 2.46 到 3.40，宽 0.36 半宽。
  card('wukong-head', [[-0.34, 2.46], [0.34, 2.46], [0.36, 3.18], [0.20, 3.34], [-0.20, 3.34], [-0.36, 3.18]], (P) => {
    const { g, box } = P;
    P.fill(C.face);
    // 桃心脸的下半部（腮）稍暗
    g.fillStyle = C.faceD; g.globalAlpha = 0.45;
    g.beginPath();
    g.ellipse(box.x0 + box.w * 0.5, box.y1 - box.h * 0.16, box.w * 0.34, box.h * 0.16, 0, 0, Math.PI * 2);
    g.fill(); g.globalAlpha = 1;
    // 雷公嘴：一道朱砂短弧 + 中线
    g.strokeStyle = C.burnt; g.lineWidth = 2.4; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(box.x0 + box.w * 0.42, box.y1 - box.h * 0.20);
    g.quadraticCurveTo(box.x0 + box.w * 0.5, box.y1 - box.h * 0.14, box.x0 + box.w * 0.58, box.y1 - box.h * 0.20);
    g.stroke();
    // 眼：墨点 + 朱砂眼圈（不画高光，spec BANNED 纯白）
    g.fillStyle = C.ink;
    for (const fx of [0.36, 0.64]) {
      g.beginPath();
      g.ellipse(box.x0 + box.w * fx, box.y0 + box.h * 0.52, box.w * 0.075, box.h * 0.10, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = C.ember; g.lineWidth = 1.6;
    for (const fx of [0.36, 0.64]) {
      g.beginPath();
      g.ellipse(box.x0 + box.w * fx, box.y0 + box.h * 0.52, box.w * 0.13, box.h * 0.15, 0, 0, Math.PI * 2);
      g.stroke();
    }
    P.innerShade(C.faceD, { alpha: 0.35, blurPx: 7 });
  }, 0.10);

  card('wukong-head-side', [[-0.26, 2.52], [0.26, 2.52], [0.26, 3.14], [-0.26, 3.14]], (P) => {
    P.fill(C.faceD);
    P.innerShade(C.ochreD, { alpha: 0.3, blurPx: 7 });
  }, 0.02);

  // 金箍：一道金环压在发际（z 最前，压住脸的顶缘）
  card('wukong-crown', [[-0.37, 3.14], [0.37, 3.14], [0.33, 3.28], [-0.33, 3.28]], (P) => {
    const { g, box } = P;
    P.fill(C.gold);
    g.fillStyle = C.ember;
    g.beginPath();
    g.arc(box.x0 + box.w * 0.5, box.y0 + box.h * 0.5, box.h * 0.34, 0, Math.PI * 2);
    g.fill();
    P.innerShade(C.burnt, { alpha: 0.35, blurPx: 4 });
  }, 0.20);

  // ---- 手臂（肩枢轴，内缘 0.44 > 躯干 0.42：正面永不压住躯干）--------------------
  const armPts = [[-0.12, -1.26], [0.12, -1.26], [0.13, 0.06], [-0.13, 0.06]];
  const armPaint = (P) => {
    const { g, box } = P;
    P.fill(C.ochre);
    g.fillStyle = C.burnt;                       // 袖口
    g.fillRect(box.x0, box.y0, box.w, box.h * 0.16);
    g.fillStyle = C.face;                        // 手
    g.beginPath();
    g.ellipse(box.x0 + box.w * 0.5, box.y1 - box.h * 0.06, box.w * 0.42, box.h * 0.07, 0, 0, Math.PI * 2);
    g.fill();
    P.innerShade(C.ochreD, { alpha: 0.4, blurPx: 6 });
  };
  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = 'wukong-shoulder-' + (side < 0 ? 'l' : 'r');
    pivot.position.set(side * 0.60, 2.42, -0.20);   // 层：手臂在躯干之后
    const m = makeCard(armPts, { ...H.cardOpts(x, z), paint: armPaint, thickness: 0.08, edgeWidth: 0.08, folds: ['top'] });
    m.name = 'wukong-arm-' + (side < 0 ? 'l' : 'r');
    pivot.add(m);
    body.add(pivot);
    arms.push(pivot);
  }

  // ---- 腿（髋枢轴，卡片的顶边在裙下 1.08 < 裙摆 1.12：与躯干无 y 重叠）------------
  const legPts = [[-0.17, -1.08], [0.17, -1.08], [0.19, -0.02], [-0.19, -0.02]];
  const legPaint = (P) => {
    const { g, box } = P;
    P.fill(C.ink);
    g.fillStyle = C.ink;
    g.globalAlpha = 0.75;
    g.fillRect(box.x0, box.y0, box.w, box.h * 0.18);
    g.globalAlpha = 1;
    g.fillStyle = C.ink;                          // 云靴
    g.fillRect(box.x0 - box.w * 0.06, box.y1 - box.h * 0.14, box.w * 1.12, box.h * 0.14);
    g.fillStyle = C.ochreD;                       // 靴口的金边
    g.fillRect(box.x0 - box.w * 0.06, box.y1 - box.h * 0.16, box.w * 1.12, box.h * 0.02);
    P.innerShade(C.burnt, { alpha: 0.22, blurPx: 5 });
  };
  const legs = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = 'wukong-hip-' + (side < 0 ? 'l' : 'r');
    pivot.position.set(side * 0.20, 1.10, -0.13);   // 层：腿在最最后
    const m = makeCard(legPts, { ...H.cardOpts(x, z), paint: legPaint, thickness: 0.08, edgeWidth: 0.08, folds: ['top'] });
    m.name = 'wukong-leg-' + (side < 0 ? 'l' : 'r');
    pivot.add(m);
    rig.add(pivot);
    legs.push(pivot);
  }

  // ---- 虎皮裙（盖住髋部，压在腿上：z 前于腿、后于躯干正面）--------------------------
  card('wukong-skirt', [[-0.36, 1.02], [0.36, 1.02], [0.40, 1.42], [-0.40, 1.42]], (P) => {
    const { g, box } = P;
    P.fill(C.ochreD);
    g.strokeStyle = C.burnt; g.lineWidth = 2;
    for (let i = 0; i < 5; i++) {                 // 虎纹
      const fx = box.x0 + box.w * (0.12 + i * 0.19);
      g.beginPath();
      g.moveTo(fx, box.y0 + box.h * 0.15);
      g.quadraticCurveTo(fx + box.w * 0.06, box.y0 + box.h * 0.55, fx, box.y0 + box.h * 0.95);
      g.stroke();
    }
    P.innerShade(C.burnt, { alpha: 0.3, blurPx: 6 });
  }, 0.14);

  // ---- 金箍棒（斜背在身后，整张在最后）-------------------------------------------
  const staff = new THREE.Group();
  staff.name = 'wukong-staff-holder';
  staff.position.set(0, 1.95, -0.50);
  staff.rotation.z = 0.34;
  const staffCard = makeCard([[-0.07, -1.62], [0.07, -1.62], [0.07, 1.62], [-0.07, 1.62]],
    { ...H.cardOpts(x, z), paint: (P) => {
      P.fill(C.ink);
      P.g.fillStyle = C.gold;
      P.g.fillRect(P.box.x0 - P.box.w * 0.08, P.box.y1 - P.box.h * 0.08, P.box.w * 1.16, P.box.h * 0.05);
      P.g.fillRect(P.box.x0 - P.box.w * 0.08, P.box.y0 + P.box.h * 0.02, P.box.w * 1.16, P.box.h * 0.05);
    }, thickness: 0.08, edgeWidth: 0.08, folds: ['top', 'bottom'] });
  staffCard.name = 'wukong-staff';
  staff.add(staffCard);
  body.add(staff);

  // ---- 步态：步幅按「走过的距离」算，脚不会打滑 ------------------------------------
  // 一个完整周期 = 2π = 两步；支撑相内腿角与距离成线性（脚钉在地上），摆动相做 smoothstep。
  const STEP = HERO_H * 0.58 / 2;   // 半步长（世界单位）
  const LEG = 1.08, ARM = 0.34;
  const stride = (walked, gait) => {
    const phase = (walked / STEP) * Math.PI;
    const s = Math.sin(phase), c = Math.cos(phase);
    const A = Math.min(0.5, (gait * STEP * 2) / (2 * LEG));   // 半步长 / 腿长的比值，宽摆时压到 0.5 rad
    const legAngle = (ph) => {
      const u = (ph / Math.PI) % 2;
      if (u >= 1) return A * (3 - 2 * u);                      // 支撑相：线性，脚不动
      const e = u * u * (3 - 2 * u);                           // 摆动相：smoothstep 从后回到前
      return A * (2 * e - 1);
    };
    legs[0].rotation.x = legAngle(phase);
    legs[1].rotation.x = legAngle(phase + Math.PI);
    arms[0].rotation.x = -ARM * gait * c;                      // 手臂与腿反相
    arms[1].rotation.x = ARM * gait * c;
    body.position.y = 0.033 * HERO_H * gait * Math.abs(s);     // 过步时略高、落脚时最低
    body.rotation.x = 0.02 * gait * Math.sin(2 * phase - 1.2); // 躯干轻微滞后
    body.rotation.z = 0.012 * gait * s;                        // 左右轻晃
  };

  // harness 的 setHero 收的是 popup 那样的「铰链句柄」：它每帧动 handle.group（位置、朝向），
  // 并把 lean/roll 写到 handle.pivot.children[0] 上。自建纸偶要给出同形状的两层：
  // pivot 是外壳（只承接前倾/侧倾），group 是真正被搬动的那一层。
  const pivot = new THREE.Group();
  pivot.name = 'wukong-pivot';
  pivot.add(rig);
  return { handle: { group: rig, pivot }, stride, parts: { body, arms, legs, staff } };
}