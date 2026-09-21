// Script to generate the comprehensive, verified 8-patient dataset for js/data.js
const fs = require('fs');

const districts = [
  "All Districts",
  "Kamrup (Assam)",
  "Dimapur (Nagaland)",
  "Shillong (Meghalaya)",
  "Imphal (Manipur)",
  "Aizawl (Mizoram)",
  "Kokrajhar (Assam)",
  "Itanagar (Arunachal)",
  "Gangtok (Sikkim)"
];

const languages = [
  "All Languages",
  "Assamese",
  "Nagamese",
  "Khasi",
  "Manipuri",
  "Mizo",
  "Bodo",
  "Hindi",
  "Nepali"
];

const healthWorkers = [
  "All Health Workers",
  "Minati Kalita (ASHA - Kamrup)",
  "Keviphreno (CHO - Dimapur)",
  "Ibanylla Nongrum (ASHA - Shillong)",
  "Thoibi Devi (ASHA - Imphal)",
  "Lalengzami (CHO - Aizawl)",
  "Birgwr Boro (ASHA - Kokrajhar)",
  "Tenzin Yangzom (CHO - Itanagar)",
  "Pempa Lhamu (ASHA - Gangtok)"
];

// Helper to generate chronological sessions spanning 10-12 weeks
function generateSessions(dates, moduleSequence, scoreGenerator, latencyGenerator, difficultyLabel) {
  const modNames = {
    memory: "Memory Match",
    attention: "Attention Spotter",
    routineRecall: "Daily Routine Sequencer",
    patternRecognition: "Pattern & Object Sort",
    reminiscence: "Recall & Reminiscence"
  };

  return dates.map((date, idx) => {
    const mod = moduleSequence[idx % moduleSequence.length];
    const score = scoreGenerator(idx, dates.length);
    const lat = latencyGenerator(idx, dates.length);
    return {
      date,
      gameModule: mod,
      gamesPlayed: modNames[mod] || "Cognitive Assessment",
      durationMins: 14 + (idx % 8),
      compositeScore: score,
      avgResponseSecs: lat,
      difficulty: difficultyLabel,
      statusTag: idx < 4 && score < 50 ? "Critical Drop" : score > 75 ? "Above Baseline" : score < 60 ? "Below Baseline" : "Stable"
    };
  });
}

// 16 Dates from late June to Mid-Sept 2026 (approx 2 per week)
const standardDates = [
  "2026-09-13", "2026-09-10", "2026-09-06", "2026-09-02", "2026-08-29",
  "2026-08-25", "2026-08-21", "2026-08-16", "2026-08-11", "2026-08-06",
  "2026-08-01", "2026-07-26", "2026-07-20", "2026-07-14", "2026-07-08",
  "2026-07-02"
];

const modSeq = ["memory", "attention", "routineRecall", "patternRecognition", "reminiscence"];

// 8 Patients Specification
const patients = [
  // 1. BHABEN CHANDRA HAZARIKA (Declining - Multi-Module Alert, Kamrup, Assamese, 74 M, Moderate)
  {
    id: "NER-2024-081",
    name: "Bhaben Chandra Hazarika",
    age: 74,
    gender: "Male",
    district: "Kamrup (Assam)",
    language: "Assamese",
    assignedHealthWorker: "Minati Kalita (ASHA - Kamrup)",
    assignedDoctor: "Dr. Priyam Borah, MD (Neurology)",
    caregiver: {
      name: "Pranab Hazarika (Son)",
      contact: "+91 94350-12890",
      relation: "Primary Co-resident Caregiver"
    },
    status: "alert",
    statusLabel: "Alert",
    statusReason: "Multi-domain cognitive decline (-24% attention, -19% routine) & low adherence (62%)",
    lastSessionDate: "2026-09-12",
    adherenceRate: 62,
    cognitiveStage: "Moderate",
    accessibility: "Mild intention tremor; 72px touch targets enabled",
    trendSparkline: [24, 22, 21, 19, 17, 14, 13],
    cognitiveModules: {
      attention: {
        name: "Sustained Attention & Reaction",
        currentScore: 42,
        delta30d: -24,
        trend7d: [48, 46, 45, 43, 42],
        trend30d: [60, 58, 56, 50, 46, 44, 42],
        trend90d: [68, 64, 59, 54, 50, 46, 42],
        clinicalAssessment: "Processing speed slowed by 480ms on visual cancellation; high distraction susceptibility"
      },
      routineRecall: {
        name: "Daily Routine & Task Sequencing",
        currentScore: 50,
        delta30d: -19,
        trend7d: [55, 54, 53, 51, 50],
        trend30d: [66, 64, 62, 58, 54, 52, 50],
        trend90d: [70, 68, 65, 62, 58, 54, 50],
        clinicalAssessment: "Errors in sequential daily activities (tea brewing, attire sequence); executive apraxia"
      },
      memory: {
        name: "Memory & Word Association",
        currentScore: 51,
        delta30d: -15,
        trend7d: [55, 54, 53, 52, 51],
        trend30d: [62, 60, 59, 56, 54, 52, 51],
        trend90d: [72, 68, 65, 62, 58, 54, 51],
        clinicalAssessment: "Accelerated word retrieval decay; delayed recall failure past 45 seconds"
      },
      patternRecognition: {
        name: "Visuospatial & Pattern Matching",
        currentScore: 50,
        delta30d: -14,
        trend7d: [54, 53, 52, 51, 50],
        trend30d: [60, 58, 57, 55, 53, 51, 50],
        trend90d: [66, 64, 62, 59, 56, 52, 50],
        clinicalAssessment: "Clock face quadrant crowding and boundary contour distortion"
      },
      reminiscence: {
        name: "Recall & Reminiscence",
        currentScore: 54,
        delta30d: -11,
        trend7d: [58, 57, 56, 55, 54],
        trend30d: [63, 62, 60, 58, 57, 55, 54],
        trend90d: [68, 66, 64, 62, 60, 58, 54],
        clinicalAssessment: "Delayed facial kinship recall; intact recognition with auditory cueing"
      }
    },
    flags: [
      {
        id: "flg-01",
        date: "2026-09-12",
        severity: "alert",
        metric: "24% decline in sustained attention speed over 30 days",
        context: "Reaction latency increased from 1.8s to 3.8s on visual spot-the-difference game."
      },
      {
        id: "flg-02",
        date: "2026-09-10",
        severity: "alert",
        metric: "Donepezil reminder unacknowledged for 2 consecutive days",
        context: "Caregiver confirmed morning dose missed due to patient morning confusion."
      },
      {
        id: "flg-03",
        date: "2026-08-28",
        severity: "attention",
        metric: "Spatial disorientation event logged during evening walk",
        context: "ASHA Minati Kalita flagged patient wandering past Noonmati corner."
      }
    ],
    careSchedule: {
      medications: [
        {
          id: "med-01",
          time: "08:30",
          period: "Morning",
          name: "Donepezil Hydrochloride",
          dosage: "10mg",
          instructions: "Take 1 tablet after morning tea with warm water",
          pillVisual: "round-white",
          pillLabel: "DNP 10",
          pillColor: "#FFFFFF",
          pillShape: "circle",
          pillBg: "#E8ECEF"
        },
        {
          id: "med-02",
          time: "20:00",
          period: "Evening",
          name: "Memantine HCl",
          dosage: "10mg",
          instructions: "Take 1 film-coated tablet with post-dinner water",
          pillVisual: "oval-yellow",
          pillLabel: "MEM 10",
          pillColor: "#F5DF98",
          pillShape: "oval",
          pillBg: "#F0ECE1"
        }
      ],
      hydration: {
        frequency: "Every 3 Hours",
        targetMl: 1500,
        instructions: "Warm lemon water or boiled herbal tea (350ml cup)"
      },
      activity: {
        time: "10:00",
        title: "Courtyard walking & gentle joint mobilization",
        durationMins: 15,
        instructions: "Gentle courtyard walking under caregiver supervision"
      },
      appointment: {
        date: "2026-09-28",
        time: "11:30 AM",
        clinic: "GMCH Regional Memory Unit — Tele-Clinic",
        physician: "Dr. Priyam Borah, MD (Neurology)",
        purpose: "Longitudinal Cognitive Review & Memantine Titration"
      },
      graceWindowMins: 45,
      caregiverAlertEnabled: true
    },
    reminders: {
      medicine: 58,
      hydration: 68,
      activity: 52,
      appointment: 70,
      recentLogs: [
        { time: "2026-09-13 08:30", type: "Medicine", title: "Donepezil 10mg morning", status: "missed" },
        { time: "2026-09-12 20:00", type: "Medicine", title: "Memantine 10mg evening", status: "acknowledged" },
        { time: "2026-09-12 16:30", type: "Hydration", title: "Warm lemon water (400ml)", status: "acknowledged" },
        { time: "2026-09-12 10:00", type: "Activity", title: "Gentle courtyard walking (15m)", status: "missed" },
        { time: "2026-09-11 08:30", type: "Medicine", title: "Donepezil 10mg morning", status: "missed" }
      ]
    },
    weeklyAdherence: [
      { weekLabel: "Wk -7", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -6", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -5", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -4", completed: 2, scheduled: 3, skipped: 1 },
      { weekLabel: "Wk -3", completed: 2, scheduled: 3, skipped: 1 },
      { weekLabel: "Wk -2", completed: 1, scheduled: 3, skipped: 2 },
      { weekLabel: "Wk -1", completed: 2, scheduled: 3, skipped: 1 },
      { weekLabel: "Current", completed: 1, scheduled: 3, skipped: 2 }
    ],
    sessions: generateSessions(
      standardDates,
      modSeq,
      (i, total) => Math.round(42 + (i / total) * 24 + (i % 2 === 0 ? 1 : -1)),
      (i, total) => +(3.8 - (i / total) * 1.8 + (i % 2 === 0 ? 0.1 : -0.1)).toFixed(1),
      "Tier 2 (Moderate)"
    ),
    clinicalNotes: [
      {
        id: "note-081-1",
        date: "2026-09-02",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "Accelerating dysexecutive syndrome over last 4 weeks. Son expresses exhaustion with evening agitation. Titrating Memantine to 20mg daily. ASHA Minati to verify bedside pillbox daily."
      },
      {
        id: "note-081-2",
        date: "2026-08-10",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "Initiation hesitation noted during morning walk. Word recall decay prominent on unprompted recall."
      },
      {
        id: "note-081-3",
        date: "2026-07-15",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "Post-intake 4-week calibration complete. Initial response latency normative; recommended cognitive game battery continuation."
      }
    ]
  },

  // 2. PEMBA TSHERING LEPCHA (Declining - Single-Module Needs Attention, Gangtok, Nepali, 68 M, Early)
  {
    id: "NER-2026-302",
    name: "Pemba Tshering Lepcha",
    age: 68,
    gender: "Male",
    district: "Gangtok (Sikkim)",
    language: "Nepali",
    assignedHealthWorker: "Pempa Lhamu (ASHA - Gangtok)",
    assignedDoctor: "Dr. Priyam Borah, MD (Neurology)",
    caregiver: {
      name: "Dawa Tshering Lepcha (Brother)",
      contact: "+91 98320-11754",
      relation: "Co-resident Brother"
    },
    status: "attention",
    statusLabel: "Needs Attention",
    statusReason: "Single-domain memory retrieval drop (-12% across 3 sessions); other domains stable",
    lastSessionDate: "2026-09-13",
    adherenceRate: 84,
    cognitiveStage: "Early",
    accessibility: "Standard touch interface; no fine motor impairment",
    trendSparkline: [74, 73, 72, 71, 68, 67, 66],
    cognitiveModules: {
      memory: {
        name: "Memory & Word Association",
        currentScore: 65,
        delta30d: -12,
        trend7d: [68, 67, 66, 65, 65],
        trend30d: [76, 75, 74, 72, 67, 66, 65], // baseline: 75, recent: 66 => -12%
        trend90d: [78, 77, 76, 75, 72, 68, 66, 65],
        clinicalAssessment: "Selective delayed verbal recall decay; intact recognition with paired associates"
      },
      attention: {
        name: "Sustained Attention & Reaction",
        currentScore: 73,
        delta30d: 0,
        trend7d: [73, 73, 73, 73, 73],
        trend30d: [73, 73, 73, 74, 73, 73, 73],
        trend90d: [72, 73, 73, 73, 73, 73, 73],
        clinicalAssessment: "Stable visual cancellation latency; normative commission error rate"
      },
      routineRecall: {
        name: "Daily Routine & Task Sequencing",
        currentScore: 78,
        delta30d: 0,
        trend7d: [78, 78, 79, 78, 78],
        trend30d: [79, 78, 78, 79, 78, 79, 78],
        trend90d: [78, 79, 78, 78, 79, 78, 78],
        clinicalAssessment: "Flawless sequencing of personal routine habits and morning walk schedule"
      },
      patternRecognition: {
        name: "Visuospatial & Pattern Matching",
        currentScore: 72,
        delta30d: 0,
        trend7d: [72, 71, 72, 72, 72],
        trend30d: [72, 71, 72, 72, 71, 72, 72],
        trend90d: [71, 72, 71, 72, 72, 71, 72],
        clinicalAssessment: "Preserved shape recognition and symmetry discrimination"
      },
      reminiscence: {
        name: "Recall & Reminiscence",
        currentScore: 75,
        delta30d: 0,
        trend7d: [75, 75, 74, 75, 75],
        trend30d: [75, 74, 75, 75, 74, 75, 75],
        trend90d: [74, 75, 74, 75, 75, 74, 75],
        clinicalAssessment: "Rapid facial recognition of family members and community figures"
      }
    },
    flags: [
      {
        id: "flg-302-1",
        date: "2026-09-10",
        severity: "attention",
        metric: "12% moderate reduction in memory retrieval sustained across 3 sessions",
        context: "Isolated drop on paired-word association; other cognitive domains remain stable at baseline."
      }
    ],
    careSchedule: {
      medications: [
        {
          id: "med-01",
          time: "08:00",
          period: "Morning",
          name: "Donepezil 5mg",
          dosage: "5mg",
          instructions: "Take 1 tablet after breakfast with warm water",
          pillVisual: "round-white",
          pillLabel: "DNP 5",
          pillColor: "#FFFFFF",
          pillShape: "circle",
          pillBg: "#E8ECEF"
        },
        {
          id: "med-02",
          time: "20:00",
          period: "Evening",
          name: "Ginkgo Biloba Extract",
          dosage: "60mg",
          instructions: "Take 1 capsule with evening water",
          pillVisual: "oval-yellow",
          pillLabel: "GB 60",
          pillColor: "#F5DF98",
          pillShape: "oval",
          pillBg: "#F0ECE1"
        }
      ],
      hydration: {
        frequency: "Every 3 Hours",
        targetMl: 1500,
        instructions: "Boiled warm water or herbal infusion"
      },
      activity: {
        time: "09:30",
        title: "Ridge park gentle walk & joint coordination",
        durationMins: 20,
        instructions: "Gentle walking along Ridge path with companion"
      },
      appointment: {
        date: "2026-10-04",
        time: "10:30 AM",
        clinic: "STNM Hospital Gangtok — Tele-Neuro Unit",
        physician: "Dr. Priyam Borah, MD (Neurology)",
        purpose: "Early-stage single-domain memory trajectory review"
      },
      graceWindowMins: 45,
      caregiverAlertEnabled: true
    },
    reminders: {
      medicine: 86,
      hydration: 84,
      activity: 80,
      appointment: 90,
      recentLogs: [
        { time: "2026-09-13 08:00", type: "Medicine", title: "Donepezil 5mg morning", status: "acknowledged" },
        { time: "2026-09-12 18:00", type: "Activity", title: "Ridge park walk (20m)", status: "acknowledged" },
        { time: "2026-09-12 12:30", type: "Hydration", title: "Warm herbal tea (350ml)", status: "acknowledged" },
        { time: "2026-09-11 08:00", type: "Medicine", title: "Donepezil 5mg morning", status: "missed" }
      ]
    },
    weeklyAdherence: [
      { weekLabel: "Wk -7", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -6", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -5", completed: 2, scheduled: 3, skipped: 1 },
      { weekLabel: "Wk -4", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -3", completed: 2, scheduled: 3, skipped: 1 },
      { weekLabel: "Wk -2", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -1", completed: 2, scheduled: 3, skipped: 1 },
      { weekLabel: "Current", completed: 2, scheduled: 3, skipped: 1 }
    ],
    sessions: generateSessions(
      standardDates,
      modSeq,
      (i, total) => {
        // Only memory drops, other modules remain high (72-79)
        const isMem = modSeq[i % modSeq.length] === "memory";
        return isMem ? Math.round(65 + (i / total) * 11) : Math.round(74 + (i % 3));
      },
      (i, total) => +(2.0 + (i / total) * 0.4).toFixed(1),
      "Tier 2 (Moderate)"
    ),
    clinicalNotes: [
      {
        id: "note-302-1",
        date: "2026-09-08",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "Noted isolated decay in delayed memory retrieval on Gangtok tele-link. Visuospatial orientation intact. Advised brother to maintain daily memory notebook."
      },
      {
        id: "note-302-2",
        date: "2026-08-16",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "Physical health good. No motor apraxia. Reminded ASHA Pempa to monitor weekly paired-word association sessions."
      }
    ]
  },

  // 3. KONG MARY LYNGDOH (Stable Flat, Shillong, Khasi, 79 F, Early)
  {
    id: "NER-2024-104",
    name: "Kong Mary Lyngdoh",
    age: 79,
    gender: "Female",
    district: "Shillong (Meghalaya)",
    language: "Khasi",
    assignedHealthWorker: "Ibanylla Nongrum (ASHA - Shillong)",
    assignedDoctor: "Dr. Priyam Borah, MD (Neurology)",
    caregiver: {
      name: "Balajied Lyngdoh (Daughter)",
      contact: "+91 98620-44910",
      relation: "Co-resident Daughter"
    },
    status: "stable",
    statusLabel: "Stable",
    statusReason: "Scores within ±2% baseline variance over 90 days; 95% adherence",
    lastSessionDate: "2026-09-13",
    adherenceRate: 95,
    cognitiveStage: "Early",
    accessibility: "Standard touch interface; no impairment",
    trendSparkline: [78, 79, 78, 79, 80, 80, 80],
    cognitiveModules: {
      memory: {
        name: "Memory & Word Association",
        currentScore: 78,
        delta30d: 2,
        trend7d: [77, 77, 78, 78, 78],
        trend30d: [76, 76, 77, 77, 78, 78, 78],
        trend90d: [75, 75, 76, 76, 77, 77, 78, 78],
        clinicalAssessment: "Stable semantic recall; prompt recognition with Khasi prompts"
      },
      attention: {
        name: "Sustained Attention & Reaction",
        currentScore: 74,
        delta30d: 1,
        trend7d: [73, 73, 74, 74, 74],
        trend30d: [72, 73, 73, 73, 74, 74, 74],
        trend90d: [71, 72, 72, 73, 73, 74, 74],
        clinicalAssessment: "Consistent response latencies across 15-minute game intervals"
      },
      routineRecall: {
        name: "Daily Routine & Task Sequencing",
        currentScore: 82,
        delta30d: 3,
        trend7d: [80, 81, 81, 82, 82],
        trend30d: [79, 79, 80, 80, 81, 81, 82],
        trend90d: [78, 78, 79, 79, 80, 81, 82],
        clinicalAssessment: "Flawless sequencing of personal care and tea brewing"
      },
      patternRecognition: {
        name: "Visuospatial & Pattern Matching",
        currentScore: 76,
        delta30d: 0,
        trend7d: [76, 76, 76, 76, 76],
        trend30d: [75, 76, 76, 76, 76, 76, 76],
        trend90d: [75, 75, 75, 76, 76, 76, 76],
        clinicalAssessment: "Preserved shape recognition and symmetry discrimination"
      },
      reminiscence: {
        name: "Recall & Reminiscence",
        currentScore: 82,
        delta30d: 2,
        trend7d: [81, 81, 82, 82, 82],
        trend30d: [80, 80, 81, 81, 82, 82, 82],
        trend90d: [79, 80, 80, 81, 81, 82, 82],
        clinicalAssessment: "Immediate identification of grandchildren and family archival images"
      }
    },
    flags: [
      {
        id: "flg-104-1",
        date: "2026-08-20",
        severity: "stable",
        metric: "90-day stability threshold maintained across all 5 cognitive modules",
        context: "Patient demonstrates excellent cognitive maintenance on culturally adapted Khasi tasks."
      }
    ],
    careSchedule: {
      medications: [
        {
          id: "med-01",
          time: "09:00",
          period: "Morning",
          name: "Choline Alphoscerate",
          dosage: "400mg",
          instructions: "Take 1 capsule after breakfast with water",
          pillVisual: "round-white",
          pillLabel: "CA 400",
          pillColor: "#FFFFFF",
          pillShape: "circle",
          pillBg: "#E8ECEF"
        },
        {
          id: "med-02",
          time: "21:00",
          period: "Evening",
          name: "Multivitamin & Zinc",
          dosage: "1 Tab",
          instructions: "Take 1 tablet after dinner",
          pillVisual: "oval-yellow",
          pillLabel: "MV",
          pillColor: "#F5DF98",
          pillShape: "oval",
          pillBg: "#F0ECE1"
        }
      ],
      hydration: {
        frequency: "Every 3 Hours",
        targetMl: 1600,
        instructions: "Warm water or light Khasi tea"
      },
      activity: {
        time: "17:30",
        title: "Garden tending and terrace walk",
        durationMins: 20,
        instructions: "Gentle leisure walking in compound"
      },
      appointment: {
        date: "2026-10-12",
        time: "11:00 AM",
        clinic: "NEIGRIHMS Shillong — Geriatric Clinic",
        physician: "Dr. Priyam Borah, MD (Neurology)",
        purpose: "Routine 6-month cognitive maintenance audit"
      },
      graceWindowMins: 45,
      caregiverAlertEnabled: true
    },
    reminders: {
      medicine: 96,
      hydration: 94,
      activity: 94,
      appointment: 100,
      recentLogs: [
        { time: "2026-09-13 09:00", type: "Medicine", title: "Choline Alphoscerate 400mg", status: "acknowledged" },
        { time: "2026-09-13 07:30", type: "Hydration", title: "Morning water intake (350ml)", status: "acknowledged" },
        { time: "2026-09-12 17:30", type: "Activity", title: "Garden walk (20m)", status: "acknowledged" },
        { time: "2026-09-12 09:00", type: "Medicine", title: "Choline Alphoscerate 400mg", status: "acknowledged" }
      ]
    },
    weeklyAdherence: [
      { weekLabel: "Wk -7", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -6", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -5", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -4", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -3", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -2", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -1", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Current", completed: 3, scheduled: 3, skipped: 0 }
    ],
    sessions: generateSessions(
      standardDates,
      modSeq,
      (i, total) => Math.round(78 + (i % 3 === 0 ? 2 : i % 2 === 0 ? -1 : 0)),
      (i, total) => +(1.8 + (i % 2 === 0 ? 0.1 : -0.1)).toFixed(1),
      "Tier 3 (High Maintenance)"
    ),
    clinicalNotes: [
      {
        id: "note-104-1",
        date: "2026-08-15",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "Patient maintaining exemplary cognitive stability. Daughter keeps strict calendar structure. Continue current nootropic regimen and encourage continued Dorbar community meetings."
      },
      {
        id: "note-104-2",
        date: "2026-07-10",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "Normal neuromuscular tone, fluent conversational Khasi. Routine recall remains in top quartile."
      }
    ]
  },

  // 4. RONGGILI BASUMATARY (Improving Gain, Kokrajhar, Bodo, 64 F, Early)
  {
    id: "NER-2025-115",
    name: "Ronggili Basumatary",
    age: 64,
    gender: "Female",
    district: "Kokrajhar (Assam)",
    language: "Bodo",
    assignedHealthWorker: "Birgwr Boro (ASHA - Kokrajhar)",
    assignedDoctor: "Dr. Priyam Borah, MD (Neurology)",
    caregiver: {
      name: "Kritika Basumatary (Daughter-in-law)",
      contact: "+91 94352-77180",
      relation: "Primary Home Caregiver"
    },
    status: "stable",
    statusLabel: "Stable",
    statusReason: "Therapeutic Gain (+17% in Memory Match) following structured cognitive protocol",
    lastSessionDate: "2026-09-12",
    adherenceRate: 92,
    cognitiveStage: "Early",
    accessibility: "Low-vision mode: high-contrast palette & 125% enlarged icons",
    trendSparkline: [64, 66, 68, 71, 74, 77, 79],
    cognitiveModules: {
      memory: {
        name: "Memory & Word Association",
        currentScore: 78,
        delta30d: 17,
        trend7d: [74, 75, 76, 77, 78],
        trend30d: [64, 65, 66, 70, 74, 76, 78], // baseline: 65, recent: 76 => +17%
        trend90d: [60, 62, 64, 66, 70, 74, 76, 78],
        clinicalAssessment: "Marked improvement in object pair recall; benefits significantly from high-contrast visuals"
      },
      attention: {
        name: "Sustained Attention & Reaction",
        currentScore: 75,
        delta30d: 8,
        trend7d: [73, 73, 74, 74, 75],
        trend30d: [67, 68, 69, 71, 72, 74, 75],
        trend90d: [65, 66, 67, 69, 71, 72, 74, 75],
        clinicalAssessment: "Response latency decreased by 420ms with consistent touchscreen training"
      },
      routineRecall: {
        name: "Daily Routine & Task Sequencing",
        currentScore: 78,
        delta30d: 7,
        trend7d: [76, 76, 77, 77, 78],
        trend30d: [70, 71, 72, 73, 75, 76, 78],
        trend90d: [68, 69, 70, 72, 73, 75, 76, 78],
        clinicalAssessment: "Independent organization of household handloom and weaving tasks"
      },
      patternRecognition: {
        name: "Visuospatial & Pattern Matching",
        currentScore: 74,
        delta30d: 8,
        trend7d: [72, 72, 73, 73, 74],
        trend30d: [66, 67, 68, 70, 71, 73, 74],
        trend90d: [64, 65, 66, 68, 70, 71, 73, 74],
        clinicalAssessment: "Enhanced geometric border recognition in traditional Dokhona patterns"
      },
      reminiscence: {
        name: "Recall & Reminiscence",
        currentScore: 77,
        delta30d: 9,
        trend7d: [75, 75, 76, 76, 77],
        trend30d: [68, 69, 70, 72, 74, 76, 77],
        trend90d: [66, 67, 68, 70, 72, 74, 76, 77],
        clinicalAssessment: "Accurate naming of village kinfolk and historical community leaders"
      }
    },
    flags: [
      {
        id: "flg-115-1",
        date: "2026-09-08",
        severity: "improvement",
        metric: "+17% sustained gain in memory accuracy over 30 days",
        context: "High-contrast accessibility mode successfully unlocked latent visual recognition capability."
      }
    ],
    careSchedule: {
      medications: [
        {
          id: "med-01",
          time: "08:30",
          period: "Morning",
          name: "Piracetam 800mg",
          dosage: "800mg",
          instructions: "Take 1 tablet with warm tea after breakfast",
          pillVisual: "round-white",
          pillLabel: "PIR 800",
          pillColor: "#FFFFFF",
          pillShape: "circle",
          pillBg: "#E8ECEF"
        },
        {
          id: "med-02",
          time: "20:30",
          period: "Evening",
          name: "Omega-3 Fatty Acids",
          dosage: "1000mg",
          instructions: "Take 1 softgel capsule with evening meal",
          pillVisual: "oval-yellow",
          pillLabel: "O3",
          pillColor: "#F5DF98",
          pillShape: "oval",
          pillBg: "#F0ECE1"
        }
      ],
      hydration: {
        frequency: "Every 3 Hours",
        targetMl: 1500,
        instructions: "Fresh boiled water or local herbal infusion"
      },
      activity: {
        time: "16:00",
        title: "Courtyard handloom weaving and mobility",
        durationMins: 25,
        instructions: "Manual handloom activity under family supervision"
      },
      appointment: {
        date: "2026-10-18",
        time: "10:00 AM",
        clinic: "Kokrajhar Civil Hospital — Tele-Clinic Unit",
        physician: "Dr. Priyam Borah, MD (Neurology)",
        purpose: "Therapeutic progress review & cognitive milestone check"
      },
      graceWindowMins: 45,
      caregiverAlertEnabled: true
    },
    reminders: {
      medicine: 94,
      hydration: 90,
      activity: 92,
      appointment: 95,
      recentLogs: [
        { time: "2026-09-12 08:30", type: "Medicine", title: "Piracetam 800mg morning", status: "acknowledged" },
        { time: "2026-09-12 07:00", type: "Hydration", title: "Morning hydration (350ml)", status: "acknowledged" },
        { time: "2026-09-11 16:00", type: "Activity", title: "Weaving & courtyard mobility", status: "acknowledged" },
        { time: "2026-09-11 08:30", type: "Medicine", title: "Piracetam 800mg morning", status: "acknowledged" }
      ]
    },
    weeklyAdherence: [
      { weekLabel: "Wk -7", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -6", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -5", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -4", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -3", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -2", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -1", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Current", completed: 3, scheduled: 3, skipped: 0 }
    ],
    sessions: generateSessions(
      standardDates,
      modSeq,
      (i, total) => Math.round(79 - (i / total) * 15 + (i % 2 === 0 ? 1 : -1)),
      (i, total) => +(1.7 + (i / total) * 1.1).toFixed(1),
      "Tier 2 (Moderate)"
    ),
    clinicalNotes: [
      {
        id: "note-115-1",
        date: "2026-09-04",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "Noticeable therapeutic acceleration. High-contrast visual cards completely bypassed patient's mild macular haze. Reaction time now under 2 seconds."
      },
      {
        id: "note-115-2",
        date: "2026-08-01",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "Daughter-in-law reports cheerful participation in evening games. Maintain current stimulation protocol."
      }
    ]
  },

  // 5. IMOTEPJEN JAMIR (Stable Flat, Dimapur, Nagamese, 83 M, Advanced)
  {
    id: "NER-2025-044",
    name: "Imotepjen Jamir",
    age: 83,
    gender: "Male",
    district: "Dimapur (Nagaland)",
    language: "Nagamese",
    assignedHealthWorker: "Keviphreno (CHO - Dimapur)",
    assignedDoctor: "Dr. Priyam Borah, MD (Neurology)",
    caregiver: {
      name: "Temjen Jamir (Son)",
      contact: "+91 94360-88219",
      relation: "Primary Co-resident Son"
    },
    status: "stable",
    statusLabel: "Stable",
    statusReason: "Baseline maintenance on Tier 1 simplified exercises; 88% reminder adherence",
    lastSessionDate: "2026-09-11",
    adherenceRate: 88,
    cognitiveStage: "Advanced",
    accessibility: "Motor tremor damping; enlarged 72px tap targets & 5s response window",
    trendSparkline: [48, 49, 49, 50, 49, 50, 50],
    cognitiveModules: {
      memory: {
        name: "Memory & Word Association",
        currentScore: 50,
        delta30d: 2,
        trend7d: [49, 49, 50, 50, 50],
        trend30d: [48, 49, 48, 49, 50, 49, 50],
        trend90d: [47, 48, 48, 49, 49, 50, 50],
        clinicalAssessment: "Stable recall plateau on familiar village photos; requires auditory reassurance"
      },
      attention: {
        name: "Sustained Attention & Reaction",
        currentScore: 48,
        delta30d: 2,
        trend7d: [47, 47, 47, 48, 48],
        trend30d: [46, 46, 47, 47, 47, 48, 48],
        trend90d: [45, 46, 46, 47, 47, 48, 48],
        clinicalAssessment: "Motor tremor filter successfully dampens double-tap errors on 72px targets"
      },
      routineRecall: {
        name: "Daily Routine & Task Sequencing",
        currentScore: 54,
        delta30d: 2,
        trend7d: [53, 53, 53, 54, 54],
        trend30d: [52, 52, 53, 53, 53, 54, 54],
        trend90d: [51, 52, 52, 53, 53, 54, 54],
        clinicalAssessment: "Maintains structured sequence for morning tea and armchair rest"
      },
      patternRecognition: {
        name: "Visuospatial & Pattern Matching",
        currentScore: 49,
        delta30d: 2,
        trend7d: [48, 48, 48, 49, 49],
        trend30d: [47, 47, 48, 48, 48, 49, 49],
        trend90d: [46, 47, 47, 48, 48, 49, 49],
        clinicalAssessment: "Preserved basic color grouping and large shape sorting"
      },
      reminiscence: {
        name: "Recall & Reminiscence",
        currentScore: 56,
        delta30d: 2,
        trend7d: [55, 55, 55, 56, 56],
        trend30d: [54, 54, 55, 55, 55, 56, 56],
        trend90d: [53, 54, 54, 55, 55, 56, 56],
        clinicalAssessment: "Strong positive response when viewing church elder and traditional Ao Naga photos"
      }
    },
    flags: [
      {
        id: "flg-044-1",
        date: "2026-08-25",
        severity: "stable",
        metric: "Stable advanced stage plateau maintained across consecutive sessions",
        context: "Caregiver routines provide stable structure preventing behavioral decompensation."
      }
    ],
    careSchedule: {
      medications: [
        {
          id: "med-01",
          time: "08:00",
          period: "Morning",
          name: "Donepezil 5mg",
          dosage: "5mg",
          instructions: "Take 1 tablet dissolved in warm water with breakfast",
          pillVisual: "round-white",
          pillLabel: "DNP 5",
          pillColor: "#FFFFFF",
          pillShape: "circle",
          pillBg: "#E8ECEF"
        },
        {
          id: "med-02",
          time: "20:00",
          period: "Evening",
          name: "Clonazepam 0.25mg",
          dosage: "0.25mg",
          instructions: "Take 1 tablet with evening meal for resting tremor",
          pillVisual: "oval-yellow",
          pillLabel: "CZP",
          pillColor: "#F5DF98",
          pillShape: "oval",
          pillBg: "#F0ECE1"
        }
      ],
      hydration: {
        frequency: "Every 2 Hours",
        targetMl: 1400,
        instructions: "Small sips of lukewarm water via spill-proof mug"
      },
      activity: {
        time: "10:30",
        title: "Armchair breathing and gentle hand exercise",
        durationMins: 15,
        instructions: "Guided hand stretches under son's assistance"
      },
      appointment: {
        date: "2026-10-22",
        time: "11:30 AM",
        clinic: "Dimapur Civil Hospital — Tele-Health Room",
        physician: "Dr. Priyam Borah, MD (Neurology)",
        purpose: "Motor tremor review and medication refill"
      },
      graceWindowMins: 45,
      caregiverAlertEnabled: true
    },
    reminders: {
      medicine: 90,
      hydration: 86,
      activity: 84,
      appointment: 92,
      recentLogs: [
        { time: "2026-09-11 08:00", type: "Medicine", title: "Donepezil 5mg morning", status: "acknowledged" },
        { time: "2026-09-10 20:00", type: "Medicine", title: "Clonazepam 0.25mg evening", status: "acknowledged" },
        { time: "2026-09-10 10:30", type: "Activity", title: "Armchair breathing session", status: "acknowledged" },
        { time: "2026-09-09 08:00", type: "Medicine", title: "Donepezil 5mg morning", status: "missed" }
      ]
    },
    weeklyAdherence: [
      { weekLabel: "Wk -7", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -6", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -5", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -4", completed: 2, scheduled: 3, skipped: 1 },
      { weekLabel: "Wk -3", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -2", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -1", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Current", completed: 2, scheduled: 3, skipped: 1 }
    ],
    sessions: generateSessions(
      standardDates,
      modSeq,
      (i, total) => Math.round(50 + (i % 2 === 0 ? 1 : -1)),
      (i, total) => +(2.8 + (i % 2 === 0 ? 0.2 : -0.1)).toFixed(1),
      "Tier 1 (Simplified)"
    ),
    clinicalNotes: [
      {
        id: "note-044-1",
        date: "2026-08-25",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "Advanced cognitive plateau supported well by son Temjen. Tremor damping algorithms on tablet working as intended. Maintained peaceful affect."
      },
      {
        id: "note-044-2",
        date: "2026-07-20",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "ASHA Keviphreno visited home; no signs of skin breakdown or severe apathy. Continue simplified Tier 1 exercises."
      }
    ]
  },

  // 6. NABAM RINA (Improving Gain, Itanagar, Hindi, 72 F, Moderate)
  {
    id: "NER-2025-091",
    name: "Nabam Rina",
    age: 72,
    gender: "Female",
    district: "Itanagar (Arunachal)",
    language: "Hindi",
    assignedHealthWorker: "Tenzin Yangzom (CHO - Itanagar)",
    assignedDoctor: "Dr. Priyam Borah, MD (Neurology)",
    caregiver: {
      name: "Nabam Tagar (Husband)",
      contact: "+91 94362-99014",
      relation: "Elderly Spouse"
    },
    status: "stable",
    statusLabel: "Stable",
    statusReason: "Therapeutic Gain (+19% in Sustained Attention) following regular tablet training",
    lastSessionDate: "2026-09-12",
    adherenceRate: 94,
    cognitiveStage: "Moderate",
    accessibility: "Low-vision mode: large text (125%) & audio narration priority",
    trendSparkline: [56, 58, 61, 64, 67, 70, 71],
    cognitiveModules: {
      attention: {
        name: "Sustained Attention & Reaction",
        currentScore: 70,
        delta30d: 19,
        trend7d: [67, 68, 69, 69, 70],
        trend30d: [56, 57, 58, 62, 66, 68, 70], // baseline: 57, recent: 68 => +19%
        trend90d: [52, 54, 56, 58, 62, 66, 68, 70],
        clinicalAssessment: "Substantial acceleration in visual scan time; reaction speed improved by 540ms"
      },
      memory: {
        name: "Memory & Word Association",
        currentScore: 72,
        delta30d: 15,
        trend7d: [69, 70, 71, 71, 72],
        trend30d: [60, 61, 62, 65, 68, 71, 72],
        trend90d: [56, 58, 60, 62, 65, 68, 71, 72],
        clinicalAssessment: "Excellent associative recall with Hindi audio prompts; paired card recall fast"
      },
      routineRecall: {
        name: "Daily Routine & Task Sequencing",
        currentScore: 74,
        delta30d: 10,
        trend7d: [72, 72, 73, 73, 74],
        trend30d: [64, 65, 66, 68, 70, 72, 74],
        trend90d: [62, 63, 64, 66, 68, 70, 72, 74],
        clinicalAssessment: "Confident sequencing of personal prayers and morning garden care in Doimukh"
      },
      patternRecognition: {
        name: "Visuospatial & Pattern Matching",
        currentScore: 70,
        delta30d: 13,
        trend7d: [67, 68, 69, 69, 70],
        trend30d: [58, 59, 60, 63, 66, 68, 70],
        trend90d: [55, 56, 58, 60, 63, 66, 68, 70],
        clinicalAssessment: "Accurate matching of geometric Nyishi textile and weaving motifs"
      },
      reminiscence: {
        name: "Recall & Reminiscence",
        currentScore: 76,
        delta30d: 11,
        trend7d: [73, 74, 75, 75, 76],
        trend30d: [65, 66, 67, 70, 72, 74, 76],
        trend90d: [62, 64, 65, 67, 70, 72, 74, 76],
        clinicalAssessment: "Fluent recognition of family elders; prompt verbal anecdotes upon photo presentation"
      }
    },
    flags: [
      {
        id: "flg-091-1",
        date: "2026-09-06",
        severity: "improvement",
        metric: "+19% sustained gain in attention speed over 30 days",
        context: "Regular daily tablet exercises with large typography mode significantly improved task focus."
      }
    ],
    careSchedule: {
      medications: [
        {
          id: "med-01",
          time: "08:30",
          period: "Morning",
          name: "Piracetam 800mg",
          dosage: "800mg",
          instructions: "Take 1 tablet with warm milk after breakfast",
          pillVisual: "round-white",
          pillLabel: "PIR 800",
          pillColor: "#FFFFFF",
          pillShape: "circle",
          pillBg: "#E8ECEF"
        },
        {
          id: "med-02",
          time: "20:30",
          period: "Evening",
          name: "Citicoline 500mg",
          dosage: "500mg",
          instructions: "Take 1 tablet after evening meal with water",
          pillVisual: "oval-yellow",
          pillLabel: "CIT 500",
          pillColor: "#F5DF98",
          pillShape: "oval",
          pillBg: "#F0ECE1"
        }
      ],
      hydration: {
        frequency: "Every 3 Hours",
        targetMl: 1600,
        instructions: "Boiled warm water or ginger herbal infusion"
      },
      activity: {
        time: "16:30",
        title: "Compound walk with spouse & breath exercises",
        durationMins: 20,
        instructions: "Gentle compound walking accompanied by husband"
      },
      appointment: {
        date: "2026-10-15",
        time: "11:00 AM",
        clinic: "TRIHMS Naharlagun — Tele-Medicine Suite",
        physician: "Dr. Priyam Borah, MD (Neurology)",
        purpose: "Therapeutic progress evaluation & visual aid optimization"
      },
      graceWindowMins: 45,
      caregiverAlertEnabled: true
    },
    reminders: {
      medicine: 96,
      hydration: 92,
      activity: 92,
      appointment: 96,
      recentLogs: [
        { time: "2026-09-12 08:30", type: "Medicine", title: "Piracetam 800mg morning", status: "acknowledged" },
        { time: "2026-09-12 07:00", type: "Hydration", title: "Morning water intake (350ml)", status: "acknowledged" },
        { time: "2026-09-11 16:30", type: "Activity", title: "Compound walk & breathing", status: "acknowledged" },
        { time: "2026-09-11 08:30", type: "Medicine", title: "Piracetam 800mg morning", status: "acknowledged" }
      ]
    },
    weeklyAdherence: [
      { weekLabel: "Wk -7", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -6", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -5", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -4", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -3", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -2", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -1", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Current", completed: 3, scheduled: 3, skipped: 0 }
    ],
    sessions: generateSessions(
      standardDates,
      modSeq,
      (i, total) => Math.round(72 - (i / total) * 16 + (i % 2 === 0 ? 1 : -1)),
      (i, total) => +(2.1 + (i / total) * 1.2).toFixed(1),
      "Tier 2 (Moderate)"
    ),
    clinicalNotes: [
      {
        id: "note-091-1",
        date: "2026-09-01",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "TRIHMS extension report shows marked improvement in sustained attention. Patient enjoys audio-visual feedback in Hindi. Excellent husband accompaniment."
      },
      {
        id: "note-091-2",
        date: "2026-08-04",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "Good physical stamina. Tablet screen brightness calibrated for mild cataract; patient reports no eye strain."
      }
    ]
  },

  // 7. YUMNAM TOMBI SINGH (Stable Flat, Imphal, Manipuri, 82 M, Advanced)
  {
    id: "NER-2024-119",
    name: "Yumnam Tombi Singh",
    age: 82,
    gender: "Male",
    district: "Imphal (Manipur)",
    language: "Manipuri",
    assignedHealthWorker: "Thoibi Devi (ASHA - Imphal)",
    assignedDoctor: "Dr. Priyam Borah, MD (Neurology)",
    caregiver: {
      name: "Yumnam Sanatombi Devi (Wife)",
      contact: "+91 96120-77812",
      relation: "Elderly Spouse"
    },
    status: "stable",
    statusLabel: "Stable",
    statusReason: "Advanced dementia maintenance plateau supported by structured home care; 82% adherence",
    lastSessionDate: "2026-09-10",
    adherenceRate: 82,
    cognitiveStage: "Advanced",
    accessibility: "Reduced fine-motor coordination; caregiver audio accompaniment active",
    trendSparkline: [38, 39, 39, 40, 40, 41, 41],
    cognitiveModules: {
      memory: {
        name: "Memory & Word Association",
        currentScore: 40,
        delta30d: 2,
        trend7d: [39, 40, 40, 40, 40],
        trend30d: [38, 38, 39, 39, 40, 40, 40],
        trend90d: [37, 38, 38, 39, 39, 40, 40],
        clinicalAssessment: "Stable recall plateau on 2-item recognition with caregiver tactile cueing"
      },
      attention: {
        name: "Sustained Attention & Reaction",
        currentScore: 38,
        delta30d: 2,
        trend7d: [37, 37, 38, 38, 38],
        trend30d: [36, 36, 37, 37, 37, 38, 38],
        trend90d: [35, 36, 36, 37, 37, 38, 38],
        clinicalAssessment: "Short 8-minute session duration prevents fatigue and motor agitation"
      },
      routineRecall: {
        name: "Daily Routine & Task Sequencing",
        currentScore: 44,
        delta30d: 2,
        trend7d: [43, 43, 43, 44, 44],
        trend30d: [42, 42, 43, 43, 43, 44, 44],
        trend90d: [41, 42, 42, 43, 43, 44, 44],
        clinicalAssessment: "Consistently tracks daily veranda sitting and prayer bell routine"
      },
      patternRecognition: {
        name: "Visuospatial & Pattern Matching",
        currentScore: 39,
        delta30d: 2,
        trend7d: [38, 38, 38, 39, 39],
        trend30d: [37, 37, 38, 38, 38, 39, 39],
        trend90d: [36, 37, 37, 38, 38, 39, 39],
        clinicalAssessment: "Basic distinction of circular vs square shapes on high-contrast screen"
      },
      reminiscence: {
        name: "Recall & Reminiscence",
        currentScore: 46,
        delta30d: 2,
        trend7d: [45, 45, 45, 46, 46],
        trend30d: [44, 44, 45, 45, 45, 46, 46],
        trend90d: [43, 44, 44, 45, 45, 46, 46],
        clinicalAssessment: "Immediate smile and eye fixation on photos of Kangla Fort and family ceremonies"
      }
    },
    flags: [
      {
        id: "flg-119-1",
        date: "2026-08-28",
        severity: "stable",
        metric: "Comfort plateau maintained on simplified Tier 1 routine",
        context: "Home environment stable; wife manages morning routine with ASHA guidance."
      }
    ],
    careSchedule: {
      medications: [
        {
          id: "med-01",
          time: "08:00",
          period: "Morning",
          name: "Amlodipine 5mg",
          dosage: "5mg",
          instructions: "Take 1 tablet after morning tea for vascular BP control",
          pillVisual: "round-white",
          pillLabel: "AML 5",
          pillColor: "#FFFFFF",
          pillShape: "circle",
          pillBg: "#E8ECEF"
        },
        {
          id: "med-02",
          time: "20:00",
          period: "Evening",
          name: "Quetiapine 12.5mg",
          dosage: "12.5mg",
          instructions: "Take half tablet at bedtime to prevent nocturnal wandering",
          pillVisual: "oval-yellow",
          pillLabel: "QTP",
          pillColor: "#F5DF98",
          pillShape: "oval",
          pillBg: "#F0ECE1"
        }
      ],
      hydration: {
        frequency: "Every 2 Hours",
        targetMl: 1400,
        instructions: "Small cup of lukewarm boiled water with lemon"
      },
      activity: {
        time: "11:00",
        title: "Veranda sitting & gentle leg passive movement",
        durationMins: 15,
        instructions: "Gentle passive joint movement assisted by wife"
      },
      appointment: {
        date: "2026-10-25",
        time: "10:30 AM",
        clinic: "JNIMS Imphal — Tele-Geriatric Clinic",
        physician: "Dr. Priyam Borah, MD (Neurology)",
        purpose: "Vascular dementia maintenance and night sedation review"
      },
      graceWindowMins: 45,
      caregiverAlertEnabled: true
    },
    reminders: {
      medicine: 84,
      hydration: 80,
      activity: 78,
      appointment: 86,
      recentLogs: [
        { time: "2026-09-10 20:00", type: "Medicine", title: "Quetiapine 12.5mg bedtime", status: "acknowledged" },
        { time: "2026-09-10 08:00", type: "Medicine", title: "Amlodipine 5mg morning", status: "acknowledged" },
        { time: "2026-09-09 11:00", type: "Activity", title: "Veranda passive mobility", status: "acknowledged" },
        { time: "2026-09-08 08:00", type: "Medicine", title: "Amlodipine 5mg morning", status: "missed" }
      ]
    },
    weeklyAdherence: [
      { weekLabel: "Wk -7", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -6", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -5", completed: 2, scheduled: 3, skipped: 1 },
      { weekLabel: "Wk -4", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -3", completed: 2, scheduled: 3, skipped: 1 },
      { weekLabel: "Wk -2", completed: 2, scheduled: 3, skipped: 1 },
      { weekLabel: "Wk -1", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Current", completed: 2, scheduled: 3, skipped: 1 }
    ],
    sessions: generateSessions(
      standardDates,
      modSeq,
      (i, total) => Math.round(41 + (i % 2 === 0 ? 1 : -1)),
      (i, total) => +(3.2 + (i % 2 === 0 ? 0.2 : -0.1)).toFixed(1),
      "Tier 1 (Simplified)"
    ),
    clinicalNotes: [
      {
        id: "note-119-1",
        date: "2026-09-03",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "Advanced vascular dementia with stable plateau in Uripok residence. Wife manages routine well. Night restlessness subsided with 12.5mg Quetiapine."
      },
      {
        id: "note-119-2",
        date: "2026-07-28",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "ASHA Thoibi Devi visits twice monthly. Weight stable, no decubitus ulcers. Reminded family on fall prevention in courtyard."
      }
    ]
  },

  // 8. PI LALTHANGPUII (Improving Gain, Aizawl, Mizo, 76 F, Moderate)
  {
    id: "NER-2024-142",
    name: "Pi Lalthangpuii",
    age: 76,
    gender: "Female",
    district: "Aizawl (Mizoram)",
    language: "Mizo",
    assignedHealthWorker: "Lalengzami (CHO - Aizawl)",
    assignedDoctor: "Dr. Priyam Borah, MD (Neurology)",
    caregiver: {
      name: "Rochhungi (Daughter)",
      contact: "+91 94361-55822",
      relation: "Primary Home Caregiver"
    },
    status: "stable",
    statusLabel: "Stable",
    statusReason: "Therapeutic Gain (+20% in Daily Routine Recall) with high Mizo task engagement",
    lastSessionDate: "2026-09-11",
    adherenceRate: 90,
    cognitiveStage: "Moderate",
    accessibility: "Standard touch interface; Mizo dialect audio prompts active",
    trendSparkline: [58, 60, 62, 65, 68, 71, 73],
    cognitiveModules: {
      routineRecall: {
        name: "Daily Routine & Task Sequencing",
        currentScore: 73,
        delta30d: 20,
        trend7d: [70, 71, 72, 72, 73],
        trend30d: [58, 59, 60, 64, 68, 71, 73], // baseline: 59, recent: 71 => +20%
        trend90d: [54, 56, 58, 60, 64, 68, 71, 73],
        clinicalAssessment: "Tremendous recovery in sequential activity planning; prepares morning tea unassisted"
      },
      memory: {
        name: "Memory & Word Association",
        currentScore: 74,
        delta30d: 14,
        trend7d: [71, 72, 73, 73, 74],
        trend30d: [62, 63, 64, 67, 70, 72, 74],
        trend90d: [58, 60, 62, 64, 67, 70, 72, 74],
        clinicalAssessment: "Mizo paired associates retrieval speed accelerated; prompt recognition on flip-cards"
      },
      attention: {
        name: "Sustained Attention & Reaction",
        currentScore: 70,
        delta30d: 12,
        trend7d: [68, 68, 69, 69, 70],
        trend30d: [60, 61, 62, 64, 67, 69, 70],
        trend90d: [56, 58, 60, 62, 64, 67, 69, 70],
        clinicalAssessment: "Reaction latency improved from 2.9s to 1.9s with reduced hesitation"
      },
      patternRecognition: {
        name: "Visuospatial & Pattern Matching",
        currentScore: 69,
        delta30d: 14,
        trend7d: [66, 67, 68, 68, 69],
        trend30d: [57, 58, 59, 62, 65, 67, 69],
        trend90d: [54, 56, 57, 59, 62, 65, 67, 69],
        clinicalAssessment: "Intact spatial rotation on traditional Puan weaving pattern puzzles"
      },
      reminiscence: {
        name: "Recall & Reminiscence",
        currentScore: 76,
        delta30d: 10,
        trend7d: [73, 74, 75, 75, 76],
        trend30d: [66, 67, 68, 71, 73, 75, 76],
        trend90d: [62, 64, 66, 68, 71, 73, 75, 76],
        clinicalAssessment: "Vivid and enthusiastic recall of past government service in Lunglei and Aizawl"
      }
    },
    flags: [
      {
        id: "flg-142-1",
        date: "2026-09-07",
        severity: "improvement",
        metric: "+20% sustained gain in daily routine sequencing over 30 days",
        context: "Structured daily morning sequencer game successfully restored confidence in independent personal routine."
      }
    ],
    careSchedule: {
      medications: [
        {
          id: "med-01",
          time: "08:30",
          period: "Morning",
          name: "Donepezil 10mg",
          dosage: "10mg",
          instructions: "Take 1 tablet after morning tea with warm water",
          pillVisual: "round-white",
          pillLabel: "DNP 10",
          pillColor: "#FFFFFF",
          pillShape: "circle",
          pillBg: "#E8ECEF"
        },
        {
          id: "med-02",
          time: "20:00",
          period: "Evening",
          name: "Memantine 10mg",
          dosage: "10mg",
          instructions: "Take 1 tablet after dinner with water",
          pillVisual: "oval-yellow",
          pillLabel: "MEM 10",
          pillColor: "#F5DF98",
          pillShape: "oval",
          pillBg: "#F0ECE1"
        }
      ],
      hydration: {
        frequency: "Every 3 Hours",
        targetMl: 1500,
        instructions: "Fresh warm water or local Mizo green tea"
      },
      activity: {
        time: "16:00",
        title: "Hill terrace walking & joint mobilization",
        durationMins: 20,
        instructions: "Gentle hill terrace walking with walking stick and daughter"
      },
      appointment: {
        date: "2026-10-10",
        time: "10:30 AM",
        clinic: "Aizawl Civil Hospital — Tele-Clinic Hub",
        physician: "Dr. Priyam Borah, MD (Neurology)",
        purpose: "Therapeutic gain follow-up and maintenance plan"
      },
      graceWindowMins: 45,
      caregiverAlertEnabled: true
    },
    reminders: {
      medicine: 92,
      hydration: 88,
      activity: 88,
      appointment: 92,
      recentLogs: [
        { time: "2026-09-11 08:30", type: "Medicine", title: "Donepezil 10mg morning", status: "acknowledged" },
        { time: "2026-09-10 20:00", type: "Medicine", title: "Memantine 10mg evening", status: "acknowledged" },
        { time: "2026-09-10 16:00", type: "Activity", title: "Terrace walking session", status: "acknowledged" },
        { time: "2026-09-09 08:30", type: "Medicine", title: "Donepezil 10mg morning", status: "acknowledged" }
      ]
    },
    weeklyAdherence: [
      { weekLabel: "Wk -7", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -6", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -5", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -4", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -3", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -2", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Wk -1", completed: 3, scheduled: 3, skipped: 0 },
      { weekLabel: "Current", completed: 3, scheduled: 3, skipped: 0 }
    ],
    sessions: generateSessions(
      standardDates,
      modSeq,
      (i, total) => Math.round(74 - (i / total) * 16 + (i % 2 === 0 ? 1 : -1)),
      (i, total) => +(1.9 + (i / total) * 1.0).toFixed(1),
      "Tier 2 (Moderate)"
    ),
    clinicalNotes: [
      {
        id: "note-142-1",
        date: "2026-09-02",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "Remarkable recovery in daily routine sequencer module. Daughter Rochhungi reports patient is now preparing his own morning tea without prompting."
      },
      {
        id: "note-142-2",
        date: "2026-08-05",
        author: "Dr. Priyam Borah, MD (Neurology)",
        text: "CHO Lalengzami confirmed stable blood pressure and medication adherence. Reinforce daily reminiscence game."
      }
    ]
  }
];

// Build complete data.js file
const fileContent = `/**
 * CLINICAL DATA STORE: CDX-GERI-NER
 * Regional Tele-Cognitive Health Registry — North-Eastern Region (NER)
 * Affiliation: GMCH Geriatric Neuro Unit & Regional Memory Assessment Centers
 * 
 * Comprehensive 8-Patient Clinical Cohort spanning 8 Regional Districts:
 * - Kamrup (Assam), Dimapur (Nagaland), Shillong (Meghalaya), Imphal (Manipur),
 *   Aizawl (Mizoram), Kokrajhar (Assam), Itanagar (Arunachal), Gangtok (Sikkim)
 */

const CLINICAL_DATA = {
  // District Registry across North-Eastern States
  districts: ${JSON.stringify(districts, null, 2)},

  // Primary Languages in NER
  languages: ${JSON.stringify(languages, null, 2)},

  // Assigned Community Health Workers / ASHAs
  healthWorkers: ${JSON.stringify(healthWorkers, null, 2)},

  // Comprehensive Patient Cohort (8 Diverse Patients)
  patients: ${JSON.stringify(patients, null, 2)}
};

// Ensure data integrity and backward-compatibility
(function normalizeClinicalData() {
  if (typeof CLINICAL_DATA === "undefined" || !CLINICAL_DATA.patients) return;

  CLINICAL_DATA.patients.forEach((p) => {
    // 1. Ensure reminiscence module exists
    if (!p.cognitiveModules.reminiscence) {
      const base = p.status === "alert" ? 54 : p.status === "attention" ? 64 : 78;
      const delta = p.status === "alert" ? -8 : p.status === "attention" ? -3 : +2;
      p.cognitiveModules.reminiscence = {
        name: "Recall & Reminiscence",
        currentScore: base,
        delta30d: delta,
        trend7d: [base + 4, base + 3, base + 2, base + 1, base],
        trend30d: [base + 8, base + 6, base + 4, base + 3, base + 2, base + 1, base],
        trend90d: [base + 12, base + 10, base + 8, base + 6, base + 4, base + 2, base],
        clinicalAssessment: p.status === "alert"
          ? "Delayed facial kinship recall; intact recognition with auditory cueing"
          : "Stable recognition of primary family members; prompt recall latency"
      };
    }

    // 2. Normalize sessions
    p.sessions.forEach((s) => {
      if (!s.gameModule) {
        const lower = (s.gamesPlayed || "").toLowerCase();
        if (lower.includes("memory") || lower.includes("word")) s.gameModule = "memory";
        else if (lower.includes("attention") || lower.includes("reaction")) s.gameModule = "attention";
        else if (lower.includes("routine") || lower.includes("sequence")) s.gameModule = "routineRecall";
        else if (lower.includes("pattern") || lower.includes("visual") || lower.includes("clock")) s.gameModule = "patternRecognition";
        else if (lower.includes("reminiscence") || lower.includes("recall")) s.gameModule = "reminiscence";
        else s.gameModule = "memory";
      }
      if (!s.avgResponseSecs) {
        s.avgResponseSecs = p.status === "alert" ? 3.4 : p.status === "attention" ? 2.5 : 1.8;
      }
    });
  });
})();
`;

fs.writeFileSync('./js/data.js', fileContent, 'utf8');
console.log("Successfully generated js/data.js with 8 complete patient dossiers!");
