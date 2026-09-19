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

loadAllData();
