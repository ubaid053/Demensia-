/**
 * DAILY ROUTINE SEQUENCER — GAME 2
 * Maps to: cognitiveModules.routineRecall
 * Patient arranges activity cards in correct morning-to-night order.
 * Tap-to-place: tap a card from the bank, then tap a numbered slot.
 * Tracks: sequencing accuracy (correct positions / total), hesitation time.
 */

const GameRoutine = {
  patientId: null,
  tier: 1,
  steps: [],          // correct ordered steps for this tier
  bankCards: [],      // shuffled cards in the "pick from" bank
  slots: [],          // placed cards (null = empty)
  startTime: null,
  stepTimes: [],      // ms timestamp when each slot was filled
  selectedCard: null, // currently selected bank card

  init(patientId, patient) {
    this.patientId = patientId;
    this.tier = DifficultyEngine.getTier(patient, "routineRecall");
    this.selectedCard = null;

    const count = GameContent.routineTierCounts[this.tier];
    this.steps = GameContent.routineSteps.slice(0, count);
    this.slots = new Array(count).fill(null);
    this.stepTimes = [];
    this.startTime = Date.now();

    // Shuffle a copy for the bank
    this.bankCards = this._shuffle([...this.steps]);

    this._render();
    GameAudio.speak("routine");
  },

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  _render() {
    // Bank
    const bank = document.getElementById("routine-bank");
    if (!bank) return;
    bank.innerHTML = "";
    this.bankCards.forEach(card => {
      bank.appendChild(this._makeCard(card, true));
    });

    // Slots row
    const slotsRow = document.getElementById("routine-slots");
    if (!slotsRow) return;
    slotsRow.innerHTML = "";
    this.steps.forEach((step, i) => {
      const slot = document.createElement("div");
      slot.className = "routine-slot";
      slot.dataset.slotIndex = i;
      slot.innerHTML = `<span class="slot-number">${i + 1}</span>
        <span style="font-size:0.625rem; color:var(--color-text-muted);">Step ${i + 1}</span>`;
      slot.addEventListener("click", () => this._onSlotClick(i));
      slotsRow.appendChild(slot);
    });

    this._updateProgress();
  },

  _makeCard(step, fromBank) {
    const el = document.createElement("div");
    el.className = "routine-card";
    el.dataset.stepId = step.id;
    el.innerHTML = `<span class="card-emoji" role="img" aria-label="${step.label}">${step.emoji}</span>
      <span style="font-size:0.8125rem; font-weight:600;">${step.label}</span>`;
    if (fromBank) {
      el.addEventListener("click", () => this._onBankCardClick(el, step));
    }
    return el;
  },

  _onBankCardClick(el, step) {
    // Deselect previous
    document.querySelectorAll(".routine-card.selected").forEach(c => c.classList.remove("selected"));
    if (this.selectedCard && this.selectedCard.id === step.id) {
      this.selectedCard = null;
      return;
    }
    this.selectedCard = step;
    el.classList.add("selected");
  },

  _onSlotClick(slotIdx) {
    if (!this.selectedCard) {
      GameApp.showEncouragement("Tap a card above first, then tap a step box.");
      GameAudio.speakRaw("First tap a card, then tap a step box below.");
      return;
    }

    // If slot already filled — remove it, put back in bank
    if (this.slots[slotIdx] !== null) {
      const oldStep = this.slots[slotIdx];
      this.slots[slotIdx] = null;
      // Re-add to bank
      const bank = document.getElementById("routine-bank");
      if (bank) bank.appendChild(this._makeCard(oldStep, true));
    }

    // Place selected card in slot
    this.slots[slotIdx] = this.selectedCard;
    this.stepTimes.push(Date.now());

    // Remove from bank
    const bank = document.getElementById("routine-bank");
    if (bank) {
      const bankCard = bank.querySelector(`[data-step-id="${this.selectedCard.id}"]`);
      if (bankCard) bankCard.remove();
    }

    // Update slot UI
    const slotEl = document.querySelector(`[data-slot-index="${slotIdx}"]`);
    if (slotEl) {
      slotEl.classList.add("filled");
      slotEl.innerHTML = `
        <span class="card-emoji" role="img" aria-label="${this.selectedCard.label}">${this.selectedCard.emoji}</span>
        <span style="font-size:0.75rem; font-weight:600;">${this.selectedCard.label}</span>
        <button class="btn-remove-slot" data-slot="${slotIdx}" aria-label="Remove"
          style="font-size:0.625rem; background:none; border:none; color:var(--color-text-muted); cursor:pointer; margin-top:2px;">
          ✕ Remove
        </button>`;
      slotEl.querySelector(".btn-remove-slot").addEventListener("click", (e) => {
        e.stopPropagation();
        this._onRemoveSlot(slotIdx);
      });
    }

    this.selectedCard = null;
    document.querySelectorAll(".routine-card.selected").forEach(c => c.classList.remove("selected"));

    this._updateProgress();

    // Check if all slots filled
    if (this.slots.every(s => s !== null)) {
      setTimeout(() => this._evaluate(), 500);
    }
  },

  _onRemoveSlot(slotIdx) {
    const step = this.slots[slotIdx];
    if (!step) return;
    this.slots[slotIdx] = null;

    // Put back in bank
    const bank = document.getElementById("routine-bank");
    if (bank) bank.appendChild(this._makeCard(step, true));

    // Reset slot UI
    const slotEl = document.querySelector(`[data-slot-index="${slotIdx}"]`);
    if (slotEl) {
      slotEl.classList.remove("filled");
      slotEl.innerHTML = `<span class="slot-number">${slotIdx + 1}</span>
        <span style="font-size:0.625rem; color:var(--color-text-muted);">Step ${slotIdx + 1}</span>`;
      slotEl.addEventListener("click", () => this._onSlotClick(slotIdx));
    }

    this._updateProgress();
  },

  _updateProgress() {
    const filled = this.slots.filter(s => s !== null).length;
    const fill = document.getElementById("routine-progress-fill");
    if (fill) fill.style.width = `${(filled / this.steps.length) * 100}%`;
    const lbl = document.getElementById("routine-progress-label");
    if (lbl) lbl.textContent = `${filled} / ${this.steps.length} placed`;
  },

  _evaluate() {
    let correct = 0;
    this.slots.forEach((placed, i) => {
      if (placed && placed.id === this.steps[i].id) correct++;
    });

    const accuracy = Math.round((correct / this.steps.length) * 100);
    const elapsed  = Math.max(1, Math.round((Date.now() - this.startTime) / 60000));

    // Highlight correct/wrong slots briefly
    const slotsEls = document.querySelectorAll("[data-slot-index]");
    slotsEls.forEach((slotEl, i) => {
      const placed = this.slots[i];
      if (!placed) return;
      if (placed.id === this.steps[i].id) {
        slotEl.style.borderColor = "var(--status-stable)";
        slotEl.style.background  = "var(--status-stable-bg)";
      } else {
        slotEl.style.borderColor = "var(--status-attention)";
        slotEl.style.background  = "var(--status-attention-bg)";
      }
    });

    SessionLogger.logGame(
      this.patientId, "routineRecall", "Daily Routine Sequencer",
      accuracy, elapsed, this.tier,
      { routineCorrectSteps: correct, routineTotalSteps: this.steps.length }
    );

    setTimeout(() => {
      GameApp.showEndScreen({
        gameName: "Daily Routine Sequencer",
        lines: [
          { label: "Steps you placed correctly", value: `${correct} of ${this.steps.length}` },
          { label: "Your answer",                value: this.slots.map(s => s ? s.label : "–").join(" → ") },
          { label: "Time taken",                 value: `${elapsed} min` }
        ]
      });
    }, 1200);
  }
};
