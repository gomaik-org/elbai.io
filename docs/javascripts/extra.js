/**
 * Wiz⚡Blitz Documentation - Interactive Architecture Diagram Lightbox & Zoom Engine
 * Zero-dependency, fully responsive, compatible with MkDocs Material instant navigation.
 * Supports Mermaid diagrams, SVG renders, and architecture graphics.
 */

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
    if (!modal || !canvas) return;

    canvas.innerHTML = '';

    // Check if element contains a rendered SVG (e.g. Mermaid) or is an IMG
    const originalSvg = element.querySelector('svg');
    if (originalSvg) {
      const svgClone = originalSvg.cloneNode(true);
      svgClone.removeAttribute('id');
      svgClone.style.maxWidth = '90vw';
      svgClone.style.maxHeight = '78vh';
      svgClone.style.width = '100%';
      svgClone.style.height = 'auto';
      svgClone.style.display = 'block';
      svgClone.style.margin = 'auto';
      svgClone.style.cursor = 'grab';
      
      const origViewBox = originalSvg.getAttribute('viewBox');
      if (origViewBox && !svgClone.getAttribute('viewBox')) {
        svgClone.setAttribute('viewBox', origViewBox);
      }
      canvas.appendChild(svgClone);
    } else if (element.tagName && element.tagName.toLowerCase() === 'img') {
      const imgClone = element.cloneNode(true);
      imgClone.style.maxWidth = '90vw';
      imgClone.style.maxHeight = '78vh';
      imgClone.style.width = 'auto';
      imgClone.style.height = 'auto';
      imgClone.style.display = 'block';
      imgClone.style.margin = 'auto';
      imgClone.style.cursor = 'grab';
      canvas.appendChild(imgClone);
    } else {
      const clone = element.cloneNode(true);
      clone.classList.remove('fullscreen', 'mermaid-hover');
      clone.style.cursor = 'grab';
      const badges = clone.querySelectorAll('.wb-diagram-zoom-badge');
      badges.forEach(b => b.remove());
      canvas.appendChild(clone);
    }

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

  // Hook into MkDocs Material navigation cycle
  if (typeof document$ !== 'undefined') {
    document$.subscribe(function () {
      ensureLightboxModal();

      // Render mermaid diagrams on navigation
      if (typeof mermaid !== 'undefined') {
        mermaid.run({
          querySelector: '.mermaid'
        }).then(() => {
          // Add hover badges to all rendered mermaid diagrams
          document.querySelectorAll('.mermaid').forEach(diagram => {
            if (!diagram.querySelector('.wb-diagram-zoom-badge')) {
              const badge = document.createElement('span');
              badge.className = 'wb-diagram-zoom-badge';
              badge.innerHTML = '🔍 Click to expand';
              diagram.style.position = 'relative';
              diagram.appendChild(badge);
            }
          });
        }).catch(err => {
          console.warn('Mermaid render notice:', err);
        });
      }
    });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      ensureLightboxModal();
    });
  }
})();
