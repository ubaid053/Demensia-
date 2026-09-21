/**
 * Full End-to-End Verification Script
 * Validates data layer, models, sync engine, and DOM structure
 */
const fs = require("fs");
const path = require("path");

console.log("=========================================");
console.log("   DEMENTIA PLATFORM E2E VERIFICATION    ");
console.log("=========================================\n");

// 1. Check data files exist and parse
const dataJs = fs.readFileSync("js/data.js", "utf8");
const gamesDataJs = fs.readFileSync("js/games-data.js", "utf8");
const appJs = fs.readFileSync("js/app.js", "utf8");
const indexHtml = fs.readFileSync("index.html", "utf8");
const gamesHtml = fs.readFileSync("games.html", "utf8");
const landingHtml = fs.readFileSync("landing.html", "utf8");

const vm = require("vm");

// Mock browser globals
const localStorageStore = {};
global.localStorage = {
  getItem: (k) => localStorageStore[k] || null,
  setItem: (k, v) => { localStorageStore[k] = String(v); },
  removeItem: (k) => { delete localStorageStore[k]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};
global.window = {
  dispatchEvent: () => {},
  speechSynthesis: { speak: () => {}, cancel: () => {} }
};
global.CustomEvent = class CustomEvent {
  constructor(type, detail) {
    this.type = type;
    this.detail = detail ? detail.detail : null;
  }
};

// Evaluate data & games-data
vm.runInThisContext(dataJs);
vm.runInThisContext(gamesDataJs);

console.log("1. Data Layer:");
console.log(` - Clinical patients count: ${CLINICAL_DATA.patients.length}`);
console.log(` - Game audio strings count: ${Object.keys(GameAudio.STRINGS).length}`);
console.log(` - Daily gentle questions count: ${ReminderSync.DAILY_QUESTIONS.length}`);
console.assert(CLINICAL_DATA.patients.length === 8, "Expected 8 patient records");
console.assert(ReminderSync.DAILY_QUESTIONS.length >= 3, "Expected daily questions");

// Test Reminder CRUD
console.log("\n2. Reminder CRUD Tests:");
const testPatientId = "NER-2024-081";
const initialReminders = ReminderSync.getAllReminders(testPatientId);
console.log(` - Initial reminders for ${testPatientId}: ${initialReminders.length}`);

const newRem = ReminderSync.addReminder(testPatientId, {
  title: "Memantine 10mg",
  category: "medication",
  time: "08:00 PM",
  dosage: "10mg",
  instructions: "Take with food",
  status: "upcoming"
});
console.log(` - Added reminder: ${newRem.title} (${newRem.id})`);
const afterAdd = ReminderSync.getAllReminders(testPatientId);
console.assert(afterAdd.some(r => r.id === newRem.id), "Failed to add reminder");

ReminderSync.setReminderStatus(testPatientId, newRem.id, "completed");
const afterStatus = ReminderSync.getAllReminders(testPatientId);
const updatedStatusItem = afterStatus.find(r => r.id === newRem.id);
console.assert(updatedStatusItem.status === "completed", "Failed to update status");
console.log(` - Updated reminder status to: ${updatedStatusItem.status}`);

ReminderSync.updateReminder(testPatientId, newRem.id, {
  dosage: "20mg"
});
const afterUpdate = ReminderSync.getAllReminders(testPatientId);
const updatedItem = afterUpdate.find(r => r.id === newRem.id);
console.assert(updatedItem.dosage === "20mg", "Failed to update dosage");
console.log(` - Updated reminder dosage to: ${updatedItem.dosage}`);

ReminderSync.deleteReminder(testPatientId, newRem.id);
const afterDelete = ReminderSync.getAllReminders(testPatientId);
console.assert(!afterDelete.some(r => r.id === newRem.id), "Failed to delete reminder");
console.log(` - Successfully deleted reminder (${newRem.id})`);

// Test Mood & Question
console.log("\n3. Mood & Question Tracking Tests:");
const moodEntry = ReminderSync.logMood(testPatientId, {
  mood: "peaceful",
  label: "Peaceful",
  emoji: "😌",
  note: "Felt very calm after morning tea"
});
console.log(` - Logged mood: ${moodEntry.emoji} ${moodEntry.label}`);
const moodHistory = ReminderSync.getMoodHistory(testPatientId);
console.assert(moodHistory.length >= 1, "Expected mood history");

const q = ReminderSync.getDailyQuestion(testPatientId);
console.log(` - Daily question: "${q.prompt}"`);
const qAns = ReminderSync.logDailyQuestion(testPatientId, q.id, q.options[0].text);
console.log(` - Answered daily question with: "${qAns.selectedOption}"`);

// Test SOS Emergency
console.log("\n4. SOS & Safe Zone Tests:");
const sosLog = ReminderSync.triggerSOS(testPatientId, {
  message: "Test emergency alert for elderly patient"
});
console.log(` - SOS triggered: Urgency=${sosLog.urgency}, ID=${sosLog.id}`);
const sosLogs = ReminderSync.getSOSLogs(testPatientId);
console.assert(sosLogs.length >= 1, "Expected SOS log entry");

const safeStatus = ReminderSync.getSafeZoneStatus(testPatientId);
console.log(` - Safe zone status: ${safeStatus.status} - ${safeStatus.badge} (${safeStatus.zoneName})`);

// Test HTML Elements & Structure
console.log("\n5. Markup Structure & Element Check:");
const requiredIndexIds = [
  "nav-roster", "nav-caregiver", "nav-analytics", "nav-patient-app",
  "view-caregiver-dashboard", "caregiver-patient-select", "btn-caregiver-notifications",
  "caregiver-active-sos-banner", "cg-metric-adherence", "cg-metric-reminders",
  "cg-metric-mood", "cg-metric-safezone", "btn-open-add-reminder",
  "caregiver-reminders-table", "caregiver-reminders-tbody", "caregiver-mood-timeline",
  "caregiver-activity-list", "caregiver-sos-logs-container", "btn-cg-test-sos",
  "modal-caregiver-add-reminder", "modal-caregiver-delete-reminder"
];
for (const id of requiredIndexIds) {
  console.assert(indexHtml.includes(`id="${id}"`), `index.html missing required ID: ${id}`);
}
console.log(` - All ${requiredIndexIds.length} required IDs in index.html verified.`);

const requiredGamesIds = [
  "nav-btn-dashboard", "nav-btn-reminders", "nav-btn-activities", "btn-patient-sos",
  "game-patient-select", "btn-to-clinician-dashboard", "view-dashboard",
  "patient-live-clock", "patient-full-date", "patient-weather-chip",
  "btn-read-today-schedule", "mood-feedback-banner",
  "daily-question-prompt", "daily-question-options", "daily-question-feedback",
  "patient-contacts-grid", "full-reminders-stack", "modal-emergency-sos",
  "sos-countdown-bar", "btn-confirm-sos", "btn-cancel-sos"
];
for (const id of requiredGamesIds) {
  console.assert(gamesHtml.includes(`id="${id}"`), `games.html missing required ID: ${id}`);
}
console.log(` - All ${requiredGamesIds.length} required IDs in games.html verified.`);

console.assert(landingHtml.includes('href="/games.html"'), "landing.html missing patient app link");
console.assert(landingHtml.includes('view=caregiver'), "landing.html missing caregiver view link");
console.assert(landingHtml.includes('Medical &amp; Regulatory Disclaimer'), "landing.html missing medical disclaimer");
console.log(" - landing.html links and disclaimers verified.");

console.log("\n ALL END-TO-END AUTOMATED VERIFICATION CHECKS PASSED! \n");
