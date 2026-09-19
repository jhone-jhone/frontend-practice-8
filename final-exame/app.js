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

loadAllData();
