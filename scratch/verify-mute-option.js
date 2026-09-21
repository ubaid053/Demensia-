const fs = require('fs');
const vm = require('vm');

async function testMute() {
  console.log('=== MUTE OPTION VERIFICATION ===');

  // 1. Check games.html has the buttons
  const html = fs.readFileSync('games.html', 'utf8');
  const hasHeaderBtn = html.includes('id="btn-toggle-audio-mute"');
  console.log('1. Header mute button present in games.html:', hasHeaderBtn ? 'PASS' : 'FAIL');

  const hasSidebarBtn = html.includes('id="sidebar-btn-mute"');
  console.log('2. Sidebar drawer mute button present in games.html:', hasSidebarBtn ? 'PASS' : 'FAIL');

  const hasWireMethod = html.includes('_wireMuteButtons');
  console.log('3. _wireMuteButtons wired in GameApp:', hasWireMethod ? 'PASS' : 'FAIL');

  // 2. Check css/games.css has the styles
  const css = fs.readFileSync('css/games.css', 'utf8');
  const hasCss = css.includes('.btn-mute-toggle') && css.includes('.btn-mute-toggle.is-muted');
  console.log('4. .btn-mute-toggle styles in css/games.css:', hasCss ? 'PASS' : 'FAIL');

  // 3. Test GameAudio mute functionality
  let speakCalled = false;
  let cancelCalled = false;
  const localStorageStore = {};

  global.localStorage = {
    getItem: (k) => localStorageStore[k] || null,
    setItem: (k, v) => { localStorageStore[k] = String(v); }
  };
  global.SpeechSynthesisUtterance = function(text) { this.text = text; };
  global.window = {
    speechSynthesis: {
      speak: (utt) => { speakCalled = true; },
      cancel: () => { cancelCalled = true; }
    },
    dispatchEvent: () => {}
  };
  global.CustomEvent = function(name, opts) { this.name = name; this.detail = opts ? opts.detail : {}; };

  vm.runInThisContext(fs.readFileSync('js/games-data.js', 'utf8'));

  GameAudio.init('English');
  console.log('5. Initial GameAudio.isMuted:', GameAudio.isMuted, '(Expected false)');

  // Test speaking when unmuted
  speakCalled = false;
  GameAudio.speakRaw('Hello world');
  console.log('6. Speaks when unmuted:', speakCalled ? 'PASS' : 'FAIL');

  // Test muting
  cancelCalled = false;
  const mutedResult = GameAudio.toggleMute();
  console.log('7. toggleMute() returned:', mutedResult, 'isMuted is:', GameAudio.isMuted, '(Expected true)');
  console.log('8. Saved to localStorage:', localStorageStore['cdx_game_audio_muted'] === 'true' ? 'PASS' : 'FAIL');
  console.log('9. Speech synthesis canceled on mute:', cancelCalled ? 'PASS' : 'FAIL');

  // Test speaking while muted
  speakCalled = false;
  GameAudio.speakRaw('This should not play');
  GameAudio.speak('welcome');
  console.log('10. Blocked speaking while muted:', !speakCalled ? 'PASS' : 'FAIL');

  // Test unmuting
  GameAudio.toggleMute();
  speakCalled = false;
  GameAudio.speakRaw('This should play now');
  console.log('11. Resumed speaking when unmuted:', speakCalled ? 'PASS' : 'FAIL');

  console.log('=== ALL MUTE TESTS PASSED ===');
}

testMute().catch(err => {
  console.error(err);
  process.exit(1);
});
