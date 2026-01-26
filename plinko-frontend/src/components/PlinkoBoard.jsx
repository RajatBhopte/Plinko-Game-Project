import { useEffect, useRef, useState } from "react";
import { BallAnimator } from "../utils/animation";
import { BOARD_CONFIG, PAYOUT_MULTIPLIERS } from "../utils/constants";

export default function PlinkoBoard({
  path,
  dropColumn,
  isAnimating,
  onAnimationComplete,
  onPegHit,
}) {
  const canvasRef = useRef(null);
  const animatorRef = useRef(null);
  const [lastWinningSlot, setLastWinningSlot] = useState(null);

  // Draw static board
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isAnimating) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pegs
    const rows = 12;
    const centerX = canvas.width / 2;
    const startY = 60;
    const verticalSpacing = 35;
    const horizontalSpacing = 32;

    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3;
      for (let peg = 0; peg < pegsInRow; peg++) {
        const x =
          centerX -
          ((pegsInRow - 1) * horizontalSpacing) / 2 +
          peg * horizontalSpacing;
        const y = startY + row * verticalSpacing;

        // Glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 8);
        glow.addColorStop(0, "rgba(245, 158, 11, 0.5)");
        glow.addColorStop(1, "rgba(245, 158, 11, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Peg
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Drop indicator
    if (dropColumn !== null) {
      const x = centerX + (dropColumn - 6) * horizontalSpacing;
      ctx.strokeStyle = "rgba(245, 158, 11, 0.8)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, 15);
      ctx.lineTo(x, startY - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x - 4, 5);
      ctx.lineTo(x + 4, 5);
      ctx.closePath();
      ctx.fill();
    }

    // Bottom bins - INSIDE THE CANVAS
    const binCount = 13;
    const binWidth = canvas.width / binCount;
    const binY = canvas.height - 70;
    const binHeight = 55;

    for (let i = 0; i < binCount; i++) {
      const isWinner = lastWinningSlot === i;
      const mult = PAYOUT_MULTIPLIERS[i];

      ctx.fillStyle = isWinner
        ? "rgba(245, 158, 11, 0.4)"
        : mult >= 10
          ? "rgba(239, 68, 68, 0.3)"
          : "rgba(59, 130, 246, 0.2)";

      ctx.fillRect(i * binWidth + 1, binY, binWidth - 2, binHeight);

      ctx.strokeStyle = isWinner ? "#f59e0b" : "#4b5563";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(i * binWidth + 1, binY, binWidth - 2, binHeight);

      ctx.fillStyle = isWinner ? "#fff" : mult >= 10 ? "#f87171" : "#60a5fa";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `${mult}×`,
        i * binWidth + binWidth / 2,
        binY + binHeight / 2,
      );
    }
  }, [dropColumn, isAnimating, lastWinningSlot]);

  // Animation
  useEffect(() => {
    if (isAnimating && path && canvasRef.current) {
      animatorRef.current = new BallAnimator(
        canvasRef,
        path,
        dropColumn,
        onPegHit,
        (slot) => {
          setLastWinningSlot(slot);
          onAnimationComplete(slot);
        },
      );
      animatorRef.current.start();
    }
    return () => animatorRef.current?.stop();
  }, [isAnimating, path]);

  return (
    <div style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
      <canvas
        ref={canvasRef}
        width={500}
        height={550}
        style={{
          width: "100%",
          height: "auto",
          border: "3px solid #374151",
          borderRadius: "12px",
          backgroundColor: "#111827",
          display: "block",
        }}
      />

      {/* Status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "12px",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: isAnimating ? "#f59e0b" : "#4b5563",
          }}
        />
        <span style={{ fontSize: "14px", color: "#9ca3af" }}>
          {isAnimating ? "Ball in motion..." : "Ready to drop"}
        </span>
      </div>
    </div>
  );
}
