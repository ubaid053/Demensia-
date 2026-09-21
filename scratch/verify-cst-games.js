const fs = require('fs');

async function runTests() {
  console.log('=== DEFINITION OF DONE VERIFICATION ===');

  // Check 1: HTML markup and scripts in games.html
  const html = fs.readFileSync('games.html', 'utf8');

  const hasTodo = html.includes('TODO: Out of scope for this pass') && html.includes('Sound & Song Recall');
  console.log('1a. Out-of-scope TODO comment:', hasTodo ? 'PASS' : 'FAIL');

  const hasOrientationBoard = html.includes('id="orientation-board-container"');
  console.log('1b. Orientation board container present:', hasOrientationBoard ? 'PASS' : 'FAIL');

  const hasSortCard = html.includes('id="card-categorize"') && html.includes('Sort It Out');
  console.log('1c. Sort It Out 6th tile in game grid:', hasSortCard ? 'PASS' : 'FAIL');

  const hasSortView = html.includes('id="view-categorize"') && html.includes('id="categorize-buckets"');
  console.log('1d. Sort It Out game view container:', hasSortView ? 'PASS' : 'FAIL');

  const hasScripts = html.includes('js/game-orientation.js') && html.includes('js/game-categorize.js');
  console.log('1e. Script tags included:', hasScripts ? 'PASS' : 'FAIL');

  // Check 2: Test js/game-orientation.js line count & logic
  const orientCode = fs.readFileSync('js/game-orientation.js', 'utf8');
  const lineCount = orientCode.trim().split('\n').length;
  console.log('2a. game-orientation.js lines:', lineCount, lineCount <= 60 ? '(<= 60 PASS)' : '(OVER 60 FAIL)');

  // Check 3: Spot-check game-memory.js gentle redirect
  const memCode = fs.readFileSync('js/game-memory.js', 'utf8');
  const hasMemGentle = memCode.includes('showEncouragement') && memCode.includes("Let's try that again");
  console.log('3a. game-memory.js gentle no-fail redirect:', hasMemGentle ? 'PASS' : 'FAIL');

  // Check 4: Spot-check game-attention.js gentle redirect
  const attCode = fs.readFileSync('js/game-attention.js', 'utf8');
  const hasAttGentle = attCode.includes('showEncouragement') && attCode.includes("Let's try that again");
  console.log('4a. game-attention.js gentle no-fail redirect:', hasAttGentle ? 'PASS' : 'FAIL');

  // Check 5: Spot-check game-pattern.js gentle redirect
  const patCode = fs.readFileSync('js/game-pattern.js', 'utf8');
  const hasPatGentle = patCode.includes('showEncouragement') && patCode.includes("Let's try that again");
  console.log('5a. game-pattern.js gentle no-fail redirect:', hasPatGentle ? 'PASS' : 'FAIL');

  // Check 6: Simulate game-categorize.js session logging end-to-end
  let sessionPayloadReceived = null;
  global.CLINICAL_DATA = {
    patients: [{ id: 'NER-2024-081', name: 'Bhaben Kalita', district: 'Kamrup', sessions: [] }]
  };
  global.DifficultyEngine = {
    getTier: () => 1,
    getTierLabel: () => 'Tier 1 (Gentle)'
  };
  const makeMockEl = () => ({
    style: {},
    dataset: {},
    innerHTML: '',
    textContent: '',
    className: '',
    appendChild: () => {},
    addEventListener: () => {},
    offsetWidth: 100
  });

  global.document = {
    getElementById: (id) => makeMockEl(),
    createElement: (tag) => makeMockEl()
  };
  global.window = {};
  global.navigator = { userAgent: 'test' };

  const vm = require('vm');
  vm.runInThisContext(fs.readFileSync('js/games-data.js', 'utf8'));
  vm.runInThisContext(fs.readFileSync('js/game-categorize.js', 'utf8'));

  // Intercept _dispatchSession
  SessionLogger._dispatchSession = (payload) => {
    sessionPayloadReceived = payload;
  };

  global.GameApp = {
    showEncouragement: (msg) => {},
    showEndScreen: (opts) => {}
  };
  global.GameAudio = {
    speakRaw: () => {}
  };

  // Init and play Sort It Out
  GameCategorize.init('NER-2024-081', CLINICAL_DATA.patients[0]);
  console.log('6a. GameCategorize initialized with', GameCategorize.items.length, 'regional items');

  // Play every item with correct answers
  for (let i = 0; i < GameCategorize.items.length; i++) {
    GameCategorize.currentIdx = i;
    GameCategorize.lockInput = false;
    const item = GameCategorize.items[i];
    GameCategorize._onBucketClick(item.answer);
  }

  // Complete game
  GameCategorize._onComplete();

  console.log('6b. Session payload recorded:');
  console.log('   gameId:', sessionPayloadReceived?.gameId);
  console.log('   gameName:', sessionPayloadReceived?.gameName);
  console.log('   category:', sessionPayloadReceived?.category);
  console.log('   accuracy:', sessionPayloadReceived?.accuracy);
  console.log('   attempted:', sessionPayloadReceived?.attempted);
  console.log('   correct:', sessionPayloadReceived?.correct);

  const sessionPass = sessionPayloadReceived &&
    sessionPayloadReceived.gameId === 'pattern-sorting' &&
    sessionPayloadReceived.gameName === 'Sort It Out' &&
    sessionPayloadReceived.accuracy === 100 &&
    sessionPayloadReceived.attempted === GameCategorize.items.length;

  console.log('6c. End-to-end Sort It Out session test:', sessionPass ? 'PASS' : 'FAIL');

  // Check 7: Spot check deliberate wrong answer in GameCategorize for gentle redirect
  let encouragementMsg = null;
  global.GameApp.showEncouragement = (msg) => { encouragementMsg = msg; };
  GameCategorize.init('NER-2024-081', CLINICAL_DATA.patients[0]);
  const firstItem = GameCategorize.items[0];
  const wrongCat = firstItem.answer === 'fruits' ? 'veg' : 'fruits';
  GameCategorize._onBucketClick(wrongCat);
  const gentlePass = encouragementMsg && encouragementMsg.includes("Let's try that again");
  console.log('7a. Deliberate wrong answer gentle redirect test:', gentlePass ? 'PASS' : 'FAIL');

  // Check 8: Test GameOrientation.render output
  vm.runInThisContext(fs.readFileSync('js/game-orientation.js', 'utf8'));
  let renderedHtml = '';
  global.document.getElementById = (id) => {
    const el = makeMockEl();
    Object.defineProperty(el, 'innerHTML', {
      set: (val) => { renderedHtml = val; },
      get: () => renderedHtml
    });
    return el;
  };
  GameOrientation.render('orientation-board-container', CLINICAL_DATA.patients[0]);
  const orientRenderPass = renderedHtml.includes("Today's Reality Orientation") &&
    renderedHtml.includes('Bhaben') &&
    renderedHtml.includes('Kamrup, Assam');
  console.log('8a. GameOrientation.render output test:', orientRenderPass ? 'PASS' : 'FAIL');

  console.log('=== ALL CHECKS COMPLETE ===');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
