/**
 * ATTENTION SPOTTER — GAME 3
 * Maps to: cognitiveModules.attention
 * Two near-identical household scenes side by side.
 * Patient taps differences on EITHER scene.
 * Tracks: correct detections, false positives, response times.
 *
 * Scenes are SVG-based; differences are togglable element properties.
 */

const GameAttention = {
  patientId: null,
  tier: 1,
  differences: [],     // [{id, found, pct: {x,y}}, ...]
  foundCount: 0,
  falsePositives: 0,
  responseTimes: [],   // ms from scene tap start
  lastTapTime: null,
  startTime: null,
  idleTimer: null,

  /* SVG scene template — differences controlled by CSS class / visibility */
  SCENES: [
    {
      label: "Village Kitchen",
      // Differences: up to 7 toggled by class on right-panel SVG
      differences: [
        { id: "d1", desc: "Window is open",   pct: { x: 72, y: 18 } },
        { id: "d2", desc: "Cup on table",      pct: { x: 38, y: 62 } },
        { id: "d3", desc: "Broom is tilted",   pct: { x: 85, y: 75 } },
        { id: "d4", desc: "Flower in pot",     pct: { x: 15, y: 55 } },
        { id: "d5", desc: "Clock shows time",  pct: { x: 55, y: 22 } },
        { id: "d6", desc: "Extra shelf item",  pct: { x: 48, y: 38 } },
        { id: "d7", desc: "Cat on mat",        pct: { x: 22, y: 82 } },
      ],
      tierCounts: { 1: 3, 2: 5, 3: 7 }
    }
  ],

  init(patientId, patient) {
    this.patientId = patientId;
    this.tier = DifficultyEngine.getTier(patient, "attention");
    this.foundCount = 0;
    this.falsePositives = 0;
    this.responseTimes = [];
    this.startTime = Date.now();
    this.lastTapTime = Date.now();

    const scene = this.SCENES[0];
    const count = scene.tierCounts[this.tier];
    this.differences = scene.differences.slice(0, count).map(d => ({ ...d, found: false }));

    this._render(scene);
    GameAudio.speak("attention");
    this._startIdleCheck();
  },

  _startIdleCheck() {
    clearInterval(this.idleTimer);
    this.idleTimer = setInterval(() => {
      const elapsed = Date.now() - this.lastTapTime;
      if (elapsed > 30000 && this.foundCount < this.differences.length) {
        GameAudio.speak("takeTime");
        this.lastTapTime = Date.now(); // Reset to avoid repeat
      }
    }, 5000);
  },

  _render(scene) {
    const wrap = document.getElementById("attention-scenes-wrap");
    if (!wrap) return;
    wrap.innerHTML = "";

    ["Scene A (Original)", "Scene B (Find differences)"].forEach((lbl, sceneIdx) => {
      const panel = document.createElement("div");
      panel.className = "attention-scene";
      panel.setAttribute("role", "img");
      panel.setAttribute("aria-label", lbl);
      panel.innerHTML = `
        <span class="attention-scene-label">${sceneIdx === 0 ? "Original" : "Find differences"}</span>
        ${this._buildSVG(sceneIdx === 1)}
      `;
      if (sceneIdx === 1) {
        panel.addEventListener("click", (e) => this._onSceneTap(e, panel));
      }
      wrap.appendChild(panel);
    });

    const lbl = document.getElementById("attention-progress-label");
    if (lbl) lbl.textContent = `0 / ${this.differences.length} found`;
    this._updateProgress();
  },

  /* Build the room SVG. showDiffs=true toggles difference elements. */
  _buildSVG(showDiffs) {
    const diff = (id, normalContent, diffContent) =>
      showDiffs && this.differences.some(d => d.id === id)
        ? diffContent
        : normalContent;

    return `<svg viewBox="0 0 300 225" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <!-- Sky / Background wall -->
      <rect width="300" height="225" fill="#FFF9FA"/>

      <!-- Floor -->
      <rect x="0" y="170" width="300" height="55" fill="#F0EDE4"/>
      <!-- Floor pattern -->
      ${[0,50,100,150,200,250].map(x => `<line x1="${x}" y1="170" x2="${x+50}" y2="225" stroke="#DDD8CB" stroke-width="0.5"/>`).join("")}

      <!-- Back wall -->
      <rect x="0" y="0" width="300" height="170" fill="#FFFDF1"/>

      <!-- Window frame -->
      <rect x="190" y="10" width="80" height="60" rx="3" fill="none" stroke="#C4BEAF" stroke-width="2"/>
      <line x1="230" y1="10" x2="230" y2="70" stroke="#C4BEAF" stroke-width="1"/>
      <line x1="190" y1="40" x2="270" y2="40" stroke="#C4BEAF" stroke-width="1"/>

      ${diff("d1",
        /* normal: window closed — sky only */
        `<rect x="192" y="12" width="37" height="27" fill="#D6EAF8"/>
         <rect x="231" y="12" width="37" height="27" fill="#D6EAF8"/>
         <rect x="192" y="41" width="37" height="27" fill="#D6EAF8"/>
         <rect x="231" y="41" width="37" height="27" fill="#D6EAF8"/>`,
        /* diff: window open — show outside tree */
        `<rect x="192" y="12" width="37" height="27" fill="#EBF5FB"/>
         <rect x="231" y="12" width="37" height="27" fill="#EBF5FB"/>
         <rect x="192" y="41" width="37" height="27" fill="#EBF5FB"/>
         <rect x="231" y="41" width="37" height="27" fill="#EBF5FB"/>
         <ellipse cx="250" cy="30" rx="16" ry="14" fill="#35654D" opacity="0.5"/>
         <line x1="250" y1="44" x2="250" y2="70" stroke="#8B6914" stroke-width="2"/>`
      )}

      <!-- Wall clock -->
      <circle cx="${showDiffs ? "166" : "155"}" cy="${showDiffs ? "28" : "28"}" r="18" fill="white" stroke="#C4BEAF" stroke-width="1.5"/>
      ${diff("d5",
        `<line x1="155" y1="28" x2="155" y2="16" stroke="#004741" stroke-width="1.5"/>
         <line x1="155" y1="28" x2="162" y2="28" stroke="#004741" stroke-width="1.5"/>`,
        `<line x1="166" y1="28" x2="166" y2="16" stroke="#9E382B" stroke-width="1.5"/>
         <line x1="166" y1="28" x2="173" y2="22" stroke="#9E382B" stroke-width="1.5"/>`
      )}

      <!-- Shelf -->
      <rect x="30" y="80" width="130" height="8" fill="#C4BEAF"/>
      <rect x="30" y="88" width="5" height="50" fill="#C4BEAF"/>
      <rect x="155" y="88" width="5" height="50" fill="#C4BEAF"/>

      <!-- Shelf items: pots, book -->
      <rect x="40" y="65" width="20" height="15" rx="3" fill="#8C5E1A" opacity="0.8"/>
      <rect x="70" y="60" width="15" height="20" rx="2" fill="#004741" opacity="0.7"/>
      <rect x="95" y="67" width="14" height="13" rx="2" fill="#9E382B" opacity="0.7"/>

      ${diff("d6",
        ``,
        `<circle cx="128" cy="74" r="7" fill="#35654D" opacity="0.85"/>
         <text x="128" y="77" text-anchor="middle" font-size="8" fill="white">★</text>`
      )}

      <!-- Table -->
      <rect x="60" y="138" width="120" height="10" rx="2" fill="#8B6914" opacity="0.8"/>
      <rect x="70" y="148" width="8" height="22" fill="#8B6914" opacity="0.7"/>
      <rect x="162" y="148" width="8" height="22" fill="#8B6914" opacity="0.7"/>

      <!-- Cup on table -->
      ${diff("d2",
        ``,
        `<rect x="105" y="126" width="14" height="12" rx="2" fill="#004741" opacity="0.85"/>
         <path d="M119 129 Q124 132 119 135" stroke="#004741" fill="none" stroke-width="1.5"/>
         <rect x="104" y="137" width="16" height="2" rx="1" fill="#003632" opacity="0.7"/>`
      )}

      <!-- Plant/pot -->
      <rect x="20" y="145" width="22" height="18" rx="4" fill="#8C5E1A" opacity="0.7"/>
      ${diff("d4",
        `<ellipse cx="31" cy="138" rx="9" ry="7" fill="#35654D" opacity="0.8"/>
         <line x1="31" y1="145" x2="31" y2="138" stroke="#35654D" stroke-width="1.5"/>`,
        `<ellipse cx="31" cy="136" rx="12" ry="9" fill="#35654D" opacity="0.85"/>
         <circle cx="28" cy="131" r="4" fill="#9E382B" opacity="0.8"/>
         <circle cx="34" cy="133" r="4" fill="#9E382B" opacity="0.8"/>
         <line x1="31" y1="145" x2="31" y2="136" stroke="#35654D" stroke-width="1.5"/>`
      )}

      <!-- Broom -->
      ${diff("d3",
        `<line x1="250" y1="100" x2="250" y2="170" stroke="#8B6914" stroke-width="2"/>
         <ellipse cx="250" cy="172" rx="14" ry="4" fill="#8C5E1A" opacity="0.7"/>`,
        `<line x1="255" y1="100" x2="245" y2="170" stroke="#8B6914" stroke-width="2"/>
         <ellipse cx="245" cy="172" rx="14" ry="4" fill="#8C5E1A" opacity="0.7"/>`
      )}

      <!-- Cat on mat -->
      ${diff("d7",
        ``,
        `<ellipse cx="200" cy="190" rx="18" ry="10" fill="#C4BEAF" opacity="0.8"/>
         <circle cx="200" cy="178" r="9" fill="#C4BEAF" opacity="0.8"/>
         <path d="M193 170 L190 163" stroke="#C4BEAF" stroke-width="2"/>
         <path d="M207 170 L210 163" stroke="#C4BEAF" stroke-width="2"/>
         <circle cx="197" cy="178" r="1.5" fill="#70807D"/>
         <circle cx="203" cy="178" r="1.5" fill="#70807D"/>
         <path d="M197 181 Q200 184 203 181" stroke="#70807D" fill="none" stroke-width="1"/>`
      )}
    </svg>`;
  },

  _onSceneTap(e, panel) {
    const rect = panel.getBoundingClientRect();
    const pctX = ((e.clientX - rect.left) / rect.width) * 100;
    const pctY = ((e.clientY - rect.top)  / rect.height) * 100;
    const tapTime = Date.now();
    this.lastTapTime = tapTime;

    // Check if tap is near any unfound difference (within 12% radius)
    const RADIUS = 12;
    let hit = null;
    for (const diff of this.differences) {
      if (diff.found) continue;
      const dx = pctX - diff.pct.x;
      const dy = pctY - diff.pct.y;
      if (Math.sqrt(dx * dx + dy * dy) < RADIUS) {
        hit = diff;
        break;
      }
    }

    if (hit) {
      hit.found = true;
      this.foundCount++;
      const elapsed = tapTime - this.startTime;
      this.responseTimes.push(elapsed);

      // Place marker on both panels
      document.querySelectorAll(".attention-scene").forEach(p => {
        const marker = document.createElement("div");
        marker.className = "diff-marker";
        marker.style.left = hit.pct.x + "%";
        marker.style.top  = hit.pct.y + "%";
        p.appendChild(marker);
      });

      GameApp.showEncouragement("✓ Well spotted!");
      this._updateProgress();

      const lbl = document.getElementById("attention-progress-label");
      if (lbl) lbl.textContent = `${this.foundCount} / ${this.differences.length} found`;

      if (this.foundCount === this.differences.length) {
        clearInterval(this.idleTimer);
        setTimeout(() => this._onComplete(), 800);
      }
    } else {
      // Gentle redirect (no-fail principle) — soft ripple without harsh error
      this.falsePositives++;
      const flash = document.createElement("div");
      flash.className = "false-positive-flash";
      flash.style.left = pctX + "%";
      flash.style.top  = pctY + "%";
      panel.appendChild(flash);
      setTimeout(() => flash.remove(), 700);
      if (typeof GameApp !== "undefined" && GameApp.showEncouragement) {
        GameApp.showEncouragement("Let's try that again — look closely around the room.");
      }
    }
  },

  _updateProgress() {
    const fill = document.getElementById("attention-progress-fill");
    if (fill) fill.style.width = `${(this.foundCount / this.differences.length) * 100}%`;
  },

  _onComplete() {
    const elapsed = Math.max(1, Math.round((Date.now() - this.startTime) / 60000));
    const avgResponse = this.responseTimes.length
      ? Math.round(this.responseTimes.reduce((a,b)=>a+b,0) / this.responseTimes.length / 1000)
      : 0;
    // Score: weight correct detections vs false positives
    const accuracy = Math.max(0, Math.min(100, Math.round(
      (this.foundCount / this.differences.length) * 100
      - (this.falsePositives * 5)
    )));

    SessionLogger.logGame(
      this.patientId, "attention", "Attention Spotter",
      accuracy, elapsed, this.tier,
      { attentionFound: this.foundCount, attentionFalsePositives: this.falsePositives, avgResponseSecs: avgResponse }
    );

    GameApp.showEndScreen({
      gameName: "Attention Spotter",
      lines: [
        { label: "Differences you spotted",    value: `${this.foundCount} of ${this.differences.length}` },
        { label: "Your focus time",             value: `${elapsed} min` },
        { label: "Average response",            value: `${avgResponse} sec` }
      ]
    });
  }
};
