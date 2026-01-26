import { BOARD_CONFIG, getBinColor, PAYOUT_MULTIPLIERS } from "./constants";

export class BallAnimator {
  constructor(canvasRef, path, dropColumn, onPegHit, onComplete) {
    this.canvas = canvasRef.current;
    if (!this.canvas) {
      console.error("Canvas reference is null");
      return;
    }

    this.ctx = this.canvas.getContext("2d");
    this.path = path;
    this.dropColumn = dropColumn;
    this.onPegHit = onPegHit;
    this.onComplete = onComplete;

    this.currentStep = 0;
    this.progress = 0;
    this.animationId = null;
    this.startTime = null;
    this.trailPositions = [];
    this.pegHitPositions = [];
    this.velocity = { x: 0, y: 0 };
    this.rotation = 0;
    this.bounceScale = 1;
    this.particleEffects = [];

    // Calculate final bin index upfront
    const rightMoves = this.path.filter((s) => s.direction === "R").length;
    this.finalBinIndex = rightMoves;
  }

  getPegPosition(row, peg) {
    const centerX = this.canvas.width / 2;
    const startY = 60;
    const verticalSpacing = 35;
    const horizontalSpacing = 32;

    const pegsInRow = row + 3;
    const x =
      centerX -
      ((pegsInRow - 1) * horizontalSpacing) / 2 +
      peg * horizontalSpacing;
    const y = startY + row * verticalSpacing;

    return { x, y };
  }

  getBinPosition(binIndex) {
    const binWidth = this.canvas.width / 13;
    const binY = this.canvas.height - 70;
    return {
      x: binIndex * binWidth + binWidth / 2,
      y: binY + 27.5,
    };
  }

  getBallPosition(stepIndex, stepProgress) {
    if (stepIndex >= this.path.length) {
      const binPos = this.getBinPosition(this.finalBinIndex);
      return { x: binPos.x, y: binPos.y };
    }

    const currentStep = this.path[stepIndex];
    const currentPeg = this.getPegPosition(currentStep.row, currentStep.peg);

    if (stepIndex === 0) {
      const startY = 20;
      // Add easing to the initial drop
      const easedProgress = this.easeInQuad(stepProgress);
      return {
        x: currentPeg.x,
        y: startY + (currentPeg.y - startY) * easedProgress,
      };
    }

    const nextRow = currentStep.row + 1;
    const nextPeg = currentStep.peg + (currentStep.direction === "R" ? 1 : 0);
    const nextPos = this.getPegPosition(nextRow, nextPeg);

    // Add slight curve to the path
    const midX = (currentPeg.x + nextPos.x) / 2;
    const midY = (currentPeg.y + nextPos.y) / 2;
    const controlX =
      midX +
      (nextPos.x - currentPeg.x) *
        0.1 *
        (currentStep.direction === "R" ? 1 : -1);

    // Quadratic bezier curve
    const t = this.easeInOutQuad(stepProgress);
    const x =
      Math.pow(1 - t, 2) * currentPeg.x +
      2 * (1 - t) * t * controlX +
      Math.pow(t, 2) * nextPos.x;
    const y =
      Math.pow(1 - t, 2) * currentPeg.y +
      2 * (1 - t) * t * midY +
      Math.pow(t, 2) * nextPos.y;

    return { x, y };
  }

  // Easing functions for smoother animation
  easeInQuad(t) {
    return t * t;
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  easeOutBounce(t) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  createParticleEffect(x, y, color = "#fbbf24") {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 2;
      this.particleEffects.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 2 + Math.random() * 2,
      });
    }
  }

  updateParticles() {
    this.particleEffects = this.particleEffects.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2; // Gravity
      particle.life -= 0.02;
      return particle.life > 0;
    });
  }

  drawParticles() {
    this.particleEffects.forEach((particle) => {
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }

  drawBackground() {
    // Gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(1, "#1e293b");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle grid
    this.ctx.strokeStyle = "rgba(71, 85, 105, 0.2)";
    this.ctx.lineWidth = 1;
    const spacing = 50;
    for (let x = 0; x < this.canvas.width; x += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  drawPegs() {
    const pegRadius = 4;
    const rows = 12;
    const centerX = this.canvas.width / 2;
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

        const wasHit = this.pegHitPositions.some(
          (hit) =>
            Math.abs(hit.x - x) < 5 && Math.abs(hit.y - y) < 5 && hit.life > 0,
        );

        const glowGradient = this.ctx.createRadialGradient(x, y, 0, x, y, 10);
        glowGradient.addColorStop(
          0,
          wasHit ? "rgba(251, 191, 36, 0.8)" : "rgba(245, 158, 11, 0.4)",
        );
        glowGradient.addColorStop(1, "rgba(245, 158, 11, 0)");
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10, 0, Math.PI * 2);
        this.ctx.fill();

        const pegGradient = this.ctx.createRadialGradient(
          x - 1.5,
          y - 1.5,
          0,
          x,
          y,
          pegRadius,
        );
        pegGradient.addColorStop(0, "#fbbf24");
        pegGradient.addColorStop(1, "#f59e0b");
        this.ctx.fillStyle = pegGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = "#d97706";
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        this.ctx.beginPath();
        this.ctx.arc(x - 1.5, y - 1.5, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    this.pegHitPositions = this.pegHitPositions.filter((hit) => {
      hit.life -= 0.05;
      return hit.life > 0;
    });
  }

  drawBins() {
    const bins = 13;
    const binWidth = this.canvas.width / bins;
    const binHeight = 55;
    const binY = this.canvas.height - 70;

    for (let i = 0; i < bins; i++) {
      const isTargetBin = i === this.finalBinIndex;

      if (isTargetBin && this.currentStep > this.path.length * 0.7) {
        this.ctx.fillStyle = getBinColor(i);
        this.ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.2;
      } else {
        this.ctx.fillStyle = getBinColor(i);
        this.ctx.globalAlpha = 0.3;
      }

      this.ctx.fillRect(i * binWidth + 1, binY, binWidth - 2, binHeight);

      this.ctx.strokeStyle = isTargetBin ? "#f59e0b" : "#4b5563";
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(i * binWidth + 1, binY, binWidth - 2, binHeight);

      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = isTargetBin
        ? "#fff"
        : PAYOUT_MULTIPLIERS[i] >= 10
          ? "#f87171"
          : "#60a5fa";
      this.ctx.font = isTargetBin ? "bold 12px Arial" : "bold 11px Arial";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(
        `${PAYOUT_MULTIPLIERS[i]}×`,
        i * binWidth + binWidth / 2,
        binY + binHeight / 2,
      );
    }
    this.ctx.globalAlpha = 1;
  }

  drawBall(x, y) {
    const { ballRadius, ballColor } = BOARD_CONFIG;

    // Draw motion trail
    this.trailPositions.forEach((pos, idx) => {
      const alpha = (idx / this.trailPositions.length) * 0.4;
      const size =
        ballRadius * (0.5 + (idx / this.trailPositions.length) * 0.4);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = ballColor;
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.globalAlpha = 1;

    // Draw ball shadow
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.ctx.beginPath();
    this.ctx.ellipse(
      x + 2,
      y + 3,
      ballRadius * 0.9,
      ballRadius * 0.6,
      0,
      0,
      Math.PI * 2,
    );
    this.ctx.fill();

    // Draw ball with bounce scale
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(this.rotation);
    this.ctx.scale(this.bounceScale, this.bounceScale);

    // Ball gradient
    const ballGradient = this.ctx.createRadialGradient(
      -3,
      -3,
      0,
      0,
      0,
      ballRadius,
    );
    ballGradient.addColorStop(0, "#fde68a");
    ballGradient.addColorStop(0.5, ballColor);
    ballGradient.addColorStop(1, "#d97706");
    this.ctx.fillStyle = ballGradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, ballRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Ball shine
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    this.ctx.beginPath();
    this.ctx.arc(
      -ballRadius * 0.3,
      -ballRadius * 0.3,
      ballRadius * 0.4,
      0,
      Math.PI * 2,
    );
    this.ctx.fill();

    this.ctx.restore();

    // Outer glow
    const glowGradient = this.ctx.createRadialGradient(
      x,
      y,
      ballRadius,
      x,
      y,
      ballRadius * 2.5,
    );
    glowGradient.addColorStop(0, "rgba(251, 191, 36, 0.6)");
    glowGradient.addColorStop(1, "rgba(251, 191, 36, 0)");
    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, ballRadius * 2.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  animate(timestamp) {
    if (!this.startTime) this.startTime = timestamp;
    const elapsed = timestamp - this.startTime;
    const totalProgress = Math.min(elapsed / BOARD_CONFIG.animationDuration, 1);

    if (totalProgress >= 1) {
      // Final bounce animation in bin
      const finalPos = this.getBinPosition(this.finalBinIndex);
      const bounceProgress = Math.min(
        (elapsed - BOARD_CONFIG.animationDuration) / 500,
        1,
      );

      if (bounceProgress < 1) {
        const bounceY =
          finalPos.y -
          Math.abs(Math.sin(bounceProgress * Math.PI * 2)) *
            20 *
            (1 - bounceProgress);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();
        this.drawBins();
        this.drawPegs();
        this.drawParticles();
        this.drawBall(finalPos.x, bounceY);
        this.updateParticles();
        this.animationId = requestAnimationFrame((ts) => this.animate(ts));
        return;
      }

      // Create celebration particles
      this.createParticleEffect(
        finalPos.x,
        finalPos.y,
        getBinColor(this.finalBinIndex),
      );
      this.onComplete(this.finalBinIndex);
      return;
    }

    const targetStep = Math.floor(totalProgress * this.path.length);
    const stepProgress = (totalProgress * this.path.length) % 1;

    // Detect peg hit
    if (targetStep > this.currentStep) {
      const currentStep = this.path[this.currentStep];
      const pegPos = this.getPegPosition(currentStep.row, currentStep.peg);
      this.pegHitPositions.push({ ...pegPos, life: 1 });
      this.createParticleEffect(pegPos.x, pegPos.y);
      this.bounceScale = 1.2; // Bounce effect
      this.onPegHit?.();
      this.currentStep = targetStep;
    }

    // Smooth bounce scale back
    this.bounceScale = Math.max(1, this.bounceScale - 0.05);

    const ballPos = this.getBallPosition(this.currentStep, stepProgress);

    // Update rotation based on movement
    if (this.trailPositions.length > 0) {
      const lastPos = this.trailPositions[this.trailPositions.length - 1];
      const dx = ballPos.x - lastPos.x;
      this.rotation += dx * 0.1;
    }

    // Add to trail
    this.trailPositions.push({ ...ballPos });
    if (this.trailPositions.length > 15) {
      this.trailPositions.shift();
    }

    // Render
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawBins();
    this.drawPegs();
    this.drawParticles();
    this.drawBall(ballPos.x, ballPos.y);
    this.updateParticles();

    this.animationId = requestAnimationFrame((ts) => this.animate(ts));
  }

  start() {
    if (!this.canvas) {
      console.error("Cannot start animation: canvas is null");
      return;
    }
    this.animationId = requestAnimationFrame((ts) => this.animate(ts));
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
