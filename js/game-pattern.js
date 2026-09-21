/**
 * PATTERN & OBJECT SORT — GAME 4
 * Maps to: cognitiveModules.patternRecognition
 * Objects appear one by one; patient taps correct category bucket.
 * Tracks: accuracy, decision speed, error pattern per category (clinically useful).
 * No time pressure — objects appear gently, no countdown.
 */

const GamePattern = {
  patientId: null,
  tier: 1,
  game: null,       // selected sort game definition
  items: [],        // shuffled items for this tier
  currentIdx: 0,
  startTime: null,
  itemStartTime: null,
  decisionTimes: [],   // ms per item
  results: [],         // {itemId, correct, answer, expected, decisionMs}
  categoryErrors: {},  // { categoryId: errorCount }

  init(patientId, patient) {
    this.patientId = patientId;
    this.tier = DifficultyEngine.getTier(patient, "patternRecognition");
    this.currentIdx = 0;
    this.decisionTimes = [];
    this.results = [];

    // Pick which sort game to use (alternate each call)
    const idx = Math.floor(Math.random() * GameContent.sortGames.length);
    this.game = GameContent.sortGames[idx];

    // Initialize error counts
    this.categoryErrors = {};
    this.game.categories.forEach(c => { this.categoryErrors[c.id] = 0; });

    // Pick N items for this tier, shuffled
    const count = GameContent.sortTierCounts[this.tier];
    const pool = [...this.game.items];
    this._shuffle(pool);
    this.items = pool.slice(0, count);

    this.startTime = Date.now();
    this._render();
    this._showItem();
    GameAudio.speak("pattern");
  },

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  _render() {
    // Render category buckets
    const bucketsEl = document.getElementById("sort-buckets");
    if (!bucketsEl) return;
    bucketsEl.innerHTML = "";
    this.game.categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "sort-bucket";
      btn.dataset.catId = cat.id;
      btn.innerHTML = `<span class="bucket-icon">${cat.icon}</span><span>${cat.label}</span>`;
      btn.addEventListener("click", () => this._onBucketClick(cat.id));
      bucketsEl.appendChild(btn);
    });

    // Question label
    const qEl = document.getElementById("sort-question");
    if (qEl) qEl.textContent = this.game.question;

    this._updateProgress();
  },

  _showItem() {
    if (this.currentIdx >= this.items.length) {
      this._onComplete();
      return;
    }

    const item = this.items[this.currentIdx];
    const stage = document.getElementById("sort-object-stage");
    if (!stage) return;

    stage.innerHTML = `
      <span role="img" aria-label="${item.label}" style="font-size:3.5rem; line-height:1;">${item.emoji}</span>
      <span class="sort-object-name">${item.label}</span>
    `;
    stage.style.animation = "none";
    void stage.offsetWidth; // reflow
    stage.style.animation = "slide-in-up 300ms ease";

    // Clear feedback
    const fb = document.getElementById("sort-feedback");
    if (fb) { fb.textContent = ""; fb.className = "sort-feedback"; }

    this.itemStartTime = Date.now();
    this._updateProgress();
    GameAudio.speakRaw(item.label);
  },

  _onBucketClick(catId) {
    const item = this.items[this.currentIdx];
    if (!item) return;

    const decisionMs = Date.now() - this.itemStartTime;
    this.decisionTimes.push(decisionMs);

    const correct = catId === item.answer;

    this.results.push({
      itemId: item.label,
      correct,
      answer: catId,
      expected: item.answer,
      decisionMs
    });

    if (!correct) {
      this.categoryErrors[catId] = (this.categoryErrors[catId] || 0) + 1;
    }

    const fb = document.getElementById("sort-feedback");
    if (fb) {
      if (correct) {
        fb.textContent = "✓ That's right!";
        fb.className = "sort-feedback correct";
        GameApp.showEncouragement("✓ Correct!");
      } else {
        const correctCat = this.game.categories.find(c => c.id === item.answer);
        fb.textContent = `Let's try that again — ${item.label} goes in "${correctCat?.label}"`;
        fb.className = "sort-feedback retry";
        if (typeof GameApp !== "undefined" && GameApp.showEncouragement) {
          GameApp.showEncouragement("Let's try that again — take your time.");
        }
      }
    }

    // Small delay before next item
    setTimeout(() => {
      this.currentIdx++;
      this._showItem();
    }, correct ? 900 : 1800);
  },

  _updateProgress() {
    const fill = document.getElementById("pattern-progress-fill");
    if (fill) fill.style.width = `${(this.currentIdx / this.items.length) * 100}%`;
    const lbl = document.getElementById("pattern-progress-label");
    if (lbl) lbl.textContent = `${this.currentIdx} / ${this.items.length}`;
  },

  _onComplete() {
    const correct = this.results.filter(r => r.correct).length;
    const accuracy = Math.round((correct / this.items.length) * 100);
    const avgDecisionSec = Math.round(
      (this.decisionTimes.reduce((a,b)=>a+b,0) / this.decisionTimes.length) / 1000
    );
    const elapsed = Math.max(1, Math.round((Date.now() - this.startTime) / 60000));

    // Find most-confused category for clinical note
    let confusedCat = null;
    let maxErr = 0;
    Object.entries(this.categoryErrors).forEach(([id, count]) => {
      if (count > maxErr) { maxErr = count; confusedCat = id; }
    });
    const confusedLabel = confusedCat
      ? this.game.categories.find(c => c.id === confusedCat)?.label
      : "None";

    SessionLogger.logGame(
      this.patientId, "patternRecognition", "Pattern & Object Sort",
      accuracy, elapsed, this.tier,
      {
        sortCorrect: correct, sortTotal: this.items.length,
        sortAvgDecisionSec: avgDecisionSec,
        sortMostConfusedCategory: confusedLabel
      }
    );

    GameApp.showEndScreen({
      gameName: "Pattern & Object Sort",
      lines: [
        { label: "Items sorted correctly",   value: `${correct} of ${this.items.length}` },
        { label: "Your average decision",    value: `${avgDecisionSec} sec each` },
        { label: "Time played",              value: `${elapsed} min` }
      ]
    });
  }
};
