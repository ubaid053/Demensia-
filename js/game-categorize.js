/**
 * SORT IT OUT — CST CATEGORIZATION GAME
 * Evidence-based cognitive stimulation therapy (CST) principle.
 * Patients sort regionally familiar NER items (fruits vs. vegetables) into 2 categories.
 * Employs a no-fail, layered design: gentle redirects, no red errors or buzzers.
 * Integrates with SessionLogger using the exact same schema as GamePattern.
 */

const GameCategorize = {
  patientId: null,
  tier: 1,
  items: [],
  currentIdx: 0,
  startTime: null,
  itemStartTime: null,
  decisionTimes: [],
  results: [],

  categories: [
    { id: "fruits", label: "Local Fruits / ফল-মূল", icon: "🍋" },
    { id: "veg",    label: "Vegetables / পাচলি",    icon: "🌿" }
  ],

  allItems: [
    { label: "Kaji Nemu (Assam Lemon)", emoji: "🍋", answer: "fruits" },
    { label: "Dhekia Xak (Fiddlehead)", emoji: "🌿", answer: "veg" },
    { label: "Kothal (Jackfruit)",       emoji: "🍈", answer: "fruits" },
    { label: "Khorisa (Bamboo Shoot)",  emoji: "🎋", answer: "veg" },
    { label: "Jolpan Banana (Kol)",     emoji: "🍌", answer: "fruits" },
    { label: "Ronga Kumora (Pumpkin)",  emoji: "🎃", answer: "veg" },
    { label: "Amita (Fresh Papaya)",    emoji: "🥭", answer: "fruits" },
    { label: "Bengena (Local Brinjal)", emoji: "🍆", answer: "veg" }
  ],

  init(patientId, patient) {
    this.patientId = patientId;
    this.tier = (typeof DifficultyEngine !== "undefined")
      ? DifficultyEngine.getTier(patient, "patternRecognition")
      : 1;
    this.currentIdx = 0;
    this.lockInput = false;
    this.decisionTimes = [];
    this.results = [];

    // Tier 1: 6 items, Tier 2: 7 items, Tier 3: 8 items
    const counts = { 1: 6, 2: 7, 3: 8 };
    const count = counts[this.tier] || 6;
    const pool = [...this.allItems];
    this._shuffle(pool);
    this.items = pool.slice(0, count);

    this.startTime = Date.now();
    this._render();
    this._showItem();
  },

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  _render() {
    const bucketsEl = document.getElementById("categorize-buckets");
    if (bucketsEl) {
      bucketsEl.innerHTML = "";
      this.categories.forEach(cat => {
        const btn = document.createElement("button");
        btn.className = "sort-bucket";
        btn.dataset.catId = cat.id;
        btn.innerHTML = `<span class="bucket-icon">${cat.icon}</span><span>${cat.label}</span>`;
        btn.addEventListener("click", () => this._onBucketClick(cat.id));
        bucketsEl.appendChild(btn);
      });
    }

    const qEl = document.getElementById("categorize-question");
    if (qEl) {
      qEl.textContent = "Sort each item into fruits or vegetables. Take your time.";
    }

    this._updateProgress();
  },

  _showItem() {
    if (this.currentIdx >= this.items.length) {
      this._onComplete();
      return;
    }

    const item = this.items[this.currentIdx];
    const stage = document.getElementById("categorize-object-stage");
    if (stage) {
      stage.innerHTML = `
        <span role="img" aria-label="${item.label}" style="font-size:3.5rem; line-height:1;">${item.emoji}</span>
        <span class="sort-object-name">${item.label}</span>
      `;
      stage.style.animation = "none";
      void stage.offsetWidth;
      stage.style.animation = "slide-in-up 300ms ease";
    }

    const fb = document.getElementById("categorize-feedback");
    if (fb) {
      fb.textContent = "";
      fb.className = "sort-feedback";
    }

    this.itemStartTime = Date.now();
    this._updateProgress();
    if (typeof GameAudio !== "undefined" && GameAudio.speakRaw) {
      GameAudio.speakRaw(item.label);
    }
  },

  _onBucketClick(catId) {
    if (this.lockInput) return;
    const item = this.items[this.currentIdx];
    if (!item) return;

    this.lockInput = true;
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

    const fb = document.getElementById("categorize-feedback");
    if (fb) {
      if (correct) {
        fb.textContent = "✓ That's right!";
        fb.className = "sort-feedback correct";
        if (typeof GameApp !== "undefined" && GameApp.showEncouragement) {
          GameApp.showEncouragement("✓ Great choice!");
        }
      } else {
        // No-fail gentle redirect (CST principle: gentle orientation, no red alert)
        const correctCat = this.categories.find(c => c.id === item.answer);
        fb.textContent = `Let's try that again — ${item.label} belongs with "${correctCat?.label}"`;
        fb.className = "sort-feedback retry";
        if (typeof GameApp !== "undefined" && GameApp.showEncouragement) {
          GameApp.showEncouragement("Let's try that again — take your time.");
        }
      }
    }

    setTimeout(() => {
      this.currentIdx++;
      this.lockInput = false;
      this._showItem();
    }, correct ? 900 : 1600);
  },

  _updateProgress() {
    const fill = document.getElementById("categorize-progress-fill");
    if (fill) fill.style.width = `${(this.currentIdx / this.items.length) * 100}%`;
    const lbl = document.getElementById("categorize-progress-label");
    if (lbl) lbl.textContent = `${this.currentIdx} / ${this.items.length}`;
  },

  _onComplete() {
    const correct = this.results.filter(r => r.correct).length;
    const accuracy = Math.round((correct / this.items.length) * 100);
    const avgDecisionSec = Math.round(
      (this.decisionTimes.reduce((a, b) => a + b, 0) / (this.decisionTimes.length || 1)) / 1000
    );
    const elapsed = Math.max(1, Math.round((Date.now() - this.startTime) / 60000));

    if (typeof SessionLogger !== "undefined" && SessionLogger.logGame) {
      SessionLogger.logGame(
        this.patientId, "patternRecognition", "Sort It Out",
        accuracy, elapsed, this.tier,
        {
          sortCorrect: correct,
          sortTotal: this.items.length,
          sortAvgDecisionSec: avgDecisionSec,
          sortMostConfusedCategory: "None"
        }
      );
    }

    if (typeof GameApp !== "undefined" && GameApp.showEndScreen) {
      GameApp.showEndScreen({
        gameName: "Sort It Out",
        lines: [
          { label: "Items sorted gently", value: `${correct} of ${this.items.length}` },
          { label: "Average decision time", value: `${avgDecisionSec} sec` },
          { label: "Time played", value: `${elapsed} min` }
        ]
      });
    }
  }
};
