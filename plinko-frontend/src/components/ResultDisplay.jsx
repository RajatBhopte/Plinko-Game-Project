import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { PAYOUT_MULTIPLIERS } from "../utils/constants";

export default function ResultDisplay({ state, onReveal, onReset }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animateProfit, setAnimateProfit] = useState(false);

  // ✅ Calculate these before any early returns
  const payout = state.betAmount * state.payoutMultiplier;
  const profit = payout - state.betAmount;
  const profitPercentage = ((profit / state.betAmount) * 100).toFixed(1);
  const isWin = profit > 0;
  const isBigWin = state.payoutMultiplier >= 10;

  // ✅ All hooks must be called before any conditional returns
  useEffect(() => {
    if (isWin && (state.phase === "COMPLETED" || state.phase === "REVEALED")) {
      setShowConfetti(true);
      setAnimateProfit(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isWin, state.phase]);

  // ✅ NOW you can return early
  if (state.phase !== "COMPLETED" && state.phase !== "REVEALED") {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state.phase}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden"
      >
        {/* Confetti Effect for Big Wins */}
        {showConfetti && isBigWin && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: -20,
                  backgroundColor: ["#fbbf24", "#f59e0b", "#ef4444", "#10b981"][
                    Math.floor(Math.random() * 4)
                  ],
                }}
                initial={{ y: -20, opacity: 1, rotate: 0 }}
                animate={{
                  y: 400,
                  opacity: 0,
                  rotate: Math.random() * 720,
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5,
                  ease: "easeIn",
                }}
              />
            ))}
          </div>
        )}

        <div
          className={`p-6 rounded-2xl shadow-2xl border-2 transition-all duration-300 ${
            isBigWin
              ? "bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 border-amber-500/50"
              : isWin
                ? "bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 border-green-500/50"
                : "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border-gray-700/50"
          }`}
        >
          {/* Header with Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <motion.span
              className="text-5xl"
              animate={
                isBigWin
                  ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }
                  : {}
              }
              transition={{
                duration: 0.6,
                repeat: isBigWin ? Infinity : 0,
                repeatDelay: 1,
              }}
            >
              {isBigWin ? "🎉" : isWin ? "🎊" : "😐"}
            </motion.span>
            <h3 className="text-3xl font-black tracking-tight">
              {isBigWin ? "BIG WIN!" : isWin ? "Winner!" : "Result"}
            </h3>
          </motion.div>

          {/* Stats Grid */}
          <div className="space-y-4 mb-6">
            {/* Bin Landing */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/10"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span className="text-sm text-gray-400 font-medium">
                  Landed on
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">BIN</span>
                <span className="font-black text-2xl text-amber-400">
                  #{state.binIndex}
                </span>
              </div>
            </motion.div>

            {/* Multiplier */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/10"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="text-sm text-gray-400 font-medium">
                  Multiplier
                </span>
              </div>
              <motion.span
                className={`font-black text-3xl ${
                  isBigWin
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500"
                    : isWin
                      ? "text-green-400"
                      : "text-gray-400"
                }`}
                animate={isBigWin ? { scale: [1, 1.1, 1] } : {}}
                transition={{
                  duration: 0.5,
                  repeat: isBigWin ? Infinity : 0,
                  repeatDelay: 0.8,
                }}
              >
                {state.payoutMultiplier}×
              </motion.span>
            </motion.div>

            {/* Bet Amount */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/10"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <span className="text-sm text-gray-400 font-medium">
                  Bet Amount
                </span>
              </div>
              <span className="font-bold text-xl text-gray-300">
                {state.betAmount.toFixed(2)}$
              </span>
            </motion.div>

            {/* Payout */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/10"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">💵</span>
                <span className="text-sm text-gray-400 font-medium">
                  Payout
                </span>
              </div>
              <span className="font-bold text-xl text-white">
                {payout.toFixed(2)}$
              </span>
            </motion.div>

            {/* Profit - The Main Event */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 150 }}
              className={`p-5 rounded-xl border-2 ${
                isWin
                  ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50"
                  : "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.span
                    className="text-3xl"
                    animate={isWin && animateProfit ? { rotate: [0, 360] } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    {isWin ? "📈" : "📉"}
                  </motion.span>
                  <div>
                    <span className="text-sm text-gray-400 font-medium block">
                      Net Profit
                    </span>
                    <span
                      className={`text-xs font-semibold ${isWin ? "text-green-400" : "text-red-400"}`}
                    >
                      {isWin ? "+" : ""}
                      {profitPercentage}%
                    </span>
                  </div>
                </div>
                <motion.div
                  className="text-right"
                  animate={isWin && animateProfit ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <span
                    className={`font-black text-3xl ${
                      isWin ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {profit >= 0 ? "+" : ""}
                    {profit.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">$</span>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            {state.phase === "COMPLETED" && (
              <motion.button
                onClick={onReveal}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>🔓</span>
                Reveal Server Seed
              </motion.button>
            )}

            {state.phase === "REVEALED" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30 mb-3"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-400 mb-1">
                      Server Seed Revealed
                    </p>
                    <p className="text-xs text-gray-400 font-mono break-all">
                      This game was provably fair and verified
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.button
              onClick={onReset}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                🔄
              </motion.span>
              Play Again
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
