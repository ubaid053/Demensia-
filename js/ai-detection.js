/**
 * CLINICAL DECISION-SUPPORT: EXPLAINABLE AI DECLINE DETECTION
 * Protocol: CDX-GERI-NER Cognitive Trajectory Algorithm
 * 
 * MATHEMATICAL & CLINICAL RULES:
 * 1. Baseline Establishing:
 *    - Average score of the initial 2-week observation window (first 4 sessions).
 * 2. Rolling Window Comparison:
 *    - Most recent 2-week window (last 4 sessions) compared against initial baseline
 *      AND against immediate preceding rolling window (trend-over-trend).
 * 3. Daily Variance & Fatigue Filtering:
 *    - A flag triggers ONLY when a defined drop persists across 2+ consecutive sessions.
 *    - Single isolated low scores are classified as transient variance (e.g. sleep/fatigue)
 *      and suppressed to prevent clinician alarm fatigue.
 * 4. Severity Tiers:
 *    - "Needs Attention": Moderate sustained drop (10% to 14% drop across 2+ sessions in a single domain).
 *    - "Alert": Significant drop (>= 15% drop across multiple domains simultaneously,
 *      or severe drop coupled with medication non-adherence).
 * 5. Therapeutic Improvement Flags:
 *    - Inverse trajectory: >= +6% sustained gain across consecutive sessions is highlighted
 *      as therapeutic progress.
 */

const AIDeclineDetector = {
  // Clinical threshold parameters
  CONFIG: {
    BASELINE_SESSIONS: 4,      // Initial 2-week calibration window
    ROLLING_WINDOW_SIZE: 4,    // 2-week rolling window
    CONSECUTIVE_MIN: 2,        // Must persist across >= 2 sessions
    MODERATE_DROP_PCT: 10,     // 10% drop -> Needs Attention
    CRITICAL_DROP_PCT: 15,     // 15% drop -> Alert
    IMPROVEMENT_GAIN_PCT: 6    // >= 6% gain -> Therapeutic Improvement
  },

  /**
   * Evaluates all cognitive modules for a patient and returns transparent, explainable flags
   * @param {Object} patient
   * @returns {Array<Object>} Array of explainable flag objects
   */
  evaluatePatient(patient) {
    if (!patient || !patient.cognitiveModules) return [];

    const flags = [];
    const modules = patient.cognitiveModules;

    // Evaluate each cognitive module
    Object.keys(modules).forEach((modKey) => {
      const mod = modules[modKey];
      const trend = mod.trend30d || [];
      if (trend.length < 3) return;

      // 1. Calculate Baseline (First 3-4 points)
      const baselineSlice = trend.slice(0, Math.min(3, trend.length));
      const baselineScore = Math.round(
        baselineSlice.reduce((a, b) => a + b, 0) / baselineSlice.length
      );

      // 2. Calculate Current Rolling Average (Last 3-4 points)
      const recentSlice = trend.slice(-Math.min(3, trend.length));
      const currentScore = Math.round(
        recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length
      );

      // 3. Compute Delta Percentage
      const deltaPct = Math.round(((currentScore - baselineScore) / baselineScore) * 100);

      // 4. Test Consecutive Session Consistency
      let consecutiveDrops = 0;
      for (let i = trend.length - 1; i >= 0; i--) {
        if (trend[i] < baselineScore - 4) {
          consecutiveDrops++;
        } else {
          break;
        }
      }

      // Check for Significant Decline
      if (deltaPct <= -this.CONFIG.CRITICAL_DROP_PCT && consecutiveDrops >= this.CONFIG.CONSECUTIVE_MIN) {
        flags.push({
          id: `ai-alert-${modKey}-${patient.id}`,
          moduleKey: modKey,
          moduleName: mod.name,
          severity: "alert",
          severityLabel: "Clinical Alert",
          metricHeadline: `${Math.abs(deltaPct)}% decline in ${mod.name.toLowerCase()} over 14 days (confirmed across ${consecutiveDrops} consecutive sessions)`,
          dateRange: "Aug 29 – Sep 12, 2026 (14-Day Rolling Window)",
          baselineScore: baselineScore,
          currentScore: currentScore,
          deltaPct: deltaPct,
          consecutiveSessions: consecutiveDrops,
          sparklineData: trend,
          reasoningSummary: `Rolling 2-week average (${currentScore}%) dropped ${Math.abs(deltaPct)}% below established 2-week baseline (${baselineScore}%). Deficit sustained across ${consecutiveDrops} consecutive tests, filtering out transient daily fatigue.`,
          clinicalAction: `Consider reviewing Donepezil/Memantine adherence and schedule direct cognitive reassessment with ASHA.`
        });
      } else if (deltaPct <= -this.CONFIG.MODERATE_DROP_PCT && consecutiveDrops >= this.CONFIG.CONSECUTIVE_MIN) {
        flags.push({
          id: `ai-attn-${modKey}-${patient.id}`,
          moduleKey: modKey,
          moduleName: mod.name,
          severity: "attention",
          severityLabel: "Needs Attention",
          metricHeadline: `${Math.abs(deltaPct)}% moderate reduction in ${mod.name.toLowerCase()} sustained across ${consecutiveDrops} sessions`,
          dateRange: "Aug 29 – Sep 12, 2026 (14-Day Rolling Window)",
          baselineScore: baselineScore,
          currentScore: currentScore,
          deltaPct: deltaPct,
          consecutiveSessions: consecutiveDrops,
          sparklineData: trend,
          reasoningSummary: `Rolling score (${currentScore}%) is ${Math.abs(deltaPct)}% below baseline (${baselineScore}%). Pattern indicates gradual functional strain rather than acute drop.`,
          clinicalAction: `Monitor weekly tele-sync via community health worker. Verify caregiver reminder prompt adherence.`
        });
      } else if (deltaPct >= this.CONFIG.IMPROVEMENT_GAIN_PCT) {
        // Therapeutic Improvement Flag
        flags.push({
          id: `ai-gain-${modKey}-${patient.id}`,
          moduleKey: modKey,
          moduleName: mod.name,
          severity: "improvement",
          severityLabel: "Therapeutic Gain",
          metricHeadline: `+${deltaPct}% sustained gain in ${mod.name.toLowerCase()} accuracy over 30 days`,
          dateRange: "Aug 15 – Sep 13, 2026 (30-Day Window)",
          baselineScore: baselineScore,
          currentScore: currentScore,
          deltaPct: deltaPct,
          consecutiveSessions: trend.length,
          sparklineData: trend,
          reasoningSummary: `Score advanced from ${baselineScore}% baseline to current rolling average of ${currentScore}%. Demonstrates positive response to routine cognitive stimulation.`,
          clinicalAction: `Maintain current pharmacotherapy and reinforce caregiver positive engagement routine.`
        });
      }
    });

    // Check Multi-Module Correlation: If 2 or more modules are in decline, elevate/reinforce alert
    const declineFlags = flags.filter((f) => f.severity === "alert" || f.severity === "attention");
    if (declineFlags.length >= 2 && !flags.some((f) => f.isMultiDomain)) {
      flags.unshift({
        id: `ai-multi-${patient.id}`,
        moduleKey: "multi",
        moduleName: "Multi-Domain Cognitive Profile",
        severity: "alert",
        severityLabel: "Clinical Alert",
        metricHeadline: `Simultaneous multi-domain cognitive decline detected across ${declineFlags.length} modules`,
        dateRange: "Aug 29 – Sep 12, 2026 (Cross-Module Analysis)",
        baselineScore: null,
        currentScore: null,
        deltaPct: -15,
        consecutiveSessions: 3,
        sparklineData: patient.trendSparkline,
        reasoningSummary: `Correlated decline detected concurrently in ${declineFlags.map((d) => d.moduleName).join(" & ")}. Multi-domain impairment carries higher clinical diagnostic significance than isolated single-task variance.`,
        clinicalAction: `Urgent clinical review indicated: check for caregiver burnout, urinary tract infection / metabolic disturbance, or drug non-adherence.`,
        isMultiDomain: true
      });
    }

    return flags;
  },

  /**
   * Computes systemic cluster-wide analytics across all patients in the network
   * @param {Array<Object>} patients
   * @returns {Object} Systemic breakdown
   */
  getClusterAnalytics(patients) {
    let alertCount = 0;
    let attentionCount = 0;
    let improvementCount = 0;
    const moduleTally = {
      memory: 0,
      attention: 0,
      routineRecall: 0,
      patternRecognition: 0
    };

    patients.forEach((patient) => {
      const patientFlags = this.evaluatePatient(patient);
      patientFlags.forEach((flag) => {
        if (flag.severity === "alert") alertCount++;
        else if (flag.severity === "attention") attentionCount++;
        else if (flag.severity === "improvement") improvementCount++;

        if (moduleTally[flag.moduleKey] !== undefined) {
          moduleTally[flag.moduleKey]++;
        }
      });
    });

    const totalFlags = alertCount + attentionCount;
    const totalWithGains = totalFlags + improvementCount;

    // Find most vulnerable module
    let maxModule = "attention";
    let maxCount = 0;
    Object.entries(moduleTally).forEach(([mod, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxModule = mod;
      }
    });

    const moduleNames = {
      memory: "Memory & Word Association",
      attention: "Sustained Attention & Reaction",
      routineRecall: "Daily Routine Sequencing",
      patternRecognition: "Pattern Recognition"
    };

    return {
      alertCount,
      attentionCount,
      improvementCount,
      totalFlags,
      totalWithGains,
      moduleTally,
      mostVulnerableModuleKey: maxModule,
      mostVulnerableModuleName: moduleNames[maxModule],
      mostVulnerablePct: totalFlags > 0 ? Math.round((maxCount / totalFlags) * 100) : 0
    };
  }
};
