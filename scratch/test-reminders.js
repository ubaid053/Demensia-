// Comprehensive Test for Reminder & Adherence System
const fs = require('fs');
const vm = require('vm');

// Mock browser globals
global.window = {
  dispatchEvent: (ev) => {
    global.__lastDispatchedEvent = ev;
  },
  speechSynthesis: {
    speak: () => {},
    cancel: () => {}
  }
};
global.CustomEvent = class CustomEvent {
  constructor(type, detail) {
    this.type = type;
    this.detail = detail.detail;
  }
};
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

// Load data.js and games-data.js
const dataCode = fs.readFileSync('./js/data.js', 'utf8');
const gamesDataCode = fs.readFileSync('./js/games-data.js', 'utf8');

vm.runInThisContext(dataCode);
vm.runInThisContext(gamesDataCode);

console.log("Testing CLINICAL_DATA patients careSchedule...");
const p = CLINICAL_DATA.patients.find(x => x.id === "NER-2024-081");
if (!p) throw new Error("Patient NER-2024-081 not found!");

console.log("Patient name:", p.name);
console.log("Care schedule medications count:", p.careSchedule.medications.length);
console.log("Medication 1:", p.careSchedule.medications[0].name, p.careSchedule.medications[0].dosage);

console.log("\nTesting ReminderSync.getCareSchedule...");
const sched = ReminderSync.getCareSchedule("NER-2024-081");
if (!sched || !sched.medications) throw new Error("Failed to get care schedule");
console.log("Care schedule loaded successfully. Grace window:", sched.graceWindowMins);

console.log("\nTesting ReminderSync.getDueReminder (Medicine)...");
const dueMed = ReminderSync.getDueReminder("NER-2024-081");
console.log("Due reminder:", dueMed.title, dueMed.time, dueMed.pillVisual, dueMed.audioKey);
if (dueMed.type !== "Medicine") throw new Error("Expected Medicine reminder type");

console.log("\nTesting ReminderSync.getDueReminder (Hydration)...");
const dueHyd = ReminderSync.getDueReminder("NER-2024-081", "hydration");
console.log("Hydration reminder:", dueHyd.title, dueHyd.target, dueHyd.audioKey);
if (dueHyd.type !== "Hydration") throw new Error("Expected Hydration reminder type");

console.log("\nTesting ReminderSync.acknowledgeReminder...");
const prevLogCount = p.reminders.recentLogs.length;
ReminderSync.acknowledgeReminder("NER-2024-081", dueMed);
if (p.reminders.recentLogs.length !== prevLogCount + 1) throw new Error("Recent logs not incremented");
const latestLog = p.reminders.recentLogs[0];
console.log("Latest log entry:", latestLog);
if (latestLog.status !== "acknowledged") throw new Error("Expected acknowledged status");
console.log("Updated medicine adherence %:", p.reminders.medicine);

console.log("\nTesting ReminderSync.logMissedReminder & Caregiver Alert simulation...");
global.__lastDispatchedEvent = null;
ReminderSync.logMissedReminder("NER-2024-081", dueMed);
const missedLog = p.reminders.recentLogs[0];
console.log("Latest log entry (missed):", missedLog);
if (missedLog.status !== "missed") throw new Error("Expected missed status");

const storedAlert = JSON.parse(global.localStorage.getItem("cdx_caregiver_alert_NER-2024-081"));
console.log("Stored caregiver alert in localStorage:", storedAlert);
if (!storedAlert || storedAlert.status !== "DISPATCHED_SMS") throw new Error("Caregiver SMS alert not stored properly");
if (!global.__lastDispatchedEvent || global.__lastDispatchedEvent.type !== "cdx:caregiver-alert") {
  throw new Error("CustomEvent cdx:caregiver-alert not fired");
}
console.log("Dispatched window event payload:", global.__lastDispatchedEvent.detail);

console.log("\nTesting GameAudio.STRINGS multi-lingual coverage for reminders...");
const keys = ["medicineReminder", "hydrationReminder", "activityReminder", "reminderAcknowledged"];
const langs = ["en-IN", "as-IN", "hi-IN", "bn-IN"];
keys.forEach(k => {
  langs.forEach(l => {
    if (!GameAudio.STRINGS[k][l]) throw new Error(`Missing audio string for ${k} in ${l}`);
  });
});
console.log("All multi-lingual reminder audio prompts verified in Assamese, Hindi, Bengali, English!");

console.log("\n ALL REMINDER & ADHERENCE UNIT TESTS PASSED SUCCESSFULLY! \n");
