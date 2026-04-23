import { useEffect, useRef } from "react";

const SYMBOLS = ["🌿", "🍃", "🌱", "🌸", "🌼", "🍀", "🌺", "🌻"];

function FloatingLeaves() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const leaves = [];

    for (let i = 0; i < 22; i++) {
      const leaf = document.createElement("div");
      leaf.className = "leaf";
      leaf.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

      const size = Math.random() * 10 + 10;
      const left = Math.random() * 100;
      const duration = Math.random() * 20 + 18;
      const delay = Math.random() * 20;

      leaf.style.cssText = `
        left: ${left}%;
        font-size: ${size}px;
        animation-duration: ${duration}s;
        animation-delay: -${delay}s;
        filter: saturate(0.6) brightness(0.9);
      `;

      container.appendChild(leaf);
      leaves.push(leaf);
    }

    return () => {
      leaves.forEach(l => l.remove());
    };
  }, []);

  return <div className="leaves-bg" ref={containerRef} />;
}

export default FloatingLeaves;