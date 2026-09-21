const fs = require('fs');
const vm = require('vm');

global.window = {
  scrollTo: () => {},
  addEventListener: () => {},
  dispatchEvent: () => {},
  speechSynthesis: {
    speaking: false,
    cancel: function() { this.speaking = false; },
    speak: function() { this.speaking = true; }
  }
};
global.localStorage = {
  _store: {},
  getItem: function(k) { return this._store[k] || null; },
  setItem: function(k, v) { this._store[k] = String(v); }
};
global.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
global.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };

vm.runInThisContext(fs.readFileSync('js/games-data.js', 'utf8'));

// Test GameAudio mute
console.log('Initial isMuted:', GameAudio.isMuted);
GameAudio.toggleMute();
console.log('After 1 toggle isMuted:', GameAudio.isMuted);
if (!GameAudio.isMuted) throw new Error('Failed to mute on single toggle');

GameAudio.toggleMute(); // unmute
console.log('After 2nd toggle isMuted:', GameAudio.isMuted);

// Test single-click cancel if speaking
window.speechSynthesis.speaking = true;
GameAudio.speak('memoryMatch');
console.log('Speaking status after click on speaking audio:', window.speechSynthesis.speaking);
if (window.speechSynthesis.speaking !== false) throw new Error('Did not cancel speech on single click');

console.log('DOM & Audio Flow Tests Passed Successfully!');
