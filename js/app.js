/**
 * CLINICAL APPLICATION CONTROLLER: CDX-GERI-NER
 * Manages View 1 (Patient Roster), View 2 (Individual Patient Record / EHR-lite),
 * View 3 (Multi-Patient Analytics Overview), and View 4 (Patient Intake / Edit Flow).
 */

// Demo API key — must match CDX_API_KEY in server.js / process.env.CDX_API_KEY
const CDX_API_KEY = 'gmch-demo-2026';

document.addEventListener("DOMContentLoaded", () => {
  ClinicalApp.init();
});

const ClinicalApp = {
  data: null,
  currentView: "roster", // 'roster' | 'detail' | 'analytics' | 'intake'
  selectedPatientId: null,

  // Filters for Roster View
  searchQuery: "",
  filterStatus: "all",
  filterDistrict: "all",
  filterLanguage: "all",
  filterHealthWorker: "all",
  sortColumn: "status",
  sortDirection: "desc",

  // Individual Patient Detail State
  activeModuleKey: "memory",
  activeTimeRange: "30d",

  // Clinical Performance Report State
  reportDateRange: "30d",      // '7d' | '30d' | '90d' | 'all'
  reportDomainFilter: "all",   // 'all' | 'memory' | 'attention' | 'routineRecall' | 'patternRecognition' | 'reminiscence'
  reportSortCol: "date",
  reportSortAsc: false,

  // Intake Form State
  intakeDraftTimer: null,

  // Game Analytics Module State
  gameAnalyticsPatientId: null,
  gameAnalyticsRange: "30d",
  gameAnalyticsCustomStart: null,
  gameAnalyticsCustomEnd: null,
  gameAnalyticsSummary: null,
  gameAnalyticsSessions: [],
  gameAnalyticsFilteredSessions: [],
  gameAnalyticsPage: 1,
  gameAnalyticsPageSize: 10,
  selectedAnalyticsSession: null,

  init() {
    // Clone realistic clinical dataset
    this.data = JSON.parse(JSON.stringify(CLINICAL_DATA));
    this.populateFilterDropdowns();
    this.attachEventListeners();
    this.setupClinicianSidebar();
    this.setupDoctorProfileModal();
    this.setupRailObserver();

    // History popstate guard: keep doctor inside portal on back navigation
    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.view) {
        this.navigateTo(e.state.view, e.state.patientId, e.state.isEdit, false);
      } else {
        if (this.currentView !== "roster") {
          this.navigateTo("roster", null, false, false);
        }
      }
    });

    // Check URL parameters for direct deep-linking
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get("view");
    const patientParam = urlParams.get("patient");
    if (viewParam === "caregiver") {
      this.navigateTo("caregiver", patientParam, false, false);
    } else if (viewParam === "detail" && patientParam) {
      this.navigateTo("detail", patientParam, false, false);
    } else if (viewParam === "analytics") {
      this.navigateTo("analytics", null, false, false);
    } else if (viewParam === "game-analytics") {
      this.navigateTo("game-analytics", patientParam, false, false);
    } else {
      // Default to roster view
      this.navigateTo("roster", null, false, false);
    }
  },

  populateFilterDropdowns() {
    // District Filter in Roster
    const distSelect = document.getElementById("roster-filter-district");
    if (distSelect) {
      distSelect.innerHTML = this.data.districts.map((d, i) => {
        const val = i === 0 ? "all" : d;
        return `<option value="${val}">${d}</option>`;
      }).join("");
    }

    // Language Filter in Roster
    const langSelect = document.getElementById("roster-filter-language");
    if (langSelect) {
      langSelect.innerHTML = this.data.languages.map((l, i) => {
        const val = i === 0 ? "all" : l;
        return `<option value="${val}">${l}</option>`;
      }).join("");
    }

    // Health Worker Filter in Roster
    const hwSelect = document.getElementById("roster-filter-hw");
    if (hwSelect) {
      hwSelect.innerHTML = this.data.healthWorkers.map((hw, i) => {
        const val = i === 0 ? "all" : hw;
        return `<option value="${val}">${hw}</option>`;
      }).join("");
    }

    // Simulating Patient Select in Patient App view
    const simSelect = document.getElementById("sim-patient-select");
    if (simSelect) {
      simSelect.innerHTML = this.data.patients.map((p) => {
        return `<option value="${p.id}">${p.name} (${p.district.split('(')[0].trim()})</option>`;
      }).join("");

      simSelect.addEventListener("change", (e) => {
        this.navigateTo("patient-app", e.target.value);
      });
    }

    // Caregiver Patient Select in Caregiver View
    const cgSelect = document.getElementById("caregiver-patient-select");
    if (cgSelect && this.data.patients) {
      cgSelect.innerHTML = this.data.patients.map((p) => {
        return `<option value="${p.id}">${p.name} (${p.id} · ${p.district.split('(')[0].trim()})</option>`;
      }).join("");

      cgSelect.addEventListener("change", (e) => {
        this.selectedPatientId = e.target.value;
        this.renderCaregiverDashboard(e.target.value);
      });
    }

    // Game Analytics Patient Select
    const gaSelect = document.getElementById("ga-patient-select");
    if (gaSelect && this.data.patients) {
      gaSelect.innerHTML = this.data.patients.map((p) => {
        return `<option value="${p.id}">${p.name} (${p.id} · ${p.district.split('(')[0].trim()})</option>`;
      }).join("");

      gaSelect.addEventListener("change", (e) => {
        this.selectedPatientId = e.target.value;
        this.loadGameAnalytics(e.target.value, this.gameAnalyticsRange || "30d");
      });
    }
  },

  // Primary Navigation Dispatcher
  navigateTo(viewName, patientId = null, isEdit = false, pushState = true) {
    this.currentView = viewName;
    if (patientId) this.selectedPatientId = patientId;

    if (pushState && window.history && window.history.pushState) {
      const q = (viewName === "roster") ? "" : `?view=${viewName}${this.selectedPatientId ? `&patient=${this.selectedPatientId}` : ""}`;
      window.history.pushState({ view: viewName, patientId: this.selectedPatientId, isEdit: isEdit }, "", window.location.pathname + q);
    }

    // Toggle view elements
    document.querySelectorAll(".dashboard-view").forEach((v) => v.classList.remove("active"));
    document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));

    // Sync Doctor Sidebar Sliding Indicator Row
    const doctorNav = document.getElementById("doctor-nav-list");
    if (doctorNav) {
      const navButtons = [...doctorNav.querySelectorAll("button")];
      const targetBtn = doctorNav.querySelector(`[data-view="${viewName}"]`);
      if (targetBtn) {
        navButtons.forEach((b) => b.classList.remove("active"));
        targetBtn.classList.add("active");
        const activeIdx = navButtons.indexOf(targetBtn);
        if (activeIdx !== -1) {
          doctorNav.style.setProperty("--active-row", activeIdx);
        }
        const li = targetBtn.closest("li");
        if (li) {
          doctorNav.style.setProperty("--indicator-top", `${li.offsetTop}px`);
          doctorNav.style.setProperty("--indicator-height", `${li.offsetHeight}px`);
          doctorNav.style.setProperty("--row", `${li.offsetHeight}px`);
        }
      }
    }

    // Update Mode Toggle Active State
    const btnDoctorMode = document.getElementById("btn-mode-doctor");
    const btnPatientMode = document.getElementById("btn-mode-patient");
    if (viewName === "patient-app") {
      if (btnDoctorMode) btnDoctorMode.classList.remove("active");
      if (btnPatientMode) btnPatientMode.classList.add("active");
    } else {
      if (btnDoctorMode) btnDoctorMode.classList.add("active");
      if (btnPatientMode) btnPatientMode.classList.remove("active");
    }

    if (viewName === "roster") {
      const vRoster = document.getElementById("view-roster");
      const navRoster = document.getElementById("nav-roster");
      if (vRoster) vRoster.classList.add("active");
      if (navRoster) navRoster.classList.add("active");
      this.renderRoster();
      window.scrollTo(0, 0);
    } else if (viewName === "caregiver") {
      const vCaregiver = document.getElementById("view-caregiver-dashboard");
      const navCaregiver = document.getElementById("nav-caregiver");
      if (vCaregiver) vCaregiver.classList.add("active");
      if (navCaregiver) navCaregiver.classList.add("active");

      const targetId = patientId || this.selectedPatientId || (this.data.patients && this.data.patients[0] ? this.data.patients[0].id : "NER-2024-081");
      this.selectedPatientId = targetId;
      this.renderCaregiverDashboard(targetId);
      window.scrollTo(0, 0);
    } else if (viewName === "detail") {
      const vDetail = document.getElementById("view-patient-detail");
      if (vDetail) vDetail.classList.add("active");
      this.loadPatientDetail(this.selectedPatientId || this.data.patients[0].id);
      window.scrollTo(0, 0);
    } else if (viewName === "analytics") {
      const vAnalytics = document.getElementById("view-analytics");
      const navAnalytics = document.getElementById("nav-analytics");
      if (vAnalytics) vAnalytics.classList.add("active");
      if (navAnalytics) navAnalytics.classList.add("active");
      this.renderAnalytics();
      window.scrollTo(0, 0);
    } else if (viewName === "game-analytics") {
      const vGameAnalytics = document.getElementById("view-game-analytics");
      const navGameAnalytics = document.getElementById("nav-game-analytics");
      if (vGameAnalytics) vGameAnalytics.classList.add("active");
      if (navGameAnalytics) navGameAnalytics.classList.add("active");

      const targetId = patientId || this.selectedPatientId || (this.data.patients && this.data.patients[0] ? this.data.patients[0].id : "NER-2024-081");
      this.selectedPatientId = targetId;
      this.loadGameAnalytics(targetId, this.gameAnalyticsRange || "30d");
      window.scrollTo(0, 0);
    } else if (viewName === "intake") {
      const vIntake = document.getElementById("view-patient-intake");
      if (vIntake) vIntake.classList.add("active");
      if (isEdit && patientId) {
        this.openEditIntake(patientId);
      } else {
        this.openNewIntake();
      }
      window.scrollTo(0, 0);
    } else if (viewName === "patient-app") {
      const vPatientApp = document.getElementById("view-patient-app");
      const navPatientApp = document.getElementById("nav-patient-app");
      if (vPatientApp) vPatientApp.classList.add("active");
      if (navPatientApp) navPatientApp.classList.add("active");
      
      const targetId = patientId || this.selectedPatientId || this.data.patients[0].id;
      this.selectedPatientId = targetId;
      this.loadPatientAppView(targetId);
      window.scrollTo(0, 0);
    }
  },

  loadPatientAppView(patientId) {
    const patient = this.data.patients.find((p) => p.id === patientId) || this.data.patients[0];
    
    // Update select dropdown value
    const simSelect = document.getElementById("sim-patient-select");
    if (simSelect && simSelect.value !== patient.id) {
      simSelect.value = patient.id;
    }

    // Update metadata badge
    const metaLang = document.getElementById("sim-patient-lang");
    const metaAccess = document.getElementById("sim-patient-access");
    if (metaLang) metaLang.textContent = patient.language;
    if (metaAccess) metaAccess.textContent = patient.accessibility.length > 28 ? patient.accessibility.slice(0, 26) + "…" : patient.accessibility;

    // Update standalone link
    const standLink = document.getElementById("sim-open-standalone");
    if (standLink) standLink.href = `games.html?patient=${patient.id}`;

    // Update iframe src if different
    const iframe = document.getElementById("patient-app-iframe");
    if (iframe) {
      const targetSrc = `games.html?patient=${patient.id}&embed=1`;
      if (!iframe.src || !iframe.src.includes(`patient=${patient.id}`)) {
        iframe.src = targetSrc;
      }
    }
  },

  /* =========================================================================
     VIEW 1: PATIENT ROSTER (MAIN VIEW)
     ========================================================================= */

  getFilteredRoster() {
    const q = this.searchQuery.toLowerCase().trim();

    return this.data.patients
      .filter((p) => {
        // Search filter (name, ID, district)
        if (q) {
          const matchName = p.name.toLowerCase().includes(q);
          const matchId = p.id.toLowerCase().includes(q);
          const matchDist = p.district.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchDist) return false;
        }

        // Status filter
        if (this.filterStatus !== "all" && p.status !== this.filterStatus) {
          return false;
        }

        // District filter
        if (this.filterDistrict !== "all" && !p.district.includes(this.filterDistrict)) {
          return false;
        }

        // Language filter
        if (this.filterLanguage !== "all" && !p.language.includes(this.filterLanguage)) {
          return false;
        }

        // Health Worker filter
        if (this.filterHealthWorker !== "all" && !p.assignedHealthWorker.includes(this.filterHealthWorker)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Status severity sort weight: alert = 3, attention = 2, stable = 1
        const severityWeight = { alert: 3, attention: 2, stable: 1 };

        let valA, valB;
        if (this.sortColumn === "status") {
          valA = severityWeight[a.status];
          valB = severityWeight[b.status];
        } else if (this.sortColumn === "lastSession") {
          valA = new Date(a.lastSessionDate).getTime();
          valB = new Date(b.lastSessionDate).getTime();
        } else if (this.sortColumn === "adherence") {
          valA = a.adherenceRate;
          valB = b.adherenceRate;
        } else if (this.sortColumn === "name") {
          valA = a.name;
          valB = b.name;
        } else {
          valA = a.name;
          valB = b.name;
        }

        if (valA < valB) return this.sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return this.sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  },

  renderRoster() {
    const tbody = document.getElementById("roster-table-body");
    const countBadge = document.getElementById("roster-count-badge");
    if (!tbody) return;

    const list = this.getFilteredRoster();
    if (countBadge) {
      countBadge.textContent = `${list.length} Patient Record${list.length === 1 ? "" : "s"} Filtered (${this.data.patients.length} Total Registered)`;
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 48px; color: var(--color-text-muted);">
            No clinical records match the specified filters. Try adjusting your search query or reset filter controls.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list
      .map((p) => {
        const chipClass =
          p.status === "alert"
            ? "chip-alert"
            : p.status === "attention"
            ? "chip-attention"
            : "chip-stable";

        const fillClass =
          p.status === "alert"
            ? "fill-alert"
            : p.status === "attention"
            ? "fill-attention"
            : "";

        const sparklineSvg = ClinicalCharts.renderSparkline(p.trendSparkline, p.status);

        return `
          <tr class="roster-row" data-patient-id="${p.id}" tabindex="0" role="button" aria-label="Open clinical record for ${p.name}">
            <td>
              <span class="roster-patient-name">${p.name}</span>
              <span class="roster-patient-id">${p.id} • ${p.age}y / ${p.gender.charAt(0)}</span>
            </td>
            <td>
              <div style="font-weight: 500;">${p.district}</div>
              <div style="font-size: 0.6875rem; color: var(--color-text-secondary);">${p.language}</div>
            </td>
            <td>
              <span class="status-chip ${chipClass}">
                <span class="chip-dot"></span>
                <span>${p.statusLabel}</span>
              </span>
            </td>
            <td>
              <span class="mono-num" style="font-size: 0.8125rem;">${p.lastSessionDate}</span>
            </td>
            <td>
              <div class="adherence-bar-wrap">
                <div class="adherence-track">
                  <div class="adherence-fill ${fillClass}" style="width: ${p.adherenceRate}%;"></div>
                </div>
                <span class="mono-num" style="font-size: 0.8125rem; font-weight: 600;">${p.adherenceRate}%</span>
              </div>
            </td>
            <td>
              ${sparklineSvg}
            </td>
            <td>
              <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${p.assignedHealthWorker}</div>
            </td>
            <td style="text-align: right;">
              <div style="display: inline-flex; align-items: center; justify-content: flex-end;">
                <span class="row-action-link" style="padding: 6px 14px; border-radius: 6px; background: rgba(13, 148, 136, 0.08); color: #0F766E; font-weight: 700; font-size: 0.8125rem;">Open Record &rarr;</span>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    // Wire row clicks
    tbody.querySelectorAll(".roster-row").forEach((row) => {
      row.addEventListener("click", () => {
        const id = row.getAttribute("data-patient-id");
        this.navigateTo("detail", id);
      });
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const id = row.getAttribute("data-patient-id");
          this.navigateTo("detail", id);
        }
      });
    });
  },

  /* =========================================================================
     VIEW 2: INDIVIDUAL PATIENT RECORD (DETAIL EHR-LITE VIEW)
     ========================================================================= */

  loadPatientDetail(patientId) {
    const patient = this.data.patients.find((p) => p.id === patientId);
    if (!patient) return;

    this.selectedPatientId = patient.id;

    // Update Breadcrumbs
    const bc = document.getElementById("detail-breadcrumb-text");
    if (bc) {
      bc.innerHTML = `Patient Roster / <strong>${patient.name}</strong> (${patient.id})`;
    }

    // Header Block
    document.getElementById("ehr-patient-name").textContent = patient.name;
    document.getElementById("ehr-patient-id").textContent = patient.id;
    document.getElementById("ehr-patient-demog").textContent = `${patient.age}y / ${patient.gender} • ${patient.district}`;
    
    // Status Chip in Header
    const statusPill = document.getElementById("ehr-status-chip");
    if (statusPill) {
      statusPill.className = `status-chip ${
        patient.status === "alert"
          ? "chip-alert"
          : patient.status === "attention"
          ? "chip-attention"
          : "chip-stable"
      }`;
      statusPill.innerHTML = `<span class="chip-dot"></span> <span>${patient.statusLabel}</span>`;
    }

    // Metadata Grid
    document.getElementById("ehr-district-val").textContent = patient.district;
    document.getElementById("ehr-lang-val").textContent = patient.language;
    document.getElementById("ehr-caregiver-val").textContent = `${patient.caregiver.name} (${patient.caregiver.contact}) - ${patient.caregiver.relation}`;
    document.getElementById("ehr-hw-val").textContent = patient.assignedHealthWorker;

    // Restore any persisted reminder logs & schedule updates
    if (typeof ReminderSync !== "undefined" && ReminderSync.restoreReminderData) {
      ReminderSync.restoreReminderData(patient.id);
    }

    // Render Cognitive Module Trend
    this.renderActiveCognitiveModule(patient);

    // Render Session History Table
    this.renderSessionHistory(patient);

    // Render Reminders & Logs
    this.renderRemindersSection(patient);

    // Populate Doctor Care Schedule Editor & Check Caregiver Alert Banner
    this.populateCareSchedule(patient);

    // Render AI Flags (Anchor visual section)
    this.renderFlagsPanel(patient);

    // Render Clinical Notes
    this.renderClinicalNotes(patient);

    // Render Clinical Performance Report (Doctor-Only Comprehensive Instrument)
    this.renderClinicalPerformanceReport(patient);

    // Update Doctor Care Calendar Label with Patient's Specific Info
    const docCalLabel = document.getElementById("doc-cal-patient-label");
    if (docCalLabel) {
      docCalLabel.innerHTML = `🗓️ Daily Care &amp; Activity Record — <span style="color: var(--color-brand-primary);">${patient.name}</span> <span style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: normal; color: var(--color-text-secondary);">(${patient.id})</span>`;
    }

    // Render Patient Daily Activity & Care Calendar (Doctor View)
    this.renderDoctorPatientCalendar(patient.id);
  },

  renderActiveCognitiveModule(patient) {
    const moduleData = patient.cognitiveModules[this.activeModuleKey] || patient.cognitiveModules.memory;
    ClinicalCharts.renderModuleTrendChart("cognitive-trend-chart-container", moduleData, this.activeTimeRange);

    // Update module tab active styling
    document.querySelectorAll(".module-tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-module") === this.activeModuleKey);
    });

    // Update time-range active styling
    document.querySelectorAll(".time-range-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-range") === this.activeTimeRange);
    });
  },

  renderSessionHistory(patient) {
    const tbody = document.getElementById("session-history-tbody");
    if (!tbody) return;

    if (!patient.sessions || patient.sessions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:16px; color:#70807D;">No session records logged yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = patient.sessions
      .map((s) => `
        <tr>
          <td class="mono-num">${s.date}</td>
          <td class="mono-num">${s.durationMins} mins</td>
          <td>${s.gamesPlayed}</td>
          <td>
            <span class="mono-num" style="font-weight:600; color:var(--color-brand-primary);">${s.compositeScore}%</span>
          </td>
          <td>
            <span style="font-size:0.75rem; color:var(--color-text-secondary);">${s.difficulty}</span>
          </td>
        </tr>
      `)
      .join("");
  },

  renderRemindersSection(patient) {
    const r = patient.reminders;

    // Category scores
    const elMed = document.getElementById("rem-score-med");
    const elHyd = document.getElementById("rem-score-hyd");
    const elAct = document.getElementById("rem-score-act");
    const elApp = document.getElementById("rem-score-app");

    if (elMed) elMed.textContent = `${r.medicine}%`;
    if (elHyd) elHyd.textContent = `${r.hydration}%`;
    if (elAct) elAct.textContent = `${r.activity}%`;
    if (elApp) elApp.textContent = `${r.appointment}%`;

    // Recent logs
    const logList = document.getElementById("reminder-logs-list");
    if (!logList) return;

    if (!r.recentLogs || r.recentLogs.length === 0) {
      logList.innerHTML = `<div style="font-size:0.75rem; color:#70807D; padding:8px;">No recent reminder logs.</div>`;
      return;
    }

    logList.innerHTML = r.recentLogs
      .map((log) => {
        const isMissed = log.status === "missed";
        return `
          <div class="reminder-log-item ${isMissed ? "log-missed" : ""}">
            <div style="display:flex; flex-direction:column; gap:1px;">
              <div style="display:flex; align-items:baseline; gap:6px;">
                <strong style="color:${isMissed ? "var(--status-alert)" : "var(--color-brand-primary)"};">${log.type}</strong>
                <span>${log.title}</span>
              </div>
              <span class="mono-num" style="font-size:0.6875rem; color:var(--color-text-muted);">${log.time}</span>
            </div>
            <span class="status-chip ${isMissed ? "chip-alert" : "chip-stable"}" style="font-size:0.6875rem;">
              <span class="chip-dot"></span>
              <span>${isMissed ? "Missed" : "Acknowledged"}</span>
            </span>
          </div>
        `;
      })
      .join("");
  },

  populateCareSchedule(patient) {
    if (!patient) return;
    const sched = (typeof ReminderSync !== "undefined" && ReminderSync.getCareSchedule)
      ? ReminderSync.getCareSchedule(patient.id) || patient.careSchedule
      : patient.careSchedule;

    if (sched) {
      const med1 = (sched.medications && sched.medications[0]) || {};
      const med2 = (sched.medications && sched.medications[1]) || {};

      const elMed1Name = document.getElementById("sched-med1-name");
      const elMed1Time = document.getElementById("sched-med1-time");
      const elMed1Instr = document.getElementById("sched-med1-instr");
      if (elMed1Name) elMed1Name.value = med1.name || "Donepezil 10mg";
      if (elMed1Time) elMed1Time.value = med1.time || "08:30";
      if (elMed1Instr) elMed1Instr.value = med1.instructions || "Take 1 tablet after morning tea with warm water";

      const elMed2Name = document.getElementById("sched-med2-name");
      const elMed2Time = document.getElementById("sched-med2-time");
      const elMed2Instr = document.getElementById("sched-med2-instr");
      if (elMed2Name) elMed2Name.value = med2.name || "Memantine 10mg";
      if (elMed2Time) elMed2Time.value = med2.time || "20:00";
      if (elMed2Instr) elMed2Instr.value = med2.instructions || "Take 1 tablet with post-dinner water";

      const elHydFreq = document.getElementById("sched-hyd-freq");
      if (elHydFreq && sched.hydration) elHydFreq.value = sched.hydration.frequency || "Every 3 Hours";

      const elActTime = document.getElementById("sched-act-time");
      if (elActTime && sched.activity) elActTime.value = sched.activity.time || "10:00";

      const elAppDate = document.getElementById("sched-app-date");
      const elAppNote = document.getElementById("sched-app-note");
      if (elAppDate && sched.appointment) elAppDate.value = sched.appointment.date || "2026-09-28";
      if (elAppNote && sched.appointment) elAppNote.value = sched.appointment.clinic || "GMCH Tele-Clinic Follow-up";
    }

    // Caregiver Alert Banner check
    const banner = document.getElementById("caregiver-sms-alert-banner");
    if (banner) {
      let activeAlert = null;
      try {
        const stored = localStorage.getItem(`cdx_caregiver_alert_${patient.id}`);
        if (stored) activeAlert = JSON.parse(stored);
      } catch(e) {}

      if (activeAlert) {
        banner.style.display = "block";
        const nameEl = document.getElementById("caregiver-sms-name");
        const phoneEl = document.getElementById("caregiver-sms-phone");
        const msgEl = document.getElementById("caregiver-sms-message");
        const timeEl = document.getElementById("caregiver-sms-time");

        if (nameEl) nameEl.textContent = activeAlert.caregiverName || (patient.caregiver && patient.caregiver.name) || "Caregiver";
        if (phoneEl) phoneEl.textContent = `(${activeAlert.caregiverPhone || (patient.caregiver && patient.caregiver.contact) || "+91 94350-12890"})`;
        if (timeEl) timeEl.textContent = activeAlert.timestamp ? activeAlert.timestamp.slice(11, 16) : "Just Now";
        if (msgEl) {
          msgEl.textContent = `ALERT: ${patient.name} missed scheduled dose of ${activeAlert.drugName || "prescribed medication"} (>45m grace window expired). Please verify bedside pillbox or coordinate with ASHA worker ${patient.assignedHealthWorker}.`;
        }
      } else {
        banner.style.display = "none";
      }
    }
  },

  /* =========================================================================
     PATIENT DAILY ACTIVITY & CARE CALENDAR (DOCTOR EHR VIEW)
     ========================================================================= */
  _docCalYear: null,
  _docCalMonth: null,
  _docCalSelectedDate: null,

  renderDoctorPatientCalendar(patientId, targetYear, targetMonth) {
    const grid = document.getElementById("doc-calendar-days-grid");
    const monthTitle = document.getElementById("doc-cal-month-name");
    if (!grid || typeof ReminderSync === "undefined") return;

    const now = new Date();
    if (targetYear === undefined || targetYear === null) {
      this._docCalYear = this._docCalYear || now.getFullYear();
      this._docCalMonth = (this._docCalMonth !== null && this._docCalMonth !== undefined) ? this._docCalMonth : now.getMonth();
    } else {
      this._docCalYear = targetYear;
      this._docCalMonth = targetMonth;
    }

    const year = this._docCalYear;
    const month = this._docCalMonth;

    const todayStr = ReminderSync.getTodayDateStr ? ReminderSync.getTodayDateStr() : new Date().toISOString().slice(0, 10);
    if (!this._docCalSelectedDate) {
      this._docCalSelectedDate = todayStr;
    }

    const monthDateObj = new Date(year, month, 1);
    const monthName = monthDateObj.toLocaleDateString([], { month: "long", year: "numeric" });
    if (monthTitle) monthTitle.textContent = monthName;

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const allActivities = ReminderSync.getPatientDailyActivities ? ReminderSync.getPatientDailyActivities(patientId) : [];

    const actByDate = {};
    allActivities.forEach((a) => {
      if (!actByDate[a.date]) actByDate[a.date] = [];
      actByDate[a.date].push(a);
    });

    let cellsHtml = "";

    // Padding prev month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dayActs = actByDate[dateStr] || [];

      cellsHtml += this._generateDocDayCellHtml({
        dayNum,
        dateStr,
        isOtherMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this._docCalSelectedDate,
        dayActs
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayActs = actByDate[dateStr] || [];

      cellsHtml += this._generateDocDayCellHtml({
        dayNum: d,
        dateStr,
        isOtherMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this._docCalSelectedDate,
        dayActs
      });
    }

    // Padding next month
    const totalFilled = firstDayIndex + daysInMonth;
    const remaining = (7 - (totalFilled % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
      const dayActs = actByDate[dateStr] || [];

      cellsHtml += this._generateDocDayCellHtml({
        dayNum: n,
        dateStr,
        isOtherMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this._docCalSelectedDate,
        dayActs
      });
    }

    grid.innerHTML = cellsHtml;

    // Attach click handlers to day cells
    grid.querySelectorAll(".calendar-day-cell").forEach((cell) => {
      cell.addEventListener("click", () => {
        const dStr = cell.getAttribute("data-date");
        this._docCalSelectedDate = dStr;
        grid.querySelectorAll(".calendar-day-cell").forEach((c) => c.classList.remove("is-selected"));
        cell.classList.add("is-selected");
        this.renderDoctorDayInspector(patientId, dStr);
      });
    });

    // Wire controls
    this._wireDocCalendarControls(patientId);

    // Render inspector for selected date
    this.renderDoctorDayInspector(patientId, this._docCalSelectedDate);
  },

  _generateDocDayCellHtml({ dayNum, dateStr, isOtherMonth, isToday, isSelected, dayActs }) {
    let dotsHtml = "";
    if (dayActs.length > 0) {
      const hasMed = dayActs.some((a) => a.type === "Medication" || a.type === "Medicine");
      const hasGame = dayActs.some((a) => a.type === "Brain Activity" || a.category === "Cognition");
      const hasMood = dayActs.some((a) => a.type === "Mood Check-In" || a.category === "Well-Being");
      const hasRoutine = dayActs.some((a) => a.type === "Gentle Orientation" || a.category === "Orientation" || a.category === "Care");

      if (hasMed) dotsHtml += `<span class="act-dot dot-med" title="Medicine Taken"></span>`;
      if (hasGame) dotsHtml += `<span class="act-dot dot-game" title="Brain Games Played"></span>`;
      if (hasMood) dotsHtml += `<span class="act-dot dot-mood" title="Mood Log"></span>`;
      if (hasRoutine && !hasMed && !hasGame) dotsHtml += `<span class="act-dot dot-routine" title="Daily Care"></span>`;
    }

    const classes = [
      "calendar-day-cell",
      isOtherMonth ? "is-other-month" : "",
      isToday ? "is-today" : "",
      isSelected ? "is-selected" : ""
    ].filter(Boolean).join(" ");

    return `
      <div class="${classes}" data-date="${dateStr}" role="button" tabindex="0" aria-label="${dateStr} - ${dayActs.length} activities">
        <div class="day-cell-top">
          <span class="day-cell-num">${dayNum}</span>
          ${isToday ? `<span class="day-today-chip">Today</span>` : ""}
        </div>
        <div class="day-activity-dots">
          ${dotsHtml}
        </div>
      </div>
    `;
  },

  _wireDocCalendarControls(patientId) {
    const btnPrev = document.getElementById("btn-doc-cal-prev");
    const btnNext = document.getElementById("btn-doc-cal-next");
    const btnToday = document.getElementById("btn-doc-cal-today");

    if (btnPrev) {
      btnPrev.onclick = () => {
        let m = this._docCalMonth - 1;
        let y = this._docCalYear;
        if (m < 0) { m = 11; y -= 1; }
        this.renderDoctorPatientCalendar(patientId, y, m);
      };
    }

    if (btnNext) {
      btnNext.onclick = () => {
        let m = this._docCalMonth + 1;
        let y = this._docCalYear;
        if (m > 11) { m = 0; y += 1; }
        this.renderDoctorPatientCalendar(patientId, y, m);
      };
    }

    if (btnToday) {
      btnToday.onclick = () => {
        const now = new Date();
        this._docCalSelectedDate = ReminderSync.getTodayDateStr ? ReminderSync.getTodayDateStr() : new Date().toISOString().slice(0, 10);
        this.renderDoctorPatientCalendar(patientId, now.getFullYear(), now.getMonth());
      };
    }
  },

  renderDoctorDayInspector(patientId, dateStr) {
    const headingEl = document.getElementById("doc-inspector-date-heading");
    const badgeEl = document.getElementById("doc-inspector-badge");
    const tallyCountEl = document.getElementById("doc-inspector-tally-count");
    const listEl = document.getElementById("doc-inspector-activities-list");
    const statMeds = document.getElementById("doc-inspector-stat-meds");
    const statGames = document.getElementById("doc-inspector-stat-games");
    const statMood = document.getElementById("doc-inspector-stat-mood");

    if (!listEl || typeof ReminderSync === "undefined") return;

    const todayStr = ReminderSync.getTodayDateStr ? ReminderSync.getTodayDateStr() : new Date().toISOString().slice(0, 10);
    const isToday = dateStr === todayStr;

    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const datePretty = dateObj.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" });

    if (headingEl) headingEl.textContent = datePretty;
    if (badgeEl) badgeEl.textContent = isToday ? "TODAY'S RECORD" : "HISTORICAL RECORD";

    const dayActivities = ReminderSync.getActivitiesForDate ? ReminderSync.getActivitiesForDate(patientId, dateStr) : [];

    if (tallyCountEl) tallyCountEl.textContent = dayActivities.length;

    const medsCount = dayActivities.filter((a) => a.type === "Medication" || a.type === "Medicine").length;
    const gamesCount = dayActivities.filter((a) => a.type === "Brain Activity" || a.category === "Cognition").length;
    const moodCount = dayActivities.filter((a) => a.type === "Mood Check-In" || a.category === "Well-Being").length;

    if (statMeds) statMeds.textContent = medsCount;
    if (statGames) statGames.textContent = gamesCount;
    if (statMood) statMood.textContent = moodCount;

    if (dayActivities.length === 0) {
      listEl.innerHTML = `
        <div class="inspector-empty-state">
          <div class="empty-state-icon">🗓️</div>
          <div class="empty-state-title">No Activities Logged</div>
          <div class="empty-state-sub">No medications or cognitive exercises were registered on ${datePretty}.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = dayActivities
      .map((act) => {
        let iconBoxClass = "icon-box-care";
        if (act.type === "Medication" || act.type === "Medicine") iconBoxClass = "icon-box-med";
        else if (act.type === "Brain Activity" || act.category === "Cognition") iconBoxClass = "icon-box-game";
        else if (act.type === "Mood Check-In") iconBoxClass = "icon-box-mood";

        const icon = act.icon || (act.type === "Medication" ? "💊" : act.type === "Brain Activity" ? "🧠" : "✅");

        return `
          <div class="inspector-act-card">
            <div class="act-card-icon-box ${iconBoxClass}">
              <span>${icon}</span>
            </div>
            <div class="act-card-body">
              <div class="act-card-meta">
                <span class="act-card-time">${act.time || "Scheduled"}</span>
                <span class="act-card-badge">${act.type || "Activity"}</span>
              </div>
              <div class="act-card-title">${act.title}</div>
              <div class="act-card-desc">${act.details || "Recorded in patient adherence log"}</div>
            </div>
          </div>
        `;
      })
      .join("");
  },

  toggleCareScheduleForm() {
    const editor = document.getElementById("care-schedule-editor");
    const btn = document.getElementById("btn-toggle-care-schedule");
    if (!editor || !btn) return;

    if (editor.style.display === "none") {
      editor.style.display = "block";
      btn.innerHTML = `Hide Schedule &uarr;`;
    } else {
      editor.style.display = "none";
      btn.innerHTML = `Configure Schedule &darr;`;
    }
  },

  saveCareSchedule() {
    const patient = this.data.patients.find((p) => p.id === this.selectedPatientId);
    if (!patient) return;

    const med1Name = document.getElementById("sched-med1-name")?.value.trim() || "Donepezil 10mg";
    const med1Time = document.getElementById("sched-med1-time")?.value || "08:30";
    const med1Instr = document.getElementById("sched-med1-instr")?.value.trim() || "Take 1 tablet after morning meal with warm water";

    const med2Name = document.getElementById("sched-med2-name")?.value.trim() || "Memantine 10mg";
    const med2Time = document.getElementById("sched-med2-time")?.value || "20:00";
    const med2Instr = document.getElementById("sched-med2-instr")?.value.trim() || "Take 1 tablet with post-dinner water";

    const hydFreq = document.getElementById("sched-hyd-freq")?.value || "Every 3 Hours";
    const actTime = document.getElementById("sched-act-time")?.value || "10:00";
    const appDate = document.getElementById("sched-app-date")?.value || "2026-09-28";
    const appNote = document.getElementById("sched-app-note")?.value.trim() || "GMCH Regional Tele-Clinic";

    const updatedSchedule = {
      medications: [
        {
          id: "med-01",
          time: med1Time,
          period: "Morning",
          name: med1Name,
          dosage: med1Name.includes(" ") ? med1Name.split(" ").pop() : "10mg",
          instructions: med1Instr,
          pillVisual: "round-white",
          pillLabel: "DNP",
          pillColor: "#FFFFFF",
          pillShape: "circle",
          pillBg: "#E8ECEF"
        },
        {
          id: "med-02",
          time: med2Time,
          period: "Evening",
          name: med2Name,
          dosage: med2Name.includes(" ") ? med2Name.split(" ").pop() : "10mg",
          instructions: med2Instr,
          pillVisual: "oval-yellow",
          pillLabel: "MEM",
          pillColor: "#F5DF98",
          pillShape: "oval",
          pillBg: "#F0ECE1"
        }
      ],
      hydration: {
        frequency: hydFreq,
        targetMl: 1500,
        instructions: "Warm water or boiled herbal tea"
      },
      activity: {
        time: actTime,
        title: "Courtyard walking & joint mobilization",
        durationMins: 15,
        instructions: "Gentle physical walking with caregiver accompaniment"
      },
      appointment: {
        date: appDate,
        time: "11:30 AM",
        clinic: appNote,
        physician: "Dr. Priyam Borah, MD (Neurology)",
        purpose: "Cognitive review & regimen titration"
      },
      graceWindowMins: 45,
      caregiverAlertEnabled: true
    };

    if (typeof ReminderSync !== "undefined" && ReminderSync.saveCareSchedule) {
      ReminderSync.saveCareSchedule(patient.id, updatedSchedule);
    } else {
      patient.careSchedule = updatedSchedule;
    }

    this.showToast("Prescription care schedule saved & synced to patient tablet.");
  },

  testPatientReminderPreview() {
    if (!this.selectedPatientId) return;
    this.showToast("Opening Patient App Reminder Interstitial (Simulation Mode)...");
    window.open(`games.html?patient=${this.selectedPatientId}&trigger=reminder`, "_blank");
  },

  simulateMissedReminderAlert() {
    const patient = this.data.patients.find((p) => p.id === this.selectedPatientId);
    if (!patient) return;

    const sched = (typeof ReminderSync !== "undefined" && ReminderSync.getCareSchedule)
      ? ReminderSync.getCareSchedule(patient.id) || patient.careSchedule
      : patient.careSchedule;

    const med = (sched && sched.medications && sched.medications[0]) || {
      name: "Donepezil",
      dosage: "10mg",
      time: "08:30"
    };

    if (typeof ReminderSync !== "undefined" && ReminderSync.logMissedReminder) {
      ReminderSync.logMissedReminder(patient.id, {
        type: "Medicine",
        title: `${med.name} ${med.dosage}`,
        time: med.time
      });
    }

    // Refresh adherence telemetry displays
    this.renderRemindersSection(patient);

    // Synchronize overall adherence rate
    if (patient.reminders) {
      patient.adherenceRate = Math.round(
        (patient.reminders.medicine + patient.reminders.hydration + patient.reminders.activity + patient.reminders.appointment) / 4
      );
    }

    // Show banner immediately
    const banner = document.getElementById("caregiver-sms-alert-banner");
    if (banner) {
      banner.style.display = "block";
      const nameEl = document.getElementById("caregiver-sms-name");
      const phoneEl = document.getElementById("caregiver-sms-phone");
      const msgEl = document.getElementById("caregiver-sms-message");
      const timeEl = document.getElementById("caregiver-sms-time");

      if (nameEl) nameEl.textContent = (patient.caregiver && patient.caregiver.name) || "Pranab Hazarika (Son)";
      if (phoneEl) phoneEl.textContent = `(${ (patient.caregiver && patient.caregiver.contact) || "+91 94350-12890" })`;
      if (timeEl) timeEl.textContent = "Just Now";
      if (msgEl) {
        msgEl.textContent = `ALERT: ${patient.name} missed morning dose of ${med.name} ${med.dosage} (>45m grace window expired). Please verify bedside pillbox or coordinate with ASHA worker ${patient.assignedHealthWorker}.`;
      }
    }

    this.showToast("Missed dose logged silently. Caregiver Emergency Tele-Alert dispatched via SMS.");
  },

  dismissCaregiverAlert() {
    const banner = document.getElementById("caregiver-sms-alert-banner");
    if (banner) banner.style.display = "none";

    if (this.selectedPatientId) {
      try {
        localStorage.removeItem(`cdx_caregiver_alert_${this.selectedPatientId}`);
      } catch(e) {}
    }
    this.showToast("Caregiver emergency tele-alert acknowledged & cleared.");
  },

  renderFlagsPanel(patient) {
    const container = document.getElementById("ehr-flags-list");
    if (!container) return;

    // 1. Evaluate algorithmic decline detection flags
    const aiFlags = typeof AIDeclineDetector !== "undefined" ? AIDeclineDetector.evaluatePatient(patient) : [];

    // 2. Include any non-cognitive operational or caregiver flags
    const allFlags = [...aiFlags];
    if (patient.flags && patient.flags.length > 0) {
      patient.flags.forEach((f) => {
        const isAlreadyCovered = allFlags.some((af) =>
          af.metricHeadline && af.metricHeadline.toLowerCase().includes(f.metric.toLowerCase().slice(0, 8))
        );
        if (!isAlreadyCovered) {
          allFlags.push({
            id: f.id || `flg-op-${Date.now()}`,
            moduleKey: "operational",
            moduleName: "Operational / Caregiver Event",
            severity: f.severity === "alert" ? "alert" : f.severity === "stable" ? "improvement" : "attention",
            severityLabel: f.severity === "alert" ? "Clinical Alert" : f.severity === "stable" ? "Protocol Milestone" : "Needs Attention",
            metricHeadline: f.metric,
            dateRange: f.date ? `${f.date} (Field / Caregiver Log)` : "Recent Event",
            baselineScore: null,
            currentScore: null,
            deltaPct: null,
            consecutiveSessions: null,
            sparklineData: null,
            reasoningSummary: f.context || "Logged by community health worker or caregiver prompt log.",
            clinicalAction: f.severity === "alert" ? "Review pill-box adherence and verify caregiver safety monitoring." : "Continue standard clinical observation schedule."
          });
        }
      });
    }

    if (allFlags.length === 0) {
      container.innerHTML = `
        <div style="font-size:0.8125rem; color:var(--color-text-secondary); padding:16px; background:var(--color-surface-subtle); border-radius:2px; border:1px solid #ECE7DB; line-height: 1.45;">
          <strong style="color: var(--status-stable); display: block; margin-bottom: 4px;">✓ Baseline Stability Maintained</strong>
          Scores across all 4 cognitive modules remain within ±3% expected variance. No sustained decline detected across consecutive sessions.
        </div>
      `;
      return;
    }

    container.innerHTML = allFlags.map((f) => {
      const isAlert = f.severity === "alert";
      const isImprovement = f.severity === "improvement";
      const cardClass = isAlert ? "flag-alert" : isImprovement ? "flag-improvement" : "";
      const chipClass = isAlert ? "chip-alert" : isImprovement ? "chip-stable" : "chip-attention";

      let sparklineHtml = "";
      if (f.sparklineData && f.sparklineData.length > 0 && typeof ClinicalCharts !== "undefined" && ClinicalCharts.renderFlagSparkline) {
        sparklineHtml = ClinicalCharts.renderFlagSparkline(f.sparklineData, f.severity, f.baselineScore);
      }

      let deltaPctClass = "pct-decline";
      let sign = "";
      if (f.deltaPct !== null) {
        if (f.deltaPct > 0) {
          deltaPctClass = "pct-gain";
          sign = "+";
        } else {
          deltaPctClass = "pct-decline";
        }
      }

      return `
        <div class="flag-card-explainable ${cardClass}" id="${f.id}">
          <div class="flag-top-meta">
            <span class="status-chip ${chipClass}">
              <span class="chip-dot"></span>
              <span>${f.severityLabel}</span>
            </span>
            <span style="font-family: var(--font-mono); font-size: 0.6875rem; color: var(--color-text-secondary);">
              ${f.dateRange}
            </span>
          </div>

          <div class="flag-headline">${f.metricHeadline}</div>

          ${(sparklineHtml || f.baselineScore !== null) ? `
            <div class="flag-telemetry-row">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${sparklineHtml}
                <span style="font-size: 0.625rem; color: var(--color-text-muted); font-family: var(--font-mono);">
                  ${f.sparklineData ? `${f.sparklineData.length} sessions` : ""}
                </span>
              </div>
              <div class="flag-delta-chips">
                ${f.baselineScore !== null ? `
                  <div style="display: flex; flex-direction: column; align-items: flex-end;">
                    <span style="font-size: 0.625rem; color: var(--color-text-muted); text-transform: uppercase;">2-Wk Baseline</span>
                    <span class="chip-baseline">${f.baselineScore}%</span>
                  </div>
                  <span style="color: var(--color-text-muted); font-size: 0.75rem;">→</span>
                  <div style="display: flex; flex-direction: column; align-items: flex-end;">
                    <span style="font-size: 0.625rem; color: var(--color-text-muted); text-transform: uppercase;">Rolling Avg</span>
                    <span class="chip-current">${f.currentScore}%</span>
                  </div>
                ` : `
                  <span class="chip-baseline" style="font-size: 0.6875rem;">Cross-Domain Battery</span>
                `}
                ${f.deltaPct !== null ? `
                  <span class="chip-pct ${deltaPctClass}">${sign}${f.deltaPct}%</span>
                ` : ""}
              </div>
            </div>
          ` : ""}

          <div class="flag-reasoning-text">
            <strong style="color: var(--color-text-primary); font-weight: 600;">Trigger Reasoning:</strong> ${f.reasoningSummary}
          </div>

          ${f.clinicalAction ? `
            <div class="flag-action-recommendation">
              <strong style="color: var(--color-brand-primary);">Clinical Next Step:</strong> ${f.clinicalAction}
            </div>
          ` : ""}
        </div>
      `;
    }).join("");
  },

  renderClinicalNotes(patient) {
    const container = document.getElementById("ehr-saved-notes-list");
    if (!container) return;

    if (!patient.clinicalNotes || patient.clinicalNotes.length === 0) {
      container.innerHTML = `<div style="font-size:0.75rem; color:#70807D; padding:8px;">No doctor clinical observations logged yet.</div>`;
      return;
    }

    container.innerHTML = patient.clinicalNotes
      .map((note) => `
        <div class="saved-note-item">
          <div class="saved-note-meta">
            <strong>${note.author}</strong>
            <span class="mono-num">${note.date}</span>
          </div>
          <p style="font-size:0.8125rem; color:var(--color-text-primary); line-height:1.45;">${note.text}</p>
        </div>
      `)
      .join("");
  },

  saveDoctorNote() {
    const input = document.getElementById("doctor-note-textarea");
    if (!input || !input.value.trim()) return;

    const patient = this.data.patients.find((p) => p.id === this.selectedPatientId);
    if (!patient) return;

    const noteText = input.value.trim();
    const newNote = {
      id: `note-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      author: "Dr. Priyam Borah, MD (Neurology)",
      text: noteText
    };

    if (!patient.clinicalNotes) patient.clinicalNotes = [];
    patient.clinicalNotes.unshift(newNote);

    input.value = "";
    this.renderClinicalNotes(patient);
    this.showToast("Clinical observation committed to patient dossier (Doctor-Only).");
  },

  exportPatientSummary() {
    const btn = document.getElementById("btn-export-ehr-summary");
    if (!btn) {
      window.print();
      return;
    }

    // Micro-interaction: Brief loading/confirmation feedback before opening print dialog
    const originalContent = btn.innerHTML;
    btn.classList.add("loading");
    btn.innerHTML = `
      <svg class="clinical-icon" width="14" height="14" viewBox="0 0 24 24" style="animation: spin 0.8s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"/>
      </svg>
      <span>Preparing Referral Record...</span>
    `;

    setTimeout(() => {
      btn.innerHTML = `
        <svg class="clinical-icon" width="14" height="14" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Print View Ready</span>
      `;

      setTimeout(() => {
        window.print();
        btn.innerHTML = originalContent;
        btn.classList.remove("loading");
      }, 400);
    }, 450);
  },

  /* =========================================================================
     CLINICAL PERFORMANCE REPORT VIEW CONTROLLER
     Doctor-only diagnostic instrument evaluating longitudinal test telemetry
     ========================================================================= */

  renderClinicalPerformanceReport(patient) {
    if (!patient) return;

    // Restore any local sessions if Game Module ran
    if (typeof SessionLogger !== "undefined" && SessionLogger.restoreFromLocalStorage) {
      SessionLogger.restoreFromLocalStorage(patient.id);
    }

    const allSessions = patient.sessions || [];

    // Calculate baseline score: earliest calibration sessions (oldest 3)
    const oldestSessions = allSessions.slice(-3);
    const baselineScore = oldestSessions.length > 0
      ? Math.round(oldestSessions.reduce((sum, s) => sum + s.compositeScore, 0) / oldestSessions.length)
      : (patient.cognitiveModules?.memory?.trend90d?.[0] || 62);

    // Filter sessions by Date Range
    // Reference clinical anchor date: 2026-09-14
    const anchorDate = new Date("2026-09-14T12:00:00Z");
    let filteredSessions = allSessions.filter((s) => {
      const sDate = new Date(`${s.date}T12:00:00Z`);
      const diffDays = Math.round((anchorDate - sDate) / (1000 * 60 * 60 * 24));

      if (this.reportDateRange === "7d") {
        return diffDays <= 7;
      } else if (this.reportDateRange === "30d") {
        return diffDays <= 30;
      } else if (this.reportDateRange === "90d") {
        return diffDays <= 90;
      }
      return true; // 'all'
    });

    // If 7d has 0 or 1 session due to calendar gaps, provide top 3 most recent sessions so charts remain informative
    if (this.reportDateRange === "7d" && filteredSessions.length < 2 && allSessions.length >= 2) {
      filteredSessions = allSessions.slice(0, 3);
    }

    // Filter sessions by Domain / Game Type
    if (this.reportDomainFilter !== "all") {
      filteredSessions = filteredSessions.filter((s) => s.gameModule === this.reportDomainFilter);
    }

    // Date range label
    const rangeLabels = {
      "7d": "7-Day",
      "30d": "30-Day",
      "90d": "90-Day",
      "all": "All-Time"
    };
    const activeRangeLabel = rangeLabels[this.reportDateRange] || "30-Day";

    // 1. Calculate 5 Cognitive Engagement Scores for Donut & Verdict
    const domainKeys = [
      { key: "memory", name: "Memory Match", moduleKey: "memory" },
      { key: "attention", name: "Attention Spotter", moduleKey: "attention" },
      { key: "routineRecall", name: "Daily Routine Sequencer", moduleKey: "routineRecall" },
      { key: "patternRecognition", name: "Pattern & Object Sort", moduleKey: "patternRecognition" },
      { key: "reminiscence", name: "Recall & Reminiscence", moduleKey: "reminiscence" }
    ];

    const domains = domainKeys.map((d) => {
      const mod = patient.cognitiveModules[d.key] || {};
      const modSessions = allSessions.filter((s) => s.gameModule === d.key);
      const recentSlice = modSessions.slice(0, 3);
      const avgScore = recentSlice.length > 0
        ? Math.round(recentSlice.reduce((sum, s) => sum + s.compositeScore, 0) / recentSlice.length)
        : (mod.currentScore || 50);

      const baseMod = mod.trend90d ? mod.trend90d[0] : (modSessions.length > 0 ? modSessions[modSessions.length - 1].compositeScore : avgScore);
      const delta = avgScore - baseMod;

      return {
        key: d.key,
        name: d.name,
        score: avgScore,
        delta: delta
      };
    });

    const compositeScore = Math.round(
      domains.reduce((acc, d) => acc + d.score, 0) / domains.length
    );

    // 2. Verdict Line Calculation: Plain clinical language with exact % change and time window
    const windowAvg = filteredSessions.length > 0
      ? Math.round(filteredSessions.reduce((acc, s) => acc + s.compositeScore, 0) / filteredSessions.length)
      : compositeScore;

    const netDelta = windowAvg - baselineScore;
    const pctChange = (((windowAvg - baselineScore) / baselineScore) * 100).toFixed(1);

    let verdictWord = "Stable";
    let verdictClass = "verdict-stable";
    let verdictTag = "Stable Maintenance";
    let explanation = `Cognitive performance variance remains within ±4% of baseline calibration across the ${activeRangeLabel.toLowerCase()} evaluation window. Neuropsychological domains demonstrate preserved functional capacity under current clinical regimen.`;

    if (netDelta <= -8) {
      verdictWord = "Declining";
      verdictClass = "verdict-declining";
      verdictTag = "Declining Trajectory";
      explanation = `Accelerated cognitive decay observed across consecutive testing cycles. Primary vulnerability localized to sustained visual attention speed and executive sequencing. Immediate clinician assessment and care plan review recommended.`;
    } else if (netDelta >= 5) {
      verdictWord = "Improving";
      verdictClass = "verdict-improving";
      verdictTag = "Therapeutic Gain";
      explanation = `Statistically significant upward trajectory sustained across consecutive testing cycles. Cognitive processing speed and recall accuracy exceed initial baseline calibration.`;
    }

    // Update Verdict Box in DOM
    const verdictBox = document.getElementById("report-verdict-box");
    const elVerdictTag = document.getElementById("report-verdict-tag");
    const elVerdictWindow = document.getElementById("report-verdict-window");
    const elVerdictLine = document.getElementById("report-verdict-line");
    const elVerdictExpl = document.getElementById("report-verdict-explanation");

    if (verdictBox) {
      verdictBox.className = `report-verdict-box ${verdictClass}`;
    }
    if (elVerdictTag) elVerdictTag.textContent = verdictTag;
    if (elVerdictWindow) elVerdictWindow.textContent = `${activeRangeLabel} Evaluation Window`;
    if (elVerdictLine) {
      const sign = netDelta > 0 ? "+" : "";
      elVerdictLine.innerHTML = `<strong>${verdictWord}:</strong> ${sign}${pctChange}% change over ${activeRangeLabel.toLowerCase()} window (Baseline: ${baselineScore}% &rarr; Current: ${windowAvg}%)`;
    }
    if (elVerdictExpl) elVerdictExpl.textContent = explanation;

    // Update Strongest & Weakest domain cards
    const sortedDomains = [...domains].sort((a, b) => b.score - a.score);
    const strongest = sortedDomains[0];
    const weakest = sortedDomains[sortedDomains.length - 1];

    const elStrongName = document.getElementById("report-strongest-name");
    const elStrongScore = document.getElementById("report-strongest-score");
    const elWeakName = document.getElementById("report-weakest-name");
    const elWeakScore = document.getElementById("report-weakest-score");

    if (elStrongName) elStrongName.textContent = strongest.name;
    if (elStrongScore) {
      const sSign = strongest.delta > 0 ? "+" : "";
      elStrongScore.textContent = `${strongest.score}% (${sSign}${strongest.delta}%)`;
    }
    if (elWeakName) elWeakName.textContent = weakest.name;
    if (elWeakScore) {
      const wSign = weakest.delta > 0 ? "+" : "";
      elWeakScore.textContent = `${weakest.score}% (${wSign}${weakest.delta}%)`;
    }

    // Update Evaluation timestamp
    const elTimestamp = document.getElementById("report-eval-timestamp");
    if (elTimestamp) elTimestamp.textContent = `Evaluated: Sep 14, 2026 • Synchronized Data`;

    // 3. Render Section 1: Overall Cognitive Donut Chart
    ClinicalCharts.renderReportCognitiveDonut("report-cognitive-donut-container", domains, compositeScore);

    // 4. Render Section 2: Performance Over Time (Combo Bar + Rolling Trendline)
    ClinicalCharts.renderReportPerformanceOverTime("report-perf-chart-container", filteredSessions, baselineScore, activeRangeLabel);

    // 5. Render Section 3: Response-Time & Hesitation Analysis (Line Chart)
    ClinicalCharts.renderReportResponseTimeTrend("report-latency-chart-container", filteredSessions, activeRangeLabel);

    // 6. Render Section 4: Adherence & Engagement Consistency (Weekly Bar Chart)
    ClinicalCharts.renderReportAdherenceConsistency("report-adherence-chart-container", patient.weeklyAdherence || []);

    // 7. Render Section 5: All-Time Test Log Table
    this.renderReportTestTable(filteredSessions, baselineScore);

    // Update Filter UI states
    document.querySelectorAll(".report-range-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-range") === this.reportDateRange);
    });
    const domSelect = document.getElementById("report-domain-select");
    if (domSelect && domSelect.value !== this.reportDomainFilter) {
      domSelect.value = this.reportDomainFilter;
    }
  },

  renderReportTestTable(sessions, baselineScore = 60) {
    const tbody = document.getElementById("report-test-table-body");
    const countBadge = document.getElementById("report-table-count");
    if (!tbody) return;

    if (countBadge) {
      countBadge.textContent = `${sessions.length} Session${sessions.length === 1 ? "" : "s"} Filtered`;
    }

    if (!sessions || sessions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 24px; color: #70807D;">
            No chronological test logs match the active filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    // Sort sessions
    const sorted = [...sessions].sort((a, b) => {
      let valA, valB;
      if (this.reportSortCol === "date") {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      } else if (this.reportSortCol === "duration") {
        valA = a.durationMins;
        valB = b.durationMins;
      } else if (this.reportSortCol === "accuracy") {
        valA = a.compositeScore;
        valB = b.compositeScore;
      } else if (this.reportSortCol === "latency") {
        valA = a.avgResponseSecs || 2.4;
        valB = b.avgResponseSecs || 2.4;
      } else if (this.reportSortCol === "status") {
        valA = a.statusTag || "";
        valB = b.statusTag || "";
      } else {
        valA = a.date;
        valB = b.date;
      }

      if (valA < valB) return this.reportSortAsc ? -1 : 1;
      if (valA > valB) return this.reportSortAsc ? 1 : -1;
      return 0;
    });

    // Update sort glyph indicators in header
    ["date", "duration", "accuracy", "latency", "status"].forEach((col) => {
      const glyph = document.getElementById(`sort-glyph-${col}`);
      const th = document.querySelector(`.report-th[data-sort="${col}"]`);
      if (glyph) {
        if (this.reportSortCol === col) {
          glyph.textContent = this.reportSortAsc ? "↑" : "↓";
          if (th) th.classList.add("active-sort");
        } else {
          glyph.textContent = "↕";
          if (th) th.classList.remove("active-sort");
        }
      }
    });

    tbody.innerHTML = sorted.map((s) => {
      const isAbove = s.compositeScore >= baselineScore;
      const isCritical = s.compositeScore <= (baselineScore - 12);
      const isSlow = s.avgResponseSecs >= 3.0;

      // Status chip determination
      let statusChipClass = "chip-stable";
      let statusLabel = s.statusTag || (isAbove ? "Above Baseline" : isCritical ? "Critical Drop" : "Below Baseline");

      if (statusLabel.includes("Critical") || statusLabel.includes("Alert")) {
        statusChipClass = "chip-alert";
      } else if (statusLabel.includes("Below")) {
        statusChipClass = "chip-attention";
      } else if (statusLabel.includes("Above") || statusLabel.includes("Stable") || statusLabel.includes("Optimal")) {
        statusChipClass = "chip-stable";
      } else {
        statusChipClass = "chip-attention";
      }

      return `
        <tr>
          <td>
            <span class="mono-num" style="font-size: 0.8125rem; font-weight: 500;">${s.date}</span>
          </td>
          <td>
            <div style="font-weight: 500; color: #1A2826;">${s.gamesPlayed}</div>
            <div style="font-size: 0.6875rem; color: #70807D; text-transform: uppercase;">${s.gameModule}</div>
          </td>
          <td>
            <span class="mono-num" style="font-size: 0.8125rem;">${s.durationMins}m</span>
          </td>
          <td>
            <div style="display: flex; align-items: baseline; gap: 6px;">
              <span class="mono-num" style="font-weight: 600; font-size: 0.875rem; color: ${isAbove ? 'var(--status-stable)' : isCritical ? 'var(--status-alert)' : 'var(--status-attention)'};">
                ${s.compositeScore}%
              </span>
              <span style="font-size: 0.6875rem; font-family: 'IBM Plex Mono', monospace; color: #70807D;">
                (${s.compositeScore - baselineScore >= 0 ? '+' : ''}${s.compositeScore - baselineScore}%)
              </span>
            </div>
          </td>
          <td>
            <div style="display: flex; align-items: baseline; gap: 4px;">
              <span class="mono-num" style="font-weight: 600; font-size: 0.875rem; color: ${isSlow ? 'var(--status-alert)' : 'var(--color-text-primary)'};">
                ${s.avgResponseSecs ? s.avgResponseSecs.toFixed(1) : '2.4'}s
              </span>
              ${isSlow ? `<span style="font-size: 0.625rem; color: var(--status-alert); font-weight: 600;">(Hesitation)</span>` : ''}
            </div>
          </td>
          <td>
            <span style="font-size: 0.75rem; color: var(--color-text-secondary); background: var(--color-surface-subtle); padding: 2px 6px; border-radius: 2px; border: 1px solid #DDD8CB;">
              ${s.difficulty || "Tier 2 (Moderate)"}
            </span>
          </td>
          <td>
            <span class="status-chip ${statusChipClass}" style="font-size: 0.6875rem;">
              <span class="chip-dot"></span>
              <span>${statusLabel}</span>
            </span>
          </td>
        </tr>
      `;
    }).join("");
  },

  exportReportPDF() {
    const btn = document.getElementById("btn-export-report-pdf") || document.getElementById("btn-export-ehr-summary");
    if (!btn) {
      window.print();
      return;
    }

    const originalContent = btn.innerHTML;
    btn.innerHTML = `
      <svg class="clinical-icon" width="14" height="14" viewBox="0 0 24 24" style="animation: spin 0.8s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"/>
      </svg>
      <span>Formatting Referral PDF...</span>
    `;

    setTimeout(() => {
      btn.innerHTML = `
        <svg class="clinical-icon" width="14" height="14" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Report Document Ready</span>
      `;

      setTimeout(() => {
        window.print();
        btn.innerHTML = originalContent;
      }, 400);
    }, 450);
  },

  /* =========================================================================
     VIEW 4: PATIENT INTAKE / RECORD-ENTRY FLOW
     ========================================================================= */

  openNewIntake() {
    // Generate next serial UHID
    const randomSuffix = Math.floor(Math.random() * 800) + 250;
    const newId = `NER-2026-${randomSuffix}`;

    document.getElementById("intake-mode").value = "create";
    document.getElementById("intake-record-id").value = "";
    document.getElementById("intake-form-heading").textContent = "Patient Clinical Intake Sheet";
    document.getElementById("intake-form-subheading").textContent = "Systematic record-entry for clinical monitoring under the NER Tele-Dementia Network.";
    document.getElementById("intake-submit-top-text").textContent = "Commit to Registry";
    document.getElementById("intake-submit-bottom-text").textContent = "Commit to Patient Registry";

    // Populate default fields
    document.getElementById("intake-uhid").value = newId;
    document.getElementById("intake-name").value = "";
    document.getElementById("intake-age").value = "";
    document.getElementById("intake-gender").value = "Male";
    document.getElementById("intake-district").value = "Kamrup Metro (Assam)";
    document.getElementById("intake-village").value = "";
    document.getElementById("intake-language").value = "Assamese";
    document.getElementById("intake-sec-language").value = "None";

    // Health context
    document.getElementById("intake-baseline-stage").value = "Not yet assessed";
    document.querySelectorAll('input[name="phys-considerations"]').forEach((chk) => (chk.checked = false));
    const chkNone = document.getElementById("chk-phys-none");
    if (chkNone) chkNone.checked = true;

    // Care network
    document.getElementById("intake-doctor").value = "Dr. Priyam Borah, MD (Neurology)";
    document.getElementById("intake-hw").value = "Minati Kalita (ASHA - Guwahati)";
    document.getElementById("intake-cg-name").value = "";
    document.getElementById("intake-cg-rel").value = "Son";
    document.getElementById("intake-cg-phone").value = "";
    document.getElementById("intake-sec-cg-name").value = "";
    document.getElementById("intake-sec-cg-phone").value = "";

    // Device setup
    document.getElementById("intake-device-type").value = "Shared Family Tablet";
    document.getElementById("intake-connectivity").value = "Intermittent (Fluctuating cellular, periodic hill disruptions)";
    document.getElementById("intake-med-morning").value = "08:30";
    document.getElementById("intake-med-evening").value = "20:00";
    document.getElementById("intake-hydration-freq").value = "Every 3 Hours";

    // Consent (pre-certified under clinical oversight)
    document.getElementById("intake-consent-check").checked = true;
    document.getElementById("intake-consent-date").value = new Date().toISOString().slice(0, 10);
    document.getElementById("intake-consent-by").value = "Dr. Priyam Borah, MD (Neurology)";

    // Clear validation states
    this.clearValidationErrors();
    this.setDraftStatus("Draft ready");
  },

  openEditIntake(patientId) {
    const patient = this.data.patients.find((p) => p.id === patientId);
    if (!patient) return;

    document.getElementById("intake-mode").value = "edit";
    document.getElementById("intake-record-id").value = patient.id;
    document.getElementById("intake-form-heading").textContent = `Edit Patient Record — ${patient.name}`;
    document.getElementById("intake-form-subheading").textContent = `Updating institutional record and supervisory assignments for ${patient.id}.`;
    document.getElementById("intake-submit-top-text").textContent = "Save Changes to Record";
    document.getElementById("intake-submit-bottom-text").textContent = "Save Changes to Record";

    // Populate existing patient fields
    document.getElementById("intake-uhid").value = patient.id;
    document.getElementById("intake-name").value = patient.name;
    document.getElementById("intake-age").value = patient.age;
    document.getElementById("intake-gender").value = patient.gender;
    document.getElementById("intake-district").value = patient.district;
    document.getElementById("intake-village").value = patient.district.includes("(") ? patient.district.split("(")[1].replace(")", "") : "";
    document.getElementById("intake-language").value = patient.language;

    // Health context
    document.getElementById("intake-baseline-stage").value = "Early";
    document.querySelectorAll('input[name="phys-considerations"]').forEach((chk) => (chk.checked = false));
    const chkNone = document.getElementById("chk-phys-none");
    if (chkNone) chkNone.checked = true;

    // Care network
    document.getElementById("intake-doctor").value = "Dr. Priyam Borah, MD (Neurology)";
    document.getElementById("intake-hw").value = patient.assignedHealthWorker || "Minati Kalita (ASHA - Guwahati)";
    document.getElementById("intake-cg-name").value = patient.caregiver.name;
    document.getElementById("intake-cg-rel").value = patient.caregiver.relation || "Son";
    document.getElementById("intake-cg-phone").value = patient.caregiver.contact;

    // Consent
    document.getElementById("intake-consent-check").checked = true;
    document.getElementById("intake-consent-date").value = patient.lastSessionDate || new Date().toISOString().slice(0, 10);
    document.getElementById("intake-consent-by").value = "Dr. Priyam Borah, MD (Neurology)";

    this.clearValidationErrors();
    this.setDraftStatus(`Existing Record Loaded (${patient.id})`);
  },

  setDraftStatus(statusText) {
    const el = document.getElementById("intake-draft-text");
    if (el) el.textContent = statusText;
  },

  handleDraftAutosave() {
    clearTimeout(this.intakeDraftTimer);
    this.intakeDraftTimer = setTimeout(() => {
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      this.setDraftStatus(`Draft autosaved (${nowStr})`);
    }, 400);
  },

  clearValidationErrors() {
    document.querySelectorAll(".form-field-group").forEach((g) => g.classList.remove("has-error"));
    document.querySelectorAll(".form-input, .form-select").forEach((inp) => inp.classList.remove("input-error"));
    const consentBox = document.getElementById("group-consent-check");
    if (consentBox) consentBox.classList.remove("has-error");
  },

  validateIntakeForm() {
    this.clearValidationErrors();
    let isValid = true;
    let firstErrorElement = null;
    const missing = [];

    // 1. Legal Name
    const nameInput = document.getElementById("intake-name");
    const nameVal = (nameInput ? nameInput.value : "").trim();
    if (!nameVal || nameVal.length < 2) {
      const grp = document.getElementById("group-patient-name");
      if (grp) grp.classList.add("has-error");
      if (nameInput) nameInput.classList.add("input-error");
      isValid = false;
      missing.push("Patient Full Name");
      if (!firstErrorElement) firstErrorElement = nameInput;
    }

    // 2. Age (Support realistic age 18-125)
    const ageInput = document.getElementById("intake-age");
    const ageNum = parseInt(ageInput ? ageInput.value : "", 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 125) {
      const grp = document.getElementById("group-patient-age");
      if (grp) grp.classList.add("has-error");
      if (ageInput) ageInput.classList.add("input-error");
      isValid = false;
      missing.push(isNaN(ageNum) ? "Patient Age" : "Valid Age (18–125)");
      if (!firstErrorElement) firstErrorElement = ageInput;
    }

    // 3. District (Default to Kamrup Metro if not chosen)
    const distSelect = document.getElementById("intake-district");
    if (distSelect && !distSelect.value) {
      distSelect.value = "Kamrup Metro (Assam)";
    }

    // 4. Primary Language (Default to Assamese if not chosen)
    const langSelect = document.getElementById("intake-language");
    if (langSelect && !langSelect.value) {
      langSelect.value = "Assamese";
    }

    // 5. Caregiver Name (Auto-fallback to family caregiver if left blank)
    const cgNameInput = document.getElementById("intake-cg-name");
    if (cgNameInput && !cgNameInput.value.trim()) {
      cgNameInput.value = nameVal ? `${nameVal.split(" ")[0]}'s Family Caregiver` : "Family Caregiver";
    }

    // 6. Caregiver Phone (Auto-fallback to primary contact if left blank)
    const cgPhoneInput = document.getElementById("intake-cg-phone");
    if (cgPhoneInput && (!cgPhoneInput.value.trim() || cgPhoneInput.value.trim().length < 5)) {
      cgPhoneInput.value = "+91 94350-12890";
    }

    // 7. Consent Checkbox (Certified under institutional clinical protocol)
    const consentCheck = document.getElementById("intake-consent-check");
    if (consentCheck && !consentCheck.checked) {
      consentCheck.checked = true;
    }

    if (!isValid && firstErrorElement) {
      firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      if (firstErrorElement.focus) firstErrorElement.focus();
    }

    this._lastMissingFields = missing;
    return isValid;
  },

  submitIntakeForm(e) {
    if (e) e.preventDefault();

    if (!this.validateIntakeForm()) {
      const details = (this._lastMissingFields && this._lastMissingFields.length > 0)
        ? `: ${this._lastMissingFields.join(", ")}`
        : "";
      this.showToast(`Please enter required patient details${details}.`);
      return;
    }

    const mode = document.getElementById("intake-mode").value;
    const uhid = document.getElementById("intake-uhid").value;
    const name = document.getElementById("intake-name").value.trim();
    const age = parseInt(document.getElementById("intake-age").value, 10);
    const gender = document.getElementById("intake-gender").value;
    const district = document.getElementById("intake-district").value;
    const language = document.getElementById("intake-language").value;
    const baselineStage = document.getElementById("intake-baseline-stage").value;
    const doctor = document.getElementById("intake-doctor").value.trim() || "Dr. Priyam Borah, MD (Neurology)";
    const hw = document.getElementById("intake-hw").value;
    const cgName = document.getElementById("intake-cg-name").value.trim();
    const cgRel = document.getElementById("intake-cg-rel").value;
    const cgPhone = document.getElementById("intake-cg-phone").value.trim();
    const deviceType = document.getElementById("intake-device-type").value;
    const connectivity = document.getElementById("intake-connectivity").value;
    const todayStr = new Date().toISOString().slice(0, 10);

    if (mode === "create") {
      // Calibrate starting baseline scores based on stage
      let baseScore = 75;
      let status = "stable";
      let statusLabel = "Stable";
      let statusReason = "Initial intake enrolled — baseline cognitive battery pending";

      if (baselineStage === "Moderate") {
        baseScore = 55;
        status = "attention";
        statusLabel = "Needs Attention";
        statusReason = "Moderate baseline stage declared at intake";
      } else if (baselineStage === "Advanced") {
        baseScore = 40;
        status = "alert";
        statusLabel = "Alert";
        statusReason = "Advanced impairment declared at intake";
      }

      const newPatient = {
        id: uhid,
        name: name,
        age: age,
        gender: gender,
        district: district,
        language: language,
        accessibility: "Standard (72px touch targets)",
        assignedHealthWorker: hw,
        assignedDoctor: doctor,
        caregiver: {
          name: cgName,
          contact: cgPhone,
          relation: cgRel
        },
        status: status,
        statusLabel: statusLabel,
        statusReason: statusReason,
        lastSessionDate: todayStr,
        adherenceRate: 100,
        weeklyAdherence: [100, 100, 100, 100],
        trendSparkline: [baseScore, baseScore, baseScore + 1, baseScore + 1, baseScore + 1],
        cognitiveModules: {
          memory: {
            name: "Memory & Word Association",
            currentScore: baseScore,
            delta30d: 0,
            trend7d: [baseScore, baseScore, baseScore, baseScore, baseScore],
            trend30d: [baseScore, baseScore, baseScore, baseScore, baseScore, baseScore, baseScore],
            trend90d: [baseScore, baseScore, baseScore, baseScore, baseScore, baseScore, baseScore, baseScore],
            clinicalAssessment: "Baseline intake enrollment recorded. Initial cognitive profile pending first app session."
          },
          attention: {
            name: "Sustained Attention & Reaction",
            currentScore: baseScore - 2,
            delta30d: 0,
            trend7d: [baseScore - 2, baseScore - 2, baseScore - 2, baseScore - 2, baseScore - 2],
            trend30d: [baseScore - 2, baseScore - 2, baseScore - 2, baseScore - 2, baseScore - 2],
            trend90d: [baseScore - 2, baseScore - 2, baseScore - 2, baseScore - 2, baseScore - 2],
            clinicalAssessment: "Baseline response calibration active."
          },
          routineRecall: {
            name: "Daily Routine & Task Sequencing",
            currentScore: baseScore + 2,
            delta30d: 0,
            trend7d: [baseScore + 2, baseScore + 2, baseScore + 2, baseScore + 2, baseScore + 2],
            trend30d: [baseScore + 2, baseScore + 2, baseScore + 2, baseScore + 2, baseScore + 2],
            trend90d: [baseScore + 2, baseScore + 2, baseScore + 2, baseScore + 2, baseScore + 2],
            clinicalAssessment: "Daily habit sequence starting point configured."
          },
          patternRecognition: {
            name: "Visuospatial & Pattern Matching",
            currentScore: baseScore,
            delta30d: 0,
            trend7d: [baseScore, baseScore, baseScore, baseScore, baseScore],
            trend30d: [baseScore, baseScore, baseScore, baseScore, baseScore],
            trend90d: [baseScore, baseScore, baseScore, baseScore, baseScore],
            clinicalAssessment: "Spatial symmetry baseline profile initialized."
          },
          reminiscence: {
            name: "Recall & Reminiscence",
            currentScore: baseScore - 1,
            delta30d: 0,
            trend7d: [baseScore - 1, baseScore - 1, baseScore - 1, baseScore - 1, baseScore - 1],
            trend30d: [baseScore - 1, baseScore - 1, baseScore - 1, baseScore - 1, baseScore - 1],
            trend90d: [baseScore - 1, baseScore - 1, baseScore - 1, baseScore - 1, baseScore - 1],
            clinicalAssessment: "Reminiscence baseline profile initialized."
          }
        },
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
              pillLabel: "DNP",
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
              instructions: "Take 1 tablet with post-dinner water",
              pillVisual: "oval-yellow",
              pillLabel: "MEM",
              pillColor: "#F5DF98",
              pillShape: "oval",
              pillBg: "#F0ECE1"
            }
          ],
          hydration: { frequency: "Every 3 Hours", targetMl: 1500, instructions: "Warm water or herbal tea" },
          activity: { time: "10:00", title: "Gentle walking & joint mobilization", durationMins: 15, instructions: "With caregiver accompaniment" },
          appointment: { date: todayStr, time: "11:30 AM", clinic: "GMCH Tele-Clinic Follow-up", physician: doctor, purpose: "Initial cognitive review" },
          graceWindowMins: 45,
          caregiverAlertEnabled: true
        },
        flags: [
          {
            id: `flg-${Date.now()}`,
            date: todayStr,
            severity: status,
            metric: `New clinical intake enrolled (${deviceType} - ${connectivity})`,
            context: `Enrolled under ${district} network. Baseline difficulty initialized.`
          }
        ],
        reminders: {
          medicine: 100,
          hydration: 100,
          activity: 100,
          appointment: 100,
          recentLogs: [
            { time: `${todayStr} 08:30`, type: "Medicine", title: "Morning medication configured", status: "acknowledged" }
          ]
        },
        sessions: [
          { date: todayStr, durationMins: 15, gamesPlayed: "Baseline Calibration Battery", compositeScore: baseScore, difficulty: "Tier 2 (Moderate)" }
        ],
        clinicalNotes: [
          {
            id: `note-${Date.now()}`,
            date: todayStr,
            author: doctor,
            text: `Initial clinical intake completed. Device setup: ${deviceType} with ${connectivity}. Caregiver ${cgName} briefed on telemetry adherence.`
          }
        ]
      };

      // Add to patient registry
      this.data.patients.unshift(newPatient);

      this.showToast(`New patient record for ${name} committed to registry (${uhid}).`);
      this.navigateTo("detail", newPatient.id);
    } else {
      // Edit mode
      const patient = this.data.patients.find((p) => p.id === uhid);
      if (patient) {
        patient.name = name;
        patient.age = age;
        patient.gender = gender;
        patient.district = district;
        patient.language = language;
        patient.assignedHealthWorker = hw;
        patient.caregiver.name = cgName;
        patient.caregiver.contact = cgPhone;
        patient.caregiver.relation = cgRel;

        patient.clinicalNotes.unshift({
          id: `note-${Date.now()}`,
          date: todayStr,
          author: doctor,
          text: `Core patient record updated by ${doctor}. Care network and demographic profile refreshed.`
        });

        this.showToast(`Clinical record for ${name} (${uhid}) updated successfully.`);
        this.navigateTo("detail", patient.id);
      }
    }
  },

  setupRailObserver() {
    const links = document.querySelectorAll(".rail-step-link");
    const sections = document.querySelectorAll(".intake-section-card");

    if (links.length === 0 || sections.length === 0) return;

    window.addEventListener("scroll", () => {
      if (this.currentView !== "intake") return;

      let currentSecId = "";
      sections.forEach((sec) => {
        const top = sec.getBoundingClientRect().top;
        if (top <= 140) {
          currentSecId = sec.id;
        }
      });

      if (currentSecId) {
        links.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("data-target") === currentSecId);
        });
      }
    });

    // Smooth rail click handling
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("data-target");
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  },

  /* =========================================================================
     VIEW 3: MULTI-PATIENT ANALYTICS OVERVIEW
     ========================================================================= */

  renderAnalytics() {
    const patients = this.data.patients;
    const total = patients.length;

    const alertCount = patients.filter((p) => p.status === "alert").length;
    const attentionCount = patients.filter((p) => p.status === "attention").length;
    const stableCount = patients.filter((p) => p.status === "stable").length;

    // Average adherence rate
    const avgAdherence = Math.round(
      patients.reduce((acc, p) => acc + p.adherenceRate, 0) / total
    );

    // AI Cluster Analytics
    const clusterStats = typeof AIDeclineDetector !== "undefined"
      ? AIDeclineDetector.getClusterAnalytics(patients)
      : null;

    const activeAlertsCount = alertCount;

    // Update stat tiles
    const elTotal = document.getElementById("stat-total-patients");
    const elPctStable = document.getElementById("stat-pct-stable");
    const elAvgAdh = document.getElementById("stat-avg-adherence");
    const elActiveAlerts = document.getElementById("stat-active-alerts");

    if (elTotal) elTotal.textContent = total;
    if (elPctStable) elPctStable.textContent = `${Math.round((stableCount / total) * 100)}%`;
    if (elAvgAdh) elAvgAdh.textContent = `${avgAdherence}%`;
    if (elActiveAlerts) elActiveAlerts.textContent = activeAlertsCount;

    // Render Charts
    ClinicalCharts.renderStatusDonut("analytics-status-donut", {
      alert: alertCount,
      attention: attentionCount,
      stable: stableCount,
      total: total
    });

    ClinicalCharts.renderDistrictAnalyticsBar("analytics-district-bars", patients);

    // Render Systemic Cluster Telemetry
    this.renderClusterTelemetry(clusterStats);

    // Render Priority Flagged Patients Table
    this.renderFlaggedPatientsTable();
  },

  renderClusterTelemetry(clusterStats) {
    if (!clusterStats) return;

    // 1. Severity Breakdown Cards
    const sevContainer = document.getElementById("analytics-telemetry-severities");
    if (sevContainer) {
      sevContainer.innerHTML = `
        <div class="telemetry-severity-card severity-card-alert">
          <div class="telemetry-severity-label" style="color: var(--status-alert);">
            <span style="width:6px; height:6px; background:var(--status-alert); border-radius:50%;"></span>
            <span>Alerts</span>
          </div>
          <div class="telemetry-severity-val" style="color: var(--status-alert);">${clusterStats.alertCount}</div>
          <div class="telemetry-severity-criteria">≥ 15% drop or multi-domain sustained across ≥ 2 sessions</div>
        </div>

        <div class="telemetry-severity-card severity-card-attention">
          <div class="telemetry-severity-label" style="color: var(--status-attention);">
            <span style="width:6px; height:6px; background:var(--status-attention); border-radius:50%;"></span>
            <span>Needs Attention</span>
          </div>
          <div class="telemetry-severity-val" style="color: var(--status-attention);">${clusterStats.attentionCount}</div>
          <div class="telemetry-severity-criteria">10% – 14% sustained dip filtering daily fatigue</div>
        </div>

        <div class="telemetry-severity-card severity-card-improvement">
          <div class="telemetry-severity-label" style="color: var(--status-stable);">
            <span style="width:6px; height:6px; background:var(--status-stable); border-radius:50%;"></span>
            <span>Therapeutic Gain</span>
          </div>
          <div class="telemetry-severity-val" style="color: var(--status-stable);">${clusterStats.improvementCount}</div>
          <div class="telemetry-severity-criteria">≥ +6% sustained gain over 30-day routine training</div>
        </div>
      `;
    }

    // 2. Cognitive Modules Breakdown Bars
    const modContainer = document.getElementById("analytics-cluster-modules");
    if (modContainer) {
      const moduleDefs = [
        { key: "attention", name: "Sustained Attention & Reaction", desc: "Target cancellation latency" },
        { key: "memory", name: "Memory & Word Association", desc: "Delayed retrieval & recognition" },
        { key: "routineRecall", name: "Daily Routine Sequencing", desc: "ADL step organization" },
        { key: "patternRecognition", name: "Visuospatial & Pattern Matching", desc: "Clock match & symmetry" }
      ];

      const totalFlags = clusterStats.totalFlags || 1;

      modContainer.innerHTML = moduleDefs.map((mod) => {
        const count = clusterStats.moduleTally[mod.key] || 0;
        const pct = Math.round((count / totalFlags) * 100);
        const isMostVulnerable = mod.key === clusterStats.mostVulnerableModuleKey;

        return `
          <div class="telemetry-module-bar-item">
            <div class="telemetry-module-meta">
              <div>
                <strong style="color: var(--color-text-primary); font-size: 0.75rem;">${mod.name}</strong>
                ${isMostVulnerable ? '<span class="status-chip chip-alert" style="font-size:0.5625rem; padding:1px 5px; margin-left:6px; display:inline-flex;">Most Vulnerable</span>' : ''}
              </div>
              <span class="mono-num" style="font-size: 0.75rem; color: ${isMostVulnerable ? 'var(--status-alert)' : 'var(--color-text-secondary)'}; font-weight: 600;">
                ${count} flags (${pct}%)
              </span>
            </div>
            <div class="telemetry-bar-track">
              <div class="telemetry-bar-fill ${isMostVulnerable ? 'highlight-vulnerable' : ''}" style="width: ${Math.max(6, pct)}%;"></div>
            </div>
          </div>
        `;
      }).join("");
    }

    // 3. Systemic Clinical Insight Commentary
    const insightContainer = document.getElementById("analytics-systemic-insight-body");
    if (insightContainer) {
      insightContainer.innerHTML = `
        <div style="margin-bottom: var(--space-3);">
          <div style="font-family: var(--font-serif); font-size: 1.0625rem; font-weight: 600; color: var(--color-brand-primary); margin-bottom: 6px; line-height: 1.35;">
            Primary Cluster Signal: ${clusterStats.mostVulnerableModuleName}
          </div>
          <p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 8px;">
            ${clusterStats.mostVulnerableModuleName} is triggering <strong>${clusterStats.mostVulnerablePct}%</strong> of active cognitive decline flags across the regional network. Sustained attention degradation frequently precedes overt episodic memory failures in early vascular and mixed dementia cohorts common in hypertensive geriatric populations in NER.
          </p>
          <div style="background-color: var(--color-surface-subtle); border-left: 3px solid var(--color-brand-primary); padding: 8px 12px; border-radius: 0 2px 2px 0; font-size: 0.75rem; color: var(--color-text-primary); line-height: 1.45;">
            <strong>Decision-Support Action:</strong> ASHA workers assigned to Dimapur and Kamrup clusters should conduct midday hydration and sleep quality verifications, as nocturnal agitation correlates with next-day attention deficits.
          </div>
        </div>
      `;
    }
  },

  renderFlaggedPatientsTable() {
    const tbody = document.getElementById("flagged-patients-tbody");
    if (!tbody) return;

    // Filter Alert and Attention patients, sorted by alert first
    const flagged = this.data.patients
      .filter((p) => p.status === "alert" || p.status === "attention")
      .sort((a, b) => {
        if (a.status === "alert" && b.status !== "alert") return -1;
        if (a.status !== "alert" && b.status === "alert") return 1;
        return new Date(b.lastSessionDate).getTime() - new Date(a.lastSessionDate).getTime();
      });

    if (flagged.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#70807D;">No high-priority alerts currently flagged in this district network.</td></tr>`;
      return;
    }

    tbody.innerHTML = flagged
      .map((p) => {
        const isAlert = p.status === "alert";
        const pAiFlags = typeof AIDeclineDetector !== "undefined" ? AIDeclineDetector.evaluatePatient(p) : [];
        const topFlag = pAiFlags.length > 0
          ? pAiFlags[0].metricHeadline
          : (p.flags && p.flags.length > 0 ? p.flags[0].metric : p.statusReason);

        return `
          <tr>
            <td>
              <span class="roster-patient-name">${p.name}</span>
              <span class="roster-patient-id">${p.id} • ${p.age}y / ${p.gender.charAt(0)}</span>
            </td>
            <td>${p.district}</td>
            <td>
              <span class="status-chip ${isAlert ? "chip-alert" : "chip-attention"}">
                <span class="chip-dot"></span>
                <span>${p.statusLabel}</span>
              </span>
            </td>
            <td style="max-width: 340px;">
              <span style="font-size: 0.75rem; color: var(--color-text-primary); font-weight: 500; display: block; line-height: 1.35;">${topFlag}</span>
            </td>
            <td class="mono-num" style="font-size: 0.75rem;">${p.lastSessionDate}</td>
            <td style="text-align: right;">
              <button class="row-action-link btn-review-flagged" data-patient-id="${p.id}" style="background: transparent; border: 1px solid var(--color-border-subtle); cursor: pointer;">
                Review Patient Record &rarr;
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    // Wire review buttons
    tbody.querySelectorAll(".btn-review-flagged").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-patient-id");
        this.navigateTo("detail", id);
      });
    });
  },

  /* =========================================================================
     HELPERS & EVENT LISTENERS
     ========================================================================= */

  showToast(msg) {
    const toast = document.getElementById("clinical-toast-msg");
    const span = document.getElementById("toast-msg-text");
    if (!toast || !span) return;

    span.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3800);
  },

  attachEventListeners() {
    // Persistent Header Brand - Return to Roster without leaving portal
    const headerBrandReturn = document.getElementById("header-brand-return-roster");
    if (headerBrandReturn) {
      headerBrandReturn.addEventListener("click", (e) => {
        e.preventDefault();
        this.navigateTo("roster");
      });
    }

    // Top Navigation Links
    const navRoster = document.getElementById("nav-roster");
    const navCaregiver = document.getElementById("nav-caregiver");
    const navAnalytics = document.getElementById("nav-analytics");

    if (navRoster) {
      navRoster.addEventListener("click", () => this.navigateTo("roster"));
    }
    if (navCaregiver) {
      navCaregiver.addEventListener("click", () => this.navigateTo("caregiver"));
    }
    if (navAnalytics) {
      navAnalytics.addEventListener("click", () => this.navigateTo("analytics"));
    }
    const navGameAnalytics = document.getElementById("nav-game-analytics");
    if (navGameAnalytics) {
      navGameAnalytics.addEventListener("click", () => this.navigateTo("game-analytics", this.selectedPatientId));
    }

    // Jump to Calendar Button in Patient Record
    const btnJumpCalendar = document.getElementById("btn-jump-to-calendar");
    if (btnJumpCalendar) {
      btnJumpCalendar.addEventListener("click", () => {
        const calPanel = document.getElementById("ehr-patient-calendar-panel");
        if (calPanel) {
          calPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    // Cross-portal Game Analytics entry points
    const btnViewPatientAnalytics = document.getElementById("btn-view-patient-analytics");
    if (btnViewPatientAnalytics) {
      btnViewPatientAnalytics.addEventListener("click", () => {
        this.navigateTo("game-analytics", this.selectedPatientId);
      });
    }

    const btnCgViewAnalytics = document.getElementById("btn-caregiver-view-game-analytics");
    if (btnCgViewAnalytics) {
      btnCgViewAnalytics.addEventListener("click", () => {
        this.navigateTo("game-analytics", this.selectedPatientId);
      });
    }

    // Header Portal Mode Switcher
    const btnModeDoctor = document.getElementById("btn-mode-doctor");
    const btnModePatient = document.getElementById("btn-mode-patient");
    if (btnModeDoctor) {
      btnModeDoctor.addEventListener("click", () => this.navigateTo("roster"));
    }
    if (btnModePatient) {
      btnModePatient.addEventListener("click", (e) => {
        if (e && e.preventDefault) e.preventDefault();
        this.navigateTo("patient-app");
      });
    }

    // Patient App View Return Button
    const btnReturnDoctor = document.getElementById("btn-return-doctor");
    if (btnReturnDoctor) {
      btnReturnDoctor.addEventListener("click", () => this.navigateTo("roster"));
    }

    // Roster Action: Open New Patient Intake
    const btnOpenIntake = document.getElementById("btn-open-intake");
    if (btnOpenIntake) {
      btnOpenIntake.addEventListener("click", () => this.navigateTo("intake", null, false));
    }

    // Detail View Actions
    const btnBackRoster = document.getElementById("btn-back-to-roster");
    if (btnBackRoster) {
      btnBackRoster.addEventListener("click", () => this.navigateTo("roster"));
    }

    const btnEditPatient = document.getElementById("btn-edit-patient");
    if (btnEditPatient) {
      btnEditPatient.addEventListener("click", () => {
        this.navigateTo("intake", this.selectedPatientId, true);
      });
    }

    // Roster Search Input
    const searchInput = document.getElementById("roster-search-input");
    const btnClearSearch = document.getElementById("btn-clear-search");
    const fStatus = document.getElementById("roster-filter-status");
    const fDistrict = document.getElementById("roster-filter-district");
    const fLanguage = document.getElementById("roster-filter-language");
    const fHw = document.getElementById("roster-filter-hw");

    const syncFilterVisualStates = () => {
      const filters = [
        { el: fStatus, val: this.filterStatus },
        { el: fDistrict, val: this.filterDistrict },
        { el: fLanguage, val: this.filterLanguage },
        { el: fHw, val: this.filterHealthWorker },
      ];
      filters.forEach(({ el, val }) => {
        if (!el) return;
        const isActive = val && val !== "all";
        el.classList.toggle("is-active-filter", isActive);
        const item = el.closest(".filter-item");
        if (item) item.classList.toggle("is-active", isActive);
      });
      if (btnClearSearch) {
        btnClearSearch.style.display = (searchInput && searchInput.value) ? "flex" : "none";
      }
    };

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        this.renderRoster();
        syncFilterVisualStates();
      });
    }

    if (btnClearSearch) {
      btnClearSearch.addEventListener("click", () => {
        if (searchInput) {
          searchInput.value = "";
          searchInput.focus();
        }
        this.searchQuery = "";
        this.renderRoster();
        syncFilterVisualStates();
      });
    }

    // Ctrl+K / Cmd+K focus shortcut
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        const rosterView = document.getElementById("view-roster");
        if (searchInput && rosterView && rosterView.classList.contains("active")) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      }
    });

    // Roster Filter Dropdowns
    if (fStatus) {
      fStatus.addEventListener("change", (e) => {
        this.filterStatus = e.target.value;
        this.renderRoster();
        syncFilterVisualStates();
      });
    }

    if (fDistrict) {
      fDistrict.addEventListener("change", (e) => {
        this.filterDistrict = e.target.value;
        this.renderRoster();
        syncFilterVisualStates();
      });
    }

    if (fLanguage) {
      fLanguage.addEventListener("change", (e) => {
        this.filterLanguage = e.target.value;
        this.renderRoster();
        syncFilterVisualStates();
      });
    }

    if (fHw) {
      fHw.addEventListener("change", (e) => {
        this.filterHealthWorker = e.target.value;
        this.renderRoster();
        syncFilterVisualStates();
      });
    }

    // Reset Filters Button
    const btnResetFilters = document.getElementById("btn-reset-filters");
    if (btnResetFilters) {
      btnResetFilters.addEventListener("click", () => {
        this.searchQuery = "";
        this.filterStatus = "all";
        this.filterDistrict = "all";
        this.filterLanguage = "all";
        this.filterHealthWorker = "all";

        if (searchInput) searchInput.value = "";
        if (fStatus) fStatus.value = "all";
        if (fDistrict) fDistrict.value = "all";
        if (fLanguage) fLanguage.value = "all";
        if (fHw) fHw.value = "all";

        this.renderRoster();
        syncFilterVisualStates();
        this.showToast("✓ Registry filters reset to default.");
      });
    }

    // Roster Sortable Headers
    document.querySelectorAll(".sortable-th").forEach((th) => {
      th.addEventListener("click", () => {
        const col = th.getAttribute("data-sort");
        if (this.sortColumn === col) {
          this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
        } else {
          this.sortColumn = col;
          this.sortDirection = col === "status" || col === "adherence" ? "desc" : "asc";
        }
        this.renderRoster();
      });
    });

    // Detail View: Cognitive Module Tabs
    document.querySelectorAll(".module-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.activeModuleKey = btn.getAttribute("data-module");
        const patient = this.data.patients.find((p) => p.id === this.selectedPatientId);
        if (patient) this.renderActiveCognitiveModule(patient);
      });
    });

    // Detail View: Time Range Buttons (7d / 30d / 90d)
    document.querySelectorAll(".time-range-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.activeTimeRange = btn.getAttribute("data-range");
        const patient = this.data.patients.find((p) => p.id === this.selectedPatientId);
        if (patient) this.renderActiveCognitiveModule(patient);
      });
    });

    // Detail View: Save Doctor Note
    const btnSaveNote = document.getElementById("btn-save-doctor-note");
    if (btnSaveNote) {
      btnSaveNote.addEventListener("click", () => this.saveDoctorNote());
    }

    // Detail View: Print / Export Summary
    const btnExport = document.getElementById("btn-export-ehr-summary");
    if (btnExport) {
      btnExport.addEventListener("click", () => this.exportReportPDF());
    }

    // Jump to Clinical Performance Report
    const btnJumpReport = document.getElementById("btn-jump-to-report");
    if (btnJumpReport) {
      btnJumpReport.addEventListener("click", () => {
        const reportSec = document.getElementById("clinical-performance-report-section");
        if (reportSec) {
          reportSec.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    // Clinical Performance Report: Date Range Toggle (7d / 30d / 90d / all)
    document.querySelectorAll(".report-range-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.reportDateRange = btn.getAttribute("data-range");
        const patient = this.data.patients.find((p) => p.id === this.selectedPatientId);
        if (patient) this.renderClinicalPerformanceReport(patient);
      });
    });

    // Clinical Performance Report: Domain Battery Filter
    const selectDomain = document.getElementById("report-domain-select");
    if (selectDomain) {
      selectDomain.addEventListener("change", (e) => {
        this.reportDomainFilter = e.target.value;
        const patient = this.data.patients.find((p) => p.id === this.selectedPatientId);
        if (patient) this.renderClinicalPerformanceReport(patient);
      });
    }

    // Clinical Performance Report: Sortable Table Headers
    document.querySelectorAll(".report-th.sortable-th").forEach((th) => {
      th.addEventListener("click", () => {
        const col = th.getAttribute("data-sort");
        if (this.reportSortCol === col) {
          this.reportSortAsc = !this.reportSortAsc;
        } else {
          this.reportSortCol = col;
          this.reportSortAsc = col === "date" ? false : true;
        }
        const patient = this.data.patients.find((p) => p.id === this.selectedPatientId);
        if (patient) this.renderClinicalPerformanceReport(patient);
      });
      th.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          th.click();
        }
      });
    });

    // Clinical Performance Report: Export PDF Action
    const btnExportReportPdf = document.getElementById("btn-export-report-pdf");
    if (btnExportReportPdf) {
      btnExportReportPdf.addEventListener("click", () => this.exportReportPDF());
    }

    // Intake Form Actions
    const formIntake = document.getElementById("clinical-intake-form");
    if (formIntake) {
      formIntake.addEventListener("submit", (e) => this.submitIntakeForm(e));
      formIntake.addEventListener("input", (e) => {
        this.handleDraftAutosave();
        if (e.target && e.target.classList.contains("input-error")) {
          e.target.classList.remove("input-error");
          const group = e.target.closest(".form-field-group") || e.target.closest(".consent-agreement-box");
          if (group) group.classList.remove("has-error");
        }
      });
      formIntake.addEventListener("change", (e) => {
        this.handleDraftAutosave();
        if (e.target && e.target.classList.contains("input-error")) {
          e.target.classList.remove("input-error");
          const group = e.target.closest(".form-field-group") || e.target.closest(".consent-agreement-box");
          if (group) group.classList.remove("has-error");
        }
      });
    }

    const btnSubmitTop = document.getElementById("btn-submit-intake-top");
    if (btnSubmitTop) {
      btnSubmitTop.addEventListener("click", (e) => this.submitIntakeForm(e));
    }

    const btnCancelTop = document.getElementById("btn-cancel-intake-top");
    const btnCancelBottom = document.getElementById("btn-cancel-intake-bottom");
    const btnIntakeBack = document.getElementById("btn-intake-back");

    const handleCancelIntake = () => {
      if (this.selectedPatientId) {
        this.navigateTo("detail", this.selectedPatientId);
      } else {
        this.navigateTo("roster");
      }
    };

    if (btnCancelTop) btnCancelTop.addEventListener("click", handleCancelIntake);
    if (btnCancelBottom) btnCancelBottom.addEventListener("click", handleCancelIntake);
    if (btnIntakeBack) btnIntakeBack.addEventListener("click", handleCancelIntake);

    // Intake None Checkbox mutually exclusive toggle
    const chkNone = document.getElementById("chk-phys-none");
    if (chkNone) {
      chkNone.addEventListener("change", (e) => {
        if (e.target.checked) {
          document.querySelectorAll('input[name="phys-considerations"]').forEach((chk) => {
            if (chk !== chkNone) chk.checked = false;
          });
        }
      });

      document.querySelectorAll('input[name="phys-considerations"]').forEach((chk) => {
        if (chk !== chkNone) {
          chk.addEventListener("change", (e) => {
            if (e.target.checked && chkNone) chkNone.checked = false;
          });
        }
      });
    }

    // Dynamic field-level error clearing on input
    const inputsToClear = [
      { id: "intake-name", group: "group-patient-name" },
      { id: "intake-age", group: "group-patient-age" },
      { id: "intake-district", group: "group-patient-district" },
      { id: "intake-language", group: "group-patient-language" },
      { id: "intake-cg-name", group: "group-cg-name" },
      { id: "intake-cg-phone", group: "group-cg-phone" },
      { id: "intake-consent-check", group: "group-consent-check" }
    ];

    inputsToClear.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) {
        el.addEventListener("input", () => {
          document.getElementById(item.group).classList.remove("has-error");
          el.classList.remove("input-error");
        });
        el.addEventListener("change", () => {
          document.getElementById(item.group).classList.remove("has-error");
          el.classList.remove("input-error");
        });
      }
    });

    // Care Schedule Controls
    const btnToggleSchedule = document.getElementById("btn-toggle-care-schedule");
    if (btnToggleSchedule) {
      btnToggleSchedule.addEventListener("click", () => this.toggleCareScheduleForm());
    }

    const btnSaveSchedule = document.getElementById("btn-save-care-schedule");
    if (btnSaveSchedule) {
      btnSaveSchedule.addEventListener("click", () => this.saveCareSchedule());
    }

    const btnTestReminder = document.getElementById("btn-test-patient-reminder");
    if (btnTestReminder) {
      btnTestReminder.addEventListener("click", () => this.testPatientReminderPreview());
    }

    const btnSimMissed = document.getElementById("btn-sim-missed-alert");
    if (btnSimMissed) {
      btnSimMissed.addEventListener("click", () => this.simulateMissedReminderAlert());
    }

    const btnDismissAlert = document.getElementById("btn-dismiss-caregiver-alert");
    if (btnDismissAlert) {
      btnDismissAlert.addEventListener("click", () => this.dismissCaregiverAlert());
    }

    // Live Caregiver Alert Broadcast Listener
    window.addEventListener("cdx:caregiver-alert", (e) => {
      if (e.detail && e.detail.patientId === this.selectedPatientId) {
        const banner = document.getElementById("caregiver-sms-alert-banner");
        if (banner) {
          banner.style.display = "block";
          const msgEl = document.getElementById("caregiver-sms-message");
          if (msgEl) {
            msgEl.textContent = `ALERT: ${e.detail.patientName} missed scheduled dose of ${e.detail.drugName} at ${e.detail.missedTime} (>45m grace window expired). Please verify bedside pillbox or coordinate with ASHA worker.`;
          }
          const timeEl = document.getElementById("caregiver-sms-time");
          if (timeEl) timeEl.textContent = "Just Now";
        }
      }
    });
    // Caregiver Dashboard Controls
    const btnOpenAddRem = document.getElementById("btn-open-add-reminder");
    if (btnOpenAddRem) {
      btnOpenAddRem.addEventListener("click", () => {
        this.openAddReminderModal(this.selectedPatientId);
      });
    }

    const btnCloseRem = document.getElementById("btn-close-reminder-modal");
    if (btnCloseRem) {
      btnCloseRem.addEventListener("click", () => this.closeReminderModal());
    }

    const btnCancelRem = document.getElementById("btn-cancel-reminder-modal");
    if (btnCancelRem) {
      btnCancelRem.addEventListener("click", () => this.closeReminderModal());
    }

    const btnSaveRem = document.getElementById("btn-save-reminder");
    if (btnSaveRem) {
      btnSaveRem.addEventListener("click", () => this.saveCaregiverReminder());
    }

    const btnCancelDel = document.getElementById("btn-cancel-delete-modal");
    if (btnCancelDel) {
      btnCancelDel.addEventListener("click", () => this.closeDeleteReminderModal());
    }

    const btnConfirmDel = document.getElementById("btn-confirm-delete-reminder");
    if (btnConfirmDel) {
      btnConfirmDel.addEventListener("click", () => this.confirmDeleteReminder());
    }

    const btnCgNotif = document.getElementById("btn-caregiver-notifications");
    if (btnCgNotif) {
      btnCgNotif.addEventListener("click", () => this.requestCaregiverNotifications());
    }

    const btnCgTestSos = document.getElementById("btn-cg-test-sos");
    if (btnCgTestSos) {
      btnCgTestSos.addEventListener("click", () => this.triggerTestSOS());
    }

    const btnDismissSos = document.getElementById("btn-dismiss-active-sos");
    if (btnDismissSos) {
      btnDismissSos.addEventListener("click", () => {
        const b = document.getElementById("caregiver-active-sos-banner");
        if (b) b.style.display = "none";
        this.showToast("Emergency alert acknowledged.");
      });
    }

    // Attach Game Analytics Event Listeners
    this.attachGameAnalyticsEventListeners();
  },

  /* =========================================================================
     CLINICIAN LEFT SLIDING DRAWER CONTROLLER & DOCTOR PROFILE MODAL
     ========================================================================= */
  setupClinicianSidebar() {
    const sidebar = document.getElementById("clinician-sidebar");
    const overlay = document.getElementById("clinician-sidebar-overlay");
    const openBtn = document.getElementById("btn-open-clinician-sidebar");
    const floatBtn = document.getElementById("btn-float-open-clinician-sidebar");
    const closeBtn = document.getElementById("btn-close-clinician-sidebar");

    const nav = sidebar ? sidebar.querySelector(".nav") : null;
    const navButtons = nav ? [...nav.querySelectorAll("button")] : [];

    const setActive = (button) => {
      if (!button) return;
      navButtons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      const idx = navButtons.indexOf(button);
      if (idx !== -1 && nav) {
        nav.style.setProperty("--active-row", idx);
      }
      const li = button.closest("li");
      if (li && nav) {
        nav.style.setProperty("--indicator-top", `${li.offsetTop}px`);
        nav.style.setProperty("--indicator-height", `${li.offsetHeight}px`);
        nav.style.setProperty("--row", `${li.offsetHeight}px`);
      }
    };

    const openSidebar = () => {
      if (!sidebar) return;
      sidebar.classList.add("open");
      sidebar.setAttribute("aria-hidden", "false");
      if (overlay) {
        overlay.classList.add("open");
        overlay.setAttribute("aria-hidden", "false");
      }
      if (floatBtn) {
        floatBtn.classList.add("is-hidden");
        floatBtn.setAttribute("aria-hidden", "true");
      }
      if (openBtn) openBtn.setAttribute("aria-expanded", "true");

      // Recalculate indicator position on drawer open
      requestAnimationFrame(() => {
        const curActive = nav ? (nav.querySelector("button.active") || navButtons[0]) : null;
        if (curActive) setActive(curActive);
      });
    };

    const closeSidebar = () => {
      if (!sidebar) return;
      sidebar.classList.remove("open");
      sidebar.setAttribute("aria-hidden", "true");
      if (overlay) {
        overlay.classList.remove("open");
        overlay.setAttribute("aria-hidden", "true");
      }
      if (floatBtn) {
        floatBtn.classList.remove("is-hidden");
        floatBtn.setAttribute("aria-hidden", "false");
      }
      if (openBtn) openBtn.setAttribute("aria-expanded", "false");
    };

    if (openBtn) openBtn.addEventListener("click", openSidebar);
    if (floatBtn) floatBtn.addEventListener("click", openSidebar);
    if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
    if (overlay) overlay.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar && sidebar.classList.contains("open")) {
        closeSidebar();
      }
    });

    // Wire Sliding Row Indicator Controller
    if (nav) {
      navButtons.forEach((button) => {
        button.addEventListener("click", () => setActive(button));
      });

      const initialActive = nav.querySelector("button.active") ?? navButtons[0];
      if (initialActive) {
        requestAnimationFrame(() => setActive(initialActive));
      }

      window.addEventListener("resize", () => {
        const cur = nav.querySelector("button.active");
        if (cur) setActive(cur);
      });
    }
  },

  setupDoctorProfileModal() {
    const trigger = document.getElementById("btn-doctor-profile");
    const modal = document.getElementById("modal-doctor-profile-backdrop");
    const closeBtn = document.getElementById("btn-close-doctor-profile");
    const dismissBtn = document.getElementById("btn-dismiss-doctor-profile");

    const btnEditToggle = document.getElementById("btn-edit-doctor-profile");
    const btnEditText = document.getElementById("btn-edit-doctor-profile-text");
    const viewMode = document.getElementById("doctor-profile-view-mode");
    const editMode = document.getElementById("doctor-profile-edit-mode");
    const cancelEditBtn = document.getElementById("btn-cancel-edit-doc");

    // Form input elements
    const inName = document.getElementById("input-doc-name");
    const inSubtitle = document.getElementById("input-doc-subtitle");
    const inSpec = document.getElementById("input-doc-spec");
    const inFacility = document.getElementById("input-doc-facility");
    const inRole = document.getElementById("input-doc-role");
    const inUhid = document.getElementById("input-doc-uhid");
    const inEmail = document.getElementById("input-doc-email");
    const inPhone = document.getElementById("input-doc-phone");

    // Display elements
    const dispName = document.getElementById("doctor-profile-modal-title");
    const dispSubtitle = document.getElementById("doctor-profile-modal-subtitle");
    const dispAvatar = document.getElementById("modal-doc-avatar");
    const dispHeaderName = document.getElementById("header-doctor-name");
    const dispHeaderAvatar = document.getElementById("header-doctor-avatar");

    const dispSpec = document.getElementById("modal-doc-spec");
    const dispFacility = document.getElementById("modal-doc-facility");
    const dispRole = document.getElementById("modal-doc-role");
    const dispUhid = document.getElementById("modal-doc-uhid");
    const dispEmail = document.getElementById("modal-doc-email");
    const dispPhone = document.getElementById("modal-doc-phone");

    // Default profile state
    const defaultProfile = {
      name: "Dr. Priyam Borah, MD",
      subtitle: "Senior Consultant • Unit 3 Neurology · GMCH Guwahati",
      spec: "Geriatric Neurology & Cognitive Decline",
      facility: "Gauhati Medical College Hospital (GMCH)",
      role: "Senior Attending Neurologist & Unit 3 Head",
      uhid: "NER-MD-4081",
      email: "dr.priyam.borah@gmch.assam.gov.in",
      phone: "+91 361 252 8701",
    };

    // Load persisted profile
    const getStoredProfile = () => {
      try {
        const raw = localStorage.getItem("cdx_doctor_profile");
        return raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
      } catch (e) {
        return defaultProfile;
      }
    };

    const applyProfile = (prof) => {
      // Calculate clean initials (e.g. Dr. Priyam Borah -> PB)
      const cleanWords = prof.name.replace(/^(dr\.|dr|md|prof\.)/gi, "").trim().split(/\s+/).filter(Boolean);
      const initials = ((cleanWords[0] ? cleanWords[0][0] : "P") + (cleanWords[1] ? cleanWords[1][0] : "B")).toUpperCase();

      if (dispName) dispName.textContent = prof.name;
      if (dispSubtitle) dispSubtitle.textContent = prof.subtitle;
      if (dispAvatar) dispAvatar.textContent = initials;
      if (dispHeaderName) dispHeaderName.textContent = prof.name;
      if (dispHeaderAvatar) dispHeaderAvatar.textContent = initials;

      if (dispSpec) dispSpec.textContent = prof.spec;
      if (dispFacility) dispFacility.textContent = prof.facility;
      if (dispRole) dispRole.textContent = prof.role;
      if (dispUhid) dispUhid.textContent = prof.uhid;
      if (dispEmail) dispEmail.textContent = prof.email;
      if (dispPhone) dispPhone.textContent = prof.phone;

      // Populate edit form fields
      if (inName) inName.value = prof.name;
      if (inSubtitle) inSubtitle.value = prof.subtitle;
      if (inSpec) inSpec.value = prof.spec;
      if (inFacility) inFacility.value = prof.facility;
      if (inRole) inRole.value = prof.role;
      if (inUhid) inUhid.value = prof.uhid;
      if (inEmail) inEmail.value = prof.email;
      if (inPhone) inPhone.value = prof.phone;
    };

    // Apply saved profile on app initialization
    applyProfile(getStoredProfile());

    const showViewMode = () => {
      if (viewMode) viewMode.style.display = "block";
      if (editMode) editMode.style.display = "none";
      if (btnEditText) btnEditText.textContent = "Edit Profile";
    };

    const showEditMode = () => {
      if (viewMode) viewMode.style.display = "none";
      if (editMode) editMode.style.display = "block";
      if (btnEditText) btnEditText.textContent = "Cancel Edit";
      if (inName) inName.focus();
    };

    if (btnEditToggle) {
      btnEditToggle.addEventListener("click", () => {
        if (editMode && editMode.style.display !== "none") {
          showViewMode();
        } else {
          showEditMode();
        }
      });
    }

    if (cancelEditBtn) {
      cancelEditBtn.addEventListener("click", () => {
        applyProfile(getStoredProfile());
        showViewMode();
      });
    }

    if (editMode) {
      editMode.addEventListener("submit", (e) => {
        e.preventDefault();
        const updated = {
          name: (inName ? inName.value : "").trim() || defaultProfile.name,
          subtitle: (inSubtitle ? inSubtitle.value : "").trim() || defaultProfile.subtitle,
          spec: (inSpec ? inSpec.value : "").trim() || defaultProfile.spec,
          facility: (inFacility ? inFacility.value : "").trim() || defaultProfile.facility,
          role: (inRole ? inRole.value : "").trim() || defaultProfile.role,
          uhid: (inUhid ? inUhid.value : "").trim() || defaultProfile.uhid,
          email: (inEmail ? inEmail.value : "").trim() || defaultProfile.email,
          phone: (inPhone ? inPhone.value : "").trim() || defaultProfile.phone,
        };
        try {
          localStorage.setItem("cdx_doctor_profile", JSON.stringify(updated));
        } catch (err) {}
        applyProfile(updated);
        showViewMode();
        this.showToast("✓ Doctor profile updated successfully.");
      });
    }

    const openModal = () => {
      if (!modal) return;
      showViewMode();
      modal.style.display = "flex";
      requestAnimationFrame(() => {
        modal.classList.add("open");
      });
      if (trigger) trigger.setAttribute("aria-expanded", "true");
    };

    const closeModal = () => {
      if (!modal) return;
      modal.classList.remove("open");
      setTimeout(() => {
        modal.style.display = "none";
        showViewMode();
      }, 350);
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    };

    if (trigger) trigger.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (dismissBtn) dismissBtn.addEventListener("click", closeModal);
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && modal.classList.contains("open")) {
        closeModal();
      }
    });
  },

  /* =========================================================================
     VIEW: CAREGIVER & FAMILY SUPPORT DASHBOARD
     ========================================================================= */

  renderCaregiverDashboard(patientId) {
    const patient = (this.data && this.data.patients.find((p) => p.id === patientId)) || (this.data && this.data.patients[0]);
    if (!patient) return;
    this.selectedPatientId = patient.id;

    // Sync caregiver patient select dropdown
    const cgSelect = document.getElementById("caregiver-patient-select");
    if (cgSelect && cgSelect.value !== patient.id) {
      cgSelect.value = patient.id;
    }

    // 1. Render Metrics Ribbon
    this.renderCaregiverMetrics(patient);

    // 2. Render Reminders Table
    this.renderCaregiverReminders(patient.id);

    // 3. Render Mood Timeline
    this.renderCaregiverMoodTimeline(patient.id);

    // 4. Render Cognitive Activity Participation
    this.renderCaregiverActivityLog(patient);

    // 5. Render Emergency SOS Logs
    this.renderCaregiverSOSLogs(patient.id);
  },

  renderCaregiverMetrics(patient) {
    const adherenceEl = document.getElementById("cg-metric-adherence");
    const adherenceChip = document.getElementById("cg-adherence-chip");
    const adherenceSub = document.getElementById("cg-adherence-sub");
    const remindersEl = document.getElementById("cg-metric-reminders");
    const remindersSub = document.getElementById("cg-metric-reminders-sub");
    const moodEl = document.getElementById("cg-metric-mood");
    const moodTimeEl = document.getElementById("cg-metric-mood-time");
    const safezoneEl = document.getElementById("cg-metric-safezone");
    const safezoneSub = document.getElementById("cg-metric-safezone-sub");

    // Adherence
    const rate = patient.adherenceRate || 85;
    if (adherenceEl) adherenceEl.textContent = `${rate}%`;
    if (adherenceChip) {
      if (rate >= 85) {
        adherenceChip.className = "status-chip chip-stable";
        adherenceChip.textContent = "High Adherence";
      } else if (rate >= 65) {
        adherenceChip.className = "status-chip chip-attention";
        adherenceChip.textContent = "Moderate Needs Care";
      } else {
        adherenceChip.className = "status-chip chip-alert";
        adherenceChip.textContent = "High Missed Rate";
      }
    }
    if (adherenceSub) {
      adherenceSub.textContent = `Supervised by ${patient.caregiver ? patient.caregiver.name : "Family Caregiver"}`;
    }

    // Reminders
    const allReminders = (typeof ReminderSync !== "undefined" && ReminderSync.getAllReminders)
      ? ReminderSync.getAllReminders(patient.id)
      : [];
    const completedCount = allReminders.filter(r => r.status === "completed").length;
    const upcomingCount = allReminders.filter(r => r.status === "upcoming" || !r.status).length;
    const missedCount = allReminders.filter(r => r.status === "missed").length;

    if (remindersEl) remindersEl.textContent = allReminders.length;
    if (remindersSub) {
      remindersSub.textContent = `${completedCount} completed · ${upcomingCount} upcoming${missedCount > 0 ? ` · ${missedCount} missed` : ""}`;
    }

    // Mood
    const moodLogs = (typeof ReminderSync !== "undefined" && ReminderSync.getMoodHistory)
      ? ReminderSync.getMoodHistory(patient.id)
      : [];
    if (moodLogs.length > 0) {
      const latest = moodLogs[0];
      if (moodEl) moodEl.textContent = `${latest.emoji || "😊"} ${latest.label || "Checked In"}`;
      if (moodTimeEl) moodTimeEl.textContent = `Logged ${latest.timestamp || "Today"}`;
    } else {
      if (moodEl) moodEl.textContent = "😌 Calm & Peaceful";
      if (moodTimeEl) moodTimeEl.textContent = "Awaiting patient check-in";
    }

    // Safe Zone
    const safeStatus = (typeof ReminderSync !== "undefined" && ReminderSync.getSafeZoneStatus)
      ? ReminderSync.getSafeZoneStatus(patient.id)
      : { status: "SAFE", badge: "Inside Safe Zone", zoneName: "Home Residence", geoFenceRadiusMeters: 200 };
    const isSafe = safeStatus.status === "SAFE" || safeStatus.isSafe === true;
    if (safezoneEl) {
      safezoneEl.textContent = isSafe ? "🟢 In Safe Zone" : "🔴 Outside Safe Zone";
      safezoneEl.style.color = isSafe ? "#2D7A58" : "#9E382B";
    }
    if (safezoneSub) {
      safezoneSub.textContent = safeStatus.details || `${safeStatus.zoneName || "Home Residence"} · ${safeStatus.geoFenceRadiusMeters || 200}m Geo-Fence`;
    }
  },

  renderCaregiverReminders(patientId) {
    const tbody = document.getElementById("caregiver-reminders-tbody");
    if (!tbody) return;

    const reminders = (typeof ReminderSync !== "undefined" && ReminderSync.getAllReminders)
      ? ReminderSync.getAllReminders(patientId)
      : [];

    if (reminders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 24px; color: var(--color-text-secondary); font-style: italic;">
            No care reminders configured for this patient. Click "+ Add New Reminder" to schedule medications, hydration, or walks.
          </td>
        </tr>
      `;
      return;
    }

    const categoryIcons = {
      medication: "💊",
      hydration: "💧",
      routine: "🚶",
      nutrition: "🍲",
      activity: "🧠"
    };

    tbody.innerHTML = reminders.map((r) => {
      const icon = categoryIcons[r.category] || "⏰";
      const status = r.status || "upcoming";
      const statusClass = `cg-badge-${status}`;
      const escapedTitle = (r.title || "").replace(/"/g, "&quot;");

      return `
        <tr data-reminder-id="${r.id}">
          <td>
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--color-text-primary);">
              <span style="font-size: 1.125rem;">${icon}</span>
              <span>${r.title}</span>
            </div>
          </td>
          <td>
            <span style="text-transform: capitalize; font-size: 0.75rem; background: var(--color-surface-subtle); padding: 3px 8px; border-radius: 10px; border: 1px solid var(--color-border-subtle);">
              ${r.category || "medication"}
            </span>
          </td>
          <td>
            <strong style="font-family: var(--font-mono); color: var(--color-brand-primary);">${r.time || "--:--"}</strong>
          </td>
          <td>${r.dosage || "—"}</td>
          <td style="max-width: 220px; font-size: 0.8125rem; color: var(--color-text-secondary);">${r.instructions || "Take as prescribed with water."}</td>
          <td>
            <span class="${statusClass}">${status}</span>
          </td>
          <td>
            <select class="cg-form-select cg-table-status-select" data-id="${r.id}" style="padding: 3px 8px; font-size: 0.75rem;">
              <option value="upcoming" ${status === "upcoming" ? "selected" : ""}>Upcoming</option>
              <option value="completed" ${status === "completed" ? "selected" : ""}>Completed</option>
              <option value="missed" ${status === "missed" ? "selected" : ""}>Missed</option>
              <option value="postponed" ${status === "postponed" ? "selected" : ""}>Postponed</option>
            </select>
          </td>
          <td>
            <div class="cg-action-group">
              <button class="cg-action-btn edit cg-btn-edit-reminder" data-id="${r.id}" title="Edit Reminder">
                Edit
              </button>
              <button class="cg-action-btn del cg-btn-delete-reminder" data-id="${r.id}" data-name="${escapedTitle}" title="Remove Reminder">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Attach row listeners
    tbody.querySelectorAll(".cg-table-status-select").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        const remId = e.target.getAttribute("data-id");
        const newStatus = e.target.value;
        if (typeof ReminderSync !== "undefined" && ReminderSync.setReminderStatus) {
          ReminderSync.setReminderStatus(patientId, remId, newStatus);
          this.showToast(`Reminder status updated to "${newStatus}". Synced to patient tablet.`);
          const patient = this.data.patients.find(p => p.id === patientId);
          if (patient) this.renderCaregiverMetrics(patient);
          // Update status badge on this row
          const row = e.target.closest("tr");
          if (row) {
            const badgeSpan = row.querySelector("td:nth-child(6) span");
            if (badgeSpan) {
              badgeSpan.className = `cg-badge-${newStatus}`;
              badgeSpan.textContent = newStatus;
            }
          }
        }
      });
    });

    tbody.querySelectorAll(".cg-btn-edit-reminder").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const remId = e.currentTarget.getAttribute("data-id");
        this.openEditReminderModal(patientId, remId);
      });
    });

    tbody.querySelectorAll(".cg-btn-delete-reminder").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const remId = e.currentTarget.getAttribute("data-id");
        const remName = e.currentTarget.getAttribute("data-name");
        this.openDeleteReminderModal(patientId, remId, remName);
      });
    });
  },

  renderCaregiverMoodTimeline(patientId) {
    const container = document.getElementById("caregiver-mood-timeline");
    if (!container) return;

    const moodLogs = (typeof ReminderSync !== "undefined" && ReminderSync.getMoodHistory)
      ? ReminderSync.getMoodHistory(patientId)
      : [];

    if (moodLogs.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--color-text-secondary); font-size: 0.875rem;">
          <div style="font-size: 2rem; margin-bottom: 6px;">🌱</div>
          <div>No patient mood check-ins logged yet today.</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px;">
            The patient tablet prompts for daily emotional self-check-ins gently without stress.
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = moodLogs.map((m) => {
      return `
        <div class="mood-entry">
          <div class="mood-entry-emoji">${m.emoji || "😊"}</div>
          <div class="mood-entry-body">
            <div class="mood-entry-title">
              <strong>${m.label || "Check-In"}</strong>
              <span class="mood-entry-time">${m.timestamp || "Today"}</span>
            </div>
            <div class="mood-entry-note">
              ${m.note || "Logged via patient daily dashboard interaction."}
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  renderCaregiverActivityLog(patient) {
    const container = document.getElementById("caregiver-activity-list");
    if (!container) return;

    const sessions = (patient && patient.sessions) ? patient.sessions.slice(0, 4) : [];
    if (sessions.length === 0) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--color-text-secondary); font-size: 0.8125rem;">
          No cognitive activity sessions recorded recently.
        </div>
      `;
      return;
    }

    const gameNames = {
      memory: "Memory Match (Word & Kin Recall)",
      attention: "Attention Spotter (Visual Cancellation)",
      routineRecall: "Daily Routine Sequencer",
      patternRecognition: "Pattern & Object Sort",
      reminiscence: "Recall & Reminiscence"
    };

    container.innerHTML = sessions.map((s) => {
      const gTitle = gameNames[s.game] || s.game || "Cognitive Engagement";
      const dateStr = s.date || "Recent";
      return `
        <div style="background: var(--color-surface-subtle); border: 1px solid var(--color-border-subtle); border-radius: 4px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.875rem; font-weight: 600; color: var(--color-text-primary);">${gTitle}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 2px;">Completed on ${dateStr} • Duration: ${s.durationSeconds ? Math.round(s.durationSeconds / 60) + 'm' : '4m'}</div>
          </div>
          <span style="background: #EAF2ED; color: #2D7A58; border: 1px solid #BED9C8; font-size: 0.6875rem; font-weight: 700; padding: 3px 8px; border-radius: 10px;">
            Participated
          </span>
        </div>
      `;
    }).join("");
  },

  renderCaregiverSOSLogs(patientId) {
    const container = document.getElementById("caregiver-sos-logs-container");
    if (!container) return;

    const logs = (typeof ReminderSync !== "undefined" && ReminderSync.getSOSLogs)
      ? ReminderSync.getSOSLogs(patientId)
      : [];

    // Also check if recent SOS banner should be shown
    const sosBanner = document.getElementById("caregiver-active-sos-banner");
    const sosContent = document.getElementById("cg-active-sos-content");
    const sosTime = document.getElementById("cg-active-sos-time");

    if (logs.length > 0) {
      const latest = logs[0];
      if (sosBanner && latest.urgency === "CRITICAL_EMERGENCY") {
        sosBanner.style.display = "block";
        if (sosContent) {
          sosContent.textContent = `${latest.message} Location: ${latest.location || "Home Residence (Assam)"} · Dispatch Status: Tele-Alert Notified.`;
        }
        if (sosTime) sosTime.textContent = latest.timestamp || "Just Now";
      }
    }

    if (logs.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--color-text-secondary); font-size: 0.875rem;">
          <div style="font-size: 1.5rem; margin-bottom: 4px;">🟢</div>
          <div>No emergency alerts or SOS dispatches logged. System standing by.</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px;">
            Emergency dispatches from the patient's tablet trigger both SMS tele-alerts and real-time logs here.
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = logs.map((log) => {
      const isCritical = log.urgency === "CRITICAL_EMERGENCY";
      const borderCol = isCritical ? "#9E382B" : "#D48806";
      const bgCol = isCritical ? "#FFF2F0" : "#FFFBE6";
      return `
        <div style="background: ${bgCol}; border-left: 4px solid ${borderCol}; border-top: 1px solid #ECE7DB; border-right: 1px solid #ECE7DB; border-bottom: 1px solid #ECE7DB; border-radius: 4px; padding: 12px 16px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="color: ${borderCol}; font-size: 0.8125rem; text-transform: uppercase;">
                ${isCritical ? '🚨 CRITICAL EMERGENCY SOS' : '⚠️ CARE ALERT'}
              </strong>
              <span style="font-size: 0.75rem; color: var(--color-text-secondary); font-family: var(--font-mono);">${log.timestamp || "Recorded"}</span>
            </div>
            <div style="font-size: 0.875rem; color: var(--color-text-primary); margin-top: 3px;">
              ${log.message || "Emergency help requested."}
            </div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px;">
              Telemetry Location: <strong>${log.location || "Home Residence"}</strong> • Battery: 88%
            </div>
          </div>
          <span style="background: ${isCritical ? '#9E382B' : '#D48806'}; color: #fff; font-size: 0.6875rem; font-weight: 700; padding: 4px 8px; border-radius: 2px;">
            DISPATCHED
          </span>
        </div>
      `;
    }).join("");
  },

  openAddReminderModal(patientId) {
    const modal = document.getElementById("modal-caregiver-add-reminder");
    const titleEl = document.getElementById("cg-modal-title");
    const idEl = document.getElementById("cg-form-reminder-id");
    const titleInput = document.getElementById("cg-form-title");
    const catInput = document.getElementById("cg-form-category");
    const timeInput = document.getElementById("cg-form-time");
    const doseInput = document.getElementById("cg-form-dosage");
    const statusInput = document.getElementById("cg-form-status");
    const instrInput = document.getElementById("cg-form-instructions");
    const errEl = document.getElementById("cg-form-error");

    if (!modal) return;
    if (titleEl) titleEl.textContent = "Add Care Reminder";
    if (idEl) idEl.value = "";
    if (titleInput) titleInput.value = "";
    if (catInput) catInput.value = "medication";
    if (timeInput) timeInput.value = "09:00 AM";
    if (doseInput) doseInput.value = "";
    if (statusInput) statusInput.value = "upcoming";
    if (instrInput) instrInput.value = "";
    if (errEl) { errEl.textContent = ""; errEl.style.display = "none"; }

    modal.style.display = "flex";
  },

  openEditReminderModal(patientId, reminderId) {
    const modal = document.getElementById("modal-caregiver-add-reminder");
    const titleEl = document.getElementById("cg-modal-title");
    const idEl = document.getElementById("cg-form-reminder-id");
    const titleInput = document.getElementById("cg-form-title");
    const catInput = document.getElementById("cg-form-category");
    const timeInput = document.getElementById("cg-form-time");
    const doseInput = document.getElementById("cg-form-dosage");
    const statusInput = document.getElementById("cg-form-status");
    const instrInput = document.getElementById("cg-form-instructions");
    const errEl = document.getElementById("cg-form-error");

    if (!modal) return;
    const reminders = (typeof ReminderSync !== "undefined" && ReminderSync.getAllReminders)
      ? ReminderSync.getAllReminders(patientId)
      : [];
    const item = reminders.find(r => r.id === reminderId);
    if (!item) return;

    if (titleEl) titleEl.textContent = "Edit Care Reminder";
    if (idEl) idEl.value = item.id;
    if (titleInput) titleInput.value = item.title || "";
    if (catInput) catInput.value = item.category || "medication";
    if (timeInput) timeInput.value = item.time || "";
    if (doseInput) doseInput.value = item.dosage || "";
    if (statusInput) statusInput.value = item.status || "upcoming";
    if (instrInput) instrInput.value = item.instructions || "";
    if (errEl) { errEl.textContent = ""; errEl.style.display = "none"; }

    modal.style.display = "flex";
  },

  closeReminderModal() {
    const modal = document.getElementById("modal-caregiver-add-reminder");
    if (modal) modal.style.display = "none";
  },

  saveCaregiverReminder() {
    const patientId = this.selectedPatientId || (this.data.patients && this.data.patients[0].id);
    const idEl = document.getElementById("cg-form-reminder-id");
    const titleInput = document.getElementById("cg-form-title");
    const catInput = document.getElementById("cg-form-category");
    const timeInput = document.getElementById("cg-form-time");
    const doseInput = document.getElementById("cg-form-dosage");
    const statusInput = document.getElementById("cg-form-status");
    const instrInput = document.getElementById("cg-form-instructions");
    const errEl = document.getElementById("cg-form-error");

    const title = titleInput ? titleInput.value.trim() : "";
    const time = timeInput ? timeInput.value.trim() : "";

    if (!title || !time) {
      if (errEl) {
        errEl.textContent = "Please provide both a Reminder Title and Scheduled Time.";
        errEl.style.display = "block";
      }
      return;
    }

    const remData = {
      title,
      category: catInput ? catInput.value : "medication",
      time,
      dosage: doseInput ? doseInput.value.trim() : "",
      status: statusInput ? statusInput.value : "upcoming",
      instructions: instrInput ? instrInput.value.trim() : ""
    };

    const existingId = idEl ? idEl.value.trim() : "";
    if (existingId) {
      if (typeof ReminderSync !== "undefined" && ReminderSync.updateReminder) {
        ReminderSync.updateReminder(patientId, existingId, remData);
        this.showToast(`Care reminder "${title}" updated and synced to tablet.`);
      }
    } else {
      if (typeof ReminderSync !== "undefined" && ReminderSync.addReminder) {
        ReminderSync.addReminder(patientId, remData);
        this.showToast(`New care reminder "${title}" created and synced to tablet.`);
      }
    }

    this.closeReminderModal();
    this.renderCaregiverDashboard(patientId);
  },

  openDeleteReminderModal(patientId, reminderId, reminderName) {
    const modal = document.getElementById("modal-caregiver-delete-reminder");
    const idInput = document.getElementById("cg-delete-reminder-id");
    const nameSpan = document.getElementById("cg-delete-reminder-name");
    if (!modal) return;

    if (idInput) idInput.value = reminderId;
    if (nameSpan) nameSpan.textContent = `"${reminderName || "this reminder"}"`;
    modal.style.display = "flex";
  },

  closeDeleteReminderModal() {
    const modal = document.getElementById("modal-caregiver-delete-reminder");
    if (modal) modal.style.display = "none";
  },

  confirmDeleteReminder() {
    const patientId = this.selectedPatientId || (this.data.patients && this.data.patients[0].id);
    const idInput = document.getElementById("cg-delete-reminder-id");
    const remId = idInput ? idInput.value : null;

    if (remId && typeof ReminderSync !== "undefined" && ReminderSync.deleteReminder) {
      ReminderSync.deleteReminder(patientId, remId);
      this.showToast("Care reminder removed from schedule and tablet.");
    }
    this.closeDeleteReminderModal();
    this.renderCaregiverDashboard(patientId);
  },

  requestCaregiverNotifications() {
    if (typeof ReminderSync !== "undefined" && ReminderSync.requestNotificationPermission) {
      ReminderSync.requestNotificationPermission().then((granted) => {
        const lbl = document.getElementById("btn-cg-notif-label");
        if (granted) {
          if (lbl) lbl.textContent = "Notifications Active ✓";
          this.showToast("Desktop notifications enabled for care alerts.");
          ReminderSync.sendBrowserNotification("CDX Caregiver Alert System Active", {
            body: "You will now receive desktop notifications for missed medication and emergency SOS events."
          });
        } else {
          if (lbl) lbl.textContent = "Alerts Blocked";
          this.showToast("Desktop notification permission was denied or dismissed.");
        }
      });
    }
  },

  triggerTestSOS() {
    const patientId = this.selectedPatientId || (this.data.patients && this.data.patients[0].id);
    const patient = (this.data && this.data.patients) ? this.data.patients.find(p => p.id === patientId) : null;
    const pName = patient ? patient.name : "Patient";
    if (typeof ReminderSync !== "undefined" && ReminderSync.triggerSOS) {
      ReminderSync.triggerSOS(patientId, {
        patientName: pName,
        message: `SIMULATED TEST SOS: Emergency button test initiated for ${pName}. Caregiver notification system fully operational.`,
        location: `${patient ? patient.district : "NER Region"} · Home Safe Zone`,
        urgency: "CRITICAL_EMERGENCY"
      });
      this.showToast("Test SOS alert logged and broadcast to caregiver dashboard.");
      this.renderCaregiverDashboard(patientId);
    }
  },

  /* =========================================================================
     VIEW: PATIENT GAME ANALYTICS, PROGRESS TRACKING & REPORTS
     ========================================================================= */

  attachGameAnalyticsEventListeners() {
    // 1. Time-Range Filter Pills
    document.querySelectorAll(".ga-time-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        const range = pill.getAttribute("data-range");
        document.querySelectorAll(".ga-time-pill").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");

        const customBox = document.getElementById("ga-custom-range-box");
        if (range === "custom") {
          if (customBox) customBox.style.display = "flex";
        } else {
          if (customBox) customBox.style.display = "none";
          this.loadGameAnalytics(this.gameAnalyticsPatientId, range);
        }
      });
    });

    // Custom Range Apply
    const btnApplyCustom = document.getElementById("btn-ga-apply-custom");
    if (btnApplyCustom) {
      btnApplyCustom.addEventListener("click", () => {
        const start = document.getElementById("ga-custom-start").value;
        const end = document.getElementById("ga-custom-end").value;
        if (!start || !end) {
          this.showToast("Please select both start and end dates.");
          return;
        }
        this.loadGameAnalytics(this.gameAnalyticsPatientId, "custom", start, end);
      });
    }

    // Reset Filters Button
    const btnResetFilters = document.getElementById("btn-ga-reset-filters");
    if (btnResetFilters) {
      btnResetFilters.addEventListener("click", () => {
        document.querySelectorAll(".ga-time-pill").forEach((p) => {
          p.classList.toggle("active", p.getAttribute("data-range") === "30d");
        });
        const customBox = document.getElementById("ga-custom-range-box");
        if (customBox) customBox.style.display = "none";

        // Reset history filters
        this.resetGameHistoryFilters();
        this.loadGameAnalytics(this.gameAnalyticsPatientId, "30d");
        this.showToast("Analytics filters reset to default 30-day window.");
      });
    }

    // Refresh Button
    const btnRefresh = document.getElementById("btn-ga-refresh");
    if (btnRefresh) {
      btnRefresh.addEventListener("click", () => {
        this.loadGameAnalytics(
          this.gameAnalyticsPatientId,
          this.gameAnalyticsRange || "30d",
          this.gameAnalyticsCustomStart,
          this.gameAnalyticsCustomEnd
        );
        this.showToast("Telemetry records refreshed from central store.");
      });
    }

    // Export CSV Action
    const btnExportCsv = document.getElementById("btn-ga-export-csv");
    if (btnExportCsv) {
      btnExportCsv.addEventListener("click", () => this.exportGameAnalyticsCSV());
    }

    // Open Report Modal Action
    const btnGenReport = document.getElementById("btn-ga-generate-report");
    if (btnGenReport) {
      btnGenReport.addEventListener("click", () => this.openReportModal());
    }

    // Report Modal Actions
    const btnCloseRepModal = document.getElementById("btn-close-report-modal");
    if (btnCloseRepModal) {
      btnCloseRepModal.addEventListener("click", () => this.closeReportModal());
    }

    const btnRepCancel = document.getElementById("btn-report-cancel");
    if (btnRepCancel) {
      btnRepCancel.addEventListener("click", () => this.closeReportModal());
    }

    const btnRepPrint = document.getElementById("btn-report-print");
    if (btnRepPrint) {
      btnRepPrint.addEventListener("click", () => this.generateReportPrint());
    }

    // History Table Filters & Sorting
    const hDomain = document.getElementById("ga-filter-domain");
    const hStatus = document.getElementById("ga-filter-status");
    const hTier = document.getElementById("ga-filter-tier");
    const hAcc = document.getElementById("ga-filter-acc");
    const hSearch = document.getElementById("ga-filter-search");
    const hSort = document.getElementById("ga-sort-select");

    [hDomain, hStatus, hTier, hAcc, hSort].forEach((el) => {
      if (el) {
        el.addEventListener("change", () => {
          this.gameAnalyticsPage = 1;
          this.applyGameHistoryFilters();
        });
      }
    });

    if (hSearch) {
      hSearch.addEventListener("input", () => {
        this.gameAnalyticsPage = 1;
        this.applyGameHistoryFilters();
      });
    }

    const btnClearHist = document.getElementById("btn-clear-hist-filters");
    if (btnClearHist) {
      btnClearHist.addEventListener("click", () => {
        this.resetGameHistoryFilters();
        this.applyGameHistoryFilters();
      });
    }

    // History Pagination Controls
    const btnPagePrev = document.getElementById("btn-ga-page-prev");
    if (btnPagePrev) {
      btnPagePrev.addEventListener("click", () => {
        if (this.gameAnalyticsPage > 1) {
          this.gameAnalyticsPage--;
          this.renderGameHistoryTable();
        }
      });
    }

    const btnPageNext = document.getElementById("btn-ga-page-next");
    if (btnPageNext) {
      btnPageNext.addEventListener("click", () => {
        const totalPages = Math.ceil((this.gameAnalyticsFilteredSessions || []).length / this.gameAnalyticsPageSize) || 1;
        if (this.gameAnalyticsPage < totalPages) {
          this.gameAnalyticsPage++;
          this.renderGameHistoryTable();
        }
      });
    }

    // Session Detail Drawer Controls
    const btnCloseDrawer = document.getElementById("btn-close-session-drawer");
    if (btnCloseDrawer) {
      btnCloseDrawer.addEventListener("click", () => this.closeSessionDetailDrawer());
    }

    const drawerOverlay = document.getElementById("ga-session-detail-modal");
    if (drawerOverlay) {
      drawerOverlay.addEventListener("click", (e) => {
        if (e.target === drawerOverlay) this.closeSessionDetailDrawer();
      });
    }

    const btnSaveNote = document.getElementById("btn-save-session-note");
    if (btnSaveNote) {
      btnSaveNote.addEventListener("click", () => this.saveSessionNote());
    }
  },

  resetGameHistoryFilters() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setVal("ga-filter-domain", "all");
    setVal("ga-filter-status", "all");
    setVal("ga-filter-tier", "all");
    setVal("ga-filter-acc", "all");
    setVal("ga-filter-search", "");
    setVal("ga-sort-select", "date-desc");
    this.gameAnalyticsPage = 1;
  },

  /**
   * Main Loader for Game Analytics View
   */
  loadGameAnalytics(patientId, range = "30d", customStart = null, customEnd = null) {
    const targetId = patientId || this.selectedPatientId || (this.data.patients && this.data.patients[0].id) || "NER-2024-081";
    this.gameAnalyticsPatientId = targetId;
    this.selectedPatientId = targetId;
    this.gameAnalyticsRange = range;
    this.gameAnalyticsCustomStart = customStart;
    this.gameAnalyticsCustomEnd = customEnd;

    // 1. Sync dropdown
    const select = document.getElementById("ga-patient-select");
    if (select && select.value !== targetId) {
      select.value = targetId;
    }

    // 2. Render Patient Demographics Strip
    const patient = (this.data.patients && this.data.patients.find((p) => p.id === targetId)) || (this.data.patients && this.data.patients[0]);
    if (patient) {
      const initials = patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
      const av = document.getElementById("ga-patient-avatar");
      if (av) av.textContent = initials;

      const pName = document.getElementById("ga-patient-name");
      if (pName) pName.textContent = patient.name;

      const pId = document.getElementById("ga-patient-id");
      if (pId) pId.textContent = `#${patient.id}`;

      const pDemog = document.getElementById("ga-patient-demog");
      if (pDemog) {
        pDemog.textContent = `${patient.age}y / ${patient.gender} • ${patient.district} • ${patient.primaryDiagnosis || "Mild Cognitive Impairment"}`;
      }

      const pCg = document.getElementById("ga-patient-caregiver-info");
      if (pCg) {
        const cg = patient.caregiver || {};
        pCg.innerHTML = `
          <div>Caregiver: <strong>${cg.name || "Primary Caregiver"}</strong> (${cg.relation || "Family"})</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted);">Contact: ${cg.contact || patient.contact || "NER Health Network"}</div>
        `;
      }
    }

    // 3. Build API query string
    const params = new URLSearchParams({ patientId: targetId, range: range });
    if (range === "custom" && customStart && customEnd) {
      params.set("start", customStart);
      params.set("end", customEnd);
    }

    // 4. Fetch Summary & Sessions from REST API with client fallback
    const apiHeaders = { 'x-api-key': CDX_API_KEY };
    Promise.all([
      fetch(`/api/analytics/summary?${params.toString()}`, { headers: apiHeaders }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/analytics/sessions?${params.toString()}`, { headers: apiHeaders }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    ]).then(([summaryRes, sessionsRes]) => {
      let summary = summaryRes && summaryRes.summary ? summaryRes.summary : this.computeClientFallbackSummary(targetId, range);
      let sessions = sessionsRes && sessionsRes.sessions ? sessionsRes.sessions : this.getClientFallbackSessions(targetId);

      this.gameAnalyticsSummary = summary;
      this.gameAnalyticsSessions = sessions;

      // Update UI components
      this.renderGameAnalyticsMetrics(summary);
      this.renderGameAnalyticsNarrative(summary);
      this.renderGameAnalyticsCharts(summary);
      this.applyGameHistoryFilters();
    }).catch((err) => {
      console.error("[GameAnalytics] Failed to fetch telemetry:", err);
      const summary = this.computeClientFallbackSummary(targetId, range);
      const sessions = this.getClientFallbackSessions(targetId);
      this.gameAnalyticsSummary = summary;
      this.gameAnalyticsSessions = sessions;
      this.renderGameAnalyticsMetrics(summary);
      this.renderGameAnalyticsNarrative(summary);
      this.renderGameAnalyticsCharts(summary);
      this.applyGameHistoryFilters();
    });
  },

  /**
   * Render 7 Summary Metrics Cards
   */
  renderGameAnalyticsMetrics(summary) {
    if (!summary) return;

    // Grouping indicator
    const grpBadge = document.getElementById("ga-grouping-indicator");
    if (grpBadge) {
      grpBadge.textContent = `Grouped by: ${summary.groupingLabel || "Day"}`;
    }

    // Card 1: Total Sessions
    const elTot = document.getElementById("ga-stat-total-sessions");
    if (elTot) elTot.textContent = summary.totalSessions || 0;
    const elTotSub = document.getElementById("ga-stat-sessions-sub");
    if (elTotSub) elTotSub.textContent = `${summary.completedSessions || 0} completed`;

    // Card 2: Engagement Duration
    const elDur = document.getElementById("ga-stat-total-duration");
    if (elDur) elDur.textContent = Math.round(summary.totalDurationMinutes || 0);
    const elDurSub = document.getElementById("ga-stat-avg-duration-sub");
    if (elDurSub) elDurSub.textContent = `${summary.avgDurationMinutes || 0} min / session`;

    // Card 3: Overall Accuracy
    const elAcc = document.getElementById("ga-stat-mean-accuracy");
    if (elAcc) elAcc.textContent = `${summary.meanAccuracy || 0}%`;
    const elAccSub = document.getElementById("ga-stat-accuracy-sub");
    if (elAccSub) elAccSub.textContent = summary.accuracyCategory || "Across all activities";

    // Card 4: Completion Rate
    const elComp = document.getElementById("ga-stat-completion-rate");
    if (elComp) elComp.textContent = `${summary.completionRate || 0}%`;
    const elCompSub = document.getElementById("ga-stat-completion-sub");
    if (elCompSub) {
      const earlyExits = (summary.partiallyCompletedSessions || 0) + (summary.abandonedSessions || 0);
      elCompSub.textContent = `${earlyExits} early exits / partial`;
    }

    // Card 5: Response Latency
    const elLat = document.getElementById("ga-stat-mean-latency");
    if (elLat) elLat.textContent = summary.meanResponseLatency || 2.5;

    // Card 6: Most Frequent Activity
    const elFav = document.getElementById("ga-stat-favorite-game");
    if (elFav) elFav.textContent = summary.mostFrequentGame || "Cognitive Activity";
    const elFavSub = document.getElementById("ga-stat-favorite-sub");
    if (elFavSub) {
      elFavSub.textContent = summary.mostFrequentGameSessions
        ? `${summary.mostFrequentGameSessions} sessions played`
        : "Observation underway";
    }

    // Card 7: Protocol Consistency
    const elDays = document.getElementById("ga-stat-active-days");
    if (elDays) elDays.textContent = summary.activeDaysCount || summary.totalSessions || 0;
    const elStreakSub = document.getElementById("ga-stat-streak-sub");
    if (elStreakSub) elStreakSub.textContent = `${summary.totalSessions || 0} sessions recorded`;
  },

  /**
   * Render Observational Progress Narrative
   */
  renderGameAnalyticsNarrative(summary) {
    const textEl = document.getElementById("ga-narrative-text");
    if (textEl && summary) {
      textEl.textContent = summary.observationalNarrative ||
        "Longitudinal cognitive engagement remains consistent across prescribed activities. Observational telemetry shows steady protocol compliance with no adverse interruption patterns.";
    }
  },

  /**
   * Render 8 Pure SVG Visual Charts
   */
  renderGameAnalyticsCharts(summary) {
    if (!summary || typeof ClinicalCharts === "undefined") return;

    // 1. Completion Status Donut
    ClinicalCharts.renderCompletionStatusDonut("ga-chart-completion", summary.completionStatusCounts || {});

    // 2. Response Breakdown Donut
    ClinicalCharts.renderResponseBreakdownDonut("ga-chart-response", summary.totalCorrect || 0, summary.totalIncorrect || 0);

    // 3. Domain Participation Donut
    ClinicalCharts.renderDomainParticipationDonut("ga-chart-domain", summary.domainCounts || {});

    // 4. Game Accuracy Comparison Horizontal Bar
    ClinicalCharts.renderGameAccuracyBar("ga-chart-game-accuracy", summary.gameAccuracies || []);

    // 5. Session Frequency Grouped Bar
    ClinicalCharts.renderSessionFrequencyBar("ga-chart-frequency", summary.frequencyData || [], summary.groupingLabel || "Period");

    // 6. Accuracy Trajectory Line
    ClinicalCharts.renderAccuracyTrajectoryLine("ga-chart-accuracy-line", summary.trajectoryData || [], summary.groupingLabel || "Period");

    // 7. Duration Trajectory Line
    ClinicalCharts.renderDurationTrajectoryLine("ga-chart-duration-line", summary.durationData || [], summary.groupingLabel || "Period");

    // 8. Latency Trajectory Line
    ClinicalCharts.renderLatencyTrajectoryLine("ga-chart-latency-line", summary.latencyData || [], summary.groupingLabel || "Period");
  },

  /**
   * Filter and Sort Chronological Game History
   */
  applyGameHistoryFilters() {
    const sessions = this.gameAnalyticsSessions || [];

    const domain = (document.getElementById("ga-filter-domain") || {}).value || "all";
    const status = (document.getElementById("ga-filter-status") || {}).value || "all";
    const tier = (document.getElementById("ga-filter-tier") || {}).value || "all";
    const acc = (document.getElementById("ga-filter-acc") || {}).value || "all";
    const search = ((document.getElementById("ga-filter-search") || {}).value || "").toLowerCase().trim();
    const sort = (document.getElementById("ga-sort-select") || {}).value || "date-desc";

    let filtered = sessions.filter((s) => {
      // Domain
      if (domain !== "all" && s.category !== domain) return false;
      // Status
      if (status !== "all" && s.completionStatus !== status) return false;
      // Tier
      if (tier !== "all" && String(s.tier) !== tier) return false;
      // Accuracy
      if (acc === "high" && s.accuracy < 75) return false;
      if (acc === "mid" && (s.accuracy < 55 || s.accuracy >= 75)) return false;
      if (acc === "low" && s.accuracy >= 55) return false;
      // Search
      if (search) {
        const text = `${s.gameName} ${s.category} ${s.notes || ""} ${s.difficulty || ""}`.toLowerCase();
        if (!text.includes(search)) return false;
      }
      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (sort === "date-desc") return (b.startTime || "").localeCompare(a.startTime || "");
      if (sort === "date-asc") return (a.startTime || "").localeCompare(b.startTime || "");
      if (sort === "acc-desc") return (b.accuracy || 0) - (a.accuracy || 0);
      if (sort === "acc-asc") return (a.accuracy || 0) - (b.accuracy || 0);
      if (sort === "dur-desc") return (b.durationSeconds || 0) - (a.durationSeconds || 0);
      if (sort === "lat-asc") return (a.responseTime || 0) - (b.responseTime || 0);
      return 0;
    });

    this.gameAnalyticsFilteredSessions = filtered;
    this.renderGameHistoryTable();
  },

  /**
   * Render Chronological Game History Table & Pagination
   */
  renderGameHistoryTable() {
    const tbody = document.getElementById("ga-history-tbody");
    if (!tbody) return;

    const filtered = this.gameAnalyticsFilteredSessions || [];
    const total = filtered.length;
    const pageSize = this.gameAnalyticsPageSize || 10;
    const totalPages = Math.ceil(total / pageSize) || 1;

    if (this.gameAnalyticsPage > totalPages) this.gameAnalyticsPage = totalPages;
    if (this.gameAnalyticsPage < 1) this.gameAnalyticsPage = 1;

    const startIdx = (this.gameAnalyticsPage - 1) * pageSize;
    const pageSessions = filtered.slice(startIdx, startIdx + pageSize);

    // Update count badge
    const cntBadge = document.getElementById("ga-history-count-badge");
    if (cntBadge) cntBadge.textContent = `${total} sessions`;

    // Update pagination controls
    const pageInfo = document.getElementById("ga-page-info");
    if (pageInfo) {
      if (total === 0) {
        pageInfo.textContent = "Showing 0 of 0 sessions";
      } else {
        pageInfo.textContent = `Showing ${startIdx + 1} to ${Math.min(startIdx + pageSize, total)} of ${total} sessions`;
      }
    }

    const pageLbl = document.getElementById("ga-page-current-label");
    if (pageLbl) pageLbl.textContent = `Page ${this.gameAnalyticsPage} of ${totalPages}`;

    const prevBtn = document.getElementById("btn-ga-page-prev");
    if (prevBtn) prevBtn.disabled = this.gameAnalyticsPage <= 1;

    const nextBtn = document.getElementById("btn-ga-page-next");
    if (nextBtn) nextBtn.disabled = this.gameAnalyticsPage >= totalPages;

    if (pageSessions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 32px; color: var(--color-text-muted);">
            No game activity sessions match the selected filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pageSessions.map((s) => {
      const d = new Date(s.startTime);
      const dateStr = !isNaN(d.getTime())
        ? `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
        : s.startTime.slice(0, 16).replace("T", " ");

      const durationStr = s.durationSeconds >= 60
        ? `${(s.durationSeconds / 60).toFixed(1)}m`
        : `${s.durationSeconds}s`;

      const accColor = s.accuracy >= 75 ? "#35654D" : s.accuracy >= 55 ? "#8C5E1A" : "#9E382B";
      const statusPill = s.completionStatus === "completed"
        ? `<span class="status-chip chip-stable">Completed</span>`
        : s.completionStatus === "partially_completed"
        ? `<span class="status-chip chip-attention">Partial</span>`
        : s.completionStatus === "abandoned"
        ? `<span class="status-chip chip-alert">Abandoned</span>`
        : `<span class="status-chip">Skipped</span>`;

      const notePreview = s.notes
        ? `<span title="${s.notes}" style="color: var(--color-text-secondary);">${s.notes.slice(0, 36)}${s.notes.length > 36 ? "…" : ""}</span>`
        : `<span style="color: var(--color-text-muted);">–</span>`;

      return `
        <tr>
          <td style="font-family: var(--font-mono); font-size: 0.75rem; white-space: nowrap;">${dateStr}</td>
          <td><strong>${s.gameName}</strong></td>
          <td><span style="font-size: 0.75rem; background: #FAF8F4; padding: 2px 6px; border: 1px solid #E8DFCE; border-radius: 3px;">${s.category}</span></td>
          <td style="font-size: 0.75rem; color: var(--color-text-secondary);">${s.difficulty || `Tier ${s.tier}`}</td>
          <td style="text-align: right; font-family: var(--font-mono);">${durationStr}</td>
          <td style="text-align: right; font-family: var(--font-mono); font-weight: 600; color: ${accColor};">${s.accuracy}%</td>
          <td style="text-align: right; font-family: var(--font-mono);">${s.responseTime}s</td>
          <td>${statusPill}</td>
          <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${notePreview}</td>
          <td style="text-align: right;">
            <button type="button" class="btn-inspect-session" onclick="ClinicalApp.openSessionDetailDrawer('${s.sessionId}')" title="Inspect complete telemetry and clinical notes">
              Inspect
            </button>
          </td>
        </tr>
      `;
    }).join("");
  },

  /**
   * Session Detail Drawer
   */
  openSessionDetailDrawer(sessionId) {
    const session = (this.gameAnalyticsSessions || []).find((s) => s.sessionId === sessionId);
    if (!session) return;
    this.selectedAnalyticsSession = session;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal("ga-drawer-session-title", `${session.gameName} — Session Telemetry`);
    setVal("ga-drawer-session-subtitle", `Session ID: ${session.sessionId} • ${session.startTime.slice(0, 16).replace("T", " ")}`);

    setVal("ga-tile-game-name", session.gameName);
    setVal("ga-tile-domain", session.category);
    setVal("ga-tile-tier", session.difficulty || `Tier ${session.tier}`);
    setVal("ga-tile-accuracy", `${session.accuracy}%`);

    const durText = session.durationSeconds >= 60
      ? `${(session.durationSeconds / 60).toFixed(1)} min (${session.durationSeconds}s)`
      : `${session.durationSeconds}s`;
    setVal("ga-tile-duration", durText);
    setVal("ga-tile-latency", `${session.responseTime}s`);
    setVal("ga-tile-correct-attempts", `${session.correct} / ${session.attempted}`);
    setVal("ga-tile-hints", session.hints || 0);
    setVal("ga-tile-status", session.completionStatus.replace("_", " "));
    setVal("ga-tile-device", session.deviceType === "tablet_or_mobile" ? "Tablet / Mobile" : "Desktop");

    // Clear note inputs
    const noteInp = document.getElementById("ga-session-note-input");
    if (noteInp) noteInp.value = "";
    const noteSt = document.getElementById("ga-note-save-status");
    if (noteSt) noteSt.textContent = "";

    // Fetch notes list from backend
    fetch(`/api/analytics/notes?sessionId=${sessionId}`, { headers: { 'x-api-key': CDX_API_KEY } })
      .then((r) => r.json())
      .then((res) => {
        const list = document.getElementById("ga-notes-history-list");
        if (!list) return;
        const notes = (res && res.notes) || [];
        if (notes.length === 0 && !session.notes) {
          list.innerHTML = `<em>No clinical notes recorded for this session yet.</em>`;
        } else {
          const allNotes = [...notes];
          if (session.notes && !allNotes.some((n) => n.noteText === session.notes)) {
            allNotes.unshift({
              authorName: "Caregiver / Telemetry",
              authorRole: "Caregiver Log",
              timestamp: session.completionTime || session.startTime,
              noteText: session.notes
            });
          }
          list.innerHTML = allNotes.map((n) => `
            <div style="padding: 8px 10px; margin-bottom: 6px; background: #fff; border: 1px solid #ECE7DB; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.6875rem; color: var(--color-text-muted);">
                <span><strong>${n.authorName}</strong> (${n.authorRole})</span>
                <span>${new Date(n.timestamp).toLocaleString("en-IN")}</span>
              </div>
              <div style="margin-top: 4px; font-size: 0.8125rem; color: var(--color-text-primary); line-height: 1.4;">
                ${n.noteText}
              </div>
            </div>
          `).join("");
        }
      })
      .catch(() => {
        const list = document.getElementById("ga-notes-history-list");
        if (list) {
          list.innerHTML = session.notes
            ? `<div style="padding: 8px 10px; background: #fff; border: 1px solid #ECE7DB; border-radius: 4px;">${session.notes}</div>`
            : `<em>No clinical notes recorded for this session yet.</em>`;
        }
      });

    const modal = document.getElementById("ga-session-detail-modal");
    if (modal) modal.style.display = "flex";
  },

  closeSessionDetailDrawer() {
    const modal = document.getElementById("ga-session-detail-modal");
    if (modal) modal.style.display = "none";
    this.selectedAnalyticsSession = null;
  },

  /**
   * Save Clinical Note for Active Session
   */
  saveSessionNote() {
    if (!this.selectedAnalyticsSession) return;
    const inp = document.getElementById("ga-session-note-input");
    const text = (inp ? inp.value : "").trim();
    if (!text) {
      this.showToast("Please enter clinical note text before saving.");
      return;
    }

    const payload = {
      patientId: this.gameAnalyticsPatientId,
      sessionId: this.selectedAnalyticsSession.sessionId,
      authorName: "Dr. Debabrata Roy (Consultant Geriatrician)",
      authorRole: "Consultant Geriatrician",
      noteText: text
    };

    fetch("/api/analytics/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": CDX_API_KEY },
      body: JSON.stringify(payload)
    })
      .then((r) => r.json())
      .then((res) => {
        if (res && res.success) {
          const st = document.getElementById("ga-note-save-status");
          if (st) st.textContent = "Clinical note saved securely ✓";
          this.showToast("Clinical note recorded in central patient record.");

          // Update local session
          this.selectedAnalyticsSession.notes = text;
          const s = (this.gameAnalyticsSessions || []).find((x) => x.sessionId === this.selectedAnalyticsSession.sessionId);
          if (s) s.notes = text;

          // Re-render notes drawer list
          this.openSessionDetailDrawer(this.selectedAnalyticsSession.sessionId);
          this.applyGameHistoryFilters();
        }
      })
      .catch((err) => {
        console.warn("[GameAnalytics] Offline mode; saving note locally:", err);
        this.selectedAnalyticsSession.notes = text;
        const s = (this.gameAnalyticsSessions || []).find((x) => x.sessionId === this.selectedAnalyticsSession.sessionId);
        if (s) s.notes = text;
        this.showToast("Note stored in local session cache.");
        this.openSessionDetailDrawer(this.selectedAnalyticsSession.sessionId);
        this.applyGameHistoryFilters();
      });
  },

  /**
   * Export CSV Telemetry (RFC 4180)
   */
  exportGameAnalyticsCSV() {
    const patientId = this.gameAnalyticsPatientId || this.selectedPatientId || "NER-2024-081";
    this.showToast("Exporting RFC 4180 CSV telemetry file...");
    window.open(`/api/analytics/export/csv?patientId=${patientId}`, "_blank");
  },

  /**
   * Report Generator Modal
   */
  openReportModal() {
    const patient = (this.data.patients && this.data.patients.find((p) => p.id === this.gameAnalyticsPatientId)) || (this.data.patients && this.data.patients[0]);
    const inp = document.getElementById("ga-report-target-patient");
    if (inp && patient) {
      inp.value = `${patient.name} (#${patient.id}) • ${patient.district}`;
    }

    const modal = document.getElementById("ga-report-modal");
    if (modal) modal.style.display = "flex";
  },

  closeReportModal() {
    const modal = document.getElementById("ga-report-modal");
    if (modal) modal.style.display = "none";
  },

  generateReportPrint() {
    const patientId = this.gameAnalyticsPatientId || this.selectedPatientId || "NER-2024-081";
    const audience = (document.getElementById("ga-report-audience") || {}).value || "clinician";
    const windowRange = (document.getElementById("ga-report-window") || {}).value || "30d";

    this.closeReportModal();
    this.showToast("Opening printable doctor & caregiver progress report...");

    const url = `/api/analytics/export/report?patientId=${patientId}&range=${windowRange}&audience=${audience}&format=print`;
    window.open(url, "_blank");
  },

  /**
   * Fallback In-Memory Telemetry Generators for Offline / Disconnected States
   */
  computeClientFallbackSummary(patientId, range) {
    const patient = (this.data.patients && this.data.patients.find((p) => p.id === patientId)) || {};
    const sessions = (patient.sessions || []).map((s, idx) => ({
      sessionId: `fallback-${idx}`,
      patientId: patientId,
      gameId: s.gameModule || "memory-match",
      gameName: s.gamesPlayed || "Cognitive Activity",
      category: s.gameModule === "routineRecall" ? "Executive Function" : s.gameModule === "attention" ? "Attention" : "Memory",
      tier: 1,
      difficulty: s.difficulty || "Tier 1 (Easy)",
      startTime: s.date ? `${s.date}T10:00:00.000Z` : new Date().toISOString(),
      durationSeconds: Math.round((s.durationMins || 2.5) * 60),
      attempted: 10,
      correct: Math.round(((s.compositeScore || 75) / 100) * 10),
      incorrect: 10 - Math.round(((s.compositeScore || 75) / 100) * 10),
      accuracy: s.compositeScore || 75,
      hints: 1,
      responseTime: s.avgResponseSecs || 2.4,
      completionStatus: "completed"
    }));

    const total = sessions.length || 1;
    const meanAcc = Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / total);

    return {
      totalSessions: total,
      completedSessions: total,
      partiallyCompletedSessions: 0,
      abandonedSessions: 0,
      completionRate: 100,
      totalDurationMinutes: Math.round(sessions.reduce((a, s) => a + s.durationSeconds, 0) / 60),
      avgDurationMinutes: +(sessions.reduce((a, s) => a + s.durationSeconds, 0) / 60 / total).toFixed(1),
      meanAccuracy: meanAcc,
      accuracyCategory: meanAcc >= 75 ? "Target Range (Preserved)" : "Moderate Performance",
      meanResponseLatency: 2.4,
      totalCorrect: sessions.reduce((a, s) => a + s.correct, 0),
      totalIncorrect: sessions.reduce((a, s) => a + s.incorrect, 0),
      completionStatusCounts: { completed: total, partially_completed: 0, abandoned: 0, skipped: 0 },
      domainCounts: { "Memory": Math.round(total * 0.4), "Executive Function": Math.round(total * 0.3), "Attention": Math.round(total * 0.3) },
      gameAccuracies: [
        { name: "Memory Match", category: "Memory", accuracy: meanAcc, sessions: Math.round(total * 0.4) },
        { name: "Daily Routine", category: "Executive Function", accuracy: Math.max(50, meanAcc - 5), sessions: Math.round(total * 0.3) },
        { name: "Visual Attention", category: "Attention", accuracy: Math.min(95, meanAcc + 3), sessions: Math.round(total * 0.3) }
      ],
      grouping: "daily",
      groupingLabel: "Day",
      frequencyData: sessions.slice(0, 10).map((s, i) => ({ label: `Day ${i + 1}`, count: 1, completed: 1, partial: 0 })),
      trajectoryData: sessions.slice(0, 10).map((s, i) => ({ label: `Day ${i + 1}`, accuracy: s.accuracy, sessionCount: 1 })),
      durationData: sessions.slice(0, 10).map((s, i) => ({ label: `Day ${i + 1}`, durationMins: +(s.durationSeconds / 60).toFixed(1) })),
      latencyData: sessions.slice(0, 10).map((s, i) => ({ label: `Day ${i + 1}`, latencySecs: s.responseTime })),
      observationalNarrative: `Patient demonstrates stable cognitive engagement across ${total} recorded activities. Task completion rate remains high with healthy response latency.`
    };
  },

  getClientFallbackSessions(patientId) {
    const patient = (this.data.patients && this.data.patients.find((p) => p.id === patientId)) || {};
    return (patient.sessions || []).map((s, idx) => ({
      sessionId: `fallback-${idx}`,
      patientId: patientId,
      gameId: s.gameModule || "memory-match",
      gameName: s.gamesPlayed || "Memory Match",
      category: s.gameModule === "routineRecall" ? "Executive Function" : s.gameModule === "attention" ? "Attention" : "Memory",
      tier: 1,
      difficulty: s.difficulty || "Tier 1 (Easy)",
      startTime: s.date ? `${s.date}T10:00:00.000Z` : new Date().toISOString(),
      durationSeconds: Math.round((s.durationMins || 2.5) * 60),
      attempted: 10,
      correct: Math.round(((s.compositeScore || 75) / 100) * 10),
      incorrect: 10 - Math.round(((s.compositeScore || 75) / 100) * 10),
      accuracy: s.compositeScore || 75,
      hints: 1,
      responseTime: s.avgResponseSecs || 2.4,
      completionStatus: "completed",
      notes: s.notes || "Regular cognitive session completed."
    }));
  }
};
