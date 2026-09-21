/**
 * GAME CONTENT DEFINITIONS & SESSION DATA CONTRACT
 * CDX-GERI-NER Cognitive Game Module
 *
 * All game content, difficulty configs, audio strings, and the session
 * logging functions that write back into the doctor's CLINICAL_DATA store.
 */

/* ============================================================
   1. AUDIO / LANGUAGE NARRATION
   ============================================================ */
const GameAudio = {
  // Language → BCP-47 voice tag mapping
  LANG_MAP: {
    "Assamese":            "as-IN",
    "Khasi":               "en-IN",
    "Manipuri":            "hi-IN",
    "Meiteilon (Manipuri)":"hi-IN",
    "Mizo":                "en-IN",
    "Nagamese":            "as-IN",
    "Bengali":             "bn-IN",
    "Bodo":                "as-IN",
    "Hindi":               "hi-IN",
    "Nepali":              "hi-IN",
    "English":             "en-IN"
  },

  // Instruction strings per language (English + 3 most common NER languages)
  STRINGS: {
    welcome: {
      "en-IN":  "Hello! Let's play your memory games today. Take your time, there is no hurry.",
      "as-IN":  "নমস্কাৰ! আজি আপোনাৰ স্মৃতি খেলবোৰ খেলো। সময় লওক, কোনো তাড়া নাই।",
      "hi-IN":  "नमस्ते! आज हम आपके याददाश्त के खेल खेलते हैं। समय लीजिए, कोई जल्दी नहीं है।",
      "bn-IN":  "নমস্কার! আজ আপনার স্মৃতি খেলাগুলো খেলি। সময় নিন, কোনো তাড়া নেই।",
    },
    memoryMatch: {
      "en-IN":  "Flip the cards and find the matching pairs. Tap two cards to turn them over.",
      "as-IN":  "কাৰ্ডবোৰ উলটাওক আৰু মিলোৱা যোৰা বিচাৰি উলিয়াওক।",
      "hi-IN":  "कार्डों को पलटें और मिलान जोड़ी खोजें। दो कार्डों को टैप करें।",
      "bn-IN":  "কার্ড উল্টান এবং মিলের জোড়া খুঁজুন। দুটি কার্ড ট্যাপ করুন।",
    },
    routine: {
      "en-IN":  "Tap the activities in the correct order, from morning to night.",
      "as-IN":  "পুৱাৰ পৰা ৰাতিলৈ কাৰ্যকলাপবোৰ সঠিক ক্ৰমত টেপ কৰক।",
      "hi-IN":  "सुबह से रात तक गतिविधियों को सही क्रम में टैप करें।",
      "bn-IN":  "সকাল থেকে রাত পর্যন্ত কার্যক্রমগুলো সঠিক ক্রমে ট্যাপ করুন।",
    },
    attention: {
      "en-IN":  "Look at both pictures carefully. Tap on anything that looks different.",
      "as-IN":  "দুয়োটা ছবি মনোযোগেৰে চাওক। যি বেলেগ দেখি সেইখিনি টেপ কৰক।",
      "hi-IN":  "दोनों तस्वीरों को ध्यान से देखें। जो अलग दिखे उस पर टैप करें।",
      "bn-IN":  "দুটো ছবি মনোযোগ দিয়ে দেখুন। যা আলাদা মনে হয় সেখানে ট্যাপ করুন।",
    },
    pattern: {
      "en-IN":  "Sort each item into the correct group by tapping the right box.",
      "as-IN":  "প্ৰতিটো বস্তু সঠিক গোটত ৰাখক।",
      "hi-IN":  "हर चीज़ को सही समूह में टैप करके रखें।",
      "bn-IN":  "প্রতিটি জিনিস সঠিক গ্রুপে ট্যাপ করে রাখুন।",
    },
    reminiscence: {
      "en-IN":  "Look at this person's photo. Who do you think this is? Take your time.",
      "as-IN":  "এই ব্যক্তিজনৰ ফটো চাওক। আপুনি ভাবিছে এই কোন? সময় লওক।",
      "hi-IN":  "इस व्यक्ति की फोटो देखें। आपको क्या लगता है यह कौन है?",
      "bn-IN":  "এই ব্যক্তির ছবি দেখুন। আপনার কি মনে হয় এটি কে?",
    },
    wellDone: {
      "en-IN":  "Well done! You did a wonderful job today.",
      "as-IN":  "শাবাশ! আজি আপুনি অতি সুন্দৰকৈ কৰিলে।",
      "hi-IN":  "शाबाश! आज आपने बहुत अच्छा किया।",
      "bn-IN":  "শাবাশ! আজ আপনি দারুণ করেছেন।",
    },
    takeTime: {
      "en-IN":  "There is no hurry. Take all the time you need.",
      "as-IN":  "কোনো তাড়া নাই। আপোনাৰ প্ৰয়োজনীয় সময় লওক।",
      "hi-IN":  "कोई जल्दी नहीं है। जितना समय चाहिए लें।",
      "bn-IN":  "কোনো তাড়া নেই। যতটা সময় দরকার নিন।",
    },
    medicineReminder: {
      "en-IN":  "It is time for your medicine. Please take your tablet with water. Take your time, there is no hurry.",
      "as-IN":  "এতিয়া আপোনাৰ ঔষধ খোৱাৰ সময় হৈছে। পানীৰে আপোনাৰ টেবলেটটো লওক। কোনো তাড়া নাই।",
      "hi-IN":  "अब आपकी दवाई का समय हो गया है। पानी के साथ अपनी गोली लें। कोई जल्दी नहीं है।",
      "bn-IN":  "এখন আপনার ওষুধ খাওয়ার সময় হয়েছে। জল দিয়ে আপনার ট্যাবলেটটি খান। কোনো তাড়া নেই।"
    },
    hydrationReminder: {
      "en-IN":  "Time for a warm glass of water. Keep yourself refreshed.",
      "as-IN":  "এগিলাচ পানী খোৱাৰ সময় হ'ল। নিজকে সতেজ ৰাখক।",
      "hi-IN":  "एक गिलास पानी पीने का समय हो गया है।",
      "bn-IN":  "এক গ্লাস জল খাওয়ার সময় হয়েছে।"
    },
    activityReminder: {
      "en-IN":  "Time for your gentle walk or stretching. Take slow and easy steps.",
      "as-IN":  "এতিয়া অলপ খোজ কঢ়াৰ সময় হ'ল। লাহে লাহে খোজ কাঢ়ক।",
      "hi-IN":  "थोड़ी देर टहलने का समय हो गया है। आराम से चलें।",
      "bn-IN":  "একটু শান্তভাবে হাঁটার সময় হয়েছে।"
    },
    reminderAcknowledged: {
      "en-IN":  "Wonderful! You took your medicine on time. Well done.",
      "as-IN":  "বৰ ভাল লাগিল! আপুনি সময়মতে ঔষধ খালে। ধন্যবাদ।",
      "hi-IN":  "बहुत अच्छा! आपने समय पर दवाई ले ली। धन्यवाद।",
      "bn-IN":  "দারুণ! আপনি সময়মতো ওষুধ খেয়েছেন। ধন্যবাদ।"
    },
    weatherForecast: {
      "en-IN":  "Good morning. Today is pleasant, mild and clear. A peaceful day to stay comfortable and take your time.",
      "as-IN":  "শুভ পুৱা। আজিৰ বতৰ শান্ত আৰু মধুৰ। আৰাম কৰক আৰু সময় লওক।",
      "hi-IN":  "शुभ प्रभात। आज का मौसम बहुत सुहाना और शांत है। आराम से रहें और समय लें।",
      "bn-IN":  "সুপ্রভাত। আজকের আবহাওয়া মনোরম এবং শান্ত। আরাম করুন এবং সময় নিন।"
    },
    moodResponseHappy: {
      "en-IN":  "We are so glad to see you smiling today. Keep up the bright spirits!",
      "as-IN":  "আজি আপোনাৰ হাঁহি দেখি বৰ আনন্দ লাগিল। মন সদায় প্ৰফুল্ল ৰাখক!",
      "hi-IN":  "आज आपकी मुस्कान देखकर बहुत खुशी हुई। ऐसे ही खुश रहें!",
      "bn-IN":  "আজ আপনার হাসি দেখে খুব আনন্দ হলো। সবসময় ভালো থাকুন!"
    },
    moodResponseCalm: {
      "en-IN":  "Peace and calm is wonderful for you. Take slow and easy steps today.",
      "as-IN":  "শান্ত মন অতি উত্তম। আজি সকলো কাম লাহে লাহে কৰক।",
      "hi-IN":  "मन का शांत रहना बहुत अच्छा है। आज आराम से सारे काम करें।",
      "bn-IN":  "শান্ত মন খুব ভালো। আজ ধীরে ধীরে সব কাজ করুন।"
    },
    moodResponseTired: {
      "en-IN":  "It is completely okay to feel tired. Please rest your eyes and relax.",
      "as-IN":  "ভাগৰ লগা একো অস্বাভাৱিক নহয়। অলপ জিৰণি লওক আৰু আৰাম কৰক।",
      "hi-IN":  "थकान महसूस होना बिल्कुल सामान्य है। कृपया थोड़ा आराम करें।",
      "bn-IN":  "ক্লান্ত লাগা স্বাভাবিক। একটু বিশ্রাম নিন।"
    },
    moodResponseHelp: {
      "en-IN":  "Do not worry, we are right here with you. Your family and health worker are notified and are here to help.",
      "as-IN":  "চিন্তা নকৰিব, আমি আপোনাৰ লগতে আছো। আপোনাৰ পৰিয়াল আৰু স্বাস্থ্যকৰ্মী সহায়ৰ বাবে সাজু আছে।",
      "hi-IN":  "चिंता न करें, हम आपके साथ हैं। आपके परिवार और स्वास्थ्य कर्मी को सूचित कर दिया गया है।",
      "bn-IN":  "চিন্তা করবেন না, আমরা আপনার সাথেই আছি। আপনার পরিবার ও স্বাস্থ্যকর্মী প্রস্তুত আছেন।"
    },
    sosTriggered: {
      "en-IN":  "Emergency help has been requested. Your family caregiver and doctors have been notified. Stay calm, you are safe.",
      "as-IN":  "জৰুৰীকালীন সাহায্যৰ অনুৰোধ প্ৰেৰণ কৰা হৈছে। আপোনাৰ পৰিয়ালক অৱগত কৰা হৈছে। চিন্তা নকৰিব, আপুনি সুৰক্ষিত।",
      "hi-IN":  "आपातकालीन सहायता भेज दी गई है। आपके परिवार और डॉक्टर को सूचित कर दिया गया है। शांत रहें, आप सुरक्षित हैं।",
      "bn-IN":  "জরুরি সাহায্য অনুরোধ পাঠানো হয়েছে। আপনার পরিবার ও ডাক্তারকে জানানো হয়েছে। শান্ত থাকুন, আপনি নিরাপদ।"
    },
    dailyQuestionIntro: {
      "en-IN":  "Here is your gentle question for today. Take all the time you need.",
      "as-IN":  "আজিৰ বাবে এটা সহজ প্ৰশ্ন। আপোনাৰ প্ৰয়োজনীয় সময় লওক।",
      "hi-IN":  "आज के लिए एक सरल प्रश्न। जितना समय चाहिए लें।",
      "bn-IN":  "আজকের জন্য একটি সহজ প্রশ্ন। আপনার সময় নিন।"
    },
    reminderPostponed: {
      "en-IN":  "Reminder postponed for ten minutes. We will gently remind you again soon.",
      "as-IN":  "১০ মিনিটৰ বাবে পিছুৱাই দিয়া হ'ল। আমি সোনকালেই আকৌ মনত পেলাই দিম।",
      "hi-IN":  "दस मिनट के लिए टाल दिया गया है। हम जल्द ही फिर से याद दिलाएंगे।",
      "bn-IN":  "১০ মিনিটের জন্য স্থগিত করা হলো। আমরা শীঘ্রই আবার মনে করিয়ে দেব।"
    }
  },

  _currentLang: "en-IN",
  isMuted: false,

  init(patientLanguage) {
    this._currentLang = this.LANG_MAP[patientLanguage] || "en-IN";
    try {
      this.isMuted = localStorage.getItem("cdx_game_audio_muted") === "true";
    } catch(e) {
      this.isMuted = false;
    }
  },

  setMuted(muted) {
    this.isMuted = !!muted;
    try {
      localStorage.setItem("cdx_game_audio_muted", String(this.isMuted));
    } catch(e) {}
    if (this.isMuted && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cdx:audio-mute-changed", { detail: { isMuted: this.isMuted } }));
    }
    return this.isMuted;
  },

  toggleMute() {
    return this.setMuted(!this.isMuted);
  },

  speak(key, fallbackText) {
    if (this.isMuted) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    // Single-click mute/silence: if speech is currently playing, clicking speaker stops it immediately
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }
    window.speechSynthesis.cancel();
    const strings = this.STRINGS[key];
    const text = (strings && strings[this._currentLang]) ||
                 (strings && strings["en-IN"]) ||
                 fallbackText || "";
    if (!text) return;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = this._currentLang;
    utt.rate = 0.82;
    utt.pitch = 1.0;
    window.speechSynthesis.speak(utt);
  },

  speakRaw(text) {
    if (this.isMuted) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    // Single-click mute/silence: if speech is currently playing, clicking speaker stops it immediately
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = this._currentLang;
    utt.rate = 0.82;
    window.speechSynthesis.speak(utt);
  }
};

/* ============================================================
   2. ADAPTIVE DIFFICULTY ENGINE
   ============================================================ */
const DifficultyEngine = {
  /**
   * Calculates a Tier (1=Easy, 2=Moderate, 3=Challenging) from the
   * patient's rolling average for a specific cognitive module.
   * Uses the same trend30d arrays the AI detection reads.
   */
  getTier(patient, moduleKey) {
    if (!patient || !patient.cognitiveModules) return 1;
    const mod = patient.cognitiveModules[moduleKey];
    if (!mod || !mod.trend30d || mod.trend30d.length === 0) return 1;

    const recent = mod.trend30d.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;

    if (avg >= 75) return 3;
    if (avg >= 55) return 2;
    return 1;
  },

  getTierLabel(tier) {
    return ["", "Tier 1 (Easy)", "Tier 2 (Moderate)", "Tier 3 (Challenging)"][tier] || "Tier 1 (Easy)";
  }
};

/* ============================================================
   3. SESSION LOGGER — writes results back to CLINICAL_DATA
   ============================================================ */
const SessionLogger = {
  /**
   * Logs a completed game result into the patient's record and remote analytics store.
   * @param {string} patientId
   * @param {string} moduleKey  - 'memory' | 'attention' | 'routineRecall' | 'patternRecognition' | 'reminiscence'
   * @param {string} gameName   - Human-readable game name
   * @param {number} accuracyPct - 0-100
   * @param {number} durationMins
   * @param {number} tier
   * @param {Object} detail     - additional detail fields (optional)
   */
  logGame(patientId, moduleKey, gameName, accuracyPct, durationMins, tier, detail = {}) {
    if (typeof CLINICAL_DATA === "undefined") return;
    const patient = CLINICAL_DATA.patients.find(p => p.id === patientId);
    if (!patient) return;

    // 1. Append to cognitiveModules trend
    if (patient.cognitiveModules && patient.cognitiveModules[moduleKey]) {
      const mod = patient.cognitiveModules[moduleKey];
      const score = Math.round(Math.max(0, Math.min(100, accuracyPct)));
      mod.trend30d = [...(mod.trend30d || []), score];
      mod.trend7d  = [...(mod.trend7d  || []), score].slice(-5);
      mod.trend90d = [...(mod.trend90d || []), score];
      mod.currentScore = score;
      mod.delta30d = score - (mod.trend30d[0] || score);
    }

    // 2. Update patient-level composite
    const today = new Date().toISOString().slice(0, 10);
    if (!patient.sessions) patient.sessions = [];

    const lastSession = patient.sessions[0];
    const avgResponse = detail.avgResponseSecs || detail.sortAvgDecisionSec || detail.reminiscenceAvgLatencySec || (detail.memoryAttempts ? +(detail.memoryAttempts * 1.6).toFixed(1) : 2.4);
    if (lastSession && lastSession.date === today) {
      // Merge into today's existing session
      lastSession.gamesPlayed += `, ${gameName}`;
      lastSession.gameModule = moduleKey;
      lastSession.durationMins += durationMins;
      lastSession.compositeScore = Math.round(
        (lastSession.compositeScore + accuracyPct) / 2
      );
      lastSession.avgResponseSecs = +( ( (lastSession.avgResponseSecs || 2.4) + avgResponse ) / 2 ).toFixed(1);
    } else {
      patient.sessions.unshift({
        date: today,
        gameModule: moduleKey,
        durationMins: Math.max(1, Math.round(durationMins)),
        gamesPlayed: gameName,
        compositeScore: Math.round(accuracyPct),
        avgResponseSecs: typeof avgResponse === "number" ? +avgResponse.toFixed(1) : 2.4,
        difficulty: DifficultyEngine.getTierLabel(tier),
        ...detail
      });
    }

    // 3. Update lastSessionDate
    patient.lastSessionDate = today;

    // 4. Persist to localStorage for cross-refresh survival
    try {
      const key = `cdx_sessions_${patientId}`;
      localStorage.setItem(key, JSON.stringify(patient.sessions.slice(0, 20)));
    } catch(e) {}

    // 5. Map gameId and category for analytics telemetry
    const idMap = {
      memory: { id: "memory-match", cat: "Memory" },
      routineRecall: { id: "daily-routine", cat: "Executive Function" },
      attention: { id: "visual-attention", cat: "Attention" },
      patternRecognition: { id: "pattern-sorting", cat: "Pattern Recognition" },
      reminiscence: { id: "reminiscence", cat: "Reminiscence" }
    };
    const mapped = idMap[moduleKey] || { id: moduleKey || "cognitive-activity", cat: "General Cognition" };

    let attempted = 1, correct = 1, incorrect = 0;
    if (detail.totalPairs) {
      attempted = detail.memoryAttempts || (detail.totalPairs * 2);
      correct = detail.memoryPairsFound || detail.totalPairs;
      incorrect = Math.max(0, attempted - correct);
    } else if (detail.routineTotalSteps) {
      attempted = detail.routineTotalSteps;
      correct = detail.routineCorrectSteps || 0;
      incorrect = Math.max(0, attempted - correct);
    } else if (detail.attentionTotal) {
      attempted = detail.attentionTotal;
      correct = detail.attentionFound || 0;
      incorrect = Math.max(0, attempted - correct);
    } else if (detail.sortTotal) {
      attempted = detail.sortTotal;
      correct = detail.sortCorrect || 0;
      incorrect = Math.max(0, attempted - correct);
    } else if (detail.reminiscenceTotal) {
      attempted = detail.reminiscenceTotal;
      correct = detail.reminiscenceCorrect || 0;
      incorrect = Math.max(0, attempted - correct);
    }

    const durationSec = Math.max(5, Math.round((durationMins || 1) * 60));
    const sessionPayload = {
      patientId: String(patientId),
      gameId: mapped.id,
      gameName: gameName,
      category: mapped.cat,
      tier: Number(tier) || 1,
      difficulty: DifficultyEngine.getTierLabel(tier),
      startTime: detail.startTime || new Date(Date.now() - durationSec * 1000).toISOString(),
      completionTime: new Date().toISOString(),
      durationSeconds: durationSec,
      attempted: attempted,
      correct: correct,
      incorrect: incorrect,
      accuracy: Math.round(Math.max(0, Math.min(100, accuracyPct))),
      hints: Number(detail.hints) || 0,
      attempts: Number(detail.attempts) || Number(detail.memoryAttempts) || 1,
      responseTime: typeof avgResponse === "number" ? +avgResponse.toFixed(1) : 2.5,
      completionStatus: detail.completionStatus || "completed",
      score: null,
      moodBefore: detail.moodBefore || null,
      moodAfter: detail.moodAfter || null,
      deviceType: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "tablet_or_mobile" : "desktop",
      notes: detail.notes || null
    };

    this._dispatchSession(sessionPayload);
  },

  /**
   * Logs a partial or abandoned game session when the patient exits early.
   */
  logPartialSession(patientId, moduleKey, gameName, tier, detail = {}) {
    if (!patientId) return;
    const idMap = {
      memory: { id: "memory-match", cat: "Memory", name: "Memory Match" },
      routine: { id: "daily-routine", cat: "Executive Function", name: "Daily Routine Sequencer" },
      routineRecall: { id: "daily-routine", cat: "Executive Function", name: "Daily Routine Sequencer" },
      attention: { id: "visual-attention", cat: "Attention", name: "Visual Attention Spotter" },
      pattern: { id: "pattern-sorting", cat: "Pattern Recognition", name: "Pattern Categorization" },
      patternRecognition: { id: "pattern-sorting", cat: "Pattern Recognition", name: "Pattern Categorization" },
      reminiscence: { id: "reminiscence", cat: "Reminiscence", name: "Reminiscence Photo Prompts" }
    };
    const mapped = idMap[moduleKey] || { id: moduleKey, cat: "General Cognition", name: gameName || "Activity" };
    const durationSec = Math.max(5, Math.round((detail.durationMins || 0.5) * 60));
    const attempted = Number(detail.attempted) || 0;
    const correct = Number(detail.correct) || 0;
    const incorrect = Number(detail.incorrect) || 0;
    const status = attempted > 0 ? "partially_completed" : "abandoned";
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    const sessionPayload = {
      patientId: String(patientId),
      gameId: mapped.id,
      gameName: mapped.name,
      category: mapped.cat,
      tier: Number(tier) || 1,
      difficulty: typeof DifficultyEngine !== "undefined" ? DifficultyEngine.getTierLabel(tier) : `Tier ${tier}`,
      startTime: detail.startTime || new Date(Date.now() - durationSec * 1000).toISOString(),
      completionTime: new Date().toISOString(),
      durationSeconds: durationSec,
      attempted: attempted,
      correct: correct,
      incorrect: incorrect,
      accuracy: accuracy,
      hints: Number(detail.hints) || 0,
      attempts: attempted || 1,
      responseTime: Number(detail.avgResponseSecs) || 2.5,
      completionStatus: status,
      score: null,
      moodBefore: detail.moodBefore || null,
      moodAfter: detail.moodAfter || null,
      deviceType: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "tablet_or_mobile" : "desktop",
      notes: detail.notes || `Activity exited early (${status.replace('_', ' ')}).`
    };

    this._dispatchSession(sessionPayload);
  },

  _dispatchSession(sessionPayload) {
    try {
      const cacheKey = `cdx_analytics_cache_${sessionPayload.patientId}`;
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]");
      cached.unshift(sessionPayload);
      localStorage.setItem(cacheKey, JSON.stringify(cached.slice(0, 50)));
    } catch(e) {}

    if (typeof fetch === "function") {
      fetch("/api/analytics/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "gmch-demo-2026"
        },
        body: JSON.stringify(sessionPayload)
      }).then(r => r.json()).then(res => {
        if (res && res.success) {
          console.log("[Analytics] Session recorded in central store:", res.sessionId);
        }
      }).catch(err => {
        console.warn("[Analytics] Server offline or unreachable; session stored in localStorage cache:", err);
      });
    }
  },

  /** Restore any localStorage sessions at app start */
  restoreFromLocalStorage(patientId) {
    try {
      const key = `cdx_sessions_${patientId}`;
      const saved = localStorage.getItem(key);
      if (!saved) return;
      const sessions = JSON.parse(saved);
      const patient = CLINICAL_DATA.patients.find(p => p.id === patientId);
      if (!patient) return;
      // Merge, preferring saved if more recent
      const savedDates = sessions.map(s => s.date);
      const existing = (patient.sessions || []).filter(s => !savedDates.includes(s.date));
      patient.sessions = [...sessions, ...existing].sort((a,b) => b.date.localeCompare(a.date));
    } catch(e) {}
  }
};

/* ============================================================
   3B. REMINDER & ADHERENCE SYNC ENGINE
   Connects Doctor Care Schedule with Patient App Interstitial
   ============================================================ */
const ReminderSync = {
  /**
   * Retrieves the patient's active care schedule (checks localStorage first)
   */
  getCareSchedule(patientId) {
    try {
      const key = `cdx_care_schedule_${patientId}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch(e) {}

    if (typeof CLINICAL_DATA !== "undefined" && CLINICAL_DATA.patients) {
      const patient = CLINICAL_DATA.patients.find(p => p.id === patientId);
      if (patient && patient.careSchedule) return patient.careSchedule;
    }
    return null;
  },

  /**
   * Saves or updates a patient's care schedule and persists to offline store
   */
  saveCareSchedule(patientId, newSchedule) {
    if (typeof CLINICAL_DATA !== "undefined" && CLINICAL_DATA.patients) {
      const patient = CLINICAL_DATA.patients.find(p => p.id === patientId);
      if (patient) {
        patient.careSchedule = JSON.parse(JSON.stringify(newSchedule));
      }
    }
    try {
      const key = `cdx_care_schedule_${patientId}`;
      localStorage.setItem(key, JSON.stringify(newSchedule));
    } catch(e) {}
  },

  /* ============================================================
     CRUD & STATUS OPERATIONS FOR REMINDERS & MEDICATIONS
     ============================================================ */
  getCustomReminders(patientId) {
    try {
      const key = `cdx_custom_reminders_${patientId}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  },

  saveCustomReminders(patientId, reminders) {
    try {
      const key = `cdx_custom_reminders_${patientId}`;
      localStorage.setItem(key, JSON.stringify(reminders));
    } catch(e) {}
  },

  getDeletedReminderIds(patientId) {
    try {
      const key = `cdx_deleted_reminders_${patientId}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  },

  /**
   * Resets today's care and medication schedule if a new day has arrived
  /**
   * Helper to get local date string YYYY-MM-DD
   */
  getTodayDateStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  /**
   * Resets today's care and medication schedule if a new day has arrived
   */
  checkDailyReset(patientId) {
    try {
      const todayStr = this.getTodayDateStr();
      const dateKey = `cdx_reminder_date_${patientId}`;
      const savedDate = localStorage.getItem(dateKey);
      if (savedDate && savedDate !== todayStr) {
        // A new day has arrived: reset today's care and medication schedule
        localStorage.removeItem(`cdx_reminder_statuses_${patientId}`);
        localStorage.setItem(dateKey, todayStr);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cdx:reminders-updated", { detail: { patientId, reset: true, date: todayStr } }));
        }
        return true;
      }
      if (!savedDate) {
        localStorage.setItem(dateKey, todayStr);
      }
    } catch(e) {}
    return false;
  },

  getReminderStatuses(patientId) {
    try {
      const todayStr = this.getTodayDateStr();
      const dateKey = `cdx_reminder_date_${patientId}`;
      const savedDate = localStorage.getItem(dateKey);

      // Auto-reset daily: if recorded date is from a previous day, clear and start fresh
      if (savedDate && savedDate !== todayStr) {
        localStorage.removeItem(`cdx_reminder_statuses_${patientId}`);
        localStorage.setItem(dateKey, todayStr);
        return {};
      }
      if (!savedDate) {
        localStorage.setItem(dateKey, todayStr);
      }

      const key = `cdx_reminder_statuses_${patientId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only return statuses belonging to today
        const filtered = {};
        Object.keys(parsed).forEach(k => {
          const ts = parsed[k]?.timestamp;
          if (!ts || ts.slice(0, 10) === todayStr) {
            filtered[k] = parsed[k];
          }
        });
        return filtered;
      }
    } catch(e) {}
    return {};
  },

  getAllReminders(patientId) {
    const list = [];
    const schedule = this.getCareSchedule(patientId);
    const deletedIds = this.getDeletedReminderIds(patientId);
    const statuses = this.getReminderStatuses(patientId);

    // 1. Extract from Care Schedule
    if (schedule) {
      if (Array.isArray(schedule.medications)) {
        schedule.medications.forEach((m, idx) => {
          const id = m.id || `sched-med-${idx+1}`;
          if (!deletedIds.includes(id)) {
            list.push({
              id,
              isScheduleItem: true,
              type: "Medicine",
              category: "Medicine",
              title: m.name ? `${m.name} ${m.dosage || ''}`.trim() : "Medication",
              name: m.name,
              dosage: m.dosage || "",
              time: m.time || "08:30",
              period: m.period || "Daily",
              instructions: m.instructions || "Take with water",
              pillVisual: m.pillVisual || "round-white",
              pillLabel: m.pillLabel || "MED",
              status: statuses[id]?.status || "upcoming",
              statusTimestamp: statuses[id]?.timestamp || null
            });
          }
        });
      }
      if (schedule.hydration && !deletedIds.includes("sched-hydration")) {
        list.push({
          id: "sched-hydration",
          isScheduleItem: true,
          type: "Hydration",
          category: "Hydration",
          title: "Warm Hydration Intake",
          dosage: "350ml Glass",
          time: "10:30",
          instructions: schedule.hydration.instructions || "Warm lemon water or herbal tea",
          pillVisual: "glass-water",
          pillLabel: "H2O",
          status: statuses["sched-hydration"]?.status || "upcoming",
          statusTimestamp: statuses["sched-hydration"]?.timestamp || null
        });
      }
      if (schedule.activity && !deletedIds.includes("sched-activity")) {
        list.push({
          id: "sched-activity",
          isScheduleItem: true,
          type: "Activity",
          category: "Activity",
          title: schedule.activity.title || "Courtyard Walk",
          dosage: `${schedule.activity.durationMins || 15} mins`,
          time: schedule.activity.time || "10:00",
          instructions: schedule.activity.instructions || "Gentle walking with caregiver supervision",
          pillVisual: "walk-shoes",
          pillLabel: "ACT",
          status: statuses["sched-activity"]?.status || "upcoming",
          statusTimestamp: statuses["sched-activity"]?.timestamp || null
        });
      }
      if (schedule.appointment && !deletedIds.includes("sched-appointment")) {
        list.push({
          id: "sched-appointment",
          isScheduleItem: true,
          type: "Appointment",
          category: "Appointment",
          title: schedule.appointment.clinic || "Tele-Clinic Appointment",
          dosage: schedule.appointment.physician || "Dr. Priyam Borah",
          time: schedule.appointment.time || "11:30 AM",
          instructions: schedule.appointment.purpose || "Cognitive review",
          pillVisual: "clinic-calendar",
          pillLabel: "DOC",
          status: statuses["sched-appointment"]?.status || "upcoming",
          statusTimestamp: statuses["sched-appointment"]?.timestamp || null
        });
      }
    }

    // 2. Add Custom Reminders
    const custom = this.getCustomReminders(patientId);
    custom.forEach(cr => {
      if (!deletedIds.includes(cr.id)) {
        list.push({
          ...cr,
          status: statuses[cr.id]?.status || cr.status || "upcoming",
          statusTimestamp: statuses[cr.id]?.timestamp || null
        });
      }
    });

    return list.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  },

  addReminder(patientId, reminderData) {
    const custom = this.getCustomReminders(patientId);
    const newId = reminderData.id || `rem-custom-${Date.now()}`;
    const newRem = {
      id: newId,
      title: reminderData.title || "Scheduled Reminder",
      type: reminderData.type || reminderData.category || "Medicine",
      category: reminderData.type || reminderData.category || "Medicine",
      dosage: reminderData.dosage || "",
      time: reminderData.time || "09:00",
      instructions: reminderData.instructions || "Care routine reminder",
      pillVisual: reminderData.pillVisual || "round-white",
      pillLabel: reminderData.pillLabel || "REM",
      status: reminderData.status || "upcoming",
      createdAt: new Date().toISOString()
    };
    custom.push(newRem);
    this.saveCustomReminders(patientId, custom);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cdx:reminders-updated", { detail: { patientId, reminder: newRem } }));
    }
    return newRem;
  },

  updateReminder(patientId, reminderId, updatedData) {
    const custom = this.getCustomReminders(patientId);
    const idx = custom.findIndex(r => r.id === reminderId);
    if (idx !== -1) {
      custom[idx] = { ...custom[idx], ...updatedData };
      this.saveCustomReminders(patientId, custom);
    } else {
      const sched = this.getCareSchedule(patientId);
      if (sched && sched.medications) {
        const medIdx = sched.medications.findIndex(m => m.id === reminderId);
        if (medIdx !== -1) {
          sched.medications[medIdx] = { ...sched.medications[medIdx], ...updatedData };
          this.saveCareSchedule(patientId, sched);
        }
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cdx:reminders-updated", { detail: { patientId, reminderId } }));
    }
    return true;
  },

  deleteReminder(patientId, reminderId) {
    let custom = this.getCustomReminders(patientId);
    const filtered = custom.filter(r => r.id !== reminderId);
    if (filtered.length !== custom.length) {
      this.saveCustomReminders(patientId, filtered);
    } else {
      const deleted = this.getDeletedReminderIds(patientId);
      if (!deleted.includes(reminderId)) {
        deleted.push(reminderId);
        try {
          localStorage.setItem(`cdx_deleted_reminders_${patientId}`, JSON.stringify(deleted));
        } catch(e) {}
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cdx:reminders-updated", { detail: { patientId, reminderId } }));
    }
    return true;
  },

  setReminderStatus(patientId, reminderId, newStatus) {
    const statuses = this.getReminderStatuses(patientId);
    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16);
    statuses[reminderId] = { status: newStatus, timestamp: nowStr };
    try {
      localStorage.setItem(`cdx_reminder_statuses_${patientId}`, JSON.stringify(statuses));
    } catch(e) {}

    const all = this.getAllReminders(patientId);
    const rem = all.find(r => r.id === reminderId) || { id: reminderId, type: "Medicine", title: "Medication Reminder", time: "08:30" };

    if (newStatus === "completed" || newStatus === "acknowledged") {
      this.appendLog(patientId, {
        time: nowStr,
        type: rem.type || rem.category || "Medicine",
        title: rem.title,
        status: "acknowledged"
      });
    } else if (newStatus === "missed") {
      this.logMissedReminder(patientId, rem, false); // pass skipStatusUpdate = false
    } else if (newStatus === "postponed") {
      this.appendLog(patientId, {
        time: nowStr,
        type: rem.type || rem.category || "Medicine",
        title: `${rem.title} (Postponed)`,
        status: "postponed"
      });
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cdx:reminders-updated", { detail: { patientId, reminderId, status: newStatus } }));
      window.dispatchEvent(new CustomEvent("cdx:reminder-status-change", { detail: { patientId, reminderId, status: newStatus } }));
    }
    return true;
  },

  /**
   * Generates or fetches an active/due reminder for the patient app
   */
  getDueReminder(patientId, overrideType = null) {
    const all = this.getAllReminders(patientId);
    if (overrideType) {
      const match = all.find(r => (r.type || "").toLowerCase() === overrideType.toLowerCase() && r.status !== "completed");
      if (match) return match;
    }

    const upcoming = all.find(r => r.status === "upcoming" || r.status === "postponed");
    if (upcoming) return upcoming;

    if (all.length > 0) return all[0];

    return {
      id: "rem-med-due",
      type: "Medicine",
      category: "medicine",
      title: "Donepezil Hydrochloride 10mg",
      dosage: "10mg",
      instructions: "Take 1 tablet with morning tea and warm water",
      time: "08:30",
      pillVisual: "round-white",
      pillLabel: "DNP 10",
      audioKey: "medicineReminder",
      graceWindowMins: 45
    };
  },

  /**
   * Logs a patient's acknowledgment ("Done") into the shared adherence telemetry
   */
  acknowledgeReminder(patientId, reminder) {
    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16);
    this.appendLog(patientId, {
      time: nowStr,
      type: reminder.type || "Medicine",
      title: reminder.title,
      status: "acknowledged"
    });
    if (reminder.id) {
      const statuses = this.getReminderStatuses(patientId);
      statuses[reminder.id] = { status: "completed", timestamp: nowStr };
      try {
        localStorage.setItem(`cdx_reminder_statuses_${patientId}`, JSON.stringify(statuses));
      } catch(e) {}
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cdx:reminders-updated", { detail: { patientId, reminderId: reminder.id, status: "completed" } }));
      }
    }
  },

  /**
   * Silently logs a missed reminder without guilt-inducing text,
   * and triggers caregiver emergency escalation if it's medication
   */
  logMissedReminder(patientId, reminder) {
    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16);
    this.appendLog(patientId, {
      time: nowStr,
      type: reminder.type || "Medicine",
      title: reminder.title,
      status: "missed"
    });
    if (reminder.id) {
      const statuses = this.getReminderStatuses(patientId);
      statuses[reminder.id] = { status: "missed", timestamp: nowStr };
      try {
        localStorage.setItem(`cdx_reminder_statuses_${patientId}`, JSON.stringify(statuses));
      } catch(e) {}
    }

    // Caregiver Emergency SMS Escalation for missed medication
    if ((reminder.type || "").toLowerCase() === "medicine") {
      let patientName = "Patient";
      let caregiverName = "Caregiver";
      let caregiverPhone = "+91 94350-00000";

      if (typeof CLINICAL_DATA !== "undefined" && CLINICAL_DATA.patients) {
        const p = CLINICAL_DATA.patients.find(pt => pt.id === patientId);
        if (p) {
          patientName = p.name;
          caregiverName = p.caregiver?.name || "Caregiver";
          caregiverPhone = p.caregiver?.contact || "+91 94350-12890";
        }
      }

      const alertPayload = {
        patientId,
        patientName,
        caregiverName,
        caregiverPhone,
        drugName: reminder.title,
        missedTime: reminder.time || "Morning",
        timestamp: nowStr,
        urgency: "HIGH_PRIORITY",
        status: "DISPATCHED_SMS"
      };

      try {
        localStorage.setItem(`cdx_caregiver_alert_${patientId}`, JSON.stringify(alertPayload));
      } catch(e) {}

      // Dispatch global window event for live dashboard listeners
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cdx:caregiver-alert", { detail: alertPayload }));
      }
    }
  },

  /**
   * Helper to append log, recalculate category %, and update weekly adherence
   */
  appendLog(patientId, entry) {
    let patient = null;
    if (typeof CLINICAL_DATA !== "undefined" && CLINICAL_DATA.patients) {
      patient = CLINICAL_DATA.patients.find(p => p.id === patientId);
    }
    if (!patient) return;

    if (!patient.reminders) {
      patient.reminders = { medicine: 70, hydration: 75, activity: 60, appointment: 80, recentLogs: [] };
    }
    if (!patient.reminders.recentLogs) {
      patient.reminders.recentLogs = [];
    }

    patient.reminders.recentLogs.unshift(entry);

    // Recalculate adherence percentage for this category
    const cat = (entry.type || "medicine").toLowerCase();
    const typeLogs = patient.reminders.recentLogs.filter(l => (l.type || "").toLowerCase() === cat);
    if (typeLogs.length > 0) {
      const ackCount = typeLogs.filter(l => l.status === "acknowledged").length;
      const newPct = Math.round((ackCount / typeLogs.length) * 100);
      if (cat === "medicine") patient.reminders.medicine = newPct;
      else if (cat === "hydration") patient.reminders.hydration = newPct;
      else if (cat === "activity") patient.reminders.activity = newPct;
      else if (cat === "appointment") patient.reminders.appointment = newPct;
    }

    // Persist to localStorage
    try {
      const key = `cdx_reminder_logs_${patientId}`;
      localStorage.setItem(key, JSON.stringify(patient.reminders));
    } catch(e) {}
  },

  /**
   * Restores cached reminder telemetry from localStorage into patient record
   */
  restoreReminderData(patientId) {
    try {
      const key = `cdx_reminder_logs_${patientId}`;
      const saved = localStorage.getItem(key);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (typeof CLINICAL_DATA !== "undefined" && CLINICAL_DATA.patients) {
        const patient = CLINICAL_DATA.patients.find(p => p.id === patientId);
        if (patient && parsed) {
          patient.reminders = parsed;
        }
      }
    } catch(e) {}
  },

  /* ============================================================
     MOOD & EMOTIONAL WELL-BEING LOGS
     ============================================================ */
  logMood(patientId, moodData) {
    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16);
    const entry = {
      id: `mood-${Date.now()}`,
      mood: moodData.id || "calm",
      label: moodData.label || "Peaceful",
      emoji: moodData.emoji || "😌",
      timestamp: nowStr,
      note: moodData.note || "Logged via Patient Home Check-in"
    };

    const key = `cdx_mood_history_${patientId}`;
    let history = [];
    try {
      const saved = localStorage.getItem(key);
      if (saved) history = JSON.parse(saved);
    } catch(e) {}

    history.unshift(entry);
    try {
      localStorage.setItem(key, JSON.stringify(history));
    } catch(e) {}

    if (typeof CLINICAL_DATA !== "undefined" && CLINICAL_DATA.patients) {
      const p = CLINICAL_DATA.patients.find(pt => pt.id === patientId);
      if (p) {
        if (!p.moodHistory) p.moodHistory = [];
        p.moodHistory.unshift(entry);
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cdx:mood-logged", { detail: { patientId, entry } }));
    }
    return entry;
  },

  getMoodHistory(patientId) {
    const key = `cdx_mood_history_${patientId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch(e) {}

    // Default rich sample mood history for immediate visual analytics
    return [
      { id: "mood-01", mood: "happy", label: "Happy", emoji: "😊", timestamp: "Today 09:15", note: "Smiling after morning courtyard garden walk" },
      { id: "mood-02", mood: "calm", label: "Peaceful", emoji: "😌", timestamp: "Yesterday 14:30", note: "Resting comfortably after lunch with family" },
      { id: "mood-03", mood: "tired", label: "Tired", emoji: "🥱", timestamp: "3 days ago", note: "Reported mild afternoon fatigue, rested" },
      { id: "mood-04", mood: "calm", label: "Peaceful", emoji: "😌", timestamp: "5 days ago", note: "Participated warmly in reminiscence photo activity" }
    ];
  },

  /* ============================================================
     DAILY GENTLE ORIENTATION QUESTION
     ============================================================ */
  DAILY_QUESTIONS: [
    {
      id: "q-season",
      prompt: "Which season are we enjoying right now?",
      options: [
        { id: "opt-autumn", text: "Autumn / Post-Monsoon", emoji: "🍂" },
        { id: "opt-spring", text: "Spring Blossom", emoji: "🌸" },
        { id: "opt-winter", text: "Cool Winter", emoji: "❄️" }
      ],
      encouragement: "Wonderful! Nature in North-East India is always refreshing and peaceful."
    },
    {
      id: "q-tea",
      prompt: "What warm drink do you enjoy most in the morning?",
      options: [
        { id: "opt-assam-tea", text: "Fresh Assam Tea", emoji: "🍵" },
        { id: "opt-lemon-water", text: "Warm Lemon Water", emoji: "🍋" },
        { id: "opt-herbal-tea", text: "Boiled Herbal Drink", emoji: "🫖" }
      ],
      encouragement: "A warm drink in the morning brings comfort and keeps you well hydrated!"
    },
    {
      id: "q-feeling",
      prompt: "What brings you peace and happiness today?",
      options: [
        { id: "opt-music", text: "Music or Quiet Prayer", emoji: "🎵" },
        { id: "opt-garden", text: "Sitting Near Green Trees", emoji: "🌳" },
        { id: "opt-family", text: "Smiling with Family", emoji: "🏡" }
      ],
      encouragement: "Cherishing small peaceful moments every day is so wonderful for your memory."
    }
  ],

  getDailyQuestion(patientId) {
    const questions = this.DAILY_QUESTIONS;
    const dayIndex = new Date().getDate() % questions.length;
    return questions[dayIndex];
  },

  logDailyQuestion(patientId, questionId, selectedOption) {
    const key = `cdx_question_history_${patientId}`;
    let history = [];
    try {
      const saved = localStorage.getItem(key);
      if (saved) history = JSON.parse(saved);
    } catch(e) {}

    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16);
    const entry = {
      id: `qans-${Date.now()}`,
      questionId,
      selectedOption,
      timestamp: nowStr
    };
    history.unshift(entry);
    try {
      localStorage.setItem(key, JSON.stringify(history));
    } catch(e) {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cdx:question-answered", { detail: { patientId, entry } }));
    }
    return entry;
  },

  /* ============================================================
     EMERGENCY SOS & SAFE-ZONE TELEMETRY
     ============================================================ */
  triggerSOS(patientId, options = {}) {
    let patientName = "Patient";
    let caregiverName = "Caregiver";
    let caregiverPhone = "+91 94350-12890";
    let doctorName = "Dr. Priyam Borah";

    if (typeof CLINICAL_DATA !== "undefined" && CLINICAL_DATA.patients) {
      const p = CLINICAL_DATA.patients.find(pt => pt.id === patientId);
      if (p) {
        patientName = p.name;
        caregiverName = p.caregiver?.name || "Caregiver";
        caregiverPhone = p.caregiver?.contact || "+91 94350-12890";
        doctorName = p.assignedDoctor || "Dr. Priyam Borah";
      }
    }

    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16);
    const sosPayload = {
      id: `sos-${Date.now()}`,
      patientId,
      patientName,
      caregiverName,
      caregiverPhone,
      doctorName,
      timestamp: nowStr,
      urgency: "CRITICAL_EMERGENCY",
      type: "PATIENT_SOS_REQUEST",
      location: options.location || "Home Residence (Kamrup) • Safe-Zone Geo-Fence Active",
      status: "DISPATCHED_TO_CAREGIVER_AND_HELPLINE",
      notes: options.notes || "SOS emergency button pressed from patient tablet. Voice assistance confirmed."
    };

    const key = `cdx_sos_alerts_${patientId}`;
    let list = [];
    try {
      const saved = localStorage.getItem(key);
      if (saved) list = JSON.parse(saved);
    } catch(e) {}
    list.unshift(sosPayload);
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch(e) {}

    this.sendBrowserNotification(
      `🚨 EMERGENCY SOS: ${patientName}`,
      `Immediate assistance requested! Caregiver (${caregiverName}: ${caregiverPhone}) and GMCH Tele-Unit notified.`
    );

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cdx:sos-alert", { detail: sosPayload }));
    }
    return sosPayload;
  },

  getSOSLogs(patientId) {
    const key = `cdx_sos_alerts_${patientId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  },

  getSafeZoneStatus(patientId) {
    return {
      status: "SAFE",
      badge: "Inside Safe Zone",
      zoneName: "Home Residence (Kamrup)",
      distanceFromBaseMeters: 20,
      geoFenceRadiusMeters: 200,
      lastPing: "Active (2m ago)",
      telemetryStatus: "Encrypted Cellular/GPS Safe-Zone Guard",
      isSimulated: true
    };
  },

  requestNotificationPermission() {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  },

  sendBrowserNotification(title, body) {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23004741'%3E%3Cpath d='M12 2v20M8 5c0 3 8 4 8 7s-8 4-8 7'/%3E%3C/svg%3E"
        });
      } catch(e) {}
    }
  },

  /* ============================================================
     PATIENT DAILY ACTIVITY CALENDAR TELEMETRY & LOGS
     ============================================================ */
  logPatientActivity(patientId, activity) {
    const todayStr = this.getTodayDateStr();
    const now = new Date();
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const entry = {
      id: activity.id || `act-${Date.now()}`,
      date: activity.date || todayStr,
      time: activity.time || nowTime,
      type: activity.type || "Activity",
      category: activity.category || "General",
      title: activity.title || "Daily Wellness Routine",
      details: activity.details || "Completed successfully",
      score: activity.score || null,
      icon: activity.icon || "✅",
      timestamp: new Date().toISOString()
    };

    const key = `cdx_activity_calendar_${patientId}`;
    let activities = [];
    try {
      const saved = localStorage.getItem(key);
      if (saved) activities = JSON.parse(saved);
    } catch(e) {}

    activities.unshift(entry);
    try {
      localStorage.setItem(key, JSON.stringify(activities));
    } catch(e) {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cdx:activity-logged", { detail: { patientId, activity: entry } }));
    }
    return entry;
  },

  getPatientDailyActivities(patientId) {
    const key = `cdx_activity_calendar_${patientId}`;
    let activities = [];
    try {
      const saved = localStorage.getItem(key);
      if (saved) activities = JSON.parse(saved);
    } catch(e) {}

    // Merge in logged reminders from recentLogs
    const pLogs = this.getCareSchedule(patientId);
    let patient = null;
    if (typeof CLINICAL_DATA !== "undefined" && CLINICAL_DATA.patients) {
      patient = CLINICAL_DATA.patients.find(p => p.id === patientId);
    }
    const recent = patient?.reminders?.recentLogs || [];
    recent.forEach((rl, idx) => {
      const dStr = (rl.time || "").slice(0, 10);
      const tStr = (rl.time || "").slice(11, 16);
      if (dStr) {
        activities.push({
          id: `med-log-${idx}`,
          date: dStr,
          time: tStr || "08:30",
          type: "Medication",
          category: "Care",
          title: rl.title || "Scheduled Dose",
          details: rl.status === "acknowledged" ? "Taken with water on time" : "Missed or postponed",
          score: null,
          icon: "💊",
          timestamp: rl.time
        });
      }
    });

    // Provide rich realistic history for past 14 days so calendar shines immediately
    const today = new Date();
    const mockDates = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().slice(0, 10);
      mockDates.push(dStr);
    }

    mockDates.forEach((dStr, idx) => {
      // Dose 1
      activities.push({
        id: `mock-med1-${idx}`,
        date: dStr,
        time: "08:30",
        type: "Medication",
        category: "Care",
        title: "Donepezil Hydrochloride 10mg",
        details: "Taken with morning tea and warm water",
        score: null,
        icon: "💊",
        timestamp: `${dStr} 08:30`
      });
      // Brain exercise on most days
      if (idx % 2 === 0 || idx < 5) {
        activities.push({
          id: `mock-game-${idx}`,
          date: dStr,
          time: "11:15",
          type: "Brain Activity",
          category: "Cognition",
          title: idx % 3 === 0 ? "Assam Cultural Memory Match" : idx % 3 === 1 ? "Morning Daily Routine Sequencing" : "Spot the Difference",
          details: "4/4 Pairs matched · High focus and calm engagement",
          score: "92%",
          icon: "🧠",
          timestamp: `${dStr} 11:15`
        });
      }
      // Mood check-in
      activities.push({
        id: `mock-mood-${idx}`,
        date: dStr,
        time: "14:00",
        type: "Mood Check-In",
        category: "Well-Being",
        title: idx % 3 === 0 ? "Feeling Peaceful & Relaxed" : "Feeling Happy & Connected",
        details: "Caregiver reported comfortable engagement and calm demeanor",
        score: null,
        icon: idx % 3 === 0 ? "😌" : "😊",
        timestamp: `${dStr} 14:00`
      });
    });

    // Deduplicate by ID and sort descending by date & time
    const seen = new Set();
    const unique = [];
    activities.forEach(a => {
      const key = `${a.date}_${a.time}_${a.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(a);
      }
    });

    return unique.sort((a, b) => (b.date + " " + b.time).localeCompare(a.date + " " + a.time));
  },

  getActivitiesForDate(patientId, dateStr) {
    const all = this.getPatientDailyActivities(patientId);
    return all.filter(a => a.date === dateStr);
  }
};

/* ============================================================
   4. GAME CONTENT BANK
   ============================================================ */
const GameContent = {
  /* --- Memory Match cards (NER-culturally familiar items) --- */
  memoryCards: [
    { id: "mango",   emoji: "🥭", label: "Mango" },
    { id: "tea",     emoji: "🍵", label: "Tea" },
    { id: "fish",    emoji: "🐟", label: "Fish" },
    { id: "flower",  emoji: "🌸", label: "Flower" },
    { id: "lamp",    emoji: "🪔", label: "Diya" },
    { id: "rice",    emoji: "🍚", label: "Rice" },
    { id: "banana",  emoji: "🍌", label: "Banana" },
    { id: "key",     emoji: "🗝️", label: "Key" },
    { id: "leaf",    emoji: "🌿", label: "Leaf" },
    { id: "bell",    emoji: "🔔", label: "Bell" },
    { id: "moon",    emoji: "🌙", label: "Moon" },
    { id: "bird",    emoji: "🐦", label: "Bird" }
  ],

  /* --- Tier grid sizes for Memory Match --- */
  memoryTiers: {
    1: { cols: 3, count: 6  },   // 3×4 = 12 cards (6 pairs)
    2: { cols: 4, count: 8  },   // 4×4 = 16 cards (8 pairs)
    3: { cols: 4, count: 10 }    // 4×5 = 20 cards (10 pairs)
  },

  /* --- Daily Routine steps --- */
  routineSteps: [
    { id: "wake",    emoji: "☀️",  label: "Wake Up",     hint: "First thing in the morning" },
    { id: "brush",   emoji: "🪥",  label: "Brush Teeth", hint: "Clean your teeth" },
    { id: "bath",    emoji: "🚿",  label: "Bathe",       hint: "Freshen up" },
    { id: "med",     emoji: "💊",  label: "Medicine",    hint: "Take your morning medicine" },
    { id: "eat",     emoji: "🍽️", label: "Breakfast",   hint: "Eat your morning meal" },
    { id: "walk",    emoji: "🚶", label: "Morning Walk", hint: "Go for a gentle walk" },
    { id: "sleep",   emoji: "🌙",  label: "Sleep",       hint: "Rest for the night" }
  ],

  routineTierCounts: { 1: 5, 2: 6, 3: 7 },

  /* --- Pattern Sort categories --- */
  sortGames: [
    {
      id: "fruit-veg",
      question: "Fruit or Vegetable?",
      categories: [
        { id: "fruit",     label: "Fruit",     icon: "🍎" },
        { id: "vegetable", label: "Vegetable", icon: "🥦" }
      ],
      items: [
        { emoji: "🥭", label: "Mango",   answer: "fruit" },
        { emoji: "🍌", label: "Banana",  answer: "fruit" },
        { emoji: "🍅", label: "Tomato",  answer: "vegetable" },
        { emoji: "🥕", label: "Carrot",  answer: "vegetable" },
        { emoji: "🍊", label: "Orange",  answer: "fruit" },
        { emoji: "🧅", label: "Onion",   answer: "vegetable" },
        { emoji: "🍇", label: "Grapes",  answer: "fruit" },
        { emoji: "🥬", label: "Leafy Green", answer: "vegetable" },
        { emoji: "🍋", label: "Lemon",   answer: "fruit" },
        { emoji: "🌽", label: "Corn",    answer: "vegetable" },
      ]
    },
    {
      id: "indoor-outdoor",
      question: "Inside Home or Outside?",
      categories: [
        { id: "indoor",  label: "Inside Home", icon: "🏠" },
        { id: "outdoor", label: "Outside",      icon: "🌳" }
      ],
      items: [
        { emoji: "🪑", label: "Chair",       answer: "indoor" },
        { emoji: "🌳", label: "Tree",        answer: "outdoor" },
        { emoji: "🛏️", label: "Bed",        answer: "indoor" },
        { emoji: "🌸", label: "Garden Flower", answer: "outdoor" },
        { emoji: "🪔", label: "Diya Lamp",   answer: "indoor" },
        { emoji: "🐦", label: "Bird",        answer: "outdoor" },
        { emoji: "📺", label: "TV",          answer: "indoor" },
        { emoji: "☁️", label: "Cloud",       answer: "outdoor" },
        { emoji: "🍳", label: "Cooking Pan", answer: "indoor" },
        { emoji: "🌙", label: "Moon",        answer: "outdoor" },
      ]
    }
  ],

  sortTierCounts: { 1: 6, 2: 8, 3: 10 },

  /* --- Reminiscence family pool --- */
  reminiscencePool: [
    {
      id: "son",    label: "Son",
      color: "#2B5854", initials: "S",
      relation: "Your son",
      distractors: ["Neighbour", "Doctor", "Son", "Brother"]
    },
    {
      id: "daughter", label: "Daughter",
      color: "#35654D", initials: "D",
      relation: "Your daughter",
      distractors: ["Friend", "Daughter", "Nurse", "Sister"]
    },
    {
      id: "spouse",  label: "Husband / Wife",
      color: "#004741", initials: "H",
      relation: "Your husband or wife",
      distractors: ["Brother", "Husband / Wife", "Friend", "Neighbour"]
    },
    {
      id: "grandchild", label: "Grandchild",
      color: "#8C5E1A", initials: "G",
      relation: "Your grandchild",
      distractors: ["Grandchild", "Neighbour's child", "Student", "ASHA Worker"]
    },
    {
      id: "asha", label: "Your Health Worker",
      color: "#9E382B", initials: "A",
      relation: "The ASHA / community health worker who visits you",
      distractors: ["Doctor", "Your Health Worker", "Teacher", "Stranger"]
    }
  ],

  reminiscenceTierChoices: { 1: 2, 2: 3, 3: 4 }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ReminderSync, GameContent };
}
