// ── 场景骨架：与 git-practice-7 展示台同款 ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x16213e);
scene.fog = new THREE.Fog(0x16213e, 8, 20);         // 雾：远处渐隐，出氛围

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 5.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);

// 光源：环境光+方向光双光源
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(3, 6, 4);
scene.add(dir);

// 展台底座：大圆柱
const stage = new THREE.Mesh(
  new THREE.CylinderGeometry(1.8, 2.0, 0.3, 48),
  new THREE.MeshStandardMaterial({ color: 0x37474f })
);
stage.position.y = -0.15;
scene.add(stage);

// ── 卡牌正面纹理：用 canvas 把真实 JSON 数据画上去 ──
function drawCardFace(card) {
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 768;
  const ctx = cv.getContext('2d');

  // 底色：暗红渐变（铁甲战士主题色）
  const bg = ctx.createLinearGradient(0, 0, 0, 768);
  bg.addColorStop(0, '#5d1a1a');
  bg.addColorStop(1, '#2b0d0d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 768);

  // 描边框
  ctx.strokeStyle = '#d97519';
  ctx.lineWidth = 10;
  ctx.strokeRect(16, 16, 480, 736);

  // 卡名
  ctx.fillStyle = '#ffe9c8';
  ctx.font = 'bold 64px KaiTi, 楷体, serif';
  ctx.textAlign = 'center';
  ctx.fillText(card.name, 256, 160);

  // 分隔线
  ctx.strokeStyle = 'rgba(217, 117, 25, 0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, 200);
  ctx.lineTo(452, 200);
  ctx.stroke();

  // 属性数值
  ctx.font = '48px KaiTi, 楷体, serif';
  ctx.fillStyle = '#9fe870';
  ctx.fillText(`胜率 ${card.winRate}%`, 256, 420);
  ctx.fillStyle = '#4fc3f7';
  ctx.fillText(`使用率 ${card.pickRate}%`, 256, 510);

  // 底部落款
  ctx.font = '32px KaiTi, 楷体, serif';
  ctx.fillStyle = 'rgba(255, 233, 200, 0.55)';
  ctx.fillText('杀戮尖塔Ⅱ · 铁甲战士', 256, 680);

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
    new THREE.MeshStandardMaterial({ color: 0x2b0d0d }), // 正面（+Z，稍后贴卡面贴图）
    new THREE.MeshStandardMaterial({ color: 0x2b0d0d })  // 背面（-Z）
  ]
);
cardMesh.position.y = 1.9;
card.add(cardMesh);
scene.add(card);

// 加载真实数据：随机抽一张铁甲战士的卡画上正面
fetch('../cards-ironclad.json')
  .then(r => r.json())
  .then(cards => {
    cardMesh.material[4] = new THREE.MeshStandardMaterial({ map: drawCardFace(cards[Math.floor(Math.random() * cards.length)]) });
    cardMesh.material[4].needsUpdate = true;
  })
  .catch(err => console.error('卡牌数据加载失败:', err));

// 动画：卡牌缓转
const animate = () => {
  requestAnimationFrame(animate);
  card.rotation.y += 0.008;
  renderer.render(scene, camera);
};
animate();

// 窗口适配
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});