const fs = require('fs');

// 1. Verify CSS layout
const css = fs.readFileSync('css/games.css', 'utf8');
const hasWideMain = css.includes('max-width: 1560px');
const hasCardsGrid = css.includes('grid-template-columns: repeat(3, 1fr)');
const hasMutePointer = css.includes('.btn-mute-toggle *') && css.includes('pointer-events: none');
console.log('CSS Checks:', { hasWideMain, hasCardsGrid, hasMutePointer });

// 2. Verify games.html back button & nav
const html = fs.readFileSync('games.html', 'utf8');
const backHomeChecks = html.includes('this._showView("view-home");');
const updateNavExposed = html.includes('this._updateNavActive = updateNavActive;');
const singleClickMute = html.includes('headerBtn.onclick = handleToggle;');
console.log('HTML/JS Checks:', { backHomeChecks, updateNavExposed, singleClickMute });

// 3. Verify games-data.js speech cancel
const jsData = fs.readFileSync('js/games-data.js', 'utf8');
const hasSpeakingCancel = jsData.includes('if (window.speechSynthesis.speaking)') && jsData.includes('window.speechSynthesis.cancel()');
console.log('Audio Checks:', { hasSpeakingCancel });

if (hasWideMain && hasCardsGrid && hasMutePointer && backHomeChecks && updateNavExposed && singleClickMute && hasSpeakingCancel) {
  console.log('\n>>> ALL 3 REQUIREMENTS VERIFIED SUCCESSFULLY! <<<');
} else {
  console.error('\n>>> SOME CHECKS FAILED! <<<');
  process.exit(1);
}
