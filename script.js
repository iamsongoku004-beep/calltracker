// ===== PARTICLES =====
const particlesContainer = document.getElementById('particles');
for (let i = 0; i < 40; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  p.style.left = Math.random() * 100 + 'vw';
  p.style.animationDelay = Math.random() * 18 + 's';
  p.style.animationDuration = (12 + Math.random() * 12) + 's';
  const colors = ['var(--accent-blue)', 'var(--accent-cyan)', 'var(--accent-purple)', 'var(--accent-pink)'];
  p.style.background = colors[Math.floor(Math.random() * colors.length)];
  p.style.boxShadow = `0 0 6px ${p.style.background}`;
  particlesContainer.appendChild(p);
}

// ===== PARTICLE BURST ON CLICK =====
function burstParticles(e, colorType) {
  const colors = {
    green: ['#10b981', '#34d399', '#059669'],
    red: ['#ef4444', '#f87171', '#dc2626'],
    purple: ['#8b5cf6', '#a78bfa', '#7c3aed'],
    blue: ['#3b82f6', '#60a5fa', '#2563eb']
  };
  const palette = colors[colorType] || colors.blue;
  const burst = document.createElement('div');
  burst.className = 'particle-burst';
  burst.style.left = e.clientX + 'px';
  burst.style.top = e.clientY + 'px';
  document.body.appendChild(burst);

  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('div');
    particle.className = 'burst-particle';
    particle.style.background = palette[Math.floor(Math.random() * palette.length)];
    particle.style.boxShadow = `0 0 8px ${particle.style.background}`;
    const angle = (Math.PI * 2 * i) / 12;
    const distance = 40 + Math.random() * 40;
    particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
    particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
    burst.appendChild(particle);
  }

  setTimeout(() => burst.remove(), 700);
}

// ===== RING PARTICLES =====
function spawnRingParticles() {
  const container = document.getElementById('ringParticles');
  if (!container) return;
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div');
    p.className = 'ring-particle';
    p.style.background = 'var(--accent-blue)';
    p.style.boxShadow = '0 0 8px var(--accent-blue)';
    const angle = (Math.PI * 2 * i) / 6;
    const r = 90 + Math.random() * 20;
    p.style.left = (130 + Math.cos(angle) * r) + 'px';
    p.style.top = (130 + Math.sin(angle) * r) + 'px';
    p.style.animation = `ringParticleFloat 2s ease-out ${i * 0.2}s forwards`;
    container.appendChild(p);
    setTimeout(() => p.remove(), 2500);
  }
}

// ===== GLASS MODE TOGGLE =====
function toggleGlassMode() {
  document.body.classList.toggle('glass-mode');
  const btn = document.getElementById('glassToggle');
  btn.classList.toggle('active');
  localStorage.setItem('callTracker_glassMode', document.body.classList.contains('glass-mode'));
}

// Load saved glass mode
const savedGlassMode = localStorage.getItem('callTracker_glassMode');
if (savedGlassMode === 'true') {
  document.body.classList.add('glass-mode');
  document.getElementById('glassToggle').classList.add('active');
}

// ===== DOM ELEMENTS =====
const currentPctInput = document.getElementById('currentPct');
const callsInput = document.getElementById('callsHandled');
const releaseStatsEl = document.getElementById('release-stats');
const dropStatsEl = document.getElementById('drop-stats');
const callsStatsEl = document.getElementById('calls-stats');
const ringSvg = document.getElementById('scoreRingSvg');
const ringFill = document.getElementById('scoreRingFill');
const ringPercentage = document.getElementById('ringPercentage');
const ringStatus = document.getElementById('ringStatus');
const targetBox = document.getElementById('targetBox');
const targetValue = document.getElementById('targetValue');
const targetDetail = document.getElementById('targetDetail');
const progressFill = document.getElementById('progressFill');
const CIRCUMFERENCE = 2 * Math.PI * 82;

// ===== SOURCE OF TRUTH =====
let stats = { release: 0, drop: 0 };
let expectedPct = '';
let expectedCalls = '';
let streakCount = 0;
let eightyFiveTriggered = false;

// ===== HELPER FUNCTIONS =====
function getVal(el) {
  const v = parseFloat(el.value);
  return isNaN(v) || v < 0 ? null : v;
}

function markAuto(el) { el.classList.add('auto-calculated'); }
function markManual(el) { el.classList.remove('auto-calculated'); }

function getCalls() {
  return stats.release + stats.drop;
}

function calcPercentage() {
  const total = stats.release + stats.drop;
  if (total === 0) return 0;
  return (stats.release / total) * 100;
}

function calcFromPercentage(percentage, calls) {
  const p = Math.min(Math.max(percentage, 0), 100) / 100;
  const releases = Math.round(calls * p);
  const drops = calls - releases;
  return { drops: Math.max(0, drops), releases: Math.max(0, releases) };
}

// ===== UPDATE RING =====
function updateRing(percentage, status) {
  const pct = Math.min(Math.max(percentage, 0), 100);
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  ringFill.style.strokeDashoffset = offset;

  let color = '#3b82f6';
  let glowClass = '';
  if (status === 'pass') { color = '#10b981'; glowClass = 'pass'; }
  else if (status === 'warning') { color = '#f59e0b'; glowClass = 'warning'; }
  else if (status === 'fail') { color = '#ef4444'; glowClass = 'fail'; }

  ringFill.style.stroke = color;
  ringSvg.className = 'score-ring-svg ' + glowClass;
  ringPercentage.style.color = color;
  ringPercentage.textContent = pct.toFixed(1) + '%';

  ringStatus.textContent = status === 'pass' ? 'PASS' : status === 'warning' ? 'WARNING' : status === 'fail' ? 'FAIL' : 'START';
  ringStatus.style.background = color;
  ringStatus.style.color = status === 'warning' ? '#1a1a2e' : 'white';

  document.querySelector('.orb-1').className = 'bg-orb orb-1 orb-' + (status || 'start');
  document.querySelector('.orb-2').className = 'bg-orb orb-2 orb-' + (status || 'start');
  document.querySelector('.orb-3').className = 'bg-orb orb-3 orb-' + (status || 'start');

  updateAppGlow(status);

  if (status !== 'start') {
    spawnRingParticles();
  }
}

function updateAppGlow(status) {
  const glow = document.getElementById('appGlow');
  glow.className = 'app-glow';
  if (status === 'pass') glow.classList.add('active-pass');
  else if (status === 'warning') glow.classList.add('active-warning');
  else if (status === 'fail') glow.classList.add('active-fail');
}

function animateNumber(element, newValue) {
  element.classList.add('animate-number');
  element.textContent = newValue;
  setTimeout(() => element.classList.remove('animate-number'), 400);
}

// ===== UPDATE PROGRESS BAR =====
function updateProgressBar(percentage) {
  const pct = Math.min(Math.max(percentage || 0, 0), 100);
  progressFill.style.width = pct + '%';
  progressFill.style.background = pct >= 75 ? 'var(--accent-green)' : pct >= 70 ? 'var(--accent-yellow)' : 'var(--accent-red)';
}

// ===== STREAK TRACKING =====
function updateStreak() {
  const banner = document.getElementById('streakBanner');
  const countEl = document.getElementById('streakCount');
  if (streakCount >= 3) {
    banner.classList.add('active');
    countEl.textContent = streakCount;
  } else {
    banner.classList.remove('active');
  }
}

// ===== CONFETTI =====
function burstConfetti() {
  const container = document.getElementById('confettiContainer');
  const colors = ['#3b82f6', '#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (4 + Math.random() * 8) + 'px';
    piece.style.height = (4 + Math.random() * 8) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDuration = (2 + Math.random() * 3) + 's';
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 5500);
  }
}

// ===== TARGET CALCULATION =====
function calculateTarget(drop, release, currentPercentage) {
  const target = 85;

  if (drop === 0 && release === 0) {
    targetBox.className = 'target-box';
    targetValue.textContent = 'Start tracking';
    targetValue.style.color = '';
    targetDetail.textContent = 'Enter metrics above to see your progress toward 75%';
    return;
  }

  if (currentPercentage >= target) {
    targetBox.className = 'target-box on-track';
    const buffer = ((currentPercentage - target) / 100 * (drop + release)).toFixed(1);
    targetValue.textContent = 'Above 75%!';
    targetDetail.textContent = "You're " + (currentPercentage - target).toFixed(1) + "% above target (" + buffer + " call buffer)";
    return;
  }

  const total = drop + release;
  const needed = Math.ceil((0.85 * total - release) / 0.15);

  if (needed <= 0) {
    targetBox.className = 'target-box on-track';
    targetValue.textContent = 'On Track!';
    targetDetail.textContent = "Current: " + currentPercentage.toFixed(1) + "% - maintain your ratio";
  } else {
    const projectedTotal = total + needed;
    const projectedPct = ((release + needed) / projectedTotal * 100);

    if (currentPercentage >= 80) {
      targetBox.className = 'target-box needs-work';
      targetValue.textContent = 'Need ' + needed + ' more release' + (needed > 1 ? 's' : '');
      targetDetail.textContent = 'Projected: ' + projectedPct.toFixed(1) + '% after ' + needed + ' more release' + (needed > 1 ? 's' : '') + ' (no more drops)';
    } else {
      targetBox.className = 'target-box critical';
      targetValue.textContent = 'Need ' + needed + ' more release' + (needed > 1 ? 's' : '');
      targetDetail.textContent = 'Critical: ' + projectedPct.toFixed(1) + '% after ' + needed + ' more release' + (needed > 1 ? 's' : '') + ' (no more drops)';
    }
  }
}

// ===== MAIN RENDER =====
function render() {
  const d = stats.drop;
  const r = stats.release;
  const c = getCalls();
  const total = d + r;
  const percentage = total > 0 ? (r / total) * 100 : 0;

  if (percentage >= 85 && !eightyFiveTriggered && total > 0) {
    eightyFiveTriggered = true;
    burstConfetti();
  }

  updateStreak();

  if (parseInt(releaseStatsEl.textContent) !== r) animateNumber(releaseStatsEl, r);
  else releaseStatsEl.textContent = r;
  if (parseInt(dropStatsEl.textContent) !== d) animateNumber(dropStatsEl, d);
  else dropStatsEl.textContent = d;
  if (parseInt(callsStatsEl.textContent) !== c) animateNumber(callsStatsEl, c);
  else callsStatsEl.textContent = c;

  const newPct = total > 0 ? percentage.toFixed(1) : '';
  const newCalls = c > 0 ? String(c) : '';

  if (currentPctInput.value === expectedPct) {
    currentPctInput.value = newPct;
    expectedPct = newPct;
    markAuto(currentPctInput);
  }

  if (callsInput.value === expectedCalls) {
    callsInput.value = newCalls;
    expectedCalls = newCalls;
    markAuto(callsInput);
  }

  let status = 'start';
  if (d === 0 && r === 0) status = 'start';
  else if (percentage >= 75) status = 'pass';
  else if (percentage >= 70) status = 'warning';
  else status = 'fail';

  updateRing(percentage, status);
  calculateTarget(d, r, percentage);
  updateProgressBar(percentage);
}

// ===== +/- BUTTONS =====
function updateStatsValue(type, change) {
  if (type === 'release') {
    stats.release = Math.max(0, stats.release + change);
    if (change > 0) {
      streakCount++;
    }
  } else if (type === 'drop') {
    stats.drop = Math.max(0, stats.drop + change);
    if (change > 0) {
      streakCount = 0;
    }
  } else if (type === 'calls') {
    if (change > 0) {
      stats.release += 1;
      streakCount++;
    } else {
      if (stats.release > stats.drop) {
        stats.release = Math.max(0, stats.release - 1);
      } else {
        stats.drop = Math.max(0, stats.drop - 1);
        if (stats.drop === 0) streakCount = stats.release;
      }
    }
  }
  expectedPct = currentPctInput.value;
  expectedCalls = callsInput.value;
  render();
}

// ===== INPUT HANDLER =====
function handleInput(e) {
  const pct = getVal(currentPctInput);
  const calls = getVal(callsInput);

  if (pct !== null && calls !== null && calls > 0) {
    const result = calcFromPercentage(pct, calls);
    stats.release = result.releases;
    stats.drop = result.drops;
  } else if (pct !== null) {
    const currentTotal = stats.release + stats.drop;
    if (currentTotal > 0) {
      const result = calcFromPercentage(pct, currentTotal);
      stats.release = result.releases;
      stats.drop = result.drops;
    }
  } else if (calls !== null && calls > 0) {
    const currentTotal = stats.release + stats.drop;
    if (currentTotal > 0) {
      const ratio = stats.release / currentTotal;
      stats.release = Math.round(calls * ratio);
      stats.drop = Math.max(0, calls - stats.release);
    } else {
      stats.release = calls;
      stats.drop = 0;
    }
  } else if (calls === 0) {
    stats.release = 0;
    stats.drop = 0;
  } else if (pct === null && calls === null) {
    stats.release = 0;
    stats.drop = 0;
  }

  render();
}

// ===== RESET ALL =====
function resetAll() {
  stats = { release: 0, drop: 0 };
  expectedPct = '';
  expectedCalls = '';
  currentPctInput.value = '';
  callsInput.value = '';
  markManual(currentPctInput);
  markManual(callsInput);
  streakCount = 0;
  eightyFiveTriggered = false;

  ringFill.style.strokeDashoffset = CIRCUMFERENCE;
  ringFill.style.stroke = 'url(#ringGrad)';
  ringSvg.className = 'score-ring-svg';
  ringPercentage.style.color = '';
  ringPercentage.textContent = '0.0%';
  ringStatus.textContent = 'START';
  ringStatus.style.background = '';
  ringStatus.style.color = '';

  targetBox.className = 'target-box';
  targetValue.textContent = 'Start tracking';
  targetValue.style.color = '';
  targetDetail.textContent = 'Enter metrics above to see your progress';

  progressFill.style.width = '0%';
  progressFill.style.background = 'var(--accent-blue)';

  document.getElementById('streakBanner').classList.remove('active');
  document.getElementById('streakCount').textContent = '0';

  document.querySelector('.orb-1').className = 'bg-orb orb-1 orb-start';
  document.querySelector('.orb-2').className = 'bg-orb orb-2 orb-start';
  document.querySelector('.orb-3').className = 'bg-orb orb-3 orb-start';

  document.getElementById('appGlow').className = 'app-glow';

  releaseStatsEl.textContent = '0';
  dropStatsEl.textContent = '0';
  callsStatsEl.textContent = '0';

  render();
}

// ===== EVENT LISTENERS =====
currentPctInput.addEventListener('input', handleInput);
currentPctInput.addEventListener('change', handleInput);
callsInput.addEventListener('input', handleInput);
callsInput.addEventListener('change', handleInput);

[currentPctInput, callsInput].forEach(input => {
  input.addEventListener('wheel', (e) => {
    if (document.activeElement === input) e.preventDefault();
  }, { passive: false });
});

// ===== INIT =====
render();

// ============================================================
// NPS CALCULATOR
// ============================================================

const npsRingSvg = document.getElementById('npsRingSvg');
const npsRingFill = document.getElementById('npsRingFill');
const npsRingPercentage = document.getElementById('npsRingPercentage');
const npsRingStatus = document.getElementById('npsRingStatus');
const npsTargetBox = document.getElementById('npsTargetBox');
const npsTargetValue = document.getElementById('npsTargetValue');
const npsTargetDetail = document.getElementById('npsTargetDetail');
const npsProgressFill = document.getElementById('npsProgressFill');

const NPS_CIRCUMFERENCE = 2 * Math.PI * 82;
const NPS_TARGET = 75;
const PROMOTERS_PER_NEUTRAL = 4;
const PROMOTERS_PER_DSAT = 7;

let npsStats = { promoter: 0, neutral: 0, dsat: 0 };
let npsStreakCount = 0;
let npsEightyFiveTriggered = false;

function getNpsTotal() {
  return npsStats.promoter + npsStats.neutral + npsStats.dsat;
}

function calcNps() {
  const total = getNpsTotal();
  if (total === 0) return 0;
  // Simple percentage: Promoters / Total * 100
  return (npsStats.promoter / total) * 100;
}

function calcPromotersNeeded() {
  // Compensation rule: each Neutral needs 4 Promoters, each DSAT needs 7 Promoters
  const needed = (4 * npsStats.neutral) + (7 * npsStats.dsat);
  return Math.max(0, needed - npsStats.promoter);
}

function updateNpsRing(percentage, status) {
  const pct = Math.min(Math.max(percentage, 0), 100);
  const offset = NPS_CIRCUMFERENCE - (pct / 100) * NPS_CIRCUMFERENCE;
  npsRingFill.style.strokeDashoffset = offset;

  let color = '#3b82f6';
  let glowClass = '';
  if (status === 'pass') { color = '#10b981'; glowClass = 'pass'; }
  else if (status === 'warning') { color = '#f59e0b'; glowClass = 'warning'; }
  else if (status === 'fail') { color = '#ef4444'; glowClass = 'fail'; }

  npsRingFill.style.stroke = color;
  npsRingSvg.className = 'score-ring-svg ' + glowClass;
  npsRingPercentage.style.color = color;
  npsRingPercentage.textContent = pct.toFixed(1) + '%';

  npsRingStatus.textContent = status === 'pass' ? 'PASS' : status === 'warning' ? 'WARNING' : status === 'fail' ? 'FAIL' : 'START';
  npsRingStatus.style.background = color;
  npsRingStatus.style.color = status === 'warning' ? '#1a1a2e' : 'white';

  if (status !== 'start') {
    const container = document.getElementById('npsRingParticles');
    if (container) {
      for (let i = 0; i < 6; i++) {
        const p = document.createElement('div');
        p.className = 'ring-particle';
        p.style.background = 'var(--accent-blue)';
        p.style.boxShadow = '0 0 8px var(--accent-blue)';
        const angle = (Math.PI * 2 * i) / 6;
        const r = 90 + Math.random() * 20;
        p.style.left = (130 + Math.cos(angle) * r) + 'px';
        p.style.top = (130 + Math.sin(angle) * r) + 'px';
        p.style.animation = `ringParticleFloat 2s ease-out ${i * 0.2}s forwards`;
        container.appendChild(p);
        setTimeout(() => p.remove(), 2500);
      }
    }
  }
}

function updateNpsProgressBar(percentage) {
  const pct = Math.min(Math.max(percentage || 0, 0), 100);
  npsProgressFill.style.width = pct + '%';
  npsProgressFill.style.background = pct >= 75 ? 'var(--accent-green)' : pct >= 70 ? 'var(--accent-yellow)' : 'var(--accent-red)';
}

function updateNpsStreak() {
  const banner = document.getElementById('npsStreakBanner');
  const countEl = document.getElementById('npsStreakCount');
  if (npsStreakCount >= 3) {
    banner.classList.add('active');
    countEl.textContent = npsStreakCount;
  } else {
    banner.classList.remove('active');
  }
}

function calculateNpsTarget() {
  const total = getNpsTotal();
  const percentage = calcNps();

  if (total === 0) {
    npsTargetBox.className = 'target-box';
    npsTargetValue.textContent = 'Start tracking';
    npsTargetValue.style.color = '';
    npsTargetDetail.textContent = 'Enter metrics to see your progress toward 75%';
    return;
  }

  if (percentage >= NPS_TARGET) {
    npsTargetBox.className = 'target-box on-track';
    const buffer = (percentage - NPS_TARGET).toFixed(1);
    npsTargetValue.textContent = 'Above 75%!';
    npsTargetValue.style.color = 'var(--accent-green)';
    npsTargetDetail.textContent = "You're " + buffer + "% above target. Keep it up!";
    return;
  }

  const needed = calcPromotersNeeded();

  if (needed <= 0) {
    npsTargetBox.className = 'target-box on-track';
    npsTargetValue.textContent = 'On Track!';
    npsTargetValue.style.color = 'var(--accent-green)';
    npsTargetDetail.textContent = "Current: " + percentage.toFixed(1) + "% - maintain your ratio";
  } else {
    if (percentage >= 70) {
      npsTargetBox.className = 'target-box needs-work';
      npsTargetValue.style.color = 'var(--accent-yellow)';
    } else {
      npsTargetBox.className = 'target-box critical';
      npsTargetValue.style.color = 'var(--accent-red)';
    }
    npsTargetValue.textContent = 'Need ' + needed + ' more promoter' + (needed > 1 ? 's' : '');
    npsTargetDetail.textContent = 'Will reach 75% after ' + needed + ' more promoter' + (needed > 1 ? 's' : '') + ' (no more neutrals/DSATs)';
  }
}

function renderNps() {
  const total = getNpsTotal();
  const percentage = calcNps();

  if (percentage >= 75 && !npsEightyFiveTriggered && total > 0) {
    npsEightyFiveTriggered = true;
    burstConfetti();
  }

  updateNpsStreak();

  let status = 'start';
  if (total === 0) status = 'start';
  else if (percentage >= 75) status = 'pass';
  else if (percentage >= 70) status = 'warning';
  else status = 'fail';

  updateNpsRing(percentage, status);
  calculateNpsTarget();
  updateNpsProgressBar(percentage);
}

function handleNpsInput(type, value) {
  const v = parseInt(value) || 0;
  const oldVal = npsStats[type];
  npsStats[type] = Math.max(0, v);

  if (type === 'promoter' && npsStats.promoter > oldVal) {
    npsStreakCount += (npsStats.promoter - oldVal);
  }
  if (type === 'dsat' && npsStats.dsat > oldVal) {
    npsStreakCount = 0;
  }

  renderNps();
}

function resetNps() {
  npsStats = { promoter: 0, neutral: 0, dsat: 0 };
  npsStreakCount = 0;
  npsEightyFiveTriggered = false;

  npsRingFill.style.strokeDashoffset = NPS_CIRCUMFERENCE;
  npsRingFill.style.stroke = 'url(#npsRingGrad)';
  npsRingSvg.className = 'score-ring-svg';
  npsRingPercentage.style.color = '';
  npsRingPercentage.textContent = '0.0%';
  npsRingStatus.textContent = 'START';
  npsRingStatus.style.background = '';
  npsRingStatus.style.color = '';

  npsTargetBox.className = 'target-box';
  npsTargetValue.textContent = 'Start tracking';
  npsTargetValue.style.color = '';
  npsTargetDetail.textContent = 'Enter metrics to see your progress toward 75%';

  npsProgressFill.style.width = '0%';
  npsProgressFill.style.background = 'var(--accent-blue)';

  document.getElementById('npsStreakBanner').classList.remove('active');
  document.getElementById('npsStreakCount').textContent = '0';

  document.getElementById('promoter-input').value = '0';
  document.getElementById('neutral-input').value = '0';
  document.getElementById('dsat-input').value = '0';

  renderNps();
}
