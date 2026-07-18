/**
 * Bridge de accesibilidad.
 *
 * Inyecta el botón flotante en todas las páginas de Moodle.
 * Cuando el usuario abre el panel, carga el iframe con la herramienta LTI.
 * Escucha mensajes postMessage del iframe y aplica los cambios visuales a la página.
 */

let iframeLoaded = false

export const init = (config) => {
  injectStyles()
  const { btn, modal, iframe } = injectDOM(config.launchUrl)
  listenMessages()

  btn.addEventListener('click', () => {
    const open = modal.hidden
    modal.hidden = !open
    btn.setAttribute('aria-expanded', String(open))

    // Cargar iframe solo la primera vez que se abre
    if (open && !iframeLoaded) {
      iframe.src = config.launchUrl
      iframeLoaded = true
    }
  })

  modal.querySelector('.a11y-close').addEventListener('click', () => {
    modal.hidden = true
    btn.setAttribute('aria-expanded', 'false')
  })

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) {
      modal.hidden = true
      btn.setAttribute('aria-expanded', 'false')
      btn.focus()
    }
  })
}

// ─── DOM ──────────────────────────────────────────────────────────────────────


// ─── postMessage: aplicar configuración a la página Moodle ───────────────────

function listenMessages() {
  window.addEventListener('message', (event) => {
    if (event.data?.type !== 'a11y:apply') return
    applySettings(event.data.settings)
  })
}

function applySettings(s) {
  // Tamaño de fuente
  document.documentElement.style.fontSize = s.fontSize + '%'

  // Tipografía
  const fonts = {
    serif:    'Georgia, "Times New Roman", serif',
    dyslexic: '"OpenDyslexic", "Comic Sans MS", cursive',
  }
  setStyle('a11y-font', fonts[s.fontFamily]
    ? `*, *::before, *::after { font-family: ${fonts[s.fontFamily]} !important; }`
    : '')

  // Contraste
  document.body.classList.remove('a11y-contrast-dark', 'a11y-contrast-high', 'a11y-contrast-yellow')
  if (s.contrast !== 'default') {
    document.body.classList.add('a11y-contrast-' + s.contrast)
  }

  // Interlineado
  setStyle('a11y-lh', `*, *::before, *::after { line-height: ${s.lineHeight} !important; }`)

  // Espaciado de palabras
  setStyle('a11y-ws', s.wordSpacing > 0
    ? `*, *::before, *::after { word-spacing: ${s.wordSpacing}em !important; }`
    : '')

  // Guía de lectura
  manageReadingGuide(s.readingGuide)

  // Máscara de página
  managePageMask(s.pageMask)

  // Texto a voz: habilitar selección para lectura
  document.body.style.userSelect = s.ttsEnabled ? 'auto' : ''
  if (s.ttsEnabled) {
    enableTTSSelection()
  } else {
    disableTTSSelection()
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setStyle(id, css) {
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('style')
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = css
}

let guideHandler = null
function manageReadingGuide(active) {
  let guide = document.getElementById('a11y-reading-guide')
  if (active) {
    if (!guide) {
      guide = document.createElement('div')
      guide.id = 'a11y-reading-guide'
      document.body.appendChild(guide)
    }
    guide.style.display = 'block'
    if (!guideHandler) {
      guideHandler = (e) => { guide.style.top = (e.clientY - 20) + 'px' }
      document.addEventListener('mousemove', guideHandler)
    }
  } else {
    if (guide) guide.style.display = 'none'
    if (guideHandler) {
      document.removeEventListener('mousemove', guideHandler)
      guideHandler = null
    }
  }
}

let maskHandler = null
function managePageMask(active) {
  let top = document.getElementById('a11y-mask-top')
  let bot = document.getElementById('a11y-mask-bottom')
  if (active) {
    if (!top) {
      top = document.createElement('div')
      top.id = 'a11y-mask-top'
      bot = document.createElement('div')
      bot.id = 'a11y-mask-bottom'
      document.body.appendChild(top)
      document.body.appendChild(bot)
    }
    top.style.display = bot.style.display = 'block'
    if (!maskHandler) {
      maskHandler = (e) => {
        top.style.height = Math.max(0, e.clientY - 50) + 'px'
        bot.style.top    = (e.clientY + 50) + 'px'
      }
      document.addEventListener('mousemove', maskHandler)
    }
  } else {
    if (top) top.style.display = bot.style.display = 'none'
    if (maskHandler) {
      document.removeEventListener('mousemove', maskHandler)
      maskHandler = null
    }
  }
}

let ttsHandler = null
function enableTTSSelection() {
  if (ttsHandler) return
  ttsHandler = () => {
    const text = window.getSelection()?.toString().trim()
    if (text && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = document.documentElement.lang || 'es'
      window.speechSynthesis.speak(utt)
    }
  }
  document.addEventListener('mouseup', ttsHandler)
}

function disableTTSSelection() {
  if (ttsHandler) {
    document.removeEventListener('mouseup', ttsHandler)
    ttsHandler = null
    window.speechSynthesis?.cancel()
  }
}

// ─── Estilos del botón y panel ────────────────────────────────────────────────

function injectStyles() {
  setStyle('a11y-plugin-styles', `
    #a11y-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #3b5bdb;
      color: #fff;
      border: none;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,.25);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background .2s, transform .15s;
    }
    #a11y-fab:hover { background: #2f4ac4; transform: scale(1.05); }
    #a11y-fab:focus-visible { outline: 3px solid #ffd700; outline-offset: 3px; }

    #a11y-panel {
      position: fixed;
      bottom: 88px;
      right: 24px;
      width: 340px;
      height: 520px;
      z-index: 9999;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,.2);
      overflow: hidden;
    }
    #a11y-panel[hidden] { display: none; }

    .a11y-panel-inner {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .a11y-close {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,.25);
      color: #fff;
      font-size: 18px;
      cursor: pointer;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .a11y-close:focus-visible { outline: 2px solid #ffd700; }

    #a11y-iframe { width: 100%; height: 100%; border: none; }

    #a11y-reading-guide {
      position: fixed;
      left: 0;
      width: 100%;
      height: 40px;
      background: rgba(255, 255, 0, .15);
      border-top: 2px solid rgba(255,200,0,.5);
      border-bottom: 2px solid rgba(255,200,0,.5);
      pointer-events: none;
      z-index: 9990;
      display: none;
    }

    #a11y-mask-top, #a11y-mask-bottom {
      position: fixed;
      left: 0;
      width: 100%;
      background: rgba(0,0,0,.5);
      pointer-events: none;
      z-index: 9989;
      display: none;
    }
    #a11y-mask-top { top: 0; }
    #a11y-mask-bottom { bottom: 0; height: 50vh; }

    /* Modos de contraste */
    body.a11y-contrast-dark {
      filter: invert(1) hue-rotate(180deg);
    }
    body.a11y-contrast-dark img,
    body.a11y-contrast-dark video {
      filter: invert(1) hue-rotate(180deg);
    }
    body.a11y-contrast-high {
      background: #000 !important;
      color: #fff !important;
    }
    body.a11y-contrast-high * {
      color: #fff !important;
      background-color: #000 !important;
      border-color: #fff !important;
    }
    body.a11y-contrast-high a { color: #ffff00 !important; }
    body.a11y-contrast-yellow {
      background: #ffff00 !important;
    }
    body.a11y-contrast-yellow * {
      background-color: #ffff00 !important;
      color: #000 !important;
    }
  `)
}
