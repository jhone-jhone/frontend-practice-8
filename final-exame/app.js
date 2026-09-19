// ── 并行加载全部 10 个 JSON 文件 ──
async function loadAllData() {
  try {
    const [characters, cardTexts, ancient, colorless, defect, ironclad, necrobinder, other, regent, silent] = await Promise.all([
      fetch('characters.json').then(r => r.json()),      // 5 个角色胜率/使用率
      fetch('cards.json').then(r => r.json()),           // 卡牌文案翻译表
      fetch('cards-ancient.json').then(r => r.json()),   // 先古之民
      fetch('cards-colorless.json').then(r => r.json()), // 无色牌
      fetch('cards-defect.json').then(r => r.json()),    // 故障机器人
      fetch('cards-ironclad.json').then(r => r.json()),  // 铁甲战士
      fetch('cards-necrobinder.json').then(r => r.json()),// 亡灵契约师
      fetch('cards-other.json').then(r => r.json()),     // 其他卡牌
      fetch('cards-regent.json').then(r => r.json()),    // 储君
      fetch('cards-silent.json').then(r => r.json())     // 静默猎手
    ]);
    console.log('角色数据:', characters);
    console.log('卡牌文案表:', cardTexts);
    renderCharacterCharts(characters);
    console.log('先古之民:', ancient);
    console.log('无色牌:', colorless);
    console.log('故障机器人:', defect);
    console.log('铁甲战士:', ironclad);
    console.log('亡灵契约师:', necrobinder);
    console.log('其他卡牌:', other);
    console.log('储君:', regent);
    console.log('静默猎手:', silent);
    // 卡牌板块: 汇总各卡池 + 反查效果表
    pools = { ironclad, silent, regent, necrobinder, defect, ancient, colorless, other };
    effectMap = buildEffectMap(cardTexts);
    renderCards();
  } catch (err) {
    console.error('数据加载失败:', err);
  }
}

// ── 角色板块: 出场率/胜率两张饼图 ──
// 每个角色的固定主题色
const CHARACTER_COLORS = {
  '铁甲战士': '#e53935',   // 红
  '静默猎手': '#43a047',   // 绿
  '储君': '#fb8c00',       // 橙
  '故障机器人': '#1e88e5', // 蓝
  '亡灵契约师': '#8e24aa'  // 紫
};

const renderCharacterCharts = (characters) => {
  // 把角色数组转成饼图数据, 并附上每个角色的固定颜色
  const toPieData = (key) => characters.map(c => ({
    name: c.name,
    value: c[key],
    itemStyle: { color: CHARACTER_COLORS[c.name] }
  }));

  const pieOption = (title, data) => ({
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
    legend: { type: 'scroll', bottom: 0, left: 'center' },
    series: [{
      name: title,
      type: 'pie',
      radius: '55%',
      center: ['50%', '45%'],
      data: data,
      avoidLabelOverlap: true,
      label: {
        formatter: '{b}\n{c}%',
        textBorderColor: 'transparent',
        overflow: 'break'
      },
      labelLine: { length: 14, length2: 10 }
    }]
  });

  const pickChart = echarts.init(document.querySelector('#pickrate-chart'));
  pickChart.setOption(pieOption(
    '角色出场率',
    toPieData('pickRate')
  ));

  const winChart = echarts.init(document.querySelector('#winrate-chart'));
  winChart.setOption(pieOption(
    '角色胜率',
    toPieData('winRate')
  ));

  // 窗口缩放时让图表自适应
  window.addEventListener('resize', () => {
    pickChart.resize();
    winChart.resize();
  });
};

// ── 卡牌板块: 角色选项 + 胜率排名 + 点击看效果 ──
const POOL_LABELS = {
  ironclad: '铁甲战士',
  silent: '静默猎手',
  regent: '储君',
  necrobinder: '亡灵契约师',
  defect: '故障机器人',
  ancient: '先古之民',
  colorless: '无色牌',
  other: '其他卡牌'
};

let pools = {};
let effectMap = {};

// 从文案表反查: 中文卡名 → 效果描述
const buildEffectMap = (cardTexts) => {
  const map = {};
  Object.keys(cardTexts).forEach(key => {
    if (key.endsWith('.title')) {
      const id = key.slice(0, -'.title'.length);
      const desc = cardTexts[`${id}.description`];
      if (desc) map[cardTexts[key]] = desc;
    }
  });
  return map;
};

// 清理游戏本地化标记: {表达式}→X, [gold]等标签→去掉
// 孤立的 X (后面没接汉字, 多为能量消耗) 统一补上"点能量"
const cleanEffect = (text) => text
  .replace(/\{[^}]*\}/g, 'X')
  .replace(/\[\/?[a-zA-Z]+\]/g, '')
  .replace(/X(?!\s*[\u4e00-\u9fa5])/g, 'X点能量')
  .replace(/\n/g, '<br>');

// 前三名高亮徽章
const rankBadge = (i) => {
  const cls = ['text-bg-danger', 'text-bg-warning', 'text-bg-primary'][i] || 'text-bg-secondary';
  return `<span class="badge ${cls}">${i + 1}</span>`;
};

const renderCards = () => {
  const poolKey = document.querySelector('#character-filter').value;
  // 卡牌名字用所属角色的主题色上色
  const charColor = CHARACTER_COLORS[POOL_LABELS[poolKey]] || '#212529';
  const cards = (pools[poolKey] || []).slice().sort((a, b) => b.winRate - a.winRate);
  const list = document.querySelector('#card-list');
  list.innerHTML = '';
  if (cards.length === 0) {
    list.innerHTML = '<li class="list-group-item">没有该角色的卡牌数据</li>';
    return;
  }
  cards.forEach((c, i) => {
    const effect = effectMap[c.name];
    // 每张卡的效果区有唯一 id, 卡名按钮通过 data-bs 属性控制它折叠
    const effectId = `effect-${poolKey}-${i}`;
    list.insertAdjacentHTML('beforeend', `
      <li class="list-group-item">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span>
            ${rankBadge(i)}
            <button type="button" class="btn btn-link btn-sm p-0 align-baseline card-name collapsed"
                    style="color: ${charColor}"
                    data-bs-toggle="collapse" data-bs-target="#${effectId}"
                    aria-expanded="false" aria-controls="${effectId}">${c.name}</button>
          </span>
          <span class="small">胜率 <strong>${c.winRate}%</strong> · 出场率 ${c.pickRate}%</span>
        </div>
        <div class="collapse card-effect small text-muted mt-1" id="${effectId}">
          <div>${effect ? cleanEffect(effect) : '暂无效果资料'}</div>
        </div>
      </li>
    `);
  });
};

document.querySelector('#character-filter').addEventListener('change', renderCards);

loadAllData();
