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
      if (tab === 'flashcards' && !state.chapitreData['flashcards']) loadFlashcards(base);
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
    $('tab-fiche').innerHTML = `<div class="fiche-content">${html}</div>
      <a class="pdf-btn" href="${base}/fiche.pdf" target="_blank">📄 Voir la fiche en PDF</a>`;
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
    renderAudioPlayer(el, data);
  } catch {
    el.innerHTML = '<div class="audio-empty">🎧 Aucun audio disponible</div>';
  }
}

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// ===== LECTEUR AUDIO TEXT-TO-SPEECH =====
function renderAudioPlayer(el, sections) {
  let currentIndex = 0;
  let isPlaying = false;
  let utterance = null;
  let speed = 1;

  el.innerHTML = `
    <div class="tts-player">
      <div class="tts-sections">
        <h3 class="tts-label">📚 Choisir une section</h3>
        <div class="tts-section-list" id="tts-section-list"></div>
      </div>
      <div class="tts-content-box">
        <div class="tts-section-title" id="tts-section-title"></div>
        <div class="tts-text" id="tts-text"></div>
      </div>
      <div class="tts-controls">
        <div class="tts-speed">
          <label>Vitesse</label>
          <div class="tts-speed-btns">
            <button class="speed-btn" data-speed="0.75">0.75×</button>
            <button class="speed-btn active" data-speed="1">1×</button>
            <button class="speed-btn" data-speed="1.25">1.25×</button>
            <button class="speed-btn" data-speed="1.5">1.5×</button>
          </div>
        </div>
        <div class="tts-main-controls">
          <button class="tts-btn" id="tts-prev">⏮</button>
          <button class="tts-btn tts-play" id="tts-play">▶</button>
          <button class="tts-btn" id="tts-next">⏭</button>
        </div>
      </div>
    </div>`;

  function loadSection(index) {
    stop();
    currentIndex = index;
    const s = sections[index];
    document.querySelectorAll('.tts-section-item').forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });
    document.getElementById('tts-section-title').textContent = s.titre;
    document.getElementById('tts-text').innerHTML = s.contenu.map(p => `<p>${p}</p>`).join('');
  }

  function play() {
    const s = sections[currentIndex];
    const text = s.contenu.join(' ');
    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = speed;
    utterance.onend = () => {
      isPlaying = false;
      document.getElementById('tts-play').textContent = '▶';
      if (currentIndex < sections.length - 1) {
        setTimeout(() => { loadSection(currentIndex + 1); play(); }, 500);
      }
    };
    speechSynthesis.speak(utterance);
    isPlaying = true;
    document.getElementById('tts-play').textContent = '⏸';
  }

  function stop() {
    speechSynthesis.cancel();
    isPlaying = false;
    const btn = document.getElementById('tts-play');
    if (btn) btn.textContent = '▶';
  }

  // Sections list
  const list = document.getElementById('tts-section-list');
  sections.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'tts-section-item';
    btn.innerHTML = `<span class="tts-section-emoji">${s.emoji || '📖'}</span> ${s.titre}`;
    btn.addEventListener('click', () => loadSection(i));
    list.appendChild(btn);
  });

  // Controls
  document.getElementById('tts-play').addEventListener('click', () => {
    if (isPlaying) { stop(); } else { play(); }
  });
  document.getElementById('tts-prev').addEventListener('click', () => {
    if (currentIndex > 0) loadSection(currentIndex - 1);
  });
  document.getElementById('tts-next').addEventListener('click', () => {
    if (currentIndex < sections.length - 1) loadSection(currentIndex + 1);
  });
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      speed = parseFloat(this.dataset.speed);
      if (isPlaying) { stop(); play(); }
    });
  });

  loadSection(0);
}

// ===== FLASHCARDS =====
async function loadFlashcards(base) {
  const el = $('tab-flashcards');
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement…</div>';
  try {
    const res = await fetch(`${base}/flashcards.json`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    state.chapitreData['flashcards'] = true;
    if (!data.length) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">🃏</div>Aucune flashcard disponible</div>'; return; }
    renderFlashcards(el, data);
  } catch {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🃏</div>Flashcards non disponibles</div>';
  }
}

function renderFlashcards(el, cards) {
  let current = 0;
  let known = 0;
  let unknown = 0;
  let flipped = false;
  const total = cards.length;
  const remaining = [...cards];

  function render() {
    if (remaining.length === 0) {
      el.innerHTML = `
        <div class="fc-result">
          <div class="fc-result-icon">🎉</div>
          <div class="fc-result-title">Terminé !</div>
          <div class="fc-result-score">
            <span class="fc-known">✅ Sus : ${known}</span>
            <span class="fc-unknown">❌ À revoir : ${unknown}</span>
          </div>
          <button class="fc-restart" onclick="renderFlashcards(document.getElementById('tab-flashcards'), ${JSON.stringify(cards).replace(/"/g, '&quot;')})">🔄 Recommencer</button>
        </div>`;
      return;
    }

    const card = remaining[0];
    flipped = false;

    el.innerHTML = `
      <div class="fc-counter">${total - remaining.length + 1} / ${total}</div>
      <div class="fc-progress">
        <div class="fc-progress-bar" style="width:${((total - remaining.length) / total * 100)}%"></div>
      </div>
      <div class="fc-card-wrapper">
        <div class="fc-card" id="fc-card">
          <div class="fc-front">
            <div class="fc-label">Question</div>
            <div class="fc-text">${card.question}</div>
            <div class="fc-hint">Appuie pour voir la réponse</div>
          </div>
          <div class="fc-back hidden">
            <div class="fc-label">Réponse</div>
            <div class="fc-text">${card.reponse}</div>
          </div>
        </div>
      </div>
      ${card.indice ? `<div class="fc-indice-wrapper">
        <button class="fc-indice-btn" id="fc-indice-btn">💡 Indice</button>
        <div class="fc-indice-text hidden" id="fc-indice-text">${card.indice}</div>
      </div>` : ''}
      <div class="fc-actions hidden" id="fc-actions">
        <button class="fc-btn fc-no" id="fc-no">❌ À revoir</button>
        <button class="fc-btn fc-yes" id="fc-yes">✅ Je savais !</button>
      </div>`;

    if (card.indice) {
      document.getElementById('fc-indice-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('fc-indice-text').classList.toggle('hidden');
        document.getElementById('fc-indice-btn').textContent = '💡 Indice ▲';
      });
    }

    document.getElementById('fc-card').addEventListener('click', () => {
      if (flipped) return;
      flipped = true;
      document.querySelector('.fc-front').classList.add('hidden');
      document.querySelector('.fc-back').classList.remove('hidden');
      document.getElementById('fc-actions').classList.remove('hidden');
      document.querySelector('.fc-hint') && document.querySelector('.fc-hint').remove();
    });

    document.getElementById('fc-yes').addEventListener('click', () => {
      known++;
      remaining.shift();
      render();
    });

    document.getElementById('fc-no').addEventListener('click', () => {
      unknown++;
      const card = remaining.shift();
      remaining.push(card); // remet à la fin
      render();
    });
  }

  render();
}
