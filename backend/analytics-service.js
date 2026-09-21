/**
 * Backend Analytics Service: CDX-GERI-NER
 * Manages patient-isolated game session telemetry, aggregations,
 * time-series bucketing, CSV export, and observational report generation.
 */

const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'data', 'analytics-store.json');

class AnalyticsService {
  constructor() {
    this._store = null;
    this._lastMtime = 0;
  }

  _loadStore() {
    try {
      if (!fs.existsSync(STORE_PATH)) {
        return { version: "2.0", patients: [], sessions: [], notes: [] };
      }
      const stats = fs.statSync(STORE_PATH);
      if (!this._store || stats.mtimeMs !== this._lastMtime) {
        const raw = fs.readFileSync(STORE_PATH, 'utf8');
        this._store = JSON.parse(raw);
        this._lastMtime = stats.mtimeMs;
      }
      return this._store;
    } catch (e) {
      console.error("Error reading analytics store:", e);
      return { version: "2.0", patients: [], sessions: [], notes: [] };
    }
  }

  _saveStore(store) {
    try {
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
      this._store = store;
      this._lastMtime = fs.statSync(STORE_PATH).mtimeMs;
    } catch (e) {
      console.error("Error saving analytics store:", e);
    }
  }

  /** Calculate Date Range window */
  _getDateRangeWindow(timeRange, customStart, customEnd) {
    // Simulated anchor: September 16, 2026 or real Date.now() if greater
    const baseNow = new Date("2026-09-16T23:59:59.999Z");
    const now = (Date.now() > baseNow.getTime()) ? new Date() : baseNow;

    let start = new Date(0);
    let end = new Date(now.getTime());
    let grouping = "daily";

    if (timeRange === "today") {
      start = new Date(now);
      start.setUTCHours(0, 0, 0, 0);
      grouping = "hourly";
    } else if (timeRange === "24h") {
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      grouping = "hourly";
    } else if (timeRange === "7d") {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      grouping = "daily";
    } else if (timeRange === "30d") {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      grouping = "daily";
    } else if (timeRange === "3m") {
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      grouping = "weekly";
    } else if (timeRange === "6m") {
      start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      grouping = "weekly";
    } else if (timeRange === "1y") {
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      grouping = "monthly";
    } else if (timeRange === "custom" && customStart) {
      start = new Date(customStart);
      if (customEnd) {
        end = new Date(customEnd);
        end.setUTCHours(23, 59, 59, 999);
      }
      const days = (end - start) / (24 * 3600 * 1000);
      grouping = days <= 2 ? "hourly" : (days <= 45 ? "daily" : (days <= 180 ? "weekly" : "monthly"));
    }

    return { start, end, grouping };
  }

  /**
   * Get filtered, isolated sessions for a patient
   */
  getSessions(query = {}) {
    const patientId = query.patientId;
    if (!patientId) {
      throw new Error("patientId is mandatory for data isolation.");
    }

    const timeRange = query.timeRange || query.range || "30d";
    const startDate = query.startDate || query.start;
    const endDate = query.endDate || query.end;
    const gameId = query.gameId;
    const status = query.status;
    const difficulty = query.difficulty;
    const sortBy = query.sortBy || "newest";
    const page = query.page || 1;
    const limit = query.limit || 100;

    const store = this._loadStore();
    const { start, end } = this._getDateRangeWindow(timeRange, startDate, endDate);

    let filtered = store.sessions.filter(s => {
      if (s.patientId !== patientId) return false;
      const completed = new Date(s.completedAt);
      if (completed < start || completed > end) return false;
      if (gameId && gameId !== "all" && s.gameId !== gameId && s.category !== gameId) return false;
      if (status && status !== "all" && s.completionStatus !== status) return false;
      if (difficulty && difficulty !== "all" && !s.difficulty.toLowerCase().includes(difficulty.toLowerCase())) return false;
      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === "oldest") return a.completedAt.localeCompare(b.completedAt);
      if (sortBy === "accuracy_high") return b.accuracyPercentage - a.accuracyPercentage;
      if (sortBy === "accuracy_low") return a.accuracyPercentage - b.accuracyPercentage;
      if (sortBy === "duration_long") return b.durationSeconds - a.durationSeconds;
      if (sortBy === "duration_short") return a.durationSeconds - b.durationSeconds;
      // Default: newest
      return b.completedAt.localeCompare(a.completedAt);
    });

    const categoryDisplayMap = {
      memory: "Memory",
      executive: "Executive Function",
      attention: "Attention",
      pattern: "Pattern Recognition",
      reminiscence: "Reminiscence"
    };

    const total = filtered.length;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, Math.min(200, parseInt(limit, 10) || 100));
    const pages = Math.ceil(total / l) || 1;
    const startIndex = (p - 1) * l;
    const paginated = filtered.slice(startIndex, startIndex + l);

    const normalized = paginated.map(s => ({
      ...s,
      sessionId: s.sessionId || s.id,
      startTime: s.startTime || s.startedAt,
      completionTime: s.completionTime || s.completedAt,
      durationSeconds: s.durationSeconds || 120,
      attempted: s.attempted !== undefined ? s.attempted : (s.attemptedCount || 1),
      correct: s.correct !== undefined ? s.correct : (s.correctCount || 0),
      incorrect: s.incorrect !== undefined ? s.incorrect : (s.incorrectCount || 0),
      accuracy: s.accuracy !== undefined ? s.accuracy : (s.accuracyPercentage || 0),
      hints: s.hints !== undefined ? s.hints : (s.hintCount || 0),
      attempts: s.attempts !== undefined ? s.attempts : (s.attemptCount || 1),
      responseTime: s.responseTime !== undefined ? s.responseTime : (s.responseTimeSec || 2.4),
      category: categoryDisplayMap[s.category] || s.category || "General Cognition"
    }));

    return {
      patientId,
      total,
      page: p,
      limit: l,
      pages,
      sessions: normalized
    };
  }

  /**
   * Record a new session (with idempotency and duplicate prevention)
   */
  recordSession(payload) {
    if (!payload.patientId) throw new Error("patientId is required.");
    if (!payload.gameName && !payload.gameId) throw new Error("gameName or gameId is required.");

    const store = this._loadStore();
    const nowIso = new Date().toISOString();

    const startedAt = payload.startedAt || payload.startTime || new Date(Date.now() - (payload.durationSeconds || 120) * 1000).toISOString();
    const completedAt = payload.completedAt || payload.completionTime || nowIso;

    // Idempotency: prevent duplicate submissions within 5 seconds for same patient and game
    const duplicate = store.sessions.find(s => 
      s.patientId === payload.patientId &&
      (s.gameId === payload.gameId || s.gameName === payload.gameName) &&
      Math.abs(new Date(s.completedAt).getTime() - new Date(completedAt).getTime()) < 5000
    );

    if (duplicate) {
      console.log(`Duplicate session prevented for patient ${payload.patientId} on ${payload.gameName}`);
      return { ...duplicate, duplicatePrevented: true };
    }

    const durationSeconds = Math.max(1, parseInt(payload.durationSeconds, 10) || 120);
    const attemptedCount = Math.max(1, parseInt(payload.attemptedCount || payload.attempted, 10) || 1);
    const correctCount = Math.max(0, parseInt(payload.correctCount || payload.correct, 10) || 0);
    const incorrectCount = Math.max(0, parseInt(payload.incorrectCount || payload.incorrect, 10) || (attemptedCount - correctCount));
    const accuracy = typeof payload.accuracyPercentage === "number" 
      ? Math.max(0, Math.min(100, Math.round(payload.accuracyPercentage)))
      : (typeof payload.accuracy === "number"
        ? Math.max(0, Math.min(100, Math.round(payload.accuracy)))
        : Math.round((correctCount / attemptedCount) * 100));

    const newSession = {
      id: payload.id || payload.sessionId || `sess-${payload.patientId.replace(/[^0-9]/g, '')}-${Date.now()}`,
      patientId: payload.patientId,
      patientName: payload.patientName || "Patient",
      gameId: payload.gameId || "game",
      gameName: payload.gameName || "Cognitive Activity",
      category: payload.category || "memory",
      startedAt,
      completedAt,
      durationSeconds,
      attemptedCount,
      correctCount,
      incorrectCount,
      accuracyPercentage: accuracy,
      hintCount: parseInt(payload.hintCount || payload.hints, 10) || 0,
      attemptCount: parseInt(payload.attemptCount || payload.attempts, 10) || attemptedCount,
      responseTimeSec: payload.responseTimeSec ? +parseFloat(payload.responseTimeSec).toFixed(1) : (payload.responseTime ? +parseFloat(payload.responseTime).toFixed(1) : 2.4),
      completionStatus: payload.completionStatus || "completed",
      difficulty: payload.difficulty || "Tier 1 (Mild)",
      score: null, // Observational tool
      moodBefore: payload.moodBefore || null,
      moodAfter: payload.moodAfter || null,
      deviceType: payload.deviceType || "tablet",
      notes: payload.notes || null,
      createdAt: nowIso
    };

    store.sessions.unshift(newSession);
    this._saveStore(store);
    return newSession;
  }

  /**
   * Get aggregate summary statistics, time series, and observational narrative
   */
  getSummary(query = {}) {
    const patientId = query.patientId;
    if (!patientId) throw new Error("patientId is required.");

    const timeRange = query.timeRange || query.range || "30d";
    const startDate = query.startDate || query.start;
    const endDate = query.endDate || query.end;

    const store = this._loadStore();
    const { start, end, grouping } = this._getDateRangeWindow(timeRange, startDate, endDate);

    const filtered = store.sessions.filter(s => {
      if (s.patientId !== patientId) return false;
      const d = new Date(s.completedAt);
      return d >= start && d <= end;
    });

    const totalSessions = filtered.length;
    const completedSessions = filtered.filter(s => s.completionStatus === "completed").length;
    const partialSessions = filtered.filter(s => s.completionStatus === "partially_completed").length;
    const abandonedSessions = filtered.filter(s => s.completionStatus === "abandoned").length;
    const skippedSessions = filtered.filter(s => s.completionStatus === "skipped").length;

    const totalDurationSec = filtered.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    const avgDurationSec = totalSessions > 0 ? Math.round(totalDurationSec / totalSessions) : 0;

    const avgAccuracy = totalSessions > 0 
      ? Math.round(filtered.reduce((acc, s) => acc + (s.accuracyPercentage || 0), 0) / totalSessions)
      : 0;

    const totalCorrect = filtered.reduce((acc, s) => acc + (s.correctCount || 0), 0);
    const totalIncorrect = filtered.reduce((acc, s) => acc + (s.incorrectCount || 0), 0);

    // Most frequently played game
    const gameCounts = {};
    filtered.forEach(s => {
      gameCounts[s.gameName] = (gameCounts[s.gameName] || 0) + 1;
    });
    let mostPlayedGame = "None";
    let maxCount = 0;
    Object.entries(gameCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostPlayedGame = name;
      }
    });

    const categoryDisplayMap = {
      memory: "Memory",
      executive: "Executive Function",
      attention: "Attention",
      pattern: "Pattern Recognition",
      reminiscence: "Reminiscence"
    };

    // Domain participation
    const formattedDomainCounts = {
      "Memory": 0,
      "Executive Function": 0,
      "Attention": 0,
      "Pattern Recognition": 0,
      "Reminiscence": 0
    };
    filtered.forEach(s => {
      const cat = categoryDisplayMap[s.category] || s.category || "Memory";
      if (formattedDomainCounts[cat] !== undefined) formattedDomainCounts[cat]++;
      else formattedDomainCounts["Memory"]++;
    });

    // Accuracy by game
    const gameStats = {};
    filtered.forEach(s => {
      if (!gameStats[s.gameName]) {
        gameStats[s.gameName] = { gameName: s.gameName, category: s.category, totalAcc: 0, count: 0, durations: 0 };
      }
      gameStats[s.gameName].totalAcc += (s.accuracyPercentage || 0);
      gameStats[s.gameName].durations += (s.durationSeconds || 0);
      gameStats[s.gameName].count++;
    });
    const accuracyByGame = Object.values(gameStats).map(g => ({
      gameName: g.gameName,
      category: categoryDisplayMap[g.category] || g.category || "Memory",
      sessionCount: g.count,
      avgAccuracy: Math.round(g.totalAcc / g.count),
      avgDurationSec: Math.round(g.durations / g.count)
    }));

    // Time-series bucketing
    const timeSeries = this._buildTimeSeriesBuckets(filtered, start, end, grouping);

    // Observational neutral narrative
    const narrative = this._generateObservationalNarrative({
      patientId,
      timeRange,
      totalSessions,
      completedSessions,
      avgAccuracy,
      mostPlayedGame,
      filtered
    });

    const latEntries = filtered.filter(s => typeof s.responseTimeSec === "number" && s.responseTimeSec > 0);
    const meanLatency = latEntries.length > 0 
      ? +(latEntries.reduce((a, s) => a + s.responseTimeSec, 0) / latEntries.length).toFixed(1) 
      : 2.4;

    return {
      patientId,
      timeRange,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      grouping,
      groupingLabel: grouping === "hourly" ? "Hour" : (grouping === "daily" ? "Day" : (grouping === "weekly" ? "Week" : "Month")),
      totalSessions,
      completedSessions,
      partiallyCompletedSessions: partialSessions,
      abandonedSessions,
      skippedSessions,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      totalDurationMinutes: +(totalDurationSec / 60).toFixed(1),
      avgDurationMinutes: +(avgDurationSec / 60).toFixed(1),
      avgDurationSec,
      avgAccuracy,
      meanAccuracy: avgAccuracy,
      accuracyCategory: avgAccuracy >= 75 ? "Target Range (Preserved)" : (avgAccuracy >= 55 ? "Moderate Range" : "Clinical Review Recommended"),
      meanResponseLatency: meanLatency,
      totalCorrect,
      totalIncorrect,
      mostPlayedGame,
      mostFrequentGame: mostPlayedGame,
      mostFrequentGameSessions: maxCount,
      activeDaysCount: new Set(filtered.map(s => s.completedAt.slice(0, 10))).size,
      recentActivity: filtered[0] ? filtered[0].completedAt : null,
      isDataSufficient: totalSessions >= 3,
      statusDistribution: {
        completed: completedSessions,
        partially_completed: partialSessions,
        abandoned: abandonedSessions,
        skipped: skippedSessions
      },
      completionStatusCounts: {
        completed: completedSessions,
        partially_completed: partialSessions,
        abandoned: abandonedSessions,
        skipped: skippedSessions
      },
      responseDistribution: {
        correct: totalCorrect,
        incorrect: totalIncorrect
      },
      domainCounts: formattedDomainCounts,
      domainParticipation: formattedDomainCounts,
      gameAccuracies: Object.values(gameStats).map(g => ({
        name: g.gameName,
        category: categoryDisplayMap[g.category] || g.category || "Memory",
        accuracy: Math.round(g.totalAcc / g.count),
        sessions: g.count
      })),
      accuracyByGame,
      timeSeries,
      frequencyData: timeSeries.map(t => ({
        label: t.label,
        count: t.sessionCount,
        completed: t.sessionCount,
        partial: 0
      })),
      trajectoryData: timeSeries.map(t => ({
        label: t.label,
        accuracy: t.avgAccuracy,
        sessionCount: t.sessionCount
      })),
      durationData: timeSeries.map(t => ({
        label: t.label,
        durationMins: +(t.avgDurationSec / 60).toFixed(1)
      })),
      latencyData: timeSeries.map(t => ({
        label: t.label,
        latencySecs: t.avgLatencySec || 2.4
      })),
      observationalNarrative: narrative
    };
  }

  _buildTimeSeriesBuckets(sessions, start, end, grouping) {
    const buckets = [];
    const stepMs = grouping === "hourly" ? 3600 * 1000 : (grouping === "daily" ? 24 * 3600 * 1000 : (grouping === "weekly" ? 7 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000));

    let cursor = new Date(start.getTime());
    while (cursor <= end) {
      const nextCursor = new Date(cursor.getTime() + stepMs);
      const inBucket = sessions.filter(s => {
        const d = new Date(s.completedAt);
        return d >= cursor && d < nextCursor;
      });

      let label = "";
      if (grouping === "hourly") {
        label = cursor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
      } else if (grouping === "daily") {
        label = cursor.toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: 'UTC' });
      } else if (grouping === "weekly") {
        label = `Wk ${cursor.toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: 'UTC' })}`;
      } else {
        label = cursor.toLocaleDateString([], { month: 'short', year: '2-digit', timeZone: 'UTC' });
      }

      const count = inBucket.length;
      const avgAcc = count > 0 ? Math.round(inBucket.reduce((a,b)=>a+(b.accuracyPercentage||0),0)/count) : 0;
      const avgDur = count > 0 ? Math.round(inBucket.reduce((a,b)=>a+(b.durationSeconds||0),0)/count) : 0;
      
      const latencyEntries = inBucket.filter(b => typeof b.responseTimeSec === "number" && b.responseTimeSec > 0);
      const avgLatency = latencyEntries.length > 0 
        ? +(latencyEntries.reduce((a,b)=>a+b.responseTimeSec,0)/latencyEntries.length).toFixed(1) 
        : null;

      buckets.push({
        label,
        timestamp: cursor.toISOString(),
        sessionCount: count,
        avgAccuracy: avgAcc,
        avgDurationSec: avgDur,
        avgLatencySec: avgLatency
      });

      cursor = nextCursor;
    }

    return buckets;
  }

  _generateObservationalNarrative({ patientId, timeRange, totalSessions, completedSessions, avgAccuracy, mostPlayedGame, filtered }) {
    if (totalSessions === 0) {
      return "No cognitive engagement sessions were recorded for this patient during the selected time period. Scheduled activities remain available on the patient tablet.";
    }

    if (totalSessions < 3) {
      return `During this period, ${totalSessions} activity session was recorded with an average accuracy of ${avgAccuracy}%. The sample size is currently limited; additional sessions will help establish stable longitudinal patterns for clinical review.`;
    }

    let trendComment = "Overall task accuracy remained consistent across sessions.";
    if (filtered.length >= 4) {
      const recent = filtered.slice(0, Math.floor(filtered.length / 2));
      const older = filtered.slice(Math.floor(filtered.length / 2));
      const recAcc = recent.reduce((a,b)=>a+b.accuracyPercentage,0) / recent.length;
      const oldAcc = older.reduce((a,b)=>a+b.accuracyPercentage,0) / older.length;
      const delta = Math.round(recAcc - oldAcc);

      if (delta >= 6) {
        trendComment = "Average accuracy was higher during the more recent sessions compared to earlier in this period.";
      } else if (delta <= -6) {
        trendComment = "Performance varied across sessions, with slightly lower task accuracy observed during recent days.";
      }
    }

    return `The patient completed ${completedSessions} of ${totalSessions} sessions during this evaluation window, maintaining an average task accuracy of ${avgAccuracy}%. ${mostPlayedGame} was the most frequently chosen activity. ${trendComment} These observational telemetry markers are provided to facilitate informed clinical discussions and do not constitute an automated medical diagnosis.`;
  }

  /**
   * Add a caregiver or doctor note
   */
  addNote(payload) {
    const patientId = payload.patientId;
    const note = payload.note || payload.noteText;
    if (!patientId || !note) throw new Error("patientId and note content are required.");
    const sessionId = payload.sessionId;
    const authorName = payload.authorName;
    const authorRole = payload.authorRole || "caregiver";

    const store = this._loadStore();
    const newNote = {
      id: `note-${patientId}-${Date.now()}`,
      patientId,
      sessionId: sessionId || null,
      authorName: authorName || (authorRole.toLowerCase().includes("doctor") || authorRole.toLowerCase().includes("clinician") ? "Attending Clinician" : "Family Caregiver"),
      authorRole,
      note,
      noteText: note,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    if (!store.notes) store.notes = [];
    store.notes.unshift(newNote);

    // If attached to session, also update session note
    if (sessionId) {
      const sess = store.sessions.find(s => s.id === sessionId || s.sessionId === sessionId);
      if (sess) sess.notes = note;
    }

    this._saveStore(store);
    return newNote;
  }

  getNotes(patientId, sessionId = null) {
    const store = this._loadStore();
    return (store.notes || []).filter(n => {
      if (sessionId) {
        return (n.sessionId === sessionId || n.id === sessionId) && (!patientId || n.patientId === patientId);
      }
      return n.patientId === patientId;
    }).map(n => ({
      ...n,
      noteText: n.noteText || n.note,
      timestamp: n.timestamp || n.createdAt
    }));
  }

  /**
   * Export RFC-4180 CSV
   */
  exportCSV({ patientId, timeRange = "all", startDate, endDate }) {
    const { sessions } = this.getSessions({
      patientId,
      timeRange,
      startDate,
      endDate,
      page: 1,
      limit: 10000,
      sortBy: "newest"
    });

    const headers = [
      "Session ID", "Patient ID", "Game Name", "Patient Name", "Completion Time (UTC)",
      "Category", "Status", "Difficulty", "Duration (Seconds)",
      "Tasks Attempted", "Tasks Correct", "Tasks Incorrect", "Accuracy (%)",
      "Hints Used", "Response Time (s)", "Mood Before", "Mood After", "Notes"
    ];

    const rows = sessions.map(s => [
      s.id,
      s.patientId,
      `"${(s.gameName || "").replace(/"/g, '""')}"`,
      `"${(s.patientName || "").replace(/"/g, '""')}"`,
      s.completedAt,
      s.category,
      s.completionStatus,
      `"${s.difficulty}"`,
      s.durationSeconds,
      s.attemptedCount,
      s.correctCount,
      s.incorrectCount,
      s.accuracyPercentage,
      s.hintCount,
      s.responseTimeSec !== null ? s.responseTimeSec : "N/A",
      s.moodBefore || "N/A",
      s.moodAfter || "N/A",
      `"${(s.notes || "").replace(/"/g, '""')}"`
    ]);

    return [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  }

  /**
   * Export Printable HTML/PDF Report
   */
  exportReportHtml({ patientId, timeRange = "30d", startDate, endDate, authorName = "Dr. Priyam Borah, MD", authorRole = "doctor" }) {
    const summary = this.getSummary({ patientId, timeRange, startDate, endDate });
    const { sessions } = this.getSessions({ patientId, timeRange, startDate, endDate, page: 1, limit: 100 });
    const notes = this.getNotes(patientId);

    const store = this._loadStore();
    const patientMeta = (store.patients || []).find(p => p.id === patientId) || { name: "Patient Record", district: "NER Region" };

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Clinical & Caregiver Cognitive Activity Report — ${patientId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1A2826; line-height: 1.5; padding: 32px; background: #fff; max-width: 900px; margin: 0 auto; }
    .header-bar { border-bottom: 2px solid #004741; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .inst-title { font-size: 1.25rem; font-weight: 700; color: #004741; }
    .inst-sub { font-size: 0.8125rem; color: #4B5A57; }
    .meta-pill { background: #EAF2ED; color: #2D7A58; border: 1px solid #BED9C8; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
    .stat-card { border: 1px solid #DDD8CB; padding: 12px; border-radius: 4px; background: #FAF8F5; }
    .stat-val { font-size: 1.5rem; font-weight: 700; color: #004741; margin-top: 4px; }
    .stat-label { font-size: 0.75rem; color: #70807D; text-transform: uppercase; }
    .narrative-box { background: #F0EDE4; border-left: 4px solid #004741; padding: 14px 18px; margin-bottom: 24px; font-size: 0.875rem; border-radius: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 0.8125rem; }
    th { background: #EBF2F1; color: #1A2826; text-align: left; padding: 8px 10px; border-bottom: 1px solid #DDD8CB; }
    td { padding: 8px 10px; border-bottom: 1px solid #EEE9DF; }
    .badge-comp { background: #EAF2ED; color: #2D7A58; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
    .badge-part { background: #FFFBE6; color: #D48806; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
    .badge-aban { background: #FFF2F0; color: #9E382B; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
    .disclaimer-box { background: #FAF8F5; border: 1px solid #DDD8CB; padding: 12px 16px; font-size: 0.75rem; color: #4B5A57; border-radius: 4px; margin-top: 32px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: flex-end; gap: 8px;">
    <button onclick="window.print()" style="background: #004741; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer;">Print / Save as PDF</button>
  </div>

  <div class="header-bar">
    <div>
      <div class="inst-title">GMCH Regional Memory Unit — NER Tele-Dementia Network</div>
      <div class="inst-sub">Clinical &amp; Caregiver Cognitive Activity Report · Longitudinal Observation</div>
      <div style="font-size: 0.875rem; margin-top: 8px;"><strong>Patient:</strong> ${patientMeta.name} (${patientId}) · District: ${patientMeta.district}</div>
    </div>
    <div style="text-align: right;">
      <span class="meta-pill">CONFIDENTIAL CLINICAL TELEMETRY</span>
      <div style="font-size: 0.75rem; color: #70807D; margin-top: 6px;">Generated: ${new Date().toLocaleDateString()} by ${authorName} (${authorRole})</div>
      <div style="font-size: 0.75rem; color: #70807D;">Window: ${timeRange.toUpperCase()}</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="stat-card">
      <div class="stat-label">Completed Sessions</div>
      <div class="stat-val">${summary.completedSessions} <span style="font-size: 0.875rem; color: #70807D;">/ ${summary.totalSessions}</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Average Accuracy</div>
      <div class="stat-val">${summary.avgAccuracy}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Session Duration</div>
      <div class="stat-val">${Math.round(summary.avgDurationSec / 60)}m ${summary.avgDurationSec % 60}s</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Most Frequent Domain</div>
      <div class="stat-val" style="font-size: 1.125rem;">${summary.mostPlayedGame}</div>
    </div>
  </div>

  <div class="narrative-box">
    <strong>Clinical Observation Narrative:</strong><br>
    ${summary.observationalNarrative}
  </div>

  <h3 style="font-size: 1rem; color: #004741; margin-bottom: 8px;">Domain Performance Breakdown</h3>
  <table>
    <thead>
      <tr>
        <th>Activity Name</th>
        <th>Sessions</th>
        <th>Average Accuracy</th>
        <th>Average Duration</th>
      </tr>
    </thead>
    <tbody>
      ${summary.accuracyByGame.map(g => `
        <tr>
          <td><strong>${g.gameName}</strong></td>
          <td>${g.sessionCount}</td>
          <td>${g.avgAccuracy}%</td>
          <td>${Math.round(g.avgDurationSec / 60)}m ${g.avgDurationSec % 60}s</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <h3 style="font-size: 1rem; color: #004741; margin-bottom: 8px;">Chronological Activity Sessions Log</h3>
  <table>
    <thead>
      <tr>
        <th>Date &amp; Time (UTC)</th>
        <th>Activity</th>
        <th>Status</th>
        <th>Duration</th>
        <th>Accuracy</th>
        <th>Response Time</th>
      </tr>
    </thead>
    <tbody>
      ${sessions.slice(0, 15).map(s => `
        <tr>
          <td>${s.completedAt.replace("T", " ").slice(0, 16)}</td>
          <td>${s.gameName}</td>
          <td><span class="${s.completionStatus === 'completed' ? 'badge-comp' : (s.completionStatus === 'abandoned' ? 'badge-aban' : 'badge-part')}">${s.completionStatus.replace('_', ' ')}</span></td>
          <td>${Math.round(s.durationSeconds / 60)}m ${s.durationSeconds % 60}s</td>
          <td>${s.accuracyPercentage}%</td>
          <td>${s.responseTimeSec ? s.responseTimeSec + 's' : '—'}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="disclaimer-box">
    <strong>Observational Disclaimer &amp; Non-Diagnostic Notice:</strong>
    This document contains assistive observational telemetry recorded from cognitive engagement exercises. It is not an automated diagnostic instrument, does not compute medical scores without clinical validation, and must be reviewed alongside comprehensive clinical evaluation by qualified medical personnel.
  </div>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      // Auto print if opened with print format
      if (window.location.search.includes('format=print')) {
        setTimeout(() => window.print(), 500);
      }
    });
  </script>
</body>
</html>`;
  }
}

module.exports = new AnalyticsService();
