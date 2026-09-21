const fs = require('fs');
const vm = require('vm');

global.window = {
  dispatchEvent: () => {},
  speechSynthesis: { speak: () => {}, cancel: () => {} }
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

const dataCode = fs.readFileSync('./js/data.js', 'utf8');
const gamesDataCode = fs.readFileSync('./js/games-data.js', 'utf8');

vm.runInThisContext(dataCode);
vm.runInThisContext(gamesDataCode);

console.log("=== Testing ReminderSync CRUD ===");
const pId = "NER-2024-081";

// 1. Initial reminders
const initialReminders = ReminderSync.getAllReminders(pId);
console.log("Initial reminder count:", initialReminders.length);
if (initialReminders.length === 0) throw new Error("Expected initial reminders from careSchedule");

// 2. Add custom reminder
const newRem = ReminderSync.addReminder(pId, {
  title: "Evening Calcium Tablet",
  type: "Medicine",
  time: "19:00",
  dosage: "500mg",
  instructions: "Take with warm water after dinner",
  status: "upcoming"
});
console.log("Added reminder ID:", newRem.id);

let allRem = ReminderSync.getAllReminders(pId);
console.log("Count after add:", allRem.length);
if (allRem.length !== initialReminders.length + 1) throw new Error("Reminder not added");

// 3. Update reminder
ReminderSync.updateReminder(pId, newRem.id, { dosage: "1000mg" });
const updated = ReminderSync.getAllReminders(pId).find(r => r.id === newRem.id);
if (updated.dosage !== "1000mg") throw new Error("Reminder update failed");
console.log("Updated reminder dosage:", updated.dosage);

// 4. Set status
ReminderSync.setReminderStatus(pId, newRem.id, "completed");
const statusCheck = ReminderSync.getAllReminders(pId).find(r => r.id === newRem.id);
if (statusCheck.status !== "completed") throw new Error("Reminder status update failed");
console.log("Updated reminder status:", statusCheck.status);

// 5. Delete reminder
ReminderSync.deleteReminder(pId, newRem.id);
allRem = ReminderSync.getAllReminders(pId);
if (allRem.some(r => r.id === newRem.id)) throw new Error("Reminder delete failed");
console.log("Count after delete:", allRem.length);

// 6. Test Mood Logging
console.log("\n=== Testing Mood Logging ===");
const moodEntry = ReminderSync.logMood(pId, { id: "happy", label: "Happy", emoji: "😊", note: "Feeling bright" });
console.log("Logged mood:", moodEntry);
const moodHistory = ReminderSync.getMoodHistory(pId);
console.log("Mood history length:", moodHistory.length);
if (moodHistory[0].mood !== "happy") throw new Error("Mood entry not retrieved");

// 7. Test Daily Question
console.log("\n=== Testing Daily Question ===");
const dq = ReminderSync.getDailyQuestion(pId);
console.log("Daily question prompt:", dq.prompt);
if (!dq.options || dq.options.length < 2) throw new Error("Daily question options missing");
const qLog = ReminderSync.logDailyQuestion(pId, dq.id, dq.options[0].text);
console.log("Daily question answered entry:", qLog);

// 8. Test SOS & Safe-Zone
console.log("\n=== Testing SOS Emergency & Safe Zone ===");
const sosAlert = ReminderSync.triggerSOS(pId, { notes: "Testing emergency help dispatch" });
console.log("SOS triggered ID:", sosAlert.id, "Urgency:", sosAlert.urgency);
const sosLogs = ReminderSync.getSOSLogs(pId);
if (sosLogs.length === 0) throw new Error("SOS log not saved");
console.log("SOS logs count:", sosLogs.length);

const safeZone = ReminderSync.getSafeZoneStatus(pId);
console.log("Safe Zone status:", safeZone.status, safeZone.badge);

console.log("\n ALL EXTENDED DATA LAYER TESTS PASSED SUCCESSFULLY! \n");
