/**
 * REMINISCENCE RECALL — GAME 5
 * Maps to: cognitiveModules.memory (secondary emotional engagement marker)
 * Shows a family avatar + voice prompt; patient picks who it is.
 * Tracks: recognition accuracy, response latency, warm emotional framing.
 * No punishment for incorrect — gently reveals the right name, encourages.
 */

const GameReminiscence = {
  patientId: null,
  patient: null,
  tier: 1,
  items: [],          // shuffled people for this session
  currentIdx: 0,
  startTime: null,
  itemStartTime: null,
  results: [],        // { personId, correct, latencyMs }
  answered: false,

  init(patientId, patient) {
    this.patientId = patientId;
    this.patient = patient;
    this.tier = DifficultyEngine.getTier(patient, "memory");
    this.currentIdx = 0;
    this.results = [];
    this.answered = false;
    this.startTime = Date.now();

    // Select 4-5 people, shuffled
    const pool = [...GameContent.reminiscencePool];
    this._shuffle(pool);
    this.items = pool.slice(0, Math.min(5, pool.length));

    this._render();
    GameAudio.speak("reminiscence");
  },

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  _render() {
    this._showPerson();
  },

  _showPerson() {
    if (this.currentIdx >= this.items.length) {
      this._onComplete();
      return;
    }

    const person = this.items[this.currentIdx];
    this.answered = false;
    this.itemStartTime = Date.now();

    // Avatar
    const avatar = document.getElementById("reminiscence-avatar");
    if (avatar) {
      avatar.innerHTML = this._buildAvatar(person);
    }

    // Question
    const q = document.getElementById("reminiscence-question");
    if (q) q.textContent = "Who is this person?";

    const prompt = document.getElementById("reminiscence-prompt");
    if (prompt) prompt.textContent = person.relation;

    // Speak
    setTimeout(() => {
      GameAudio.speakRaw("Who is this person? " + person.relation);
    }, 400);

    // Build choices
    const choiceCount = GameContent.reminiscenceTierChoices[this.tier];
    const choices = this._buildChoices(person, choiceCount);

    const choicesEl = document.getElementById("reminiscence-choices");
    if (!choicesEl) return;
    choicesEl.innerHTML = "";
    choices.forEach(choice => {
      const btn = document.createElement("button");
      btn.className = "reminiscence-choice-btn";
      btn.textContent = choice;
      btn.setAttribute("aria-label", `Choose: ${choice}`);
      btn.addEventListener("click", () => this._onChoicePick(btn, choice, person));
      choicesEl.appendChild(btn);
    });

    this._updateProgress();
  },

  _buildAvatar(person) {
    // Generates a warm SVG face avatar using the person's color + initials
    return `
      <svg width="160" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="circle-clip">
            <circle cx="80" cy="80" r="78"/>
          </clipPath>
        </defs>
        <!-- Background wash -->
        <circle cx="80" cy="80" r="78" fill="${person.color}" opacity="0.15"/>
        <!-- Body silhouette -->
        <ellipse cx="80" cy="140" rx="52" ry="40" fill="${person.color}" opacity="0.25" clip-path="url(#circle-clip)"/>
        <!-- Head -->
        <circle cx="80" cy="68" r="36" fill="${person.color}" opacity="0.85"/>
        <!-- Initial letter -->
        <text x="80" y="80" text-anchor="middle" dominant-baseline="middle"
              font-family="'Source Serif 4', serif" font-size="36" font-weight="700" fill="white">
          ${person.initials}
        </text>
        <!-- Collar/neck hint -->
        <path d="M54 108 Q80 120 106 108" fill="${person.color}" opacity="0.3" clip-path="url(#circle-clip)"/>
      </svg>
    `;
  },

  _buildChoices(person, count) {
    // Use the person's distractors, pick N-1 wrong answers + 1 correct
    const wrong = person.distractors.filter(d => d !== person.label);
    this._shuffle(wrong);
    const choices = [person.label, ...wrong.slice(0, count - 1)];
    this._shuffle(choices);
    return choices;
  },

  _onChoicePick(btn, choice, person) {
    if (this.answered) return;
    this.answered = true;

    const latencyMs = Date.now() - this.itemStartTime;
    const correct = choice === person.label;

    this.results.push({ personId: person.id, correct, latencyMs });

    // Style the buttons
    const allBtns = document.querySelectorAll(".reminiscence-choice-btn");
    allBtns.forEach(b => {
      if (b.textContent === person.label) {
        b.classList.add("selected-correct");
      } else if (b === btn && !correct) {
        b.classList.add("selected-wrong");
      }
    });

    if (correct) {
      GameApp.showEncouragement("✓ Wonderful memory!");
      GameAudio.speakRaw("That's right! " + person.label + ". Wonderful!");
    } else {
      GameApp.showEncouragement("This is your " + person.label.toLowerCase() + ".");
      GameAudio.speakRaw("This is your " + person.label + ". You're doing wonderfully.");
    }

    setTimeout(() => {
      this.currentIdx++;
      this._showPerson();
    }, correct ? 1400 : 2200);
  },

  _updateProgress() {
    const fill = document.getElementById("reminiscence-progress-fill");
    if (fill) fill.style.width = `${(this.currentIdx / this.items.length) * 100}%`;
    const lbl = document.getElementById("reminiscence-progress-label");
    if (lbl) lbl.textContent = `${this.currentIdx} / ${this.items.length}`;
  },

  _onComplete() {
    const correct = this.results.filter(r => r.correct).length;
    const accuracy = Math.round((correct / this.items.length) * 100);
    const avgLatencySec = Math.round(
      (this.results.reduce((a,b)=>a+b.latencyMs,0) / this.results.length) / 1000
    );
    const elapsed = Math.max(1, Math.round((Date.now() - this.startTime) / 60000));

    SessionLogger.logGame(
      this.patientId, "memory", "Reminiscence Recall",
      accuracy, elapsed, this.tier,
      { reminiscenceCorrect: correct, reminiscenceAvgLatencySec: avgLatencySec }
    );

    GameApp.showEndScreen({
      gameName: "Reminiscence Recall",
      lines: [
        { label: "Family members you recognised", value: `${correct} of ${this.items.length}` },
        { label: "Your response time",             value: `${avgLatencySec} sec each` },
        { label: "Time played",                    value: `${elapsed} min` }
      ]
    });
  }
};
