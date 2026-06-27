// Token inyectado por el servidor (LTI flow o botón flotante)
const TOKEN = window.__A11Y_TOKEN__ || null

const DEFAULT_PREFS = {
  fontSize: 100,
  fontFamily: 'default',
  contrast: 'default',
  lineHeight: 1.5,
  wordSpacing: 0,
  readingGuide: false,
  pageMask: false,
  ttsEnabled: false,
}

let state = { ...DEFAULT_PREFS }
let saveTimer = null

// ─── Auth ─────────────────────────────────────────────────────────────────────

function authHeaders() {
  return TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}
}

async function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers ?? {}),
    },
  })
}

// ─── Preferencias ─────────────────────────────────────────────────────────────

async function loadPreferences() {
  try {
    const res = await apiFetch('/api/preferences')
    if (!res.ok) return
    const data = await res.json()
    state = { ...DEFAULT_PREFS, ...data.preferences }
    renderUI()
    notifyParent()
  } catch {
    // usar defaults
  }
}

function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    apiFetch('/api/preferences', {
      method: 'POST',
      body: JSON.stringify({ preferences: state }),
    }).catch(() => {})
  }, 500)
}

// ─── Comunicación con la página de Moodle ────────────────────────────────────

function notifyParent() {
  window.parent.postMessage({ type: 'a11y:apply', settings: state }, '*')
}

// ─── Estado ───────────────────────────────────────────────────────────────────

function update(changes) {
  state = { ...state, ...changes }
  notifyParent()
  scheduleSave()
}

// ─── UI: sincronizar controles con el estado ──────────────────────────────────

function renderUI() {
  document.getElementById('font-size-value').textContent = state.fontSize + '%'

  document.querySelectorAll('[data-font]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.font === state.fontFamily)
  })

  document.querySelectorAll('[data-contrast]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.contrast === state.contrast)
  })

  const lh = document.getElementById('line-height')
  lh.value = state.lineHeight
  lh.setAttribute('aria-valuenow', state.lineHeight)
  document.getElementById('line-height-value').textContent = state.lineHeight

  const ws = document.getElementById('word-spacing')
  ws.value = state.wordSpacing
  ws.setAttribute('aria-valuenow', state.wordSpacing)
  document.getElementById('word-spacing-value').textContent = state.wordSpacing + 'em'

  document.getElementById('reading-guide').checked = state.readingGuide
  document.getElementById('page-mask').checked = state.pageMask
  document.getElementById('tts-enabled').checked = state.ttsEnabled
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const tabLoaded = { a11y: true, ia: false, nav: false, prog: false }

function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach((btn) => {
    const active = btn.dataset.tab === tabId
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-selected', String(active))
  })

  document.querySelectorAll('.tab-panel').forEach((panel) => {
    const active = panel.id === `tab-${tabId}`
    panel.hidden = !active
    if (active) panel.classList.add('active')
    else panel.classList.remove('active')
  })

  if (!tabLoaded[tabId]) {
    tabLoaded[tabId] = true
    if (tabId === 'nav') loadCourseNav()
    if (tabId === 'prog') loadProgress()
  }
}

// ─── IA ───────────────────────────────────────────────────────────────────────

async function callAI(action) {
  const text = document.getElementById('ia-input').value.trim()
  if (text.length < 20) {
    showIaStatus('Escribe al menos 20 caracteres para procesar.', false)
    return
  }

  setIaLoading(true)

  try {
    const res = await apiFetch(`/api/ai/${action}`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
    const data = await res.json()

    if (!res.ok) {
      showIaStatus(data.error ?? 'Error al procesar el texto.', false)
      return
    }

    showIaResult(data.result)
  } catch {
    showIaStatus('Error de conexión. Inténtalo de nuevo.', false)
  } finally {
    setIaLoading(false)
  }
}

function setIaLoading(loading) {
  document.getElementById('btn-summarize').disabled = loading
  document.getElementById('btn-simplify').disabled = loading
  const status = document.getElementById('ia-status')
  if (loading) {
    status.textContent = 'Procesando…'
    status.hidden = false
  } else {
    status.hidden = true
  }
}

function showIaStatus(msg, isInfo = true) {
  const status = document.getElementById('ia-status')
  status.textContent = msg
  status.className = isInfo ? 'ia-status' : 'ia-status ia-status--error'
  status.hidden = false
  document.getElementById('ia-output-wrap').hidden = true
}

function showIaResult(text) {
  document.getElementById('ia-status').hidden = true
  const wrap = document.getElementById('ia-output-wrap')
  document.getElementById('ia-output').textContent = text
  wrap.hidden = false
}

// ─── Navegación del curso ─────────────────────────────────────────────────────

async function loadCourseNav() {
  const loading = document.getElementById('nav-loading')
  const error   = document.getElementById('nav-error')
  const empty   = document.getElementById('nav-empty')
  const tree    = document.getElementById('nav-tree')

  loading.hidden = false
  error.hidden = true
  empty.hidden = true
  tree.hidden = true

  try {
    const res = await apiFetch('/api/course')
    const data = await res.json()

    if (!res.ok) {
      error.textContent = data.error ?? 'Error al cargar el contenido del curso.'
      error.hidden = false
      return
    }

    const { nav } = data
    const visibleSections = nav.filter((s) => s.modules.length > 0)

    if (visibleSections.length === 0) {
      empty.hidden = false
      return
    }

    tree.innerHTML = visibleSections.map((section) => `
      <details class="nav-section" open>
        <summary class="nav-section-title">${escapeHtml(section.name || 'Sección')}</summary>
        <ul class="nav-module-list">
          ${section.modules.filter(m => m.visible).map((mod) => `
            <li class="nav-module">
              <span class="nav-mod-icon">${modIcon(mod.modname)}</span>
              ${mod.url
                ? `<a href="${escapeHtml(mod.url)}" target="_top" class="nav-mod-link">${escapeHtml(mod.name)}</a>`
                : `<span class="nav-mod-name">${escapeHtml(mod.name)}</span>`
              }
              ${mod.state !== null ? `<span class="nav-mod-state ${mod.state > 0 ? 'done' : ''}" aria-label="${mod.state > 0 ? 'Completado' : 'Pendiente'}">
                ${mod.state > 0 ? '✓' : '○'}
              </span>` : ''}
            </li>
          `).join('')}
        </ul>
      </details>
    `).join('')

    tree.hidden = false
  } catch {
    error.textContent = 'Error de conexión al cargar el curso.'
    error.hidden = false
  } finally {
    loading.hidden = true
  }
}

// ─── Progreso ─────────────────────────────────────────────────────────────────

async function loadProgress() {
  const loading = document.getElementById('prog-loading')
  const error   = document.getElementById('prog-error')
  const empty   = document.getElementById('prog-empty')
  const content = document.getElementById('prog-content')

  loading.hidden = false
  error.hidden = true
  empty.hidden = true
  content.hidden = true

  try {
    const res = await apiFetch('/api/progress')
    const data = await res.json()

    if (!res.ok) {
      error.textContent = data.error ?? 'Error al cargar el progreso.'
      error.hidden = false
      return
    }

    const { activities, total, completed, percent } = data

    if (total === 0) {
      empty.hidden = false
      return
    }

    const bar = document.getElementById('prog-bar')
    bar.style.width = percent + '%'
    bar.setAttribute('aria-valuenow', percent)

    document.getElementById('prog-label').textContent =
      `${completed} / ${total} actividades completadas (${percent}%)`

    const list = document.getElementById('prog-list')
    list.innerHTML = activities.map((a) => `
      <li class="prog-item ${a.state > 0 ? 'prog-item--done' : ''}">
        <span class="prog-item-icon" aria-hidden="true">${a.state > 0 ? '✓' : '○'}</span>
        <span class="prog-item-name">${escapeHtml(modName(a.modname))}</span>
      </li>
    `).join('')

    content.hidden = false
  } catch {
    error.textContent = 'Error de conexión al cargar el progreso.'
    error.hidden = false
  } finally {
    loading.hidden = true
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function modIcon(modname) {
  const icons = {
    resource: '📄', folder: '📁', url: '🔗', page: '📝',
    assign: '📋', quiz: '📝', forum: '💬', video: '🎬',
    h5pactivity: '🎮', scorm: '📦', glossary: '📖',
  }
  return icons[modname] ?? '📌'
}

function modName(modname) {
  const names = {
    resource: 'Archivo', folder: 'Carpeta', url: 'URL', page: 'Página',
    assign: 'Tarea', quiz: 'Cuestionario', forum: 'Foro', video: 'Video',
    h5pactivity: 'Actividad H5P', scorm: 'SCORM', glossary: 'Glosario',
  }
  return names[modname] ?? modname
}

// ─── Event listeners ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadPreferences()

  // Tabs
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
  })

  // Tamaño de fuente
  document.getElementById('font-decrease').addEventListener('click', () => {
    const next = Math.max(80, state.fontSize - 10)
    document.getElementById('font-size-value').textContent = next + '%'
    update({ fontSize: next })
  })

  document.getElementById('font-increase').addEventListener('click', () => {
    const next = Math.min(200, state.fontSize + 10)
    document.getElementById('font-size-value').textContent = next + '%'
    update({ fontSize: next })
  })

  // Tipografía
  document.querySelectorAll('[data-font]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-font]').forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      update({ fontFamily: btn.dataset.font })
    })
  })

  // Contraste
  document.querySelectorAll('[data-contrast]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-contrast]').forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      update({ contrast: btn.dataset.contrast })
    })
  })

  // Interlineado
  document.getElementById('line-height').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value)
    e.target.setAttribute('aria-valuenow', val)
    document.getElementById('line-height-value').textContent = val
    update({ lineHeight: val })
  })

  // Espaciado de palabras
  document.getElementById('word-spacing').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value)
    e.target.setAttribute('aria-valuenow', val)
    document.getElementById('word-spacing-value').textContent = val + 'em'
    update({ wordSpacing: val })
  })

  // Guía de lectura
  document.getElementById('reading-guide').addEventListener('change', (e) => {
    update({ readingGuide: e.target.checked })
  })

  // Máscara
  document.getElementById('page-mask').addEventListener('change', (e) => {
    update({ pageMask: e.target.checked })
  })

  // Texto a voz
  document.getElementById('tts-enabled').addEventListener('change', (e) => {
    update({ ttsEnabled: e.target.checked })
  })

  // Restablecer
  document.getElementById('reset-btn').addEventListener('click', () => {
    state = { ...DEFAULT_PREFS }
    renderUI()
    notifyParent()
    scheduleSave()
  })

  // IA
  document.getElementById('btn-summarize').addEventListener('click', () => callAI('summarize'))
  document.getElementById('btn-simplify').addEventListener('click', () => callAI('simplify'))

  document.getElementById('btn-ia-copy').addEventListener('click', () => {
    const text = document.getElementById('ia-output').textContent
    navigator.clipboard?.writeText(text).then(() => {
      const btn = document.getElementById('btn-ia-copy')
      btn.textContent = '✓ Copiado'
      setTimeout(() => { btn.textContent = '📋 Copiar' }, 2000)
    })
  })
})
