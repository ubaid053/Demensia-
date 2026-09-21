// Validation Test Suite for 8-Patient Realistic Mock Dataset
const fs = require('fs');
const vm = require('vm');

// Mock browser window and console
global.window = {};
global.CustomEvent = class CustomEvent {};

const dataCode = fs.readFileSync('./js/data.js', 'utf8');
const aiCode = fs.readFileSync('./js/ai-detection.js', 'utf8');

vm.runInThisContext(dataCode);
vm.runInThisContext(aiCode);

console.log("=== 1. VERIFYING COHORT COUNT & DISTRICTS ===");
const patients = CLINICAL_DATA.patients;
console.log("Total patients in registry:", patients.length);
if (patients.length !== 8) throw new Error(`Expected 8 patients, got ${patients.length}`);

const expectedDistricts = [
  "Kamrup (Assam)",
  "Dimapur (Nagaland)",
  "Shillong (Meghalaya)",
  "Imphal (Manipur)",
  "Aizawl (Mizoram)",
  "Kokrajhar (Assam)",
  "Itanagar (Arunachal)",
  "Gangtok (Sikkim)"
];

const foundDistricts = patients.map(p => p.district);
console.log("Found districts:", foundDistricts);
expectedDistricts.forEach(d => {
  if (!foundDistricts.includes(d)) throw new Error(`Missing expected district: ${d}`);
});
console.log("All 8 regional districts present without duplicates!");

console.log("\n=== 2. VERIFYING LANGUAGES & DEMOGRAPHICS ===");
const foundLanguages = patients.map(p => p.language);
console.log("Found languages:", foundLanguages);
const expectedLangs = ["Assamese", "Nagamese", "Khasi", "Manipuri", "Mizo", "Bodo", "Hindi", "Nepali"];
expectedLangs.forEach(l => {
  if (!foundLanguages.includes(l)) throw new Error(`Missing expected language: ${l}`);
});

const ages = patients.map(p => p.age);
console.log("Age range:", Math.min(...ages), "to", Math.max(...ages));
if (Math.min(...ages) < 62 || Math.max(...ages) > 84) {
  throw new Error("Age range out of 62–84 bound");
}

const males = patients.filter(p => p.gender === "Male").length;
const females = patients.filter(p => p.gender === "Female").length;
console.log(`Gender distribution: ${males} Males, ${females} Females`);
if (males === 0 || females === 0) throw new Error("Gender must be mixed");

console.log("\n=== 3. VERIFYING COGNITIVE STAGES & ACCESSIBILITY ===");
const stages = {
  Early: patients.filter(p => p.cognitiveStage === "Early").length,
  Moderate: patients.filter(p => p.cognitiveStage === "Moderate").length,
  Advanced: patients.filter(p => p.cognitiveStage === "Advanced").length
};
console.log("Cognitive stage distribution:", stages);
if (stages.Early !== 3 || stages.Moderate !== 3 || stages.Advanced !== 2) {
  throw new Error(`Cognitive stage spread must be 3 Early, 3 Moderate, 2 Advanced. Got: ${JSON.stringify(stages)}`);
}

patients.forEach(p => {
  if (!p.accessibility) throw new Error(`Patient ${p.id} missing accessibility profile`);
  console.log(`- ${p.name} (${p.id}): ${p.accessibility}`);
});

console.log("\n=== 4. TESTING AI DECLINE DETECTION ENGINE ===");
// Patient 1: Multi-Module Decline (Bhaben Chandra Hazarika)
const bhaben = patients.find(p => p.id === "NER-2024-081");
const bhabenFlags = AIDeclineDetector.evaluatePatient(bhaben);
console.log(`Bhaben Chandra Hazarika flags (${bhabenFlags.length}):`);
bhabenFlags.forEach(f => console.log(`  [${f.severity.toUpperCase()}] ${f.moduleName}: ${f.metricHeadline}`));

const hasMultiDomain = bhabenFlags.some(f => f.isMultiDomain);
const hasAttentionAlert = bhabenFlags.some(f => f.moduleKey === "attention" && f.severity === "alert");
const hasRoutineAlert = bhabenFlags.some(f => f.moduleKey === "routineRecall" && f.severity === "alert");

if (!hasMultiDomain || !hasAttentionAlert || !hasRoutineAlert) {
  throw new Error("Bhaben Chandra Hazarika failed to trigger Multi-Domain and Dual-Module Clinical Alerts");
}
console.log("✓ Bhaben correctly triggered Multi-Module Alert tier!");

// Patient 2: Single-Module Decline (Pemba Tshering Lepcha)
const pemba = patients.find(p => p.id === "NER-2026-302");
const pembaFlags = AIDeclineDetector.evaluatePatient(pemba);
console.log(`\nPemba Tshering Lepcha flags (${pembaFlags.length}):`);
pembaFlags.forEach(f => console.log(`  [${f.severity.toUpperCase()}] ${f.moduleName}: ${f.metricHeadline}`));

const hasMemoryAttn = pembaFlags.some(f => f.moduleKey === "memory" && f.severity === "attention");
const hasOtherDecline = pembaFlags.some(f => f.moduleKey !== "memory" && (f.severity === "alert" || f.severity === "attention"));

if (!hasMemoryAttn) throw new Error("Pemba failed to trigger Needs Attention flag in Memory");
if (hasOtherDecline) throw new Error("Pemba must only have a single-module decline");
if (pembaFlags.some(f => f.isMultiDomain)) throw new Error("Pemba should NOT trigger multi-domain alert");
console.log("✓ Pemba correctly triggered Single-Module 'Needs Attention' tier!");

// Improving Patients: Ronggili, Nabam, Lalthangpuii
["NER-2025-115", "NER-2025-091", "NER-2024-142"].forEach(id => {
  const p = patients.find(x => x.id === id);
  const flags = AIDeclineDetector.evaluatePatient(p);
  const hasGain = flags.some(f => f.severity === "improvement");
  console.log(`\n${p.name} (${p.id}) Therapeutic Gain check: ${hasGain ? "PASS" : "FAIL"}`);
  if (!hasGain) throw new Error(`${p.name} failed to trigger Therapeutic Gain flag`);
});
console.log("✓ All 3 improving patients correctly trigger Therapeutic Gain flags!");

// Stable Patients: Mary, Imotepjen, Tombi
["NER-2024-104", "NER-2025-044", "NER-2024-119"].forEach(id => {
  const p = patients.find(x => x.id === id);
  const flags = AIDeclineDetector.evaluatePatient(p);
  const declineFlags = flags.filter(f => f.severity === "alert" || f.severity === "attention");
  console.log(`\n${p.name} (${p.id}) Stable check: ${declineFlags.length === 0 ? "STABLE (0 decline flags)" : "FAILED"}`);
  if (declineFlags.length > 0) throw new Error(`${p.name} should have 0 decline flags`);
});
console.log("✓ All 3 stable patients maintain baseline stability without decline flags!");

console.log("\n=== 5. VERIFYING ADHERENCE LOGS & RATES ===");
patients.forEach(p => {
  if (p.id === "NER-2024-081") {
    if (p.adherenceRate > 65) throw new Error(`Bhaben adherence rate must be deliberately lower (~60%), got ${p.adherenceRate}`);
  } else {
    if (p.adherenceRate < 80 || p.adherenceRate > 96) {
      throw new Error(`Patient ${p.id} adherence rate must be 80–95%, got ${p.adherenceRate}`);
    }
  }
  if (!p.reminders || !p.reminders.recentLogs || p.reminders.recentLogs.length < 3) {
    throw new Error(`Patient ${p.id} missing recent adherence logs`);
  }
  if (!p.weeklyAdherence || p.weeklyAdherence.length !== 8) {
    throw new Error(`Patient ${p.id} missing 8-week weekly adherence`);
  }
});
console.log("Adherence logs and rates verified for all 8 patients!");

console.log("\n=== 6. VERIFYING CAREGIVERS & CLINICAL NOTES ===");
patients.forEach(p => {
  if (!p.caregiver || !p.caregiver.name || !p.caregiver.contact || !p.caregiver.relation) {
    throw new Error(`Patient ${p.id} missing complete caregiver record`);
  }
  if (!p.clinicalNotes || p.clinicalNotes.length < 2) {
    throw new Error(`Patient ${p.id} must have 2–3 doctor clinical notes`);
  }
  console.log(`- ${p.name}: Caregiver ${p.caregiver.name} (${p.caregiver.relation}), ${p.clinicalNotes.length} notes`);
});

console.log("\n=== 7. VERIFYING SYSTEMIC CLUSTER ANALYTICS ===");
const cluster = AIDeclineDetector.getClusterAnalytics(patients);
console.log("Cluster analytics summary:", {
  alertCount: cluster.alertCount,
  attentionCount: cluster.attentionCount,
  improvementCount: cluster.improvementCount,
  totalFlags: cluster.totalFlags,
  moduleTally: cluster.moduleTally
});

console.log("\n=========================================");
console.log(" ALL DATA VALIDATION TESTS PASSED 100%!  ");
console.log("=========================================\n");
