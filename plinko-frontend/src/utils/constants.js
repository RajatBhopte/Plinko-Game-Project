export const BOARD_CONFIG = {
  boardWidth: 650,
  boardHeight: 700,
  rows: 12,
  pegSpacing: 35,
  pegRadius: 6,
  pegColor: "#f59e0b",
  ballRadius: 8,
  ballColor: "#fbbf24",
  bgColor: "#0f172a",
  bins: 13,
  animationDuration: 3000,
};

export const PAYOUT_MULTIPLIERS = [
  10, 5, 2.5, 1.2, 0.5, 0.2, 0.2, 0.2, 0.5, 1.2, 2.5, 5, 10,
];

// Fix the getBinColor function
export function getBinColor(binIndex) {
  const multiplier = PAYOUT_MULTIPLIERS[binIndex];

  if (!multiplier) {
    return "#3b82f6"; // Default blue color
  }

  // High value (10x or more) - Red
  if (multiplier >= 10) {
    return "#ef4444";
  }
  // Medium-high value (3x or more) - Orange/Yellow
  else if (multiplier >= 3) {
    return "#eab308";
  }
  // Medium value (1x or more) - Blue
  else if (multiplier >= 1) {
    return "#3b82f6";
  }
  // Low value (less than 1x) - Dark blue/gray
  else {
    return "#1e40af";
  }
}
