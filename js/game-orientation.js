/**
 * REALITY ORIENTATION BOARD — CST Principle
 * A low-complexity, non-evaluative daily orientation module.
 * Displays day, date, time-of-day greeting, and seasonal regional context.
 * Kept strictly under 60 lines.
 */

const GameOrientation = {
  getSeason(month) {
    if (month >= 2 && month <= 4) return "Spring (Pre-Monsoon)";
    if (month >= 5 && month <= 8) return "Monsoon Season";
    if (month >= 9 && month <= 10) return "Autumn Season";
    return "Winter Season";
  },

  getTimeGreeting(hour) {
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  },

  render(containerId = "orientation-board-container", patient = null) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const now = new Date();
    const dayName = now.toLocaleDateString([], { weekday: "long" });
    const fullDate = now.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
    const greeting = this.getTimeGreeting(now.getHours());
    const season = this.getSeason(now.getMonth());
    const firstName = (patient && patient.name) ? patient.name.split(" ")[0] : "Friend";
    const region = (patient && patient.district) ? `${patient.district}, Assam` : "Assam & Northeast India";

    el.innerHTML = `
      <div class="patient-orientation-card" role="region" aria-label="Today's Orientation Board" style="margin-bottom: 22px;">
        <div class="orientation-time-block">
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-brand-primary); font-weight: 700;">
            🗓️ Today's Reality Orientation
          </div>
          <div class="orientation-live-clock" style="font-size: 1.875rem;">
            ${greeting}, ${firstName}!
          </div>
          <div class="orientation-full-date" style="font-size: 1.125rem;">
            Today is <strong>${dayName}</strong>, ${fullDate}
          </div>
          <div class="orientation-weather-chip">
            <span>🌿</span>
            <span>It's ${season} in ${region}</span>
          </div>
        </div>
      </div>
    `;
  }
};
