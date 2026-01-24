import React, { useRef, useEffect, useState } from "react";

interface PlinkoBoardProps {
  dropColumn: number;
  isDropping: boolean;
  path?: ("L" | "R")[];
  finalBin?: number;
  onFinishDrop: () => void;
  multipliers: number[];
  isMuted?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export const PlinkoBoard: React.FC<PlinkoBoardProps> = ({
  dropColumn,
  isDropping,
  path,
  onFinishDrop,
  multipliers,
  isMuted = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lastLandedBin, setLastLandedBin] = useState<number | null>(null);

  // Physics & Visual constants
  const ROWS = 12;
  const particles = useRef<Particle[]>([]);

  // Reduced Motion Check
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion.current = mediaQuery.matches;
    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Animation State
  const animState = useRef({
    ballX: 0,
    ballY: 0,
    velocityY: 0,
    currentRow: -1,
    progressBetweenRows: 0,
    active: false,
    pathIndex: 0,
    targetCol: 0,
    startCol: 0,
  });

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Init Drop
  useEffect(() => {
    if (isDropping && path && !animState.current.active) {
      setLastLandedBin(null);
      animState.current = {
        active: true,
        ballX: dropColumn,
        ballY: -1,
        velocityY: 0,
        currentRow: -1,
        progressBetweenRows: 0,
        pathIndex: 0,
        targetCol: dropColumn,
        startCol: dropColumn,
      };
    }
  }, [isDropping, path, dropColumn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const width = dimensions.width;
    const height = dimensions.height;

    // Layout Calculation
    const paddingTop = Math.min(40, height * 0.05);
    const paddingBottom = Math.max(40, height * 0.1);
    const availableHeight = height - paddingTop - paddingBottom;
    const rowHeight = availableHeight / ROWS;

    // Grid Configuration
    const maxCols = 15;
    const centerIndex = 7;
    const maxColWidthByHeight = rowHeight * 1.5;
    const colWidth = Math.min(width / maxCols, maxColWidthByHeight);

    const pegRadius = Math.min(colWidth, rowHeight) * 0.15;
    const ballRadius = pegRadius * 1.8;

    let requestID: number;

    const spawnConfetti = (x: number, y: number) => {
      if (prefersReducedMotion.current) return;
      const colors = ["#22d3ee", "#34d399", "#f472b6", "#fbbf24", "#ffffff"];
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1.0,
          size: Math.random() * 4 + 2,
        });
      }
    };

    // Simple audio functions (inline to avoid import issues)
    const playTick = () => {
      if (isMuted) return;
      const audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + 0.05,
      );

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.05);
    };

    const playWin = (multiplier: number) => {
      if (isMuted) return;
      const audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.value = 600 + multiplier * 50;
      oscillator.type = "triangle";
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + 0.3,
      );

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    };

    const playLoss = () => {
      if (isMuted) return;
      const audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.value = 200;
      oscillator.type = "sawtooth";
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + 0.2,
      );

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.2);
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // --- Draw Bins ---
      const binWidth = colWidth;
      const binY = paddingTop + ROWS * rowHeight + 20;

      const showSuffix = colWidth > 32;

      multipliers.forEach((mult, i) => {
        const x = (i + 1) * colWidth + (width - 15 * colWidth) / 2;
        const isLanded = lastLandedBin === i;

        // Bin Background
        ctx.fillStyle = isLanded
          ? "rgba(34, 211, 238, 0.2)"
          : "rgba(15, 23, 42, 0.6)";

        ctx.beginPath();
        const taper = 2;
        ctx.moveTo(x - binWidth / 2 + taper, binY);
        ctx.lineTo(x + binWidth / 2 - taper, binY);
        ctx.lineTo(x + binWidth / 2, binY + 40);
        ctx.lineTo(x - binWidth / 2, binY + 40);
        ctx.fill();

        // Bin Border
        ctx.strokeStyle = isLanded ? "#22d3ee" : "#334155";
        ctx.lineWidth = isLanded ? 2 : 1;
        ctx.stroke();

        // Glow effect
        if (isLanded && !prefersReducedMotion.current) {
          ctx.shadowColor = "#22d3ee";
          ctx.shadowBlur = 15;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Text
        let fontSize = Math.floor(colWidth * 0.45);
        if (fontSize < 8) fontSize = 8;
        if (fontSize > 13) fontSize = 13;

        const activeFontSize = isLanded
          ? Math.min(fontSize * 1.3, colWidth * 0.7)
          : fontSize;

        ctx.fillStyle = isLanded ? "#fff" : mult >= 1 ? "#4ade80" : "#f87171";
        ctx.font = `bold ${activeFontSize}px "Orbitron", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const text = showSuffix ? `${mult}x` : `${mult}`;
        ctx.fillText(text, x, binY + 20);
      });

      // --- Draw Pegs (Symmetric Pyramid) ---
      ctx.fillStyle = "#94a3b8";

      for (let r = 0; r < ROWS; r++) {
        const minCol = centerIndex - Math.ceil(r / 2);
        const maxCol = centerIndex + Math.floor(r / 2);

        for (let c = minCol; c <= maxCol; c++) {
          const cx =
            (c + (r % 2 === 0 ? 0 : 0.5)) * colWidth +
            (width - 15 * colWidth) / 2;
          const cy = paddingTop + r * rowHeight;

          ctx.beginPath();
          ctx.arc(cx, cy, pegRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- Draw Ghost Ball (Aim) ---
      if (!animState.current.active) {
        const gridCol = dropColumn + 1;
        const startX = gridCol * colWidth + (width - 15 * colWidth) / 2;

        ctx.beginPath();
        ctx.arc(startX, paddingTop - 20, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34, 211, 238, 0.3)";
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = "rgba(34, 211, 238, 0.2)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(startX, paddingTop - 20);
        ctx.lineTo(startX, height - 60);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // --- Draw Active Ball ---
      if (animState.current.active && path) {
        const s = animState.current;
        const speed = prefersReducedMotion.current ? 0.15 : 0.06;
        s.progressBetweenRows += speed;

        if (s.progressBetweenRows >= 1) {
          s.currentRow++;
          s.progressBetweenRows = 0;
          s.startCol = s.targetCol;

          // Hit logic
          if (s.currentRow < ROWS && s.currentRow >= 0) {
            playTick();
          }

          // Next Move
          if (s.currentRow < path.length) {
            const move = path[s.currentRow];
            s.targetCol = s.startCol + (move === "R" ? 0.5 : -0.5);
          } else {
            // Landed
            s.active = false;
            const final = Math.round(s.targetCol);
            const clampedFinal = Math.min(
              multipliers.length - 1,
              Math.max(0, final),
            );
            setLastLandedBin(clampedFinal);
            onFinishDrop();

            const finalMult = multipliers[clampedFinal] || 0;

            if (finalMult >= 1) {
              playWin(finalMult);
              const landX =
                (clampedFinal + 1) * colWidth + (width - 15 * colWidth) / 2;
              spawnConfetti(landX, binY);
            } else {
              playLoss();
            }
          }
        }

        const currentXGrid =
          s.startCol + (s.targetCol - s.startCol) * s.progressBetweenRows + 1;
        const currentYGrid =
          (s.currentRow === -1 ? -0.5 : s.currentRow) + s.progressBetweenRows;

        const pixelX = currentXGrid * colWidth + (width - 15 * colWidth) / 2;
        const pixelY = paddingTop + currentYGrid * rowHeight;

        ctx.beginPath();
        ctx.arc(pixelX, pixelY, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // --- Draw Particles ---
      if (particles.current.length > 0) {
        for (let i = particles.current.length - 1; i >= 0; i--) {
          const p = particles.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.2; // Gravity
          p.life -= 0.02;

          if (p.life <= 0) {
            particles.current.splice(i, 1);
            continue;
          }

          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.rect(p.x, p.y, p.size, p.size);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      }

      requestID = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(requestID);
  }, [
    dimensions,
    dropColumn,
    path,
    multipliers,
    onFinishDrop,
    lastLandedBin,
    isMuted,
  ]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative rounded-xl overflow-hidden cursor-crosshair"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
