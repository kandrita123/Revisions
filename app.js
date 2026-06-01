// ===== CONFIG =====
const GITHUB_USER = 'kandrita123';
const GITHUB_REPO = 'revisions';
const BRANCH = 'main';
const BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${BRANCH}`;
const API_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents`;

// ===== ANNÉES CONFIG =====
const ANNEES = [
  { id: '2025-2026', label: '6ème',  icon: '1️⃣', color: '#3949AB' },
  { id: '2026-2027', label: '5ème',  icon: '2️⃣', color: '#00897B' },
  { id: '2027-2028', label: '4ème',  icon: '3️⃣', color: '#E53935' },
  { id: '2028-2029', label: '3ème',  icon: '4️⃣', color: '#FB8C00' },
];

// ===== MATIÈRES CONFIG =====
const MATIERES = [
  { id: 'histoire-geo', label: 'Histoire-Géo',   icon: '🏛️', class: 'histoire' },
  { id: 'maths',        label: 'Maths',           icon: '📐', class: 'maths'   },
  { id: 'francais',     label: 'Français',        icon: '✍️', class: 'francais'},
  { id: 'svt',          label: 'SVT',             icon: '🌿', class: 'svt'     },
  { id: 'physique',     label: 'Physique-Chimie', icon: '⚗️', class: 'physique'},
  { id: 'anglais',      label: 'Anglais',         icon: '🇬🇧', class: 'anglais' },
];

// ===== STATE =====
let state = {
  screen: 'annees',
  annee: null,
  matiere: null,
  chapitre: null,
  chapitreData: {},
};

// ===== DOM =====
const $ = id => document.getElementById(id);
const screens = {
  annees: $('screen-annees'),
  matieres: $('screen-matieres'),
  chapitres: $('screen-chapitres'),
  chapitre: $('screen-chapitre'),
};

// ===== NAVIGATION =====
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  state.screen = name;
  $('btn-back').classList.toggle('hidden', name === 'annees');
}

function goBack() {
  if (state.screen === 'matieres') showScreen('annees');
  else if (state.screen === 'chapitres') showScreen('matieres');
  else if (state.screen === 'chapitre') showScreen('chapitres');
  else showScreen('annees');
}

$('btn-back').addEventListener('click', goBack);

// ===== INIT =====
renderAnnees();
showScreen('annees');

// ===== ANNÉES =====
function renderAnnees() {
  const grid = $('annees-grid');
  grid.innerHTML = '';
  ANNEES.forEach(a => {
    const card = document.createElement('div');
    card.className = 'annee-card';
    card.style.background = `linear-gradient(135deg, ${a.color}, ${a.color}99)`;
    card.innerHTML = `<div class="annee-icon">${a.icon}</div><div class="annee-label">${a.label}</div><div class="annee-year">${a.id}</div>`;
    card.addEventListener('click', () => {
      state.annee = a;
      $('matieres-title').textContent = `${a.label} — Matières`;
      renderMatieres();
      showScreen('matieres');
    });
    grid.appendChild(card);
  });
}

// ===== MATIÈRES =====
function renderMatieres() {
  const grid = $('matieres-grid');
  grid.innerHTML = '';
  MATIERES.forEach(m => {
    const card = document.createElement('div');
    card.className = `matiere-card ${m.class}`;
    card.innerHTML = `<div class="matiere-icon">${m.icon}</div><div>${m.label}</div>`;
    card.addEventListener('click', () => loadChapitres(m));
    grid.appendChild(card);
  });
}

// ===== CHAPITRES =====
async function loadChapitres(matiere) {
  state.matiere = matiere;
  $('chapitres-title').textContent = `${state.annee.label} — ${matiere.label}`;
  const list = $('chapitres-list');
  list.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement…</div>';
  showScreen('chapitres');

  try {
    const path = `content/${state.annee.id}/${matiere.id}`;
    const res = await fetch(`${API_URL}/${path}?ref=${BRANCH}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!res.ok) throw new Error();
    const items = await res.json();
    const chapitres = items.filter(i => i.type === 'dir').sort((a,b) => a.name.localeCompare(b.name));

    if (!chapitres.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div>Aucun chapitre disponible</div>';
      return;
    }

    list.innerHTML = '';
    chapitres.forEach(ch => {
      const div = document.createElement('div');
      div.className = 'chapitre-item';
      div.innerHTML = `<div class="chapitre-num">${matiere.label}</div><div>${formatChapitreLabel(ch.name)}</div>`;
      div.addEventListener('click', () => loadChapitre(matiere, ch.name));
      list.appendChild(div);
    });
  } catch {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div>Aucun chapitre disponible pour le moment</div>';
  }
}

function formatChapitreLabel(name) {
  const match = name.match(/^ch(\d+)-(.+)$/);
  if (match) {
    const num = parseInt(match[1]);
    const titre = match[2].replace(/-/g, ' ');
    return `Chapitre ${num} — ${titre.charAt(0).toUpperCase() + titre.slice(1)}`;
  }
  return name.replace(/-/g, ' ');
}

// ===== CHAPITRE =====
async function loadChapitre(matiere, chapName) {
  state.chapitre = chapName;
  state.chapitreData = {};
  showScreen('chapitre');

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="fiche"]').classList.add('active');
  $('tab-fiche').classList.add('active');
  $('tab-fiche').innerHTML = '<div class="loading"><div class="spinner"></div>Chargement…</div>';

  const base = `${BASE_URL}/content/${state.annee.id}/${matiere.id}/${chapName}`;
  loadFiche(base);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      $('tab-' + tab).classList.add('active');
      if (tab === 'quiz-facile' && !state.chapitreData['quiz-facile']) loadQuiz(base, 'facile');
      if (tab === 'quiz-difficile' && !state.chapitreData['quiz-difficile']) loadQuiz(base, 'difficile');
      if (tab === 'audio' && !state.chapitreData['audio']) loadAudio(base);
    };
  });
}

async function loadFiche(base) {
  try {
    const res = await fetch(`${base}/fiche.html`);
    if (!res.ok) throw new Error();
    const html = await res.text();
    state.chapitreData['fiche'] = true;
    $('tab-fiche').innerHTML = `<div class="fiche-content">${html}</div>`;
  } catch {
    $('tab-fiche').innerHTML = '<div class="empty-state"><div class="empty-icon">📄</div>Fiche non disponible</div>';
  }
}

async function loadQuiz(base, niveau) {
  const el = $('tab-quiz-' + niveau);
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement…</div>';
  try {
    const res = await fetch(`${base}/quiz-${niveau}.json`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    state.chapitreData['quiz-' + niveau] = true;
    renderQuiz(el, data);
  } catch {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">❓</div>Quiz non disponible</div>';
  }
}

function renderQuiz(container, questions) {
  let score = 0, answered = 0;
  const total = questions.length;
  container.innerHTML = '';

  questions.forEach((q, qi) => {
    const div = document.createElement('div');
    div.className = 'quiz-question';

    if (q.type === 'qcm') {
      div.innerHTML = `<p>${qi+1}. ${q.question}</p><div class="quiz-options"></div>`;
      const opts = div.querySelector('.quiz-options');
      q.options.forEach((opt, oi) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          if (div.dataset.answered) return;
          div.dataset.answered = '1'; answered++;
          const correct = oi === q.answer;
          if (correct) score++;
          btn.classList.add(correct ? 'correct' : 'wrong');
          if (!correct) opts.querySelectorAll('.quiz-option')[q.answer].classList.add('reveal');
          checkEnd();
        });
        opts.appendChild(btn);
      });

    } else if (q.type === 'vrai-faux') {
      div.innerHTML = `<p>${qi+1}. ${q.question}</p><div class="quiz-options vf-options"></div>`;
      const opts = div.querySelector('.vf-options');
      ['Vrai', 'Faux'].forEach((label, vi) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = label;
        btn.addEventListener('click', () => {
          if (div.dataset.answered) return;
          div.dataset.answered = '1'; answered++;
          const correct = (vi === 0) === q.answer;
          if (correct) score++;
          btn.classList.add(correct ? 'correct' : 'wrong');
          if (!correct) opts.querySelectorAll('.quiz-option')[q.answer ? 0 : 1].classList.add('reveal');
          checkEnd();
        });
        opts.appendChild(btn);
      });

    } else if (q.type === 'oral') {
      let revealed = false;
      div.innerHTML = `<div class="oral-card">
        <div class="oral-question">${qi+1}. ${q.question}</div>
        <button class="oral-reveal-btn">Voir la réponse</button>
        <div class="oral-answer hidden">${q.answer}</div>
      </div>`;
      div.querySelector('.oral-reveal-btn').addEventListener('click', function() {
        if (!revealed) {
          revealed = true;
          div.querySelector('.oral-answer').classList.remove('hidden');
          this.textContent = '✓ Réponse affichée';
          if (!div.dataset.answered) { div.dataset.answered = '1'; answered++; checkEnd(); }
        }
      });
    }
    container.appendChild(div);
  });

  function checkEnd() {
    if (answered === total) {
      const d = document.createElement('div');
      d.className = 'quiz-score';
      d.innerHTML = `Score : ${score}/${total} (${Math.round(score/total*100)}%)<br>
        <button class="quiz-restart" onclick="location.reload()">🔄 Recommencer</button>`;
      container.appendChild(d);
    }
  }
}

async function loadAudio(base) {
  const el = $('tab-audio');
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement…</div>';
  try {
    const res = await fetch(`${base}/audio.json`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    state.chapitreData['audio'] = true;
    if (!data.length) { el.innerHTML = '<div class="audio-empty">🎧 Aucun audio disponible</div>'; return; }
    el.innerHTML = '<div class="audio-list"></div>';
    const list = el.querySelector('.audio-list');
    data.forEach(item => {
      const div = document.createElement('div');
      div.className = 'audio-item';
      div.innerHTML = `<button class="audio-play">▶</button>
        <div class="audio-info"><div class="audio-title">${item.title}</div>
        <div class="audio-duration">${item.duration || ''}</div></div>`;
      div.querySelector('.audio-play').addEventListener('click', function() {
        const audio = new Audio(`${base}/${item.file}`);
        audio.play(); this.textContent = '⏸';
        audio.onended = () => { this.textContent = '▶'; };
      });
      list.appendChild(div);
    });
  } catch {
    el.innerHTML = '<div class="audio-empty">🎧 Aucun audio disponible</div>';
  }
}

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
