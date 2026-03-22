const fs = require('fs');
const path = require('path');

const themeCssPath = path.join(__dirname, 'theme.css');
const themeCss = fs.readFileSync(themeCssPath, 'utf8');
const DESKTOP_CHROME_ID = 'macx-desktop-chrome';
const DESKTOP_DRAG_HEIGHT = '38px';

function applyTheme() {
  const existing = document.getElementById('claude-warm-theme');
  if (existing) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'claude-warm-theme';
  style.textContent = themeCss;
  document.head.appendChild(style);
}

function applyDesktopChrome() {
  document.documentElement.style.setProperty('--macx-topbar-height', DESKTOP_DRAG_HEIGHT);

  if (document.getElementById(DESKTOP_CHROME_ID)) {
    return;
  }

  const chrome = document.createElement('div');
  chrome.id = DESKTOP_CHROME_ID;
  chrome.setAttribute('aria-hidden', 'true');
  document.body.prepend(chrome);
}

window.addEventListener('DOMContentLoaded', applyTheme);
window.addEventListener('DOMContentLoaded', applyDesktopChrome);

const observer = new MutationObserver(() => {
  if (!document.getElementById('claude-warm-theme')) {
    applyTheme();
  }

  if (!document.getElementById(DESKTOP_CHROME_ID)) {
    applyDesktopChrome();
  }
});

window.addEventListener('load', () => {
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
});
