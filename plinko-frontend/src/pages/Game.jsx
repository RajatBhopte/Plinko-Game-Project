import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameFlow, gameActions } from "../hooks/useGameFlow";
import { useKeyboard } from "../hooks/useKeyboard";
import { useSound } from "../hooks/useSound";
import { commitRound, startRound, revealRound } from "../utils/api";
import PlinkoBoard from "../components/PlinkoBoard";
import GameControls from "../components/GameControls";
import RoundInfo from "../components/RoundInfo";
import ResultDisplay from "../components/ResultDisplay";
import SoundToggle from "../components/SoundToggle";
// In your main.jsx or index.jsx or App.jsx

export default function Game() {
  const [state, dispatch, helpers] = useGameFlow();
  const { isMuted, setIsMuted, playPegSound, playLandingSound } = useSound();
  const [showStats, setShowStats] = useState(false);

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        dispatch(gameActions.clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error, dispatch]);

  const handleDrop = async () => {
    if (!helpers.canDrop) {
      console.warn("Cannot drop: game is not ready");
      return;
    }

    dispatch(gameActions.setLoading(true));

    try {
      // Step 1: Commit
      const commitData = await commitRound();
      dispatch(gameActions.commitSuccess(commitData));

      // Step 2: Auto-generate clientSeed and start
      const clientSeed = crypto.randomUUID();
      const startData = await startRound(
        commitData.roundId,
        clientSeed,
        state.betAmount,
        state.dropColumn,
      );

      dispatch(
        gameActions.startSuccess({
          ...startData,
          clientSeed,
        }),
      );
    } catch (error) {
      console.error("Drop error:", error);
      dispatch(gameActions.error(error.message || "Failed to start game"));
    }
  };

  const handleAnimationComplete = () => {
    playLandingSound();
    dispatch(gameActions.animationComplete());
  };

  const handleReveal = async () => {
    dispatch(gameActions.setLoading(true));
    try {
      const revealData = await revealRound(state.roundId);
      dispatch(gameActions.revealSuccess(revealData));
    } catch (error) {
      console.error("Reveal error:", error);
      dispatch(
        gameActions.error(error.message || "Failed to reveal server seed"),
      );
    }
  };

  const handleReset = () => {
    dispatch(gameActions.reset());
  };

  // Keyboard controls
  useKeyboard({
    onLeft: () => {
      if (state.phase === "IDLE") {
        dispatch(gameActions.setDropColumn(Math.max(0, state.dropColumn - 1)));
      }
    },
    onRight: () => {
      if (state.phase === "IDLE") {
        dispatch(gameActions.setDropColumn(Math.min(12, state.dropColumn + 1)));
      }
    },
    onDrop: () => {
      if (helpers.canDrop) handleDrop();
    },
    disabled: !helpers.canDrop,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-x-hidden">
      <div className="fixed top-4 right-4 z-50 w-12 h-12">
        <SoundToggle isMuted={isMuted} onToggle={() => setIsMuted(!isMuted)} />
      </div>

      {/* Stats Toggle Button */}
      <motion.button
        onClick={() => setShowStats(!showStats)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-4 left-4 z-50 p-3 bg-gray-800 hover:bg-gray-700 rounded-2xl shadow-2xl border-2 border-gray-700 transition-all duration-300"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          {state.stats.totalRounds > 0 && (
            <span className="text-xs font-bold text-amber-400">
              {state.stats.totalRounds}
            </span>
          )}
        </div>
      </motion.button>

      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed left-4 top-20 z-40 w-72 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border-2 border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">📈 Session Stats</h3>
              <button
                onClick={() => setShowStats(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <StatRow
                label="Total Rounds"
                value={state.stats.totalRounds}
                icon="🎲"
              />
              <StatRow
                label="Total Wagered"
                value={`${state.stats.totalWagered.toFixed(2)}$`}
                icon="💰"
              />
              <StatRow
                label="Total Payout"
                value={`${state.stats.totalPayout.toFixed(2)}$`}
                icon="💵"
              />
              <StatRow
                label="Net Profit"
                value={`${helpers.netProfit >= 0 ? "+" : ""}${helpers.netProfit.toFixed(2)}$`}
                valueColor={
                  helpers.netProfit >= 0 ? "text-green-400" : "text-red-400"
                }
                icon={helpers.netProfit >= 0 ? "📈" : "📉"}
              />
              <StatRow
                label="Biggest Win"
                value={`${state.stats.biggestWin.toFixed(2)}$`}
                icon="🏆"
              />
              <StatRow
                label="Best Multiplier"
                value={`${state.stats.biggestMultiplier}×`}
                icon="⚡"
              />
              <StatRow
                label="Avg. Multiplier"
                value={`${helpers.averageMultiplier}×`}
                icon="📊"
              />
            </div>

            {state.stats.totalRounds > 0 && (
              <button
                onClick={() => {
                  if (confirm("Clear all session statistics?")) {
                    dispatch(gameActions.clearHistory());
                  }
                }}
                className="w-full mt-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg font-semibold text-sm transition-all duration-200 border border-red-600/30"
              >
                Clear Stats
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md"
          >
            <div className="bg-gradient-to-r from-red-900 to-red-800 border-2 border-red-600 rounded-2xl shadow-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">❌</span>
                <div className="flex-1">
                  <p className="font-bold text-white mb-1">Error Occurred</p>
                  <p className="text-sm text-red-200">{state.error}</p>
                </div>
                <button
                  onClick={() => dispatch(gameActions.clearError())}
                  className="text-red-200 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          {/* Header */}
          <header className="text-center mb-12 relative">
            {/* Background glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10"
            >
              {/* Main title */}
              <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight">
                <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-2xl">
                  🎲 Plinko
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl font-bold text-gray-300 mb-4">
                Provably Fair Gaming
              </p>
              {/* Game status indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-gray-700/50 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    className={`w-3 h-3 rounded-full ${
                      helpers.isPlaying ? "bg-amber-500" : "bg-gray-500"
                    }`}
                    animate={
                      helpers.isPlaying
                        ? {
                            scale: [1, 1.2, 1],
                            boxShadow: [
                              "0 0 0 0 rgba(245, 158, 11, 0.7)",
                              "0 0 0 8px rgba(245, 158, 11, 0)",
                              "0 0 0 0 rgba(245, 158, 11, 0)",
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-sm font-bold text-gray-300">
                    {state.phase === "IDLE" && "🎯 Ready to Play"}
                    {state.phase === "COMMITTED" && "⏳ Committing Round..."}
                    {state.phase === "ANIMATING" && "🎲 Ball in Motion"}
                    {state.phase === "COMPLETED" && "✅ Round Complete"}
                    {state.phase === "REVEALED" && "🔓 Verified & Fair"}
                  </span>
                </div>

                {/* Round counter */}
                {state.stats.totalRounds > 0 && (
                  <>
                    <div className="w-px h-6 bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Rounds:</span>
                      <span className="text-sm font-bold text-amber-400">
                        {state.stats.totalRounds}
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          </header>

          {/* Game Layout */}
          {/* Game Layout */}
          {/* Game Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start max-w-[1400px] mx-auto">
            {/* Left Column - Board + Info Panels */}
            <div className="md:col-span-7 w-full space-y-4">
              {/* Plinko Board */}
              <div className="flex justify-center">
                <PlinkoBoard
                  path={state.path}
                  dropColumn={state.dropColumn}
                  isAnimating={state.phase === "ANIMATING"}
                  onAnimationComplete={handleAnimationComplete}
                  onPegHit={playPegSound}
                />
              </div>

              {/* Provably Fair & Result below board - Side by Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <RoundInfo state={state} />
                <ResultDisplay
                  state={state}
                  onReveal={handleReveal}
                  onReset={handleReset}
                />
              </div>
            </div>

            {/* Right Column - Controls Only */}
            <div className="md:col-span-5 w-full">
              <GameControls
                betAmount={state.betAmount}
                dropColumn={state.dropColumn}
                onBetChange={(val) => dispatch(gameActions.setBet(val))}
                onColumnChange={(val) =>
                  dispatch(gameActions.setDropColumn(val))
                }
                onDrop={handleDrop}
                disabled={!helpers.canDrop}
              />
            </div>
          </div>

          {state.history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📜</span>
                Recent Rounds
              </h3>

              {/* Horizontal scrollable container */}
              <div className="overflow-x-auto pb-4 -mx-4 px-4">
                <div className="flex gap-3 min-w-max">
                  {state.history.slice(0, 10).map((round, index) => (
                    <motion.div
                      key={round.roundId}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-xl border-2 w-32 flex-shrink-0 ${
                        round.profit > 0
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      <div className="text-xs text-gray-400 mb-1">
                        #{state.history.length - index}
                      </div>
                      <div
                        className={`text-2xl font-black ${
                          round.profit > 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {round.multiplier}×
                      </div>
                      <div
                        className={`text-xs font-semibold ${
                          round.profit > 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {round.profit > 0 ? "+" : ""}
                        {round.profit.toFixed(2)}$
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {state.isLoading && state.phase !== "ANIMATING" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="text-6xl"
            >
              ⏳
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper component for stats
function StatRow({ label, value, icon, valueColor = "text-white" }) {
  return (
    <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <span className={`font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}
