/**
 * MEMORY MATCH — GAME 1
 * Maps to: cognitiveModules.memory
 * Flip-card pairs using culturally familiar NER objects.
 * Tracks: accuracy (matches/pairs), total attempts, time elapsed.
 */

const GameMemory = {
  patientId: null,
  tier: 1,
  cards: [],
  flipped: [],
  matched: 0,
  totalPairs: 0,
  attempts: 0,
  startTime: null,
  lockBoard: false,

  init(patientId, patient) {
    this.patientId = patientId;
    this.tier = DifficultyEngine.getTier(patient, "memory");
    this.matched = 0;
    this.attempts = 0;
    this.flipped = [];
    this.lockBoard = false;
    this.startTime = Date.now();

    const cfg = GameContent.memoryTiers[this.tier];
    this.totalPairs = cfg.count;

    // Pick cards for this tier
    const pool = [...GameContent.memoryCards].slice(0, cfg.count);
    // Duplicate to make pairs, shuffle
    this.cards = this._shuffle([...pool, ...pool].map((c, i) => ({
      ...c, uid: `${c.id}-${i}`, flipped: false, matched: false
    })));

    this._render(cfg.cols);
    GameAudio.speak("memoryMatch");
  },

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  _render(cols) {
    const grid = document.getElementById("memory-grid");
    if (!grid) return;
    grid.style.gridTemplateColumns = `repeat(${cols}, 90px)`;
    grid.innerHTML = "";

    this.cards.forEach((card, idx) => {
      const el = document.createElement("div");
      el.className = "memory-card";
      el.setAttribute("aria-label", "Card " + (idx + 1));
      el.setAttribute("tabindex", "0");
      el.dataset.uid = card.uid;
      el.innerHTML = `
        <div class="memory-card-inner">
          <div class="memory-card-front" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <path d="M9 9l6 6M15 9l-6 6"/>
            </svg>
          </div>
          <div class="memory-card-back" role="img" aria-label="${card.label}">
            ${card.emoji}
          </div>
        </div>`;
      el.addEventListener("click", () => this._onCardClick(el, card, idx));
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") this._onCardClick(el, card, idx); });
      grid.appendChild(el);
    });

    // Update progress label
    const lbl = document.getElementById("memory-progress-label");
    if (lbl) lbl.textContent = `0 / ${this.totalPairs} pairs found`;
    this._updateProgress(0);
  },

  _onCardClick(el, card, idx) {
    if (this.lockBoard) return;
    if (el.classList.contains("flipped") || el.classList.contains("matched")) return;

    el.classList.add("flipped");
    this.flipped.push({ el, card });

    if (this.flipped.length === 2) {
      this.attempts++;
      this.lockBoard = true;

      const [a, b] = this.flipped;
      if (a.card.id === b.card.id) {
        // Match!
        this.matched++;
        setTimeout(() => {
          a.el.classList.add("matched");
          b.el.classList.add("matched");
          this.flipped = [];
          this.lockBoard = false;
          this._updateProgress(this.matched);
          GameApp.showEncouragement("✓ Great match!");

          const lbl = document.getElementById("memory-progress-label");
          if (lbl) lbl.textContent = `${this.matched} / ${this.totalPairs} pairs found`;

          if (this.matched === this.totalPairs) {
            setTimeout(() => this._onComplete(), 600);
          }
        }, 400);
      } else {
        // No-fail gentle redirect (Tovertafel principle) — soft cue, no red buzzer
        if (typeof GameApp !== "undefined" && GameApp.showEncouragement) {
          GameApp.showEncouragement("Let's try that again — take all the time you need.");
        }
        setTimeout(() => {
          a.el.classList.remove("flipped");
          b.el.classList.remove("flipped");
          this.flipped = [];
          this.lockBoard = false;
        }, 1200);
      }
    }
  },

  _updateProgress(matched) {
    const fill = document.getElementById("memory-progress-fill");
    if (fill) fill.style.width = `${(matched / this.totalPairs) * 100}%`;
  },

  _onComplete() {
    const elapsed = Math.max(1, Math.round((Date.now() - this.startTime) / 60000));
    // Accuracy: fewer attempts relative to pairs = higher score
    // Perfect = attempts === totalPairs. Allow up to 3× attempts as "ok"
    const maxAttempts = this.totalPairs * 3;
    const accuracy = Math.round(
      Math.max(0, Math.min(100, 100 - ((this.attempts - this.totalPairs) / maxAttempts) * 60))
    );

    SessionLogger.logGame(
      this.patientId, "memory", "Memory Match",
      accuracy, elapsed, this.tier,
      { memoryAttempts: this.attempts, memoryPairsFound: this.matched }
    );

    GameApp.showEndScreen({
      gameName: "Memory Match",
      lines: [
        { label: "Pairs you matched beautifully", value: `${this.matched} of ${this.totalPairs}` },
        { label: "Number of tries",               value: String(this.attempts) },
        { label: "Time played",                    value: `${elapsed} min` }
      ]
    });
  }
};
