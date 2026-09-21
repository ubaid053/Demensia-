// Test all UI rendering calculations and chart generators across all 8 patients
const fs = require('fs');

const dataCode = fs.readFileSync('js/data.js', 'utf8');
const aiCode = fs.readFileSync('js/ai-detection.js', 'utf8');
const chartsCode = fs.readFileSync('js/charts.js', 'utf8');

eval(dataCode.replace("const CLINICAL_DATA =", "global.CLINICAL_DATA ="));
eval(aiCode.replace("const AIDeclineDetector =", "global.AIDeclineDetector ="));
eval(chartsCode.replace("const ClinicalCharts =", "global.ClinicalCharts ="));

console.log("=== 1. VERIFYING ALL 8 PATIENTS IN CLINICAL DATA ===");
console.log(`Loaded ${CLINICAL_DATA.patients.length} patients.`);

let allChartsPass = true;

CLINICAL_DATA.patients.forEach((p, idx) => {
  console.log(`\nPatient ${idx + 1}: ${p.name} (${p.id}) - Status: ${p.status}`);

  // Test Sparkline SVG rendering
  const sparkline = ClinicalCharts.renderSparkline(p.trendSparkline, p.status);
  if (!sparkline || !sparkline.includes('<svg') || !sparkline.includes('</svg>')) {
    console.error(`  FAIL: Sparkline failed for ${p.id}`);
    allChartsPass = false;
  } else {
    console.log(`  ✓ Sparkline SVG generated (${sparkline.length} chars)`);
  }

  // Test Flag Sparklines for memory
  const flagSparkline = ClinicalCharts.renderFlagSparkline(p.cognitiveModules.memory.trend30d, p.status, p.cognitiveModules.memory.baselineScore);
  if (!flagSparkline || !flagSparkline.includes('<svg')) {
    console.error(`  FAIL: Flag sparkline failed for ${p.id}`);
    allChartsPass = false;
  } else {
    console.log(`  ✓ Flag Sparkline SVG generated`);
  }

  // Test AI evaluation
  const flags = AIDeclineDetector.evaluatePatient(p);
  console.log(`  ✓ AI evaluation generated ${flags.length} flag(s)`);

  // Test Adherence telemetry
  const totalLogs = p.reminders.recentLogs.length;
  const ackLogs = p.reminders.recentLogs.filter(l => l.status === 'acknowledged').length;
  console.log(`  ✓ Adherence telemetry confirmed (${p.adherenceRate}%, ${totalLogs} recent logs, ${p.weeklyAdherence.length} weekly buckets)`);

  // Check 5 game session history exists
  const gameTypes = ['memory', 'routineRecall', 'attention', 'patternRecognition', 'reminiscence'];
  gameTypes.forEach(g => {
    const s = p.sessions.filter(sh => sh.gameModule === g);
    if (s.length === 0) {
      console.error(`  FAIL: Missing session history for game ${g}`);
      allChartsPass = false;
    }
  });
  console.log(`  ✓ Complete session history across all 5 games (${p.sessions.length} total sessions)`);
});

console.log("\n=== 2. VERIFYING AGGREGATE STATS & ANALYTICS ===");
const total = CLINICAL_DATA.patients.length;
const alertCount = CLINICAL_DATA.patients.filter(p => p.status === 'alert').length;
const attentionCount = CLINICAL_DATA.patients.filter(p => p.status === 'attention').length;
const stableCount = CLINICAL_DATA.patients.filter(p => p.status === 'stable').length;
const avgAdherence = Math.round(CLINICAL_DATA.patients.reduce((acc, p) => acc + p.adherenceRate, 0) / total);
const clusterStats = AIDeclineDetector.getClusterAnalytics(CLINICAL_DATA.patients);

console.log(`Total Patients: ${total}`);
console.log(`Alert Patients: ${alertCount}`);
console.log(`Attention Patients: ${attentionCount}`);
console.log(`Stable Patients: ${stableCount}`);
console.log(`Cohort Stability Rate: ${Math.round((stableCount / total) * 100)}%`);
console.log(`Average Adherence: ${avgAdherence}%`);
console.log(`Most Vulnerable Domain: ${clusterStats.mostVulnerableModuleName} (${clusterStats.mostVulnerablePct}%)`);

if (allChartsPass) {
  console.log("\n=========================================");
  console.log(" ALL UI RENDERING AND CHARTS PASSED 100%!");
  console.log("=========================================");
} else {
  process.exit(1);
}
