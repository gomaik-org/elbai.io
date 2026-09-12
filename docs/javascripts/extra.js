/**
 * Wiz⚡Blitz Documentation - Interactive Architecture Diagram Lightbox & Zoom Engine
 * Zero-dependency, fully responsive, compatible with MkDocs Material instant navigation.
 * Supports Mermaid diagrams, SVG renders, and architecture graphics.
 */

// Intercept attachShadow globally so shadow roots created by MkDocs Material remain accessible for lightbox cloning
if (typeof Element !== 'undefined' && Element.prototype.attachShadow) {
  const _origAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    const shadow = _origAttachShadow.call(this, Object.assign({}, init, { mode: 'open' }));
    this.__wbShadowRoot = shadow;
    return shadow;
  };
}

(function () {
  'use strict';

  let currentScale = 1.0;
  let isDragging = false;
  let startX = 0, startY = 0;
  let translateX = 0, translateY = 0;

  // Initialize Mermaid with safe defaults
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose'
    });
  }

  // Ensure modal DOM elements exist
  function ensureLightboxModal() {
    if (document.getElementById('wb-diagram-lightbox')) return;

    const modal = document.createElement('div');
    modal.id = 'wb-diagram-lightbox';
    modal.className = 'wb-lightbox-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Diagram Viewer');

    modal.innerHTML = `
      <div class="wb-lightbox-backdrop"></div>
      <div class="wb-lightbox-dialog">
        <div class="wb-lightbox-header">
          <div class="wb-lightbox-title">
            <span class="wb-lightbox-badge">⚡ Architecture Diagram</span>
            <span class="wb-lightbox-hint">Use mouse wheel or buttons to zoom • Drag to pan</span>
          </div>
          <div class="wb-lightbox-toolbar">
            <button class="wb-lightbox-btn" id="wb-zoom-out" title="Zoom Out (–)">–</button>
            <span class="wb-lightbox-scale" id="wb-scale-label">100%</span>
            <button class="wb-lightbox-btn" id="wb-zoom-in" title="Zoom In (+)">+</button>
            <button class="wb-lightbox-btn" id="wb-zoom-reset" title="Reset (0)">↺</button>
            <button class="wb-lightbox-btn wb-lightbox-close" id="wb-lightbox-close" title="Close (Esc)">✕</button>
          </div>
        </div>
        <div class="wb-lightbox-viewport" id="wb-lightbox-viewport">
          <div class="wb-lightbox-canvas" id="wb-lightbox-canvas"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Bind event handlers for controls
    const backdrop = modal.querySelector('.wb-lightbox-backdrop');
    const closeBtn = modal.querySelector('#wb-lightbox-close');
    const zoomInBtn = modal.querySelector('#wb-zoom-in');
    const zoomOutBtn = modal.querySelector('#wb-zoom-out');
    const resetBtn = modal.querySelector('#wb-zoom-reset');
    const viewport = modal.querySelector('#wb-lightbox-viewport');
    const canvas = modal.querySelector('#wb-lightbox-canvas');

    backdrop.addEventListener('click', closeLightbox);
    closeBtn.addEventListener('click', closeLightbox);

    zoomInBtn.addEventListener('click', () => adjustZoom(0.25));
    zoomOutBtn.addEventListener('click', () => adjustZoom(-0.25));
    resetBtn.addEventListener('click', resetZoom);

    // Mouse wheel zoom
    viewport.addEventListener('wheel', function (e) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      adjustZoom(delta);
    }, { passive: false });

    // Drag to pan
    viewport.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return; // Left click only
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      viewport.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      applyTransform();
    });

    window.addEventListener('mouseup', function () {
      if (isDragging) {
        isDragging = false;
        viewport.classList.remove('is-dragging');
      }
    });
  }

  function applyTransform() {
    const canvas = document.getElementById('wb-lightbox-canvas');
    const label = document.getElementById('wb-scale-label');
    if (!canvas) return;
    canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
    if (label) {
      label.textContent = `${Math.round(currentScale * 100)}%`;
    }
  }

  function adjustZoom(delta) {
    currentScale = Math.min(Math.max(currentScale + delta, 0.4), 3.5);
    applyTransform();
  }

  function resetZoom() {
    currentScale = 1.0;
    translateX = 0;
    translateY = 0;
    applyTransform();
  }

  function openLightbox(element) {
    ensureLightboxModal();
    const modal = document.getElementById('wb-diagram-lightbox');
    const canvas = document.getElementById('wb-lightbox-canvas');
    const viewport = document.getElementById('wb-lightbox-viewport');
    if (!modal || !canvas) return;

    // Reset canvas and prepare diagram element
    canvas.innerHTML = '';
    
    // Check if element contains shadowRoot with SVG (MkDocs Material renders into shadow root)
    const shadow = element.shadowRoot || element.__wbShadowRoot;
    let targetNode = null;
    if (shadow && shadow.querySelector('svg')) {
      targetNode = shadow.querySelector('svg').cloneNode(true);
    } else {
      targetNode = element.cloneNode(true);
    }

    targetNode.classList.remove('fullscreen', 'mermaid-hover');
    targetNode.style.cursor = 'grab';

    // Remove zoom badge if present in targetNode
    const badge = targetNode.querySelector ? targetNode.querySelector('.wb-diagram-zoom-badge') : null;
    if (badge) badge.remove();

    // Scale SVGs based on their viewBox for optimal initial presentation
    const svgs = targetNode.tagName && targetNode.tagName.toLowerCase() === 'svg'
      ? [targetNode]
      : (targetNode.querySelectorAll ? targetNode.querySelectorAll('svg') : []);
    const availW = (viewport ? viewport.clientWidth : window.innerWidth * 0.9) || 1200;
    const availH = (viewport ? viewport.clientHeight : window.innerHeight * 0.75) || 700;

    svgs.forEach(svg => {
      const vb = svg.getAttribute('viewBox');
      if (vb) {
        const parts = vb.trim().split(/\s+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          const vbWidth = parts[2];
          const vbHeight = parts[3];
          
          const scaleW = availW / vbWidth;
          const scaleH = availH / vbHeight;
          const fitScale = Math.min(scaleW, scaleH, 1.5);
          
          const targetW = Math.max(Math.round(vbWidth * fitScale), 400);
          const targetH = Math.round(targetW * (vbHeight / vbWidth));

          svg.style.width = targetW + 'px';
          svg.style.height = targetH + 'px';
          svg.style.maxWidth = 'none';
          svg.style.maxHeight = 'none';
          svg.style.display = 'block';
        }
      }
    });

    canvas.appendChild(targetNode);
    resetZoom();

    modal.classList.add('is-active');
    document.body.classList.add('wb-lightbox-open');
  }

  function closeLightbox() {
    const modal = document.getElementById('wb-diagram-lightbox');
    if (!modal) return;
    modal.classList.remove('is-active');
    document.body.classList.remove('wb-lightbox-open');
    const canvas = document.getElementById('wb-lightbox-canvas');
    if (canvas) canvas.innerHTML = '';
  }

  // Keyboard shortcut: Escape to close, +/- to zoom
  document.addEventListener('keydown', function (e) {
    const modal = document.getElementById('wb-diagram-lightbox');
    if (!modal || !modal.classList.contains('is-active')) return;

    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === '+' || e.key === '=') {
      adjustZoom(0.25);
    } else if (e.key === '-' || e.key === '_') {
      adjustZoom(-0.25);
    } else if (e.key === '0') {
      resetZoom();
    }
  });

  // Attach click listener to diagrams via delegation
  document.addEventListener('click', function (e) {
    // If click is inside lightbox itself, ignore
    if (e.target.closest('#wb-diagram-lightbox')) return;

    // Check for Mermaid diagram container
    const mermaidContainer = e.target.closest('.mermaid');
    if (mermaidContainer) {
      e.preventDefault();
      e.stopPropagation();
      openLightbox(mermaidContainer);
      return;
    }

    // Check for architecture image (e.g., SVG/PNG diagrams)
    const img = e.target.closest('article img:not(.no-zoom)');
    if (img && (img.src.includes('diagram') || img.src.includes('architecture') || img.classList.contains('zoomable'))) {
      e.preventDefault();
      e.stopPropagation();
      openLightbox(img);
    }
  });

  // Asynchronously render all mermaid code blocks into clean SVGs
  async function renderMermaidDiagrams() {
    if (typeof mermaid === 'undefined') return;
    const mermaidElements = document.querySelectorAll('.mermaid');
    let seq = 0;
    for (const el of mermaidElements) {
      if (el.dataset.mermaidRendered === 'true') continue;
      seq++;
      const codeEl = el.querySelector('code');
      const code = codeEl ? codeEl.textContent : el.textContent;
      const renderId = 'mermaid-render-' + seq + '-' + Date.now();
      try {
        const { svg } = await window.mermaid.render(renderId, code);
        el.dataset.mermaidCode = code;
        el.dataset.mermaidRendered = 'true';
        el.innerHTML = svg;
        el.style.position = 'relative';
        el.style.cursor = 'zoom-in';

        if (!el.querySelector('.wb-diagram-zoom-badge')) {
          const badge = document.createElement('span');
          badge.className = 'wb-diagram-zoom-badge';
          badge.innerHTML = '🔍 Click to expand';
          el.appendChild(badge);
        }
      } catch (err) {
        console.warn('Mermaid render error for element', el, err);
      }
    }
  }

  // Initialize immediately and also subscribe to document$ for instant navigation
  function initAll() {
    ensureLightboxModal();
    renderMermaidDiagrams();
  }

  // Hook into MkDocs Material navigation cycle
  if (typeof document$ !== 'undefined') {
    document$.subscribe(function () {
      initAll();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
