// ── 场景骨架：与 git-practice-7 展示台同款 ──
const scene = new THREE.Scene();
// 背景换成网页同款背景图 (异步加载, 加载完成前先用深色兜底)
scene.background = new THREE.Color(0x16213e);
new THREE.TextureLoader().load('../images/qq20260307.png', (tex) => {
  scene.background = tex;
});

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 6);

// 画布铺满整个页面, 背景图完整显示
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 视角稍微对准卡牌方向
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.2, 0);
controls.update();

// 光源：环境光+方向光双光源
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(3, 6, 4);
scene.add(dir);

// 展台底座：大圆柱 (与卡牌一起放在画面左侧)
const stage = new THREE.Mesh(
  new THREE.CylinderGeometry(1.8, 2.0, 0.3, 48),
  new THREE.MeshStandardMaterial({ color: 0x37474f })
);
stage.position.set(-2.5, -0.09, 0);   // 缩放后高度 0.18, 让台面正好在 y=0
stage.scale.setScalar(0.6);   // 与卡牌同比例缩小
scene.add(stage);

// ── 颜色工具: hex 与黑/白按比例混合 ──
const mix = (hex, target, k) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s) => Math.round(((n >> s) & 255) * (1 - k) + target * k);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
const darken = (hex, k) => mix(hex, 0, k);
const lighten = (hex, k) => mix(hex, 255, k);

// ── 角色轮换配置: 只轮换五位可操作角色 ──
const POOL_ORDER = ['ironclad', 'silent', 'regent', 'necrobinder', 'defect'];
const POOL_META = {
  ironclad:    { label: '铁甲战士',   img: '../images/zhanshi.jpg', color: '#e53935' },
  silent:      { label: '静默猎手',   img: '../images/liechou.jpg', color: '#43a047' },
  regent:      { label: '储君',       img: '../images/chujun.jpg',  color: '#fb8c00' },
  necrobinder: { label: '亡灵契约师', img: '../images/necrobinder.jpg', color: '#8e24aa' },
  defect:      { label: '故障机器人', img: '../images/jibao.jpg',   color: '#1e88e5' },
  ancient:     { label: '先古之民',   img: '../images/gumei.jpg',   color: '#9e9d24' },
  colorless:   { label: '无色牌',     img: null,                    color: '#757575' },
  other:       { label: '其他卡牌',   img: null,                    color: '#546e7a' }
};
let poolIndex = 0;
const poolCache = {};
const imgCache = {};

// 卡池数据缓存: 同一角色只 fetch 一次
const loadPool = (key) =>
  poolCache[key] || (poolCache[key] = fetch(`../cards-${key}.json`).then(r => r.json()));

// 图片缓存: 同一张照片只加载一次
const getImage = (src) => new Promise((resolve) => {
  if (imgCache[src]) return resolve(imgCache[src]);
  const im = new Image();
  im.onload = () => { imgCache[src] = im; resolve(im); };
  im.onerror = () => resolve(null);
  im.src = src;
});

// ── 卡牌正面纹理：canvas 画名称/照片/数据, 配色跟随角色主题 ──
async function drawCardFace(cardData, meta) {
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 768;
  const ctx = cv.getContext('2d');

  // 底色: 主题色变暗后的渐变
  const bg = ctx.createLinearGradient(0, 0, 0, 768);
  bg.addColorStop(0, darken(meta.color, 0.55));
  bg.addColorStop(1, darken(meta.color, 0.75));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 768);

  // 描边框: 主题色提亮
  ctx.strokeStyle = lighten(meta.color, 0.35);
  ctx.lineWidth = 10;
  ctx.strokeRect(16, 16, 480, 736);

  // 卡名
  ctx.fillStyle = '#ffe9c8';
  ctx.font = 'bold 64px KaiTi, 楷体, serif';
  ctx.textAlign = 'center';
  ctx.fillText(cardData.name, 256, 160);

  // 分隔线
  ctx.strokeStyle = 'rgba(255, 233, 200, 0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, 200);
  ctx.lineTo(452, 200);
  ctx.stroke();

  // 角色照片 (等比缩放进 300x140 区域, 居中; 有 crop 配置时先裁剪)
  if (meta.img) {
    const img = await getImage(meta.img);
    if (img) {
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (meta.crop) ({ sx, sy, sw, sh } = meta.crop);
      const maxW = 300, maxH = 140;
      const scale = Math.min(maxW / sw, maxH / sh);
      const w = sw * scale, h = sh * scale;
      ctx.drawImage(img, sx, sy, sw, sh, (512 - w) / 2, 220 + (maxH - h) / 2, w, h);
    }
  }

  // 属性数值
  ctx.font = '48px KaiTi, 楷体, serif';
  ctx.fillStyle = '#9fe870';
  ctx.fillText(`胜率 ${cardData.winRate}%`, 256, 420);
  ctx.fillStyle = '#4fc3f7';
  ctx.fillText(`使用率 ${cardData.pickRate}%`, 256, 510);

  // 底部落款
  ctx.font = '32px KaiTi, 楷体, serif';
  ctx.fillStyle = 'rgba(255, 233, 200, 0.55)';
  ctx.fillText(`杀戮尖塔Ⅱ · ${meta.label}`, 256, 680);

  return new THREE.CanvasTexture(cv);
}

// ── 展品：一张会旋转的卡牌（薄盒子，有厚度才立体）──
const card = new THREE.Group();
const cardMesh = new THREE.Mesh(
  new THREE.BoxGeometry(2.2, 3.3, 0.05),
  [
    new THREE.MeshStandardMaterial({ color: 0x5d1a1a }), // 右
    new THREE.MeshStandardMaterial({ color: 0x5d1a1a }), // 左
    new THREE.MeshStandardMaterial({ color: 0x7a2020 }), // 顶
    new THREE.MeshStandardMaterial({ color: 0x7a2020 }), // 底
    new THREE.MeshStandardMaterial({ color: 0x2b0d0d }), // 正面（+Z，showPool 时贴卡面贴图）
    new THREE.MeshStandardMaterial({ color: 0x2b0d0d })  // 背面（-Z）
  ]
);
// 缩小卡牌并整体移到画面左侧
cardMesh.position.y = 1.65;   // 组内抬高, 缩放后正好站在展台上
card.scale.setScalar(0.6);
card.position.x = -2.5;
card.add(cardMesh);
scene.add(card);

// 自适应布局: 宽屏(比例≥1.2)卡牌靠左, 窄屏回中避免跑出画面
const layoutScene = () => {
  const x = window.innerWidth / window.innerHeight >= 1.2 ? -2.5 : 0;
  card.position.x = x;
  stage.position.x = x;
};
layoutScene();

// 侧面/背面材质跟随角色主题色
const applyTheme = (meta) => {
  const side = darken(meta.color, 0.55);
  const edge = darken(meta.color, 0.45);
  const back = darken(meta.color, 0.75);
  cardMesh.material[0].color.set(side);
  cardMesh.material[1].color.set(side);
  cardMesh.material[2].color.set(edge);
  cardMesh.material[3].color.set(edge);
  cardMesh.material[5].color.set(back);
};

// 展示某个角色: 随机抽一张卡 + 换主题色 + 重画卡面
const showPool = async (key) => {
  const meta = POOL_META[key];
  try {
    const cards = await loadPool(key);
    applyTheme(meta);
    const cardData = cards[Math.floor(Math.random() * cards.length)];
    const old = cardMesh.material[4];
    cardMesh.material[4] = new THREE.MeshStandardMaterial({
      map: await drawCardFace(cardData, meta)
    });
    old.dispose();  // 释放旧贴图占用的显存
  } catch (err) {
    console.error('卡牌数据加载失败:', err);
  }
};

// 初始展示第一个角色
showPool(POOL_ORDER[poolIndex]);

// 动画: 每转满一圈 (2π) 切换到下一个角色
const animate = () => {
  requestAnimationFrame(animate);
  card.rotation.y += 0.008;
  if (card.rotation.y >= Math.PI * 2) {
    card.rotation.y -= Math.PI * 2;
    poolIndex = (poolIndex + 1) % POOL_ORDER.length;
    showPool(POOL_ORDER[poolIndex]);
  }
  renderer.render(scene, camera);
};
animate();

// 窗口适配
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  layoutScene();
});