const fs = require('fs');

// Check 1: portal mode switcher in files
const indexHtml = fs.readFileSync('index.html', 'utf8');
const gamesHtml = fs.readFileSync('games.html', 'utf8');

const hasSwitcherIndex = indexHtml.includes('PORTAL MODE SWITCHER') || indexHtml.includes('portal-switcher');
const hasSwitcherGames = gamesHtml.includes('PORTAL MODE SWITCHER') || gamesHtml.includes('portal-switcher');
console.log('Check 1 (Portal switcher removed):', { indexClean: !hasSwitcherIndex, gamesClean: !hasSwitcherGames });

// Check 2: Calendar in patient nav and views
const hasCalNav = gamesHtml.includes('id="nav-btn-calendar"');
const hasCalView = gamesHtml.includes('id="view-calendar"');
const hasCalGrid = gamesHtml.includes('id="calendar-days-grid"');
const hasDashboardBtn = gamesHtml.includes('id="btn-dashboard-view-calendar"');
console.log('Check 2 (Calendar in games.html):', { hasCalNav, hasCalView, hasCalGrid, hasDashboardBtn });

// Check 3: ReminderSync daily reset & activity logging
const { ReminderSync } = require('../js/games-data.js');

// Mock localStorage for node test
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

const pid = 'P-001';
// Set previous day
localStorage.setItem('cdx_reminder_date_' + pid, '2026-09-18');
localStorage.setItem('cdx_reminder_statuses_' + pid, JSON.stringify({
  'sched-med-1': { status: 'completed', timestamp: '2026-09-18 08:30' }
}));

const resetTriggered = ReminderSync.checkDailyReset(pid);
const statusesAfterReset = ReminderSync.getReminderStatuses(pid);
console.log('Check 3 (Daily Reset):', { resetTriggered, statusesCleared: Object.keys(statusesAfterReset).length === 0 });

// Check 4: Activity Calendar logging
ReminderSync.logPatientActivity(pid, {
  type: 'Medication',
  title: 'Donepezil 10mg',
  time: '08:30',
  details: 'Taken with water'
});
const todayStr = ReminderSync.getTodayDateStr();
const todayActs = ReminderSync.getActivitiesForDate(pid, todayStr);
console.log('Check 4 (Activity Logged & Queried):', { count: todayActs.length, firstTitle: todayActs[0]?.title });

// Check 5: Doctor dashboard roster toolbar enhancements
const hasDeptTag = indexHtml.includes('roster-dept-tag');
const hasPulseDot = indexHtml.includes('roster-dept-pulse');
const hasElevatedBtn = indexHtml.includes('btn-intake-elevated');
const hasIconBadges = indexHtml.includes('filter-category-icon-box') && indexHtml.includes('status-tint');
const hasLeadingIcons = indexHtml.includes('select-leading-icon');
console.log('Check 5 (Doctor Dashboard Roster Enhancements):', { hasDeptTag, hasPulseDot, hasElevatedBtn, hasIconBadges, hasLeadingIcons });
