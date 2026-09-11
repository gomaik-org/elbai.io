/* 
  Zero-Dependency Event-Delegated Interactive Click-to-Zoom Lightbox for Mermaid Diagrams
  Fully compatible with MkDocs Material instant loading and asynchronous Mermaid renders.
*/

// Initialize Mermaid with safe defaults
if (typeof mermaid !== "undefined") {
  mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose"
  });
}

document$.subscribe(function() {
  // Create overlay element if it doesn't exist in the current page
  let overlay = document.querySelector(".mermaid-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "mermaid-overlay";
    document.body.appendChild(overlay);
  }

  // Asynchronously render all mermaid diagrams on instant navigation
  if (typeof mermaid !== "undefined") {
    mermaid.run({
      querySelector: ".mermaid"
    }).catch(function(err) {
      console.warn("Mermaid render notice:", err);
    });
  }
});

// Event delegation handles dynamic clicks perfectly, even after async Mermaid loads
document.addEventListener("click", function(e) {
  // Find closest parent container with the "mermaid" class
  const diagram = e.target.closest(".mermaid");
  if (!diagram) return;

  const overlay = document.querySelector(".mermaid-overlay");
  if (!overlay) return;

  // Toggle fullscreen state on click
  if (diagram.classList.contains("fullscreen")) {
    diagram.classList.remove("fullscreen");
    overlay.classList.remove("active");
    document.body.style.overflow = ""; // Re-enable background scrolling
  } else {
    // Dismiss any other open fullscreen diagram first
    const openDiagram = document.querySelector(".mermaid.fullscreen");
    if (openDiagram) {
      openDiagram.classList.remove("fullscreen");
    }
    diagram.classList.add("fullscreen");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }
  e.stopPropagation();
});

// Clicking on the overlay dismisses any active fullscreen diagram
document.addEventListener("click", function(e) {
  const overlay = e.target.closest(".mermaid-overlay");
  if (overlay && overlay.classList.contains("active")) {
    const activeFull = document.querySelector(".mermaid.fullscreen");
    if (activeFull) {
      activeFull.classList.remove("fullscreen");
    }
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
});

// Pressing Escape also closes the active diagram lightbox
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    const activeFull = document.querySelector(".mermaid.fullscreen");
    const overlay = document.querySelector(".mermaid-overlay");
    if (activeFull) {
      activeFull.classList.remove("fullscreen");
    }
    if (overlay) {
      overlay.classList.remove("active");
    }
    document.body.style.overflow = "";
  }
});
