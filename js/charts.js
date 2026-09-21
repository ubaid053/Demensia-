/**
 * CLINICAL CHART ENGINE: CDX-GERI-NER
 * SVG Longitudinal & Multi-Module Cognitive Visualizations
 * Adheres strictly to the locked restrained clinical palette.
 */

const ClinicalCharts = {
  /**
   * Generates a readable inline SVG sparkline for table cells with directional indicator
   * @param {Array<number>} values - Array of numerical scores (0-100)
   * @param {string} status - 'alert' | 'attention' | 'stable'
   * @returns {string} SVG HTML string
   */
  renderSparkline(values, status) {
    if (!values || values.length === 0) return "";

    const width = 84;
    const height = 22;
    const padX = 4;
    const padY = 3;

    let strokeColor = "#35654D";
    let strokeWidth = 1.6;
    let glyph = `<span class="sparkline-glyph glyph-stable" title="Stable trajectory">&rarr;</span>`;

    if (status === "alert") {
      strokeColor = "#9E382B";
      strokeWidth = 2.2;
      glyph = `<span class="sparkline-glyph glyph-alert" title="Decline trajectory">&searrow;</span>`;
    } else if (status === "attention") {
      strokeColor = "#8C5E1A";
      strokeWidth = 1.8;
      glyph = `<span class="sparkline-glyph glyph-attention" title="Mild decline">&searrow;</span>`;
    }

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const spread = maxVal - minVal || 1;

    const points = values.map((val, i) => {
      const x = padX + (i / (values.length - 1)) * (width - 2 * padX);
      const normalizedY = (val - minVal) / spread;
      const y = height - padY - normalizedY * (height - 2 * padY);
      return { x, y, val };
    });

    const pathD = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }, "");

    const startPt = points[0];
    const endPt = points[points.length - 1];

    return `
      <div class="sparkline-cell-wrap">
        <svg class="sparkline-svg" viewBox="0 0 ${width} ${height}" aria-hidden="true">
          <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="${startPt.x.toFixed(1)}" cy="${startPt.y.toFixed(1)}" r="1.75" fill="#70807D" />
          <circle cx="${endPt.x.toFixed(1)}" cy="${endPt.y.toFixed(1)}" r="${status === 'alert' ? 2.75 : 2.25}" fill="${strokeColor}" />
        </svg>
        ${glyph}
      </div>
    `;
  },

  /**
   * Generates a dedicated inline sparkline for AI Flag reasoning cards
   * Showing the session-by-session metric scores against the 2-week baseline
   * @param {Array<number>} values - Array of session scores
   * @param {string} severity - 'alert' | 'attention' | 'improvement'
   * @param {number|null} baselineScore - Baseline score
   * @returns {string} SVG HTML string
   */
  renderFlagSparkline(values, severity, baselineScore = null) {
    if (!values || values.length === 0) return "";

    const width = 110;
    const height = 28;
    const padX = 5;
    const padY = 4;

    const color =
      severity === "alert"
        ? "#9E382B"
        : severity === "attention"
        ? "#8C5E1A"
        : "#35654D";

    const minVal = Math.min(...values, baselineScore || values[0]) - 4;
    const maxVal = Math.max(...values, baselineScore || values[0]) + 4;
    const spread = maxVal - minVal || 1;

    const getY = (val) => {
      const norm = (val - minVal) / spread;
      return height - padY - Math.max(0, Math.min(1, norm)) * (height - 2 * padY);
    };

    const points = values.map((val, i) => {
      const x = padX + (i / (values.length - 1)) * (width - 2 * padX);
      return { x, y: getY(val), val };
    });

    const pathD = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }, "");

    let baselineLineSvg = "";
    if (baselineScore !== null) {
      const baseY = getY(baselineScore);
      baselineLineSvg = `
        <line x1="${padX}" y1="${baseY.toFixed(1)}" x2="${width - padX}" y2="${baseY.toFixed(1)}" stroke="#70807D" stroke-dasharray="2 2" stroke-width="0.8" opacity="0.8" />
      `;
    }

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display:block; overflow:visible;" aria-hidden="true">
        ${baselineLineSvg}
        <path d="${pathD}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="${points[0].x.toFixed(1)}" cy="${points[0].y.toFixed(1)}" r="2" fill="#70807D" />
        <circle cx="${points[points.length - 1].x.toFixed(1)}" cy="${points[points.length - 1].y.toFixed(1)}" r="2.5" fill="${color}" />
      </svg>
    `;
  },

  /**
   * Renders the Cognitive Module Performance Trend Chart for a selected game module & time range
   * With hover-to-inspect interactive data node tooltips
   * @param {string} containerId - Element ID
   * @param {Object} moduleData - e.g. patient.cognitiveModules.memory
   * @param {string} timeRange - '7d' | '30d' | '90d'
   */
  renderModuleTrendChart(containerId, moduleData, timeRange = "30d") {
    const container = document.getElementById(containerId);
    if (!container || !moduleData) return;

    const trendKey = `trend${timeRange}`;
    const values = moduleData[trendKey] || moduleData.trend30d;
    if (!values || values.length === 0) return;

    const width = 640;
    const height = 180;
    const margin = { top: 24, right: 30, bottom: 30, left: 38 };

    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const minScore = 20;
    const maxScore = 100;

    const getY = (val) => {
      const norm = (val - minScore) / (maxScore - minScore);
      return margin.top + chartH - Math.max(0, Math.min(1, norm)) * chartH;
    };

    const getX = (idx) => {
      return margin.left + (idx / (values.length - 1)) * chartW;
    };

    const firstScore = values[0];
    const lastScore = values[values.length - 1];
    const netDelta = lastScore - firstScore;
    const pctChange = (((lastScore - firstScore) / firstScore) * 100).toFixed(1);

    let deltaColor = "#35654D";
    let deltaSign = "↑ +";
    let statusText = "Stable / Preserved";

    if (netDelta < 0) {
      if (Math.abs(netDelta) >= 12) {
        deltaColor = "#9E382B";
        deltaSign = "↓ ";
        statusText = "Accelerated Decline";
      } else {
        deltaColor = "#8C5E1A";
        deltaSign = "↓ ";
        statusText = "Mild Decline";
      }
    } else if (netDelta === 0) {
      deltaSign = "±";
      statusText = "Unchanged";
    }

    const thresholdY = getY(45);
    const baselineY = getY(firstScore);

    const pts = values.map((score, i) => ({
      x: getX(i),
      y: getY(score),
      score,
      step: i + 1,
      totalSteps: values.length,
      deltaFromStart: score - firstScore
    }));

    const pathData = pts.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, "");

    const areaD = `${pathData} L ${pts[pts.length - 1].x},${height - margin.bottom} L ${pts[0].x},${height - margin.bottom} Z`;

    const yTicks = [30, 50, 70, 90];
    const gridlinesSvg = yTicks
      .map((val) => {
        const y = getY(val);
        return `
          <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#DDD8CB" stroke-dasharray="2 3" stroke-width="1" />
          <text x="${margin.left - 8}" y="${y + 4}" font-family="IBM Plex Mono" font-size="10" fill="#70807D" text-anchor="end">${val}%</text>
        `;
      })
      .join("");

    const xLabelsSvg = pts
      .map((pt, idx) => {
        let label = `T${idx + 1}`;
        if (timeRange === "7d") label = `Day ${idx + 1}`;
        else if (timeRange === "30d") label = `Wk ${idx + 1}`;
        else if (timeRange === "90d") label = `M${idx + 1}`;

        return `
          <text x="${pt.x}" y="${height - margin.bottom + 16}" font-family="IBM Plex Sans" font-size="10" fill="#4B5A57" text-anchor="middle" font-weight="500">${label}</text>
        `;
      })
      .join("");

    const dotsSvg = pts
      .map((pt, idx) => {
        let periodLabel = timeRange === "7d" ? `Day ${idx + 1}` : timeRange === "30d" ? `Week ${idx + 1}` : `Month ${idx + 1}`;
        return `
          <g class="chart-point-node" tabindex="0" role="button" aria-label="${periodLabel}: ${pt.score}%">
            <circle cx="${pt.x}" cy="${pt.y}" r="10" fill="transparent" class="chart-inspect-hitbox"
              data-score="${pt.score}" data-period="${periodLabel}" data-delta="${pt.deltaFromStart}" />
            <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="#FFF9FA" stroke="${deltaColor}" stroke-width="2.2" />
            <text x="${pt.x}" y="${pt.y - 9}" font-family="IBM Plex Mono" font-size="10" font-weight="600" fill="#1A2826" text-anchor="middle">${pt.score}%</text>
          </g>
        `;
      })
      .join("");

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <div>
          <span style="font-family: 'Source Serif 4', serif; font-size: 1.0625rem; font-weight: 600; color: #004741;">${moduleData.name}</span>
          <span style="font-size: 0.75rem; color: #70807D; margin-left: 8px;">(${timeRange} Evaluation Window)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-family: 'IBM Plex Mono', monospace; font-size: 0.8125rem; font-weight: 600; color: ${deltaColor}; background: ${deltaColor === "#9E382B" ? "#F7ECEB" : deltaColor === "#8C5E1A" ? "#FAF3E8" : "#EDF4F0"}; padding: 2px 8px; border-radius: 2px; border: 1px solid ${deltaColor}40;">
            ${deltaSign}${Math.abs(pctChange)}% (${statusText})
          </span>
        </div>
      </div>

      <div style="position: relative;">
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;">
          <defs>
            <linearGradient id="chartFillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${deltaColor}" stop-opacity="0.16" />
              <stop offset="100%" stop-color="${deltaColor}" stop-opacity="0.01" />
            </linearGradient>
          </defs>

          <!-- Area fill under line -->
          <path d="${areaD}" fill="url(#chartFillGrad)" />

          <!-- Critical threshold line at 45% -->
          <line x1="${margin.left}" y1="${thresholdY}" x2="${width - margin.right}" y2="${thresholdY}" stroke="#9E382B" stroke-dasharray="3 3" stroke-width="1.2" />
          <text x="${width - margin.right - 4}" y="${thresholdY - 4}" font-family="IBM Plex Sans" font-size="9" fill="#9E382B" text-anchor="end">Critical Decline Level (&lt;45%)</text>

          <!-- Baseline reference line -->
          <line x1="${margin.left}" y1="${baselineY}" x2="${width - margin.right}" y2="${baselineY}" stroke="#70807D" stroke-dasharray="1 3" stroke-width="1" />

          <!-- Gridlines -->
          ${gridlinesSvg}

          <!-- Axes rules -->
          <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1" />
          <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1" />

          <!-- X Labels -->
          ${xLabelsSvg}

          <!-- Primary trajectory line -->
          <path d="${pathData}" fill="none" stroke="${deltaColor}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />

          <!-- Data dots & hitboxes -->
          ${dotsSvg}
        </svg>

        <!-- Floating Hover-to-Inspect Tooltip -->
        <div id="chart-hover-tooltip" class="chart-hover-tooltip"></div>
      </div>

      <div style="font-size: 0.75rem; color: #4B5A57; margin-top: 8px; padding: 7px 12px; background: #FFFDF1; border: 1px solid #ECE7DB; border-radius: 2px;">
        <strong>Clinical Impression:</strong> ${moduleData.clinicalAssessment}
      </div>
    `;

    this.attachChartInspectListeners(container);
  },

  /**
   * Attaches interactive mouse inspect events to data nodes in the chart
   */
  attachChartInspectListeners(container) {
    const tooltip = container.querySelector("#chart-hover-tooltip");
    const hitboxes = container.querySelectorAll(".chart-inspect-hitbox");
    if (!tooltip || hitboxes.length === 0) return;

    hitboxes.forEach((hb) => {
      hb.addEventListener("mouseenter", (e) => {
        const score = hb.getAttribute("data-score");
        const period = hb.getAttribute("data-period");
        const delta = parseInt(hb.getAttribute("data-delta"), 10) || 0;
        const deltaStr = delta >= 0 ? `+${delta}%` : `${delta}%`;
        const deltaColor = delta < 0 ? "#9E382B" : "#35654D";

        tooltip.innerHTML = `
          <div style="font-weight:600; color:#004741; font-family:'Source Serif 4', Georgia, serif;">${period} Assessment</div>
          <div style="display:flex; justify-content:space-between; gap:12px; margin-top:2px;">
            <span>Score: <strong style="font-family:'IBM Plex Mono', monospace;">${score}%</strong></span>
            <span style="font-family:'IBM Plex Mono', monospace; color:${deltaColor};">Delta: ${deltaStr}</span>
          </div>
        `;
        tooltip.style.display = "block";

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        tooltip.style.left = `${Math.min(mouseX + 12, rect.width - 150)}px`;
        tooltip.style.top = `${Math.max(mouseY - 45, 10)}px`;
      });

      hb.addEventListener("mousemove", (e) => {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        tooltip.style.left = `${Math.min(mouseX + 12, rect.width - 150)}px`;
        tooltip.style.top = `${Math.max(mouseY - 45, 10)}px`;
      });

      hb.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });
    });
  },

  /**
   * Renders the District Analytics Breakdown horizontal bar chart
   * @param {string} containerId - Element ID
   * @param {Array<Object>} patients - Patient array
   */
  renderDistrictAnalyticsBar(containerId, patients) {
    const container = document.getElementById(containerId);
    if (!container || !patients) return;

    const districtCounts = {};
    patients.forEach((p) => {
      const dist = p.district.split("(")[0].trim();
      districtCounts[dist] = (districtCounts[dist] || 0) + 1;
    });

    const entries = Object.entries(districtCounts).sort((a, b) => b[1] - a[1]);
    const maxCount = Math.max(...Object.values(districtCounts), 1);

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${entries
          .map(([district, count]) => {
            const pct = Math.round((count / maxCount) * 100);
            return `
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; margin-bottom: 3px;">
                  <span style="font-weight: 500; color: #1A2826;">${district}</span>
                  <span style="font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: #4B5A57;">${count} Patient${count > 1 ? "s" : ""}</span>
                </div>
                <div style="height: 8px; background: #ECE7DB; border-radius: 2px; overflow: hidden;">
                  <div style="width: ${pct}%; height: 100%; background: #004741; border-radius: 2px;"></div>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  },

  /**
   * Renders the Status Donut/Ring Breakdown Chart
   * @param {string} containerId - Element ID
   * @param {Object} counts - { alert, attention, stable, total }
   */
  renderStatusDonut(containerId, counts) {
    const container = document.getElementById(containerId);
    if (!container || !counts) return;

    const total = counts.total || 1;
    const pctAlert = Math.round((counts.alert / total) * 100);
    const pctAttention = Math.round((counts.attention / total) * 100);
    const pctStable = Math.round((counts.stable / total) * 100);

    const size = 160;
    const strokeWidth = 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const alertStroke = (counts.alert / total) * circumference;
    const attentionStroke = (counts.attention / total) * circumference;
    const stableStroke = (counts.stable / total) * circumference;

    const alertOffset = 0;
    const attentionOffset = -alertStroke;
    const stableOffset = -(alertStroke + attentionStroke);

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-around; flex-wrap: wrap; gap: 16px;">
        <div style="position: relative; width: ${size}px; height: ${size}px;">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
            <!-- Alert Arc (#9E382B) -->
            <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="#9E382B" stroke-width="${strokeWidth}"
              stroke-dasharray="${alertStroke} ${circumference - alertStroke}" stroke-dashoffset="${alertOffset}" />
            <!-- Needs Attention Arc (#8C5E1A) -->
            <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="#8C5E1A" stroke-width="${strokeWidth}"
              stroke-dasharray="${attentionStroke} ${circumference - attentionStroke}" stroke-dashoffset="${attentionOffset}" />
            <!-- Stable Arc (#35654D) -->
            <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="#35654D" stroke-width="${strokeWidth}"
              stroke-dasharray="${stableStroke} ${circumference - stableStroke}" stroke-dashoffset="${stableOffset}" />
          </svg>
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
            <span style="font-family: 'IBM Plex Mono', monospace; font-size: 1.5rem; font-weight: 600; color: #004741; line-height: 1;">${total}</span>
            <span style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; color: #70807D; margin-top: 2px;">Patients</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.8125rem;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 10px; height: 10px; background: #9E382B; border-radius: 2px;"></span>
            <span><strong>Alert:</strong> ${counts.alert} (${pctAlert}%)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 10px; height: 10px; background: #8C5E1A; border-radius: 2px;"></span>
            <span><strong>Needs Attention:</strong> ${counts.attention} (${pctAttention}%)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 10px; height: 10px; background: #35654D; border-radius: 2px;"></span>
            <span><strong>Stable:</strong> ${counts.stable} (${pctStable}%)</span>
          </div>
        </div>
      </div>
    `;
  },

  /* =========================================================================
     CLINICAL PERFORMANCE REPORT CHARTS
     Locked Clinical Palette: Deep Teal (#004741), Muted Sage (#35654D),
     Muted Rust (#9E382B), Muted Amber (#8C5E1A), Slate (#70807D), Linen (#F0EDE4)
     ========================================================================= */

  /**
   * 1. Overall Cognitive Summary Donut: 5-category relative performance
   */
  renderReportCognitiveDonut(containerId, domains, compositeScore) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 5 Category color assignments strictly within locked palette
    const colors = [
      "#004741", // Memory (Primary deep teal)
      "#8C5E1A", // Attention (Muted amber)
      "#35654D", // Routine Recall (Muted sage)
      "#2B5854", // Pattern Recognition (Slate teal)
      "#5B7B7A"  // Reminiscence (Muted teal-gray)
    ];

    const size = 180;
    const strokeWidth = 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Weight relative score distribution
    const totalScore = domains.reduce((sum, d) => sum + Math.max(1, d.score), 0) || 1;
    let accumulatedAngle = 0;

    const arcs = domains.map((d, i) => {
      const fraction = d.score / totalScore;
      const strokeDash = fraction * circumference;
      const strokeOffset = -accumulatedAngle;
      accumulatedAngle += strokeDash;
      return {
        ...d,
        color: colors[i % colors.length],
        strokeDash,
        strokeOffset,
        fraction: Math.round(fraction * 100)
      };
    });

    const svgArcs = arcs.map(a => `
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent"
        stroke="${a.color}" stroke-width="${strokeWidth}"
        stroke-dasharray="${a.strokeDash.toFixed(1)} ${(circumference - a.strokeDash).toFixed(1)}"
        stroke-dashoffset="${a.strokeOffset.toFixed(1)}"
        class="report-donut-slice" data-domain="${a.name}" data-score="${a.score}%" />
    `).join("");

    const legendItems = arcs.map(a => `
      <div class="report-donut-legend-item">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 10px; height: 10px; background: ${a.color}; border-radius: 2px; flex-shrink: 0;"></span>
          <span style="font-size: 0.8125rem; font-weight: 500; color: #1A2826;">${a.name}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-family: 'IBM Plex Mono', monospace; font-size: 0.875rem; font-weight: 600; color: ${a.color};">${a.score}%</span>
          <span style="font-size: 0.6875rem; font-family: 'IBM Plex Mono', monospace; color: ${a.delta < 0 ? '#9E382B' : a.delta > 0 ? '#35654D' : '#70807D'};">
            ${a.delta > 0 ? `+${a.delta}%` : `${a.delta}%`}
          </span>
        </div>
      </div>
    `).join("");

    container.innerHTML = `
      <div class="report-donut-wrapper">
        <div style="position: relative; width: ${size}px; height: ${size}px; flex-shrink: 0;">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg); display: block;">
            <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="#EAE6DA" stroke-width="${strokeWidth}" />
            ${svgArcs}
          </svg>
          <div class="report-donut-center">
            <span class="report-donut-val">${compositeScore}%</span>
            <span class="report-donut-lbl">Composite Index</span>
          </div>
        </div>
        <div class="report-donut-legend">
          <div style="font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #70807D; margin-bottom: 4px;">
            Domain Engagement Distribution (5 Categories)
          </div>
          ${legendItems}
        </div>
      </div>
    `;
  },

  /**
   * 2. Performance Over Time: Combo Bar + Rolling Average Line Chart
   * Sage = Above Baseline, Rust = Below Baseline.
   */
  renderReportPerformanceOverTime(containerId, sessions, baselineScore, dateRangeLabel) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!sessions || sessions.length === 0) {
      container.innerHTML = `
        <div style="padding: 32px; text-align: center; color: #70807D; font-size: 0.875rem;">
          No cognitive session records found for the selected ${dateRangeLabel} window.
        </div>
      `;
      return;
    }

    // Chronological order (oldest to newest for plotting)
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

    // Calculate rolling average (window of 3)
    const rollingAvgs = sorted.map((s, idx) => {
      const windowStart = Math.max(0, idx - 2);
      const windowSlice = sorted.slice(windowStart, idx + 1);
      const avg = windowSlice.reduce((sum, item) => sum + item.compositeScore, 0) / windowSlice.length;
      return Math.round(avg);
    });

    const width = 680;
    const height = 240;
    const margin = { top: 28, right: 36, bottom: 44, left: 48 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const minScore = 0;
    const maxScore = 100;

    const getY = (val) => {
      const norm = (val - minScore) / (maxScore - minScore);
      return margin.top + chartH - Math.max(0, Math.min(1, norm)) * chartH;
    };

    const slotWidth = chartW / sorted.length;
    const barWidth = Math.max(10, Math.min(28, slotWidth * 0.62));

    // Y Gridlines (0%, 25%, 50%, 75%, 100%)
    const yTicks = [0, 25, 50, 75, 100];
    const gridlinesSvg = yTicks.map(val => {
      const y = getY(val);
      return `
        <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#DDD8CB" stroke-dasharray="2 3" stroke-width="1" />
        <text x="${margin.left - 10}" y="${y + 3.5}" font-family="IBM Plex Mono" font-size="10" fill="#70807D" text-anchor="end">${val}%</text>
      `;
    }).join("");

    // Baseline Line
    const baseY = getY(baselineScore);
    const baselineSvg = `
      <line x1="${margin.left}" y1="${baseY}" x2="${width - margin.right}" y2="${baseY}" stroke="#70807D" stroke-dasharray="3 3" stroke-width="1.2" />
      <text x="${width - margin.right - 4}" y="${baseY - 5}" font-family="IBM Plex Sans" font-size="9.5" font-weight="600" fill="#4B5A57" text-anchor="end">
        Patient Baseline (${baselineScore}%)
      </text>
    `;

    // Bars
    const barsSvg = sorted.map((s, idx) => {
      const centerX = margin.left + (idx + 0.5) * slotWidth;
      const barX = centerX - barWidth / 2;
      const barY = getY(s.compositeScore);
      const barH = height - margin.bottom - barY;
      const isAbove = s.compositeScore >= baselineScore;
      const isCritical = s.compositeScore <= (baselineScore - 12);
      const barColor = isAbove ? "#35654D" : isCritical ? "#9E382B" : "#8C5E1A";

      // Formatted date label
      const dateParts = s.date.split("-");
      const shortDate = `${dateParts[1]}/${dateParts[2]}`;

      return `
        <g class="report-bar-group" tabindex="0">
          <rect x="${barX.toFixed(1)}" y="${barY.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${Math.max(2, barH).toFixed(1)}"
            fill="${barColor}" rx="1.5"
            class="report-chart-bar-hit"
            data-date="${s.date}" data-game="${s.gamesPlayed}" data-score="${s.compositeScore}" data-rolling="${rollingAvgs[idx]}" data-diff="${s.compositeScore - baselineScore}" />
          <text x="${centerX.toFixed(1)}" y="${height - margin.bottom + 16}" font-family="IBM Plex Mono" font-size="9" fill="#4B5A57" text-anchor="middle">
            ${shortDate}
          </text>
        </g>
      `;
    }).join("");

    // Rolling Average Line & Points
    const linePts = sorted.map((s, idx) => {
      const x = margin.left + (idx + 0.5) * slotWidth;
      const y = getY(rollingAvgs[idx]);
      return { x, y, val: rollingAvgs[idx] };
    });

    const linePathD = linePts.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }, "");

    const dotsSvg = linePts.map(pt => `
      <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="3" fill="#FFF9FA" stroke="#004741" stroke-width="2" />
    `).join("");

    container.innerHTML = `
      <div class="report-chart-header">
        <div>
          <div class="report-chart-title">Accuracy % Per Session &amp; Rolling Trajectory</div>
          <div class="report-chart-subtitle">Unit: Percentage (%) • Range: ${dateRangeLabel} • N = ${sorted.length} Sessions</div>
        </div>
        <div class="report-chart-legend">
          <span class="report-legend-chip"><span style="background: #35654D;"></span> Above Baseline</span>
          <span class="report-legend-chip"><span style="background: #9E382B;"></span> Below Baseline</span>
          <span class="report-legend-chip"><span style="background: #004741; height: 3px;"></span> Rolling Average</span>
        </div>
      </div>

      <div style="position: relative; width: 100%;">
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;">
          ${gridlinesSvg}
          ${baselineSvg}
          <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1.2" />
          <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1.2" />
          
          <!-- Y-Axis Unit Label -->
          <text transform="rotate(-90)" x="${-(margin.top + chartH / 2)}" y="14" font-family="IBM Plex Sans" font-size="10" font-weight="600" fill="#70807D" text-anchor="middle">
            Accuracy Score (%)
          </text>
          
          <!-- X-Axis Label -->
          <text x="${margin.left + chartW / 2}" y="${height - 6}" font-family="IBM Plex Sans" font-size="10" fill="#70807D" text-anchor="middle">
            Session Date (Chronological)
          </text>

          <!-- Accuracy Bars -->
          ${barsSvg}

          <!-- Rolling Average Trendline -->
          <path d="${linePathD}" fill="none" stroke="#004741" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
          ${dotsSvg}
        </svg>

        <div id="chart-perf-tooltip" class="clinical-chart-tooltip" style="display: none;"></div>
      </div>
    `;

    this.attachPerformanceTooltipListeners(container);
  },

  /**
   * Tooltips for Performance Over Time
   */
  attachPerformanceTooltipListeners(container) {
    const tooltip = container.querySelector("#chart-perf-tooltip");
    const bars = container.querySelectorAll(".report-chart-bar-hit");
    if (!tooltip || bars.length === 0) return;

    bars.forEach(bar => {
      bar.addEventListener("mouseenter", (e) => {
        const date = bar.getAttribute("data-date");
        const game = bar.getAttribute("data-game");
        const score = bar.getAttribute("data-score");
        const rolling = bar.getAttribute("data-rolling");
        const diff = parseInt(bar.getAttribute("data-diff"), 10);
        const diffStr = diff >= 0 ? `+${diff}%` : `${diff}%`;
        const diffColor = diff < 0 ? "#9E382B" : "#35654D";

        tooltip.innerHTML = `
          <div style="font-weight:600; color:#004741; font-family:'Source Serif 4', Georgia, serif;">${game}</div>
          <div style="font-family:'IBM Plex Mono', monospace; font-size:0.6875rem; color:#70807D; margin-bottom:4px;">${date}</div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size:0.75rem;">
            <span>Accuracy: <strong style="font-family:'IBM Plex Mono', monospace;">${score}%</strong></span>
            <span>Rolling Avg: <strong style="font-family:'IBM Plex Mono', monospace;">${rolling}%</strong></span>
          </div>
          <div style="font-size:0.6875rem; margin-top:4px; font-weight:600; color:${diffColor};">
            Delta from Baseline: ${diffStr}
          </div>
        `;
        tooltip.style.display = "block";
      });

      bar.addEventListener("mousemove", (e) => {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        tooltip.style.left = `${Math.min(mouseX + 12, rect.width - 180)}px`;
        tooltip.style.top = `${Math.max(mouseY - 60, 10)}px`;
      });

      bar.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });
    });
  },

  /**
   * 3. Response-Time & Hesitation Analysis: Line chart of latency across sessions
   * Explicit visual weight equal to accuracy chart!
   */
  renderReportResponseTimeTrend(containerId, sessions, dateRangeLabel) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!sessions || sessions.length === 0) {
      container.innerHTML = `
        <div style="padding: 32px; text-align: center; color: #70807D; font-size: 0.875rem;">
          No latency records found for the selected ${dateRangeLabel} window.
        </div>
      `;
      return;
    }

    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

    const width = 680;
    const height = 240;
    const margin = { top: 28, right: 36, bottom: 44, left: 48 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const minLat = 0.0;
    const maxLat = 5.0; // Seconds

    const getY = (sec) => {
      const norm = (sec - minLat) / (maxLat - minLat);
      return margin.top + chartH - Math.max(0, Math.min(1, norm)) * chartH;
    };

    const getX = (idx) => {
      return margin.left + (idx / Math.max(1, sorted.length - 1)) * chartW;
    };

    // Y Gridlines (0s, 1s, 2s, 3s, 4s, 5s)
    const yTicks = [0, 1.0, 2.0, 3.0, 4.0, 5.0];
    const gridlinesSvg = yTicks.map(val => {
      const y = getY(val);
      return `
        <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#DDD8CB" stroke-dasharray="2 3" stroke-width="1" />
        <text x="${margin.left - 10}" y="${y + 3.5}" font-family="IBM Plex Mono" font-size="10" fill="#70807D" text-anchor="end">${val.toFixed(1)}s</text>
      `;
    }).join("");

    // Clinical Delay / Hesitation Threshold at 3.0s
    const threshY = getY(3.0);
    const threshSvg = `
      <line x1="${margin.left}" y1="${threshY}" x2="${width - margin.right}" y2="${threshY}" stroke="#9E382B" stroke-dasharray="3 3" stroke-width="1.3" />
      <text x="${width - margin.right - 4}" y="${threshY - 5}" font-family="IBM Plex Sans" font-size="9.5" font-weight="600" fill="#9E382B" text-anchor="end">
        Clinical Hesitation / Delay Threshold (>3.0s)
      </text>
    `;

    // Latency Points
    const pts = sorted.map((s, idx) => ({
      x: getX(idx),
      y: getY(s.avgResponseSecs),
      sec: s.avgResponseSecs,
      date: s.date,
      game: s.gamesPlayed,
      module: s.gameModule
    }));

    const linePathD = pts.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }, "");

    const areaD = `${linePathD} L ${pts[pts.length - 1].x.toFixed(1)},${(height - margin.bottom).toFixed(1)} L ${pts[0].x.toFixed(1)},${(height - margin.bottom).toFixed(1)} Z`;

    const lastSec = pts[pts.length - 1].sec;
    const firstSec = pts[0].sec;
    const deltaSec = +(lastSec - firstSec).toFixed(1);
    const isWorsening = lastSec >= 3.0 || deltaSec > 0.5;

    const dotsSvg = pts.map(pt => {
      const isSlow = pt.sec >= 3.0;
      const dotColor = isSlow ? "#9E382B" : "#35654D";
      const dateParts = pt.date.split("-");
      const shortDate = `${dateParts[1]}/${dateParts[2]}`;

      return `
        <g class="report-latency-node" tabindex="0">
          <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="10" fill="transparent" class="report-chart-latency-hit"
            data-date="${pt.date}" data-game="${pt.game}" data-latency="${pt.sec}" />
          <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${isSlow ? 4.5 : 3.5}" fill="#FFF9FA" stroke="${dotColor}" stroke-width="2" />
          <text x="${pt.x.toFixed(1)}" y="${height - margin.bottom + 16}" font-family="IBM Plex Mono" font-size="9" fill="#4B5A57" text-anchor="middle">
            ${shortDate}
          </text>
        </g>
      `;
    }).join("");

    container.innerHTML = `
      <div class="report-chart-header">
        <div>
          <div class="report-chart-title">Decision Latency &amp; Hesitation Analysis</div>
          <div class="report-chart-subtitle">Unit: Seconds (s) • Range: ${dateRangeLabel} • Early Biomarker of Executive Slowing</div>
        </div>
        <div class="report-chart-legend">
          <span class="report-legend-chip"><span style="background: #35654D;"></span> Normal Latency (&lt;2.5s)</span>
          <span class="report-legend-chip"><span style="background: #9E382B;"></span> Delay / Hesitation (&gt;3.0s)</span>
          <span class="report-legend-chip" style="font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; font-weight: 600; color: ${isWorsening ? '#9E382B' : '#35654D'};">
            ${deltaSec > 0 ? `↑ +${deltaSec}s Slowdown` : `↓ ${Math.abs(deltaSec)}s Swift`}
          </span>
        </div>
      </div>

      <div style="position: relative; width: 100%;">
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;">
          <defs>
            <linearGradient id="latencyAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${isWorsening ? '#9E382B' : '#004741'}" stop-opacity="0.16" />
              <stop offset="100%" stop-color="${isWorsening ? '#9E382B' : '#004741'}" stop-opacity="0.01" />
            </linearGradient>
          </defs>

          ${gridlinesSvg}
          ${threshSvg}
          <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1.2" />
          <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1.2" />

          <!-- Y-Axis Unit Label -->
          <text transform="rotate(-90)" x="${-(margin.top + chartH / 2)}" y="14" font-family="IBM Plex Sans" font-size="10" font-weight="600" fill="#70807D" text-anchor="middle">
            Mean Decision Latency (s)
          </text>

          <!-- X-Axis Label -->
          <text x="${margin.left + chartW / 2}" y="${height - 6}" font-family="IBM Plex Sans" font-size="10" fill="#70807D" text-anchor="middle">
            Session Date (Chronological)
          </text>

          <!-- Area Under Trajectory -->
          <path d="${areaD}" fill="url(#latencyAreaGrad)" />

          <!-- Line Trajectory -->
          <path d="${linePathD}" fill="none" stroke="${isWorsening ? '#9E382B' : '#004741'}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />

          <!-- Interactive Node Dots -->
          ${dotsSvg}
        </svg>

        <div id="chart-latency-tooltip" class="clinical-chart-tooltip" style="display: none;"></div>
      </div>
    `;

    this.attachLatencyTooltipListeners(container);
  },

  /**
   * Tooltips for Latency Analysis
   */
  attachLatencyTooltipListeners(container) {
    const tooltip = container.querySelector("#chart-latency-tooltip");
    const nodes = container.querySelectorAll(".report-chart-latency-hit");
    if (!tooltip || nodes.length === 0) return;

    nodes.forEach(node => {
      node.addEventListener("mouseenter", (e) => {
        const date = node.getAttribute("data-date");
        const game = node.getAttribute("data-game");
        const lat = parseFloat(node.getAttribute("data-latency"));
        const isSlow = lat >= 3.0;

        tooltip.innerHTML = `
          <div style="font-weight:600; color:#004741; font-family:'Source Serif 4', Georgia, serif;">${game}</div>
          <div style="font-family:'IBM Plex Mono', monospace; font-size:0.6875rem; color:#70807D; margin-bottom:4px;">${date}</div>
          <div style="font-size:0.75rem;">
            Decision Latency: <strong style="font-family:'IBM Plex Mono', monospace; font-size:0.875rem; color:${isSlow ? '#9E382B' : '#35654D'};">${lat.toFixed(1)}s</strong>
          </div>
          <div style="font-size:0.6875rem; margin-top:3px; color:${isSlow ? '#9E382B' : '#70807D'};">
            ${isSlow ? "⚠️ Significant cognitive hesitation detected" : "✓ Within expected normative response window"}
          </div>
        `;
        tooltip.style.display = "block";
      });

      node.addEventListener("mousemove", (e) => {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        tooltip.style.left = `${Math.min(mouseX + 12, rect.width - 180)}px`;
        tooltip.style.top = `${Math.max(mouseY - 60, 10)}px`;
      });

      node.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });
    });
  },

  /**
   * 4. Adherence & Engagement Consistency: Weekly Sessions Completed vs. Skipped
   */
  renderReportAdherenceConsistency(containerId, weeklyData) {
    const container = document.getElementById(containerId);
    if (!container || !weeklyData || weeklyData.length === 0) return;

    const width = 680;
    const height = 180;
    const margin = { top: 24, right: 30, bottom: 40, left: 44 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const maxSessions = 4; // Expected 3 per week, scale up to 4
    const getY = (val) => {
      const norm = val / maxSessions;
      return margin.top + chartH - Math.max(0, Math.min(1, norm)) * chartH;
    };

    const slotW = chartW / weeklyData.length;
    const barW = Math.max(8, Math.min(18, slotW * 0.32));

    // Y Gridlines (0, 1, 2, 3, 4 sessions)
    const yTicks = [0, 1, 2, 3, 4];
    const gridlinesSvg = yTicks.map(val => {
      const y = getY(val);
      return `
        <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#DDD8CB" stroke-dasharray="2 3" stroke-width="1" />
        <text x="${margin.left - 8}" y="${y + 3.5}" font-family="IBM Plex Mono" font-size="10" fill="#70807D" text-anchor="end">${val}</text>
      `;
    }).join("");

    // Target protocol line (3 sessions / week)
    const targetY = getY(3);
    const targetLineSvg = `
      <line x1="${margin.left}" y1="${targetY}" x2="${width - margin.right}" y2="${targetY}" stroke="#2B5854" stroke-dasharray="4 2" stroke-width="1" />
      <text x="${width - margin.right - 4}" y="${targetY - 4}" font-family="IBM Plex Sans" font-size="9" fill="#2B5854" text-anchor="end">Protocol Target (3x/wk)</text>
    `;

    let totalCompleted = 0;
    let totalScheduled = 0;

    const barsSvg = weeklyData.map((w, idx) => {
      totalCompleted += w.completed;
      totalScheduled += w.scheduled;

      const centerX = margin.left + (idx + 0.5) * slotW;
      const compX = centerX - barW - 1.5;
      const skipX = centerX + 1.5;

      const compY = getY(w.completed);
      const compH = height - margin.bottom - compY;

      const skipY = getY(w.skipped);
      const skipH = height - margin.bottom - skipY;

      return `
        <g class="report-adherence-bar-pair">
          <!-- Completed Bar (#004741) -->
          <rect x="${compX.toFixed(1)}" y="${compY.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(2, compH).toFixed(1)}"
            fill="#004741" rx="1.5" />
          
          <!-- Skipped Bar (#9E382B) -->
          <rect x="${skipX.toFixed(1)}" y="${skipY.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1, skipH).toFixed(1)}"
            fill="#9E382B" rx="1.5" opacity="${w.skipped > 0 ? '0.9' : '0.2'}" />

          <!-- X Label -->
          <text x="${centerX.toFixed(1)}" y="${height - margin.bottom + 16}" font-family="IBM Plex Mono" font-size="9" fill="#4B5A57" text-anchor="middle">
            ${w.weekLabel}
          </text>
        </g>
      `;
    }).join("");

    const overallPct = Math.round((totalCompleted / Math.max(1, totalScheduled)) * 100);

    container.innerHTML = `
      <div class="report-chart-header">
        <div>
          <div class="report-chart-title">Adherence &amp; Engagement Consistency</div>
          <div class="report-chart-subtitle">Sessions Completed vs. Skipped Per Week • Longitudinal Protocol Compliance</div>
        </div>
        <div class="report-chart-legend">
          <span class="report-legend-chip"><span style="background: #004741;"></span> Completed Sessions</span>
          <span class="report-legend-chip"><span style="background: #9E382B;"></span> Skipped / Missed</span>
          <span class="report-legend-chip" style="font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; font-weight: 600; color: ${overallPct >= 75 ? '#35654D' : '#9E382B'};">
            ${overallPct}% Compliance
          </span>
        </div>
      </div>

      <div style="position: relative; width: 100%;">
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;">
          ${gridlinesSvg}
          ${targetLineSvg}
          <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1.2" />
          <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1.2" />

          <!-- Y-Axis Unit Label -->
          <text transform="rotate(-90)" x="${-(margin.top + chartH / 2)}" y="14" font-family="IBM Plex Sans" font-size="10" font-weight="600" fill="#70807D" text-anchor="middle">
            Sessions / Week
          </text>

          <!-- Grouped Bars -->
          ${barsSvg}
        </svg>
      </div>
    `;
  },

  /* =========================================================================
     GAME ANALYTICS ENGINE CHARTS
     Dedicated Accessible Visualizations for Patient Game Analytics Dashboard
     ========================================================================= */

  /**
   * Helper to toggle between SVG Visual and Accessible Data Table
   */
  toggleDataTable(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const visual = container.querySelector(".chart-visual-wrapper");
    const table = container.querySelector(".chart-table-wrapper");
    const btn = container.querySelector(".btn-chart-toggle");
    if (!visual || !table) return;

    const isTableVisible = table.style.display !== "none";
    if (isTableVisible) {
      table.style.display = "none";
      visual.style.display = "block";
      if (btn) {
        btn.setAttribute("aria-expanded", "false");
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg><span>View Data Table</span>`;
      }
    } else {
      table.style.display = "block";
      visual.style.display = "none";
      if (btn) {
        btn.setAttribute("aria-expanded", "true");
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg><span>View Visual Chart</span>`;
      }
    }
  },

  /**
   * 1. Completion Status Breakdown Donut
   * @param {string} containerId
   * @param {Object} counts - { completed, partially_completed, abandoned, skipped }
   */
  renderCompletionStatusDonut(containerId, counts = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const completed = counts.completed || 0;
    const partial = counts.partially_completed || 0;
    const abandoned = counts.abandoned || 0;
    const skipped = counts.skipped || 0;
    const total = completed + partial + abandoned + skipped;

    if (total === 0) {
      container.innerHTML = `<div class="chart-empty-state"><p>No session activity recorded for this period.</p></div>`;
      return;
    }

    const compPct = Math.round((completed / total) * 100);
    const size = 160;
    const strokeWidth = 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const slices = [
      { label: "Completed", count: completed, color: "#004741" },
      { label: "Partially Completed", count: partial, color: "#8C5E1A" },
      { label: "Abandoned", count: abandoned, color: "#9E382B" },
      { label: "Skipped", count: skipped, color: "#70807D" }
    ].filter(s => s.count > 0);

    let accumulated = 0;
    const circlesSvg = slices.map(s => {
      const stroke = (s.count / total) * circumference;
      const offset = -accumulated;
      accumulated += stroke;
      return `<circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="${s.color}"
        stroke-width="${strokeWidth}" stroke-dasharray="${stroke} ${circumference - stroke}"
        stroke-dashoffset="${offset}" role="graphics-symbol" aria-label="${s.label}: ${s.count} (${Math.round((s.count/total)*100)}%)">
        <title>${s.label}: ${s.count} sessions (${Math.round((s.count/total)*100)}%)</title>
      </circle>`;
    }).join("");

    const legendHtml = slices.map(s => `
      <div class="analytics-legend-item">
        <span class="legend-color-dot" style="background:${s.color};"></span>
        <span class="legend-text"><strong>${s.label}:</strong> ${s.count} (${Math.round((s.count/total)*100)}%)</span>
      </div>
    `).join("");

    const tableRows = slices.map(s => `
      <tr>
        <th scope="row">${s.label}</th>
        <td class="num-cell">${s.count}</td>
        <td class="num-cell">${Math.round((s.count/total)*100)}%</td>
      </tr>
    `).join("");

    container.innerHTML = `
      <div class="chart-header-actions">
        <button type="button" class="btn-chart-toggle" aria-expanded="false" onclick="ClinicalCharts.toggleDataTable('${containerId}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <span>View Data Table</span>
        </button>
      </div>
      <div class="chart-visual-wrapper">
        <div class="donut-chart-layout">
          <div class="donut-svg-holder" style="position: relative; width: ${size}px; height: ${size}px; margin: 0 auto;">
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);" role="img" aria-label="Session completion breakdown donut chart">
              ${circlesSvg}
            </svg>
            <div class="donut-center-badge">
              <span class="donut-center-val">${compPct}%</span>
              <span class="donut-center-sub">Completed</span>
            </div>
          </div>
          <div class="analytics-chart-legend">
            ${legendHtml}
          </div>
        </div>
      </div>
      <div class="chart-table-wrapper" style="display:none;">
        <table class="chart-data-table" aria-label="Completion status data table">
          <thead>
            <tr><th scope="col">Status</th><th scope="col" class="num-cell">Sessions</th><th scope="col" class="num-cell">Percentage</th></tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * 2. Response Breakdown Donut (Correct vs. Incorrect)
   */
  renderResponseBreakdownDonut(containerId, correct = 0, incorrect = 0) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const total = correct + incorrect;
    if (total === 0) {
      container.innerHTML = `<div class="chart-empty-state"><p>No attempt telemetry recorded for this period.</p></div>`;
      return;
    }

    const accPct = Math.round((correct / total) * 100);
    const incPct = 100 - accPct;
    const size = 160;
    const strokeWidth = 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const correctStroke = (correct / total) * circumference;
    const incStroke = (incorrect / total) * circumference;

    container.innerHTML = `
      <div class="chart-header-actions">
        <button type="button" class="btn-chart-toggle" aria-expanded="false" onclick="ClinicalCharts.toggleDataTable('${containerId}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <span>View Data Table</span>
        </button>
      </div>
      <div class="chart-visual-wrapper">
        <div class="donut-chart-layout">
          <div class="donut-svg-holder" style="position: relative; width: ${size}px; height: ${size}px; margin: 0 auto;">
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);" role="img" aria-label="Correct versus incorrect responses donut chart">
              <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="#35654D"
                stroke-width="${strokeWidth}" stroke-dasharray="${correctStroke} ${circumference - correctStroke}"
                stroke-dashoffset="0" role="graphics-symbol" aria-label="Correct: ${correct} (${accPct}%)">
                <title>Correct Responses: ${correct} (${accPct}%)</title>
              </circle>
              <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="#9E382B"
                stroke-width="${strokeWidth}" stroke-dasharray="${incStroke} ${circumference - incStroke}"
                stroke-dashoffset="${-correctStroke}" role="graphics-symbol" aria-label="Incorrect: ${incorrect} (${incPct}%)">
                <title>Incorrect Responses: ${incorrect} (${incPct}%)</title>
              </circle>
            </svg>
            <div class="donut-center-badge">
              <span class="donut-center-val">${accPct}%</span>
              <span class="donut-center-sub">Accuracy</span>
            </div>
          </div>
          <div class="analytics-chart-legend">
            <div class="analytics-legend-item">
              <span class="legend-color-dot" style="background:#35654D;"></span>
              <span class="legend-text"><strong>Correct:</strong> ${correct.toLocaleString()} (${accPct}%)</span>
            </div>
            <div class="analytics-legend-item">
              <span class="legend-color-dot" style="background:#9E382B;"></span>
              <span class="legend-text"><strong>Incorrect:</strong> ${incorrect.toLocaleString()} (${incPct}%)</span>
            </div>
            <div class="analytics-legend-item" style="font-size: 0.75rem; color: #70807D;">
              <span>Total Attempts: ${total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="chart-table-wrapper" style="display:none;">
        <table class="chart-data-table" aria-label="Response breakdown data table">
          <thead>
            <tr><th scope="col">Response Type</th><th scope="col" class="num-cell">Count</th><th scope="col" class="num-cell">Share</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Correct Responses</th><td class="num-cell">${correct.toLocaleString()}</td><td class="num-cell">${accPct}%</td></tr>
            <tr><th scope="row">Incorrect Responses</th><td class="num-cell">${incorrect.toLocaleString()}</td><td class="num-cell">${incPct}%</td></tr>
            <tr class="total-row"><th scope="row">Total Telemetry Items</th><td class="num-cell">${total.toLocaleString()}</td><td class="num-cell">100%</td></tr>
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * 3. Domain Participation Donut
   */
  renderDomainParticipationDonut(containerId, domainCounts = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const entries = Object.entries(domainCounts).filter(([_, count]) => count > 0);
    const total = entries.reduce((acc, [_, count]) => acc + count, 0);

    if (total === 0) {
      container.innerHTML = `<div class="chart-empty-state"><p>No domain activity recorded for this period.</p></div>`;
      return;
    }

    const domainColors = {
      "Memory": "#004741",
      "Executive Function": "#2B5854",
      "Attention": "#8C5E1A",
      "Pattern Recognition": "#4A7C59",
      "Reminiscence": "#7A528A"
    };

    const size = 160;
    const strokeWidth = 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let accumulated = 0;
    const circlesSvg = entries.map(([domain, count]) => {
      const color = domainColors[domain] || "#5C768D";
      const stroke = (count / total) * circumference;
      const offset = -accumulated;
      accumulated += stroke;
      const pct = Math.round((count / total) * 100);
      return `<circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="${color}"
        stroke-width="${strokeWidth}" stroke-dasharray="${stroke} ${circumference - stroke}"
        stroke-dashoffset="${offset}" role="graphics-symbol" aria-label="${domain}: ${count} (${pct}%)">
        <title>${domain}: ${count} sessions (${pct}%)</title>
      </circle>`;
    }).join("");

    const legendHtml = entries.map(([domain, count]) => {
      const color = domainColors[domain] || "#5C768D";
      const pct = Math.round((count / total) * 100);
      return `
        <div class="analytics-legend-item">
          <span class="legend-color-dot" style="background:${color};"></span>
          <span class="legend-text"><strong>${domain}:</strong> ${count} (${pct}%)</span>
        </div>
      `;
    }).join("");

    const tableRows = entries.map(([domain, count]) => `
      <tr>
        <th scope="row">${domain}</th>
        <td class="num-cell">${count}</td>
        <td class="num-cell">${Math.round((count / total) * 100)}%</td>
      </tr>
    `).join("");

    container.innerHTML = `
      <div class="chart-header-actions">
        <button type="button" class="btn-chart-toggle" aria-expanded="false" onclick="ClinicalCharts.toggleDataTable('${containerId}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <span>View Data Table</span>
        </button>
      </div>
      <div class="chart-visual-wrapper">
        <div class="donut-chart-layout">
          <div class="donut-svg-holder" style="position: relative; width: ${size}px; height: ${size}px; margin: 0 auto;">
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);" role="img" aria-label="Cognitive domain participation donut chart">
              ${circlesSvg}
            </svg>
            <div class="donut-center-badge">
              <span class="donut-center-val">${total}</span>
              <span class="donut-center-sub">Sessions</span>
            </div>
          </div>
          <div class="analytics-chart-legend">
            ${legendHtml}
          </div>
        </div>
      </div>
      <div class="chart-table-wrapper" style="display:none;">
        <table class="chart-data-table" aria-label="Domain participation data table">
          <thead>
            <tr><th scope="col">Cognitive Domain</th><th scope="col" class="num-cell">Sessions</th><th scope="col" class="num-cell">Share</th></tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * 4. Game-by-Game Accuracy Comparison (Horizontal Bar Chart)
   */
  renderGameAccuracyBar(containerId, gameAccuracies = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!gameAccuracies || gameAccuracies.length === 0) {
      container.innerHTML = `<div class="chart-empty-state"><p>No game data available for accuracy comparison.</p></div>`;
      return;
    }

    const width = 540;
    const rowHeight = 36;
    const headerHeight = 24;
    const height = headerHeight + gameAccuracies.length * rowHeight + 20;
    const labelWidth = 175;
    const barAreaWidth = width - labelWidth - 85;

    const baselineX = labelWidth + barAreaWidth * 0.75;

    const rowsSvg = gameAccuracies.map((g, i) => {
      const y = headerHeight + i * rowHeight;
      const acc = Math.max(0, Math.min(100, g.accuracy || 0));
      const barW = (acc / 100) * barAreaWidth;
      const color = acc >= 75 ? "#35654D" : acc >= 55 ? "#8C5E1A" : "#9E382B";

      return `
        <g class="game-acc-row">
          <!-- Game Name & Domain -->
          <text x="${labelWidth - 10}" y="${y + 16}" font-family="IBM Plex Sans, sans-serif" font-size="11" font-weight="600" fill="#1C2826" text-anchor="end">
            ${g.name}
          </text>
          <text x="${labelWidth - 10}" y="${y + 27}" font-family="IBM Plex Sans, sans-serif" font-size="9" fill="#70807D" text-anchor="end">
            ${g.category}
          </text>

          <!-- Track -->
          <rect x="${labelWidth}" y="${y + 7}" width="${barAreaWidth}" height="14" rx="3" fill="#E8E4D9" />
          <!-- Value Bar -->
          <rect x="${labelWidth}" y="${y + 7}" width="${Math.max(3, barW)}" height="14" rx="3" fill="${color}" role="graphics-symbol" aria-label="${g.name}: ${acc}% accuracy">
            <title>${g.name} (${g.category}): ${acc}% mean accuracy across ${g.sessions} sessions</title>
          </rect>

          <!-- Percentage & Count Label -->
          <text x="${labelWidth + barAreaWidth + 10}" y="${y + 18}" font-family="IBM Plex Mono, monospace" font-size="10" font-weight="600" fill="#1C2826">
            ${acc}% <tspan font-family="IBM Plex Sans" font-size="8.5" font-weight="normal" fill="#70807D">(${g.sessions}s)</tspan>
          </text>
        </g>
      `;
    }).join("");

    const tableRows = gameAccuracies.map(g => `
      <tr>
        <th scope="row">${g.name}</th>
        <td>${g.category}</td>
        <td class="num-cell">${g.accuracy}%</td>
        <td class="num-cell">${g.sessions}</td>
      </tr>
    `).join("");

    container.innerHTML = `
      <div class="chart-header-actions">
        <button type="button" class="btn-chart-toggle" aria-expanded="false" onclick="ClinicalCharts.toggleDataTable('${containerId}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <span>View Data Table</span>
        </button>
      </div>
      <div class="chart-visual-wrapper">
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;" role="img" aria-label="Game accuracy comparison bar chart">
          <!-- 75% Target Reference Line -->
          <line x1="${baselineX}" y1="${headerHeight - 4}" x2="${baselineX}" y2="${height - 10}" stroke="#70807D" stroke-width="1" stroke-dasharray="3,3" />
          <text x="${baselineX}" y="${headerHeight - 8}" font-family="IBM Plex Sans, sans-serif" font-size="8.5" fill="#70807D" text-anchor="middle">
            75% Expected Baseline
          </text>
          ${rowsSvg}
        </svg>
      </div>
      <div class="chart-table-wrapper" style="display:none;">
        <table class="chart-data-table" aria-label="Game accuracy comparison data table">
          <thead>
            <tr><th scope="col">Activity</th><th scope="col">Cognitive Domain</th><th scope="col" class="num-cell">Mean Accuracy</th><th scope="col" class="num-cell">Total Sessions</th></tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * 5. Session Frequency Over Time (Grouped Vertical Bar Chart)
   */
  renderSessionFrequencyBar(containerId, frequencyData = [], groupingLabel = "Period") {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!frequencyData || frequencyData.length === 0) {
      container.innerHTML = `<div class="chart-empty-state"><p>No session frequency records found.</p></div>`;
      return;
    }

    const width = 560;
    const height = 220;
    const margin = { top: 25, right: 25, bottom: 40, left: 45 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const maxCount = Math.max(4, ...frequencyData.map(d => d.count || 0));
    const getY = val => height - margin.bottom - ((val / maxCount) * chartH);

    // Y ticks
    const yTicks = [0, Math.round(maxCount * 0.5), maxCount];
    const gridlinesSvg = yTicks.map(val => {
      const y = getY(val);
      return `
        <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#DDD8CB" stroke-width="0.8" stroke-dasharray="2,2" />
        <text x="${margin.left - 8}" y="${y + 3}" font-family="IBM Plex Mono, monospace" font-size="9" fill="#70807D" text-anchor="end">${val}</text>
      `;
    }).join("");

    const slotWidth = chartW / frequencyData.length;
    const barWidth = Math.max(6, Math.min(24, slotWidth * 0.55));

    const barsSvg = frequencyData.map((d, i) => {
      const centerX = margin.left + i * slotWidth + slotWidth / 2;
      const barX = centerX - barWidth / 2;

      const compCount = d.completed || 0;
      const partialCount = (d.partial || 0) + (d.abandoned || 0);

      const compH = (compCount / maxCount) * chartH;
      const partH = (partialCount / maxCount) * chartH;

      const compY = height - margin.bottom - compH;
      const partY = compY - partH;

      return `
        <g class="freq-bar-group">
          <!-- Partial / Abandoned Bar -->
          ${partialCount > 0 ? `
            <rect x="${barX}" y="${partY}" width="${barWidth}" height="${partH}" rx="2" fill="#8C5E1A" role="graphics-symbol" aria-label="${d.label}: ${partialCount} partial/abandoned">
              <title>${d.label}: ${partialCount} partial/abandoned sessions</title>
            </rect>
          ` : ""}
          <!-- Completed Bar -->
          ${compCount > 0 ? `
            <rect x="${barX}" y="${compY}" width="${barWidth}" height="${compH}" rx="2" fill="#004741" role="graphics-symbol" aria-label="${d.label}: ${compCount} completed">
              <title>${d.label}: ${compCount} completed sessions</title>
            </rect>
          ` : ""}
          <!-- X Axis Label -->
          <text x="${centerX}" y="${height - margin.bottom + 16}" font-family="IBM Plex Sans, sans-serif" font-size="8.5" fill="#4B5A57" text-anchor="middle">
            ${d.label}
          </text>
        </g>
      `;
    }).join("");

    const tableRows = frequencyData.map(d => `
      <tr>
        <th scope="row">${d.label}</th>
        <td class="num-cell">${d.count || 0}</td>
        <td class="num-cell">${d.completed || 0}</td>
        <td class="num-cell">${(d.partial || 0) + (d.abandoned || 0)}</td>
      </tr>
    `).join("");

    container.innerHTML = `
      <div class="chart-header-actions">
        <div class="chart-mini-legend">
          <span class="legend-chip"><span style="background:#004741;"></span> Completed</span>
          <span class="legend-chip"><span style="background:#8C5E1A;"></span> Partial / Early Exit</span>
        </div>
        <button type="button" class="btn-chart-toggle" aria-expanded="false" onclick="ClinicalCharts.toggleDataTable('${containerId}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <span>View Data Table</span>
        </button>
      </div>
      <div class="chart-visual-wrapper">
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;" role="img" aria-label="Session frequency bar chart over time">
          ${gridlinesSvg}
          <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1.2" />
          <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1.2" />
          <!-- Y-Axis Unit -->
          <text transform="rotate(-90)" x="${-(margin.top + chartH / 2)}" y="12" font-family="IBM Plex Sans" font-size="9.5" font-weight="600" fill="#70807D" text-anchor="middle">
            Sessions
          </text>
          ${barsSvg}
        </svg>
      </div>
      <div class="chart-table-wrapper" style="display:none;">
        <table class="chart-data-table" aria-label="Session frequency data table">
          <thead>
            <tr><th scope="col">${groupingLabel}</th><th scope="col" class="num-cell">Total Sessions</th><th scope="col" class="num-cell">Completed</th><th scope="col" class="num-cell">Partial / Abandoned</th></tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * 6. Accuracy Trajectory Over Time (Line Chart with Area Fill)
   */
  renderAccuracyTrajectoryLine(containerId, trajectoryData = [], groupingLabel = "Period") {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!trajectoryData || trajectoryData.length === 0) {
      container.innerHTML = `<div class="chart-empty-state"><p>No accuracy trajectory points available.</p></div>`;
      return;
    }

    const width = 560;
    const height = 220;
    const margin = { top: 25, right: 25, bottom: 40, left: 45 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const getY = val => height - margin.bottom - ((val / 100) * chartH);

    // Gridlines for 0, 25, 50, 75, 100
    const yTicks = [0, 25, 50, 75, 100];
    const gridlinesSvg = yTicks.map(val => {
      const y = getY(val);
      const isBaseline = val === 75;
      return `
        <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="${isBaseline ? '#70807D' : '#DDD8CB'}" stroke-width="${isBaseline ? 1.1 : 0.8}" stroke-dasharray="${isBaseline ? '3,3' : '2,2'}" />
        <text x="${margin.left - 8}" y="${y + 3}" font-family="IBM Plex Mono, monospace" font-size="9" fill="${isBaseline ? '#004741' : '#70807D'}" font-weight="${isBaseline ? '600' : 'normal'}" text-anchor="end">${val}%</text>
      `;
    }).join("");

    const points = trajectoryData.map((d, i) => {
      const x = trajectoryData.length === 1
        ? margin.left + chartW / 2
        : margin.left + (i / (trajectoryData.length - 1)) * chartW;
      const y = getY(d.accuracy);
      return { x, y, data: d };
    });

    let pathD = "";
    let areaD = "";
    if (points.length === 1) {
      pathD = `M ${points[0].x - 15} ${points[0].y} L ${points[0].x + 15} ${points[0].y}`;
      areaD = `M ${points[0].x - 15} ${height - margin.bottom} L ${points[0].x - 15} ${points[0].y} L ${points[0].x + 15} ${points[0].y} L ${points[0].x + 15} ${height - margin.bottom} Z`;
    } else {
      pathD = points.reduce((acc, pt, i) => i === 0 ? `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, "");
      areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${height - margin.bottom} L ${points[0].x.toFixed(1)},${height - margin.bottom} Z`;
    }

    const circlesSvg = points.map(pt => `
      <g class="trajectory-pt">
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="4" fill="#004741" stroke="#FFFFFF" stroke-width="2" role="graphics-symbol" aria-label="${pt.data.label}: ${pt.data.accuracy}% accuracy">
          <title>${pt.data.label}: ${pt.data.accuracy}% mean accuracy (${pt.data.sessionCount || 1} sessions)</title>
        </circle>
        <text x="${pt.x.toFixed(1)}" y="${height - margin.bottom + 16}" font-family="IBM Plex Sans, sans-serif" font-size="8.5" fill="#4B5A57" text-anchor="middle">
          ${pt.data.label}
        </text>
      </g>
    `).join("");

    const tableRows = trajectoryData.map(d => `
      <tr>
        <th scope="row">${d.label}</th>
        <td class="num-cell">${d.accuracy}%</td>
        <td class="num-cell">${d.sessionCount || 1}</td>
      </tr>
    `).join("");

    const gradId = `accGrad-${containerId}`;

    container.innerHTML = `
      <div class="chart-header-actions">
        <div class="chart-mini-legend">
          <span class="legend-chip"><span style="background:#004741;"></span> Mean Accuracy</span>
          <span class="legend-chip"><span style="background:#70807D; border-top:1px dashed #70807D; height:1px;"></span> 75% Baseline</span>
        </div>
        <button type="button" class="btn-chart-toggle" aria-expanded="false" onclick="ClinicalCharts.toggleDataTable('${containerId}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <span>View Data Table</span>
        </button>
      </div>
      <div class="chart-visual-wrapper">
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;" role="img" aria-label="Accuracy trajectory line chart over time">
          <defs>
            <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#004741" stop-opacity="0.28" />
              <stop offset="100%" stop-color="#004741" stop-opacity="0.02" />
            </linearGradient>
          </defs>
          ${gridlinesSvg}
          <path d="${areaD}" fill="url(#${gradId})" />
          <path d="${pathD}" fill="none" stroke="#004741" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1.2" />
          <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1.2" />
          <!-- Y-Axis Unit -->
          <text transform="rotate(-90)" x="${-(margin.top + chartH / 2)}" y="12" font-family="IBM Plex Sans" font-size="9.5" font-weight="600" fill="#70807D" text-anchor="middle">
            Accuracy %
          </text>
          ${circlesSvg}
        </svg>
      </div>
      <div class="chart-table-wrapper" style="display:none;">
        <table class="chart-data-table" aria-label="Accuracy trajectory data table">
          <thead>
            <tr><th scope="col">${groupingLabel}</th><th scope="col" class="num-cell">Mean Accuracy</th><th scope="col" class="num-cell">Sessions</th></tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * 7. Duration Trajectory Over Time (Line Chart)
   */
  renderDurationTrajectoryLine(containerId, durationData = [], groupingLabel = "Period") {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!durationData || durationData.length === 0) {
      container.innerHTML = `<div class="chart-empty-state"><p>No session duration data recorded.</p></div>`;
      return;
    }

    const width = 560;
    const height = 220;
    const margin = { top: 25, right: 25, bottom: 40, left: 45 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const maxMins = Math.max(3, ...durationData.map(d => d.durationMins || 1));
    const getY = val => height - margin.bottom - ((val / maxMins) * chartH);

    const yTicks = [0, +(maxMins * 0.5).toFixed(1), +maxMins.toFixed(1)];
    const gridlinesSvg = yTicks.map(val => {
      const y = getY(val);
      return `
        <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#DDD8CB" stroke-width="0.8" stroke-dasharray="2,2" />
        <text x="${margin.left - 8}" y="${y + 3}" font-family="IBM Plex Mono, monospace" font-size="9" fill="#70807D" text-anchor="end">${val}m</text>
      `;
    }).join("");

    const points = durationData.map((d, i) => {
      const x = durationData.length === 1
        ? margin.left + chartW / 2
        : margin.left + (i / (durationData.length - 1)) * chartW;
      const y = getY(d.durationMins);
      return { x, y, data: d };
    });

    let pathD = "";
    let areaD = "";
    if (points.length === 1) {
      pathD = `M ${points[0].x - 15} ${points[0].y} L ${points[0].x + 15} ${points[0].y}`;
      areaD = `M ${points[0].x - 15} ${height - margin.bottom} L ${points[0].x - 15} ${points[0].y} L ${points[0].x + 15} ${points[0].y} L ${points[0].x + 15} ${height - margin.bottom} Z`;
    } else {
      pathD = points.reduce((acc, pt, i) => i === 0 ? `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, "");
      areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${height - margin.bottom} L ${points[0].x.toFixed(1)},${height - margin.bottom} Z`;
    }

    const circlesSvg = points.map(pt => `
      <g class="duration-pt">
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="3.75" fill="#2B5854" stroke="#FFFFFF" stroke-width="2" role="graphics-symbol" aria-label="${pt.data.label}: ${pt.data.durationMins} minutes">
          <title>${pt.data.label}: ${pt.data.durationMins} mins duration</title>
        </circle>
        <text x="${pt.x.toFixed(1)}" y="${height - margin.bottom + 16}" font-family="IBM Plex Sans, sans-serif" font-size="8.5" fill="#4B5A57" text-anchor="middle">
          ${pt.data.label}
        </text>
      </g>
    `).join("");

    const tableRows = durationData.map(d => `
      <tr>
        <th scope="row">${d.label}</th>
        <td class="num-cell">${d.durationMins} min</td>
      </tr>
    `).join("");

    const gradId = `durGrad-${containerId}`;

    container.innerHTML = `
      <div class="chart-header-actions">
        <button type="button" class="btn-chart-toggle" aria-expanded="false" onclick="ClinicalCharts.toggleDataTable('${containerId}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <span>View Data Table</span>
        </button>
      </div>
      <div class="chart-visual-wrapper">
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;" role="img" aria-label="Session duration trajectory line chart over time">
          <defs>
            <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2B5854" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#2B5854" stop-opacity="0.02" />
            </linearGradient>
          </defs>
          ${gridlinesSvg}
          <path d="${areaD}" fill="url(#${gradId})" />
          <path d="${pathD}" fill="none" stroke="#2B5854" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1.2" />
          <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1.2" />
          <text transform="rotate(-90)" x="${-(margin.top + chartH / 2)}" y="12" font-family="IBM Plex Sans" font-size="9.5" font-weight="600" fill="#70807D" text-anchor="middle">
            Minutes
          </text>
          ${circlesSvg}
        </svg>
      </div>
      <div class="chart-table-wrapper" style="display:none;">
        <table class="chart-data-table" aria-label="Session duration trajectory data table">
          <thead>
            <tr><th scope="col">${groupingLabel}</th><th scope="col" class="num-cell">Session Duration (min)</th></tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * 8. Response Latency Trajectory Over Time (Line Chart)
   */
  renderLatencyTrajectoryLine(containerId, latencyData = [], groupingLabel = "Period") {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!latencyData || latencyData.length === 0) {
      container.innerHTML = `<div class="chart-empty-state"><p>No latency telemetry recorded.</p></div>`;
      return;
    }

    const width = 560;
    const height = 220;
    const margin = { top: 25, right: 25, bottom: 40, left: 45 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const maxSecs = Math.max(4, ...latencyData.map(d => d.latencySecs || 2.5));
    const getY = val => height - margin.bottom - ((val / maxSecs) * chartH);

    const yTicks = [0, +(maxSecs * 0.5).toFixed(1), +maxSecs.toFixed(1)];
    const gridlinesSvg = yTicks.map(val => {
      const y = getY(val);
      return `
        <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#DDD8CB" stroke-width="0.8" stroke-dasharray="2,2" />
        <text x="${margin.left - 8}" y="${y + 3}" font-family="IBM Plex Mono, monospace" font-size="9" fill="#70807D" text-anchor="end">${val}s</text>
      `;
    }).join("");

    const baselineY = getY(2.5);

    const points = latencyData.map((d, i) => {
      const x = latencyData.length === 1
        ? margin.left + chartW / 2
        : margin.left + (i / (latencyData.length - 1)) * chartW;
      const y = getY(d.latencySecs);
      return { x, y, data: d };
    });

    let pathD = "";
    let areaD = "";
    if (points.length === 1) {
      pathD = `M ${points[0].x - 15} ${points[0].y} L ${points[0].x + 15} ${points[0].y}`;
      areaD = `M ${points[0].x - 15} ${height - margin.bottom} L ${points[0].x - 15} ${points[0].y} L ${points[0].x + 15} ${points[0].y} L ${points[0].x + 15} ${height - margin.bottom} Z`;
    } else {
      pathD = points.reduce((acc, pt, i) => i === 0 ? `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, "");
      areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${height - margin.bottom} L ${points[0].x.toFixed(1)},${height - margin.bottom} Z`;
    }

    const circlesSvg = points.map(pt => `
      <g class="latency-pt">
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="3.75" fill="#8C5E1A" stroke="#FFFFFF" stroke-width="2" role="graphics-symbol" aria-label="${pt.data.label}: ${pt.data.latencySecs} seconds">
          <title>${pt.data.label}: ${pt.data.latencySecs}s mean response time</title>
        </circle>
        <text x="${pt.x.toFixed(1)}" y="${height - margin.bottom + 16}" font-family="IBM Plex Sans, sans-serif" font-size="8.5" fill="#4B5A57" text-anchor="middle">
          ${pt.data.label}
        </text>
      </g>
    `).join("");

    const tableRows = latencyData.map(d => `
      <tr>
        <th scope="row">${d.label}</th>
        <td class="num-cell">${d.latencySecs}s</td>
      </tr>
    `).join("");

    const gradId = `latGrad-${containerId}`;

    container.innerHTML = `
      <div class="chart-header-actions">
        <div class="chart-mini-legend">
          <span class="legend-chip"><span style="background:#8C5E1A;"></span> Mean Latency</span>
          <span class="legend-chip"><span style="background:#70807D; border-top:1px dashed #70807D; height:1px;"></span> 2.5s Target Baseline</span>
        </div>
        <button type="button" class="btn-chart-toggle" aria-expanded="false" onclick="ClinicalCharts.toggleDataTable('${containerId}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <span>View Data Table</span>
        </button>
      </div>
      <div class="chart-visual-wrapper">
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;" role="img" aria-label="Response latency trajectory line chart over time">
          <defs>
            <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#8C5E1A" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#8C5E1A" stop-opacity="0.02" />
            </linearGradient>
          </defs>
          ${gridlinesSvg}
          <!-- 2.5s Target Baseline -->
          <line x1="${margin.left}" y1="${baselineY}" x2="${width - margin.right}" y2="${baselineY}" stroke="#70807D" stroke-width="1" stroke-dasharray="3,3" />
          <path d="${areaD}" fill="url(#${gradId})" />
          <path d="${pathD}" fill="none" stroke="#8C5E1A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1.2" />
          <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#DDD8CB" stroke-width="1.2" />
          <text transform="rotate(-90)" x="${-(margin.top + chartH / 2)}" y="12" font-family="IBM Plex Sans" font-size="9.5" font-weight="600" fill="#70807D" text-anchor="middle">
            Latency (sec)
          </text>
          ${circlesSvg}
        </svg>
      </div>
      <div class="chart-table-wrapper" style="display:none;">
        <table class="chart-data-table" aria-label="Response latency trajectory data table">
          <thead>
            <tr><th scope="col">${groupingLabel}</th><th scope="col" class="num-cell">Mean Response Latency</th></tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }
};

