const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('landing.html', 'utf8');
const js = fs.readFileSync('js/landing.js', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (err) => { console.error("Console error:", err); });
virtualConsole.on("warn", (warn) => { console.warn("Console warn:", warn); });
virtualConsole.on("log", (log) => { console.log("Console log:", log); });

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  url: "http://localhost:3000/landing.html",
  virtualConsole
});

const { window } = dom;
const { document } = window;

// Polyfill matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

try {
  // Execute landing.js
  const scriptEl = document.createElement("script");
  scriptEl.textContent = js;
  document.body.appendChild(scriptEl);

  console.log("landing.js executed successfully");

  // Now simulate click on header patient login button
  const headerBtn = document.getElementById("btn-header-patient-login");
  const portalBtn = document.getElementById("portal-patient");
  const modal = document.getElementById("patient-login-modal-backdrop");

  console.log("headerBtn exists:", !!headerBtn);
  console.log("portalBtn exists:", !!portalBtn);
  console.log("modal exists:", !!modal);
  console.log("modal class before click:", modal.className);

  headerBtn.click();

  console.log("After headerBtn click:");
  console.log("modal class:", modal.className);
  console.log("body overflow:", document.body.style.overflow);
  console.log("captcha text:", document.getElementById("patient-captcha-text")?.textContent);

  // Close modal
  const cancelBtn = document.getElementById("btn-cancel-patient-modal");
  cancelBtn.click();
  console.log("After cancel click - modal class:", modal.className, "body overflow:", document.body.style.overflow);

  // Click portal card
  portalBtn.click();
  console.log("After portalBtn click - modal class:", modal.className, "body overflow:", document.body.style.overflow);

} catch (e) {
  console.error("Execution error:", e);
}
