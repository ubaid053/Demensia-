/**
 * Script to generate rich, normalized data/analytics-store.json
 * Seeds multi-week cognitive game sessions for all 8 regional patients
 */
const fs = require('fs');
const path = require('path');

const patients = [
  { id: "NER-2024-081", name: "Biren Hazarika", district: "Kamrup (Assam)", baseAccuracy: 82, baseLatency: 2.3 },
  { id: "NER-2024-094", name: "Alongla Jamir", district: "Dimapur (Nagaland)", baseAccuracy: 76, baseLatency: 2.8 },
  { id: "NER-2024-102", name: "Kynpham Nongkynrih", district: "Shillong (Meghalaya)", baseAccuracy: 88, baseLatency: 1.9 },
  { id: "NER-2024-118", name: "Tomba Singh", district: "Imphal (Manipur)", baseAccuracy: 68, baseLatency: 3.4 },
  { id: "NER-2024-135", name: "Zoramthanga Sailo", district: "Aizawl (Mizoram)", baseAccuracy: 85, baseLatency: 2.1 },
  { id: "NER-2024-149", name: "Bhabani Basumatary", district: "Kokrajhar (Assam)", baseAccuracy: 72, baseLatency: 3.1 },
  { id: "NER-2024-163", name: "Dorjee Khandu", district: "Itanagar (Arunachal)", baseAccuracy: 64, baseLatency: 3.7 },
  { id: "NER-2024-177", name: "Karma Tshering", district: "Gangtok (Sikkim)", baseAccuracy: 91, baseLatency: 1.7 }
];

const games = [
  { id: "memory", name: "Memory Match", category: "memory", totalTasks: 6 },
  { id: "attention", name: "Attention Spotter", category: "attention", totalTasks: 5 },
  { id: "routine", name: "Daily Routine Sequencer", category: "executive", totalTasks: 4 },
  { id: "pattern", name: "Pattern & Object Sort", category: "visuospatial", totalTasks: 6 },
  { id: "reminiscence", name: "Reminiscence Recall", category: "reminiscence", totalTasks: 4 }
];

const tiers = ["Tier 1 (Mild)", "Tier 2 (Moderate)", "Tier 3 (Substantial)"];
const moods = ["calm", "happy", "okay", "tired", "worried"];

const sessions = [];
const notes = [];
let sessionCounter = 1000;

// Current base date: Sep 16, 2026 (local date in simulation)
const now = new Date("2026-09-16T15:30:00.000Z");

patients.forEach(p => {
  // Generate 24-32 sessions per patient over the past 60 days
  const sessionCount = 28;
  for (let i = 0; i < sessionCount; i++) {
    sessionCounter++;
    // Distribute sessions over 60 days
    const dayOffset = Math.floor(i * 2.1);
    const sessionTime = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000 - (i % 5) * 3600 * 1000 - (i % 12) * 60 * 1000);
    
    const game = games[i % games.length];
    const durationSeconds = 120 + ((i * 37) % 240); // 2 to 6 minutes
    const startedAt = new Date(sessionTime.getTime() - durationSeconds * 1000).toISOString();
    const completedAt = sessionTime.toISOString();
    
    // Status variation (mostly completed, occasional partial or abandoned)
    let completionStatus = "completed";
    if (i === 4 && p.id === "NER-2024-081") completionStatus = "partially_completed";
    else if (i === 11 && p.id === "NER-2024-081") completionStatus = "abandoned";
    else if (i % 13 === 0) completionStatus = "partially_completed";

    // Variations around patient baseline
    const variance = ((i * 13) % 15) - 7;
    let accuracy = Math.min(100, Math.max(35, p.baseAccuracy + variance));
    if (completionStatus === "abandoned") accuracy = 40;
    if (completionStatus === "partially_completed") accuracy = 55;

    const attemptedCount = completionStatus === "completed" 
      ? game.totalTasks 
      : Math.max(2, Math.floor(game.totalTasks * 0.5));
    const correctCount = Math.round((accuracy / 100) * attemptedCount);
    const incorrectCount = Math.max(0, attemptedCount - correctCount);
    const hintCount = (i % 3 === 0) ? 1 : (i % 7 === 0 ? 2 : 0);
    const attemptCount = attemptedCount + (i % 4);
    const responseTimeSec = +(p.baseLatency + ((i % 5) * 0.2 - 0.4)).toFixed(1);
    const difficulty = tiers[i % 2]; // mostly Tier 1 & Tier 2

    const moodBefore = moods[i % moods.length];
    const moodAfter = (accuracy >= 80) ? "happy" : (accuracy >= 65 ? "calm" : "okay");

    const sessObj = {
      id: `sess-${p.id.replace(/[^0-9]/g, '')}-${sessionCounter}`,
      patientId: p.id,
      patientName: p.name,
      gameId: game.id,
      gameName: game.name,
      category: game.category,
      startedAt,
      completedAt,
      durationSeconds,
      attemptedCount,
      correctCount,
      incorrectCount,
      accuracyPercentage: accuracy,
      hintCount,
      attemptCount,
      responseTimeSec: (game.id === "attention" || game.id === "pattern" || game.id === "reminiscence") ? responseTimeSec : null,
      completionStatus,
      difficulty,
      score: null, // Observational tool, no artificial validated points
      moodBefore,
      moodAfter,
      deviceType: "tablet",
      notes: null,
      createdAt: completedAt
    };

    // Add note for specific interesting sessions
    if (completionStatus === "partially_completed") {
      sessObj.notes = "Patient paused session to have afternoon tea with daughter. Resumed calm state.";
    } else if (completionStatus === "abandoned") {
      sessObj.notes = "Patient appeared fatigued after morning walk. Caregiver advised resting.";
    } else if (i === 0) {
      sessObj.notes = "Completed with excellent focus. Recognized family pictures immediately.";
    }

    sessions.push(sessObj);
  }

  // Add 2 longitudinal caregiver/doctor notes per patient
  notes.push({
    id: `note-${p.id}-01`,
    patientId: p.id,
    authorName: "Dr. Priyam Borah, MD",
    authorRole: "doctor",
    note: `Longitudinal observation: ${p.name} demonstrates stable cognitive participation across 5 activity domains. Dysexecutive sequencing remains consistent under familiar Assamese tea routine stimuli.`,
    createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString()
  });

  notes.push({
    id: `note-${p.id}-02`,
    patientId: p.id,
    authorName: "Pranab Hazarika",
    authorRole: "caregiver",
    note: "Enjoys the reminiscence photo activity most in the late morning after breakfast. Mood was peaceful throughout the week.",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
  });
});

// Sort sessions newest first
sessions.sort((a, b) => b.completedAt.localeCompare(a.completedAt));

const store = {
  version: "2.0",
  lastUpdated: now.toISOString(),
  patients: patients.map(p => ({ id: p.id, name: p.name, district: p.district })),
  sessions,
  notes
};

if (!fs.existsSync("data")) {
  fs.mkdirSync("data", { recursive: true });
}

fs.writeFileSync("data/analytics-store.json", JSON.stringify(store, null, 2), "utf8");
console.log(`Successfully generated data/analytics-store.json!`);
console.log(`- Total patients: ${patients.length}`);
console.log(`- Total sessions: ${sessions.length}`);
console.log(`- Total notes: ${notes.length}`);
