import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { PlinkoBoard } from "./components/PlinkoBoard";
import { ControlPanel } from "./components/ControlPanel";
import { Verifier } from "./components/Verifier";
import { usePlinkoGame } from "./hooks/usePlinkoGame";
import { initAudio, toggleMute } from "./utils/audio";

type View = "game" | "verifier";

const App = () => {
  const [view, setView] = useState<View>("game");
  const [betAmount, setBetAmount] = useState<number>(10);
  const [dropColumn, setDropColumn] = useState<number>(6);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const {
    dropBall,
    isDropping,
    lastResult,
    history,
    clientSeed,
    setClientSeed,
    revealRound,
    finishDrop,
    multipliers,
    nonce,
  } = usePlinkoGame();

  // Initialize audio context on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  // FIXED: Properly handle drop with async/await
  const handleDrop = async () => {
     const result = await dropBall(dropColumn, betAmount);

     console.log("🔍 DEBUG MULTIPLIER MISMATCH:");
     console.log("  Backend finalBin:", result?.finalBin);
     console.log("  Backend payout:", result?.payout);
     console.log("  Frontend multipliers array:", multipliers);
     console.log(
       "  Frontend multipliers[finalBin]:",
       multipliers[result?.finalBin || 0],
     );
     console.log(
       "  Do they match?",
       result?.payout === multipliers[result?.finalBin || 0],
     );
    if (isDropping) {
      console.log("⚠️ Already dropping, ignoring click");
      return;
    }

    console.log("🎮 DROP BUTTON CLICKED");
    console.log("Drop column:", dropColumn);
    console.log("Bet amount:", betAmount);

    try {
      const result = await dropBall(dropColumn, betAmount);

      if (!result) {
        console.error("❌ dropBall returned null/undefined");
        return;
      }

      console.log("✅ Drop completed successfully:");
      console.log("  - Path:", result.path);
      console.log("  - Final bin:", result.finalBin);
      console.log("  - Payout:", result.payout);
      console.log("  - Round ID:", result.roundId);
    } catch (error) {
      console.error("❌ Error in handleDrop:", error);
    }
  };

  // FIXED: Auto-reveal after animation finishes
  useEffect(() => {
    // When isDropping changes from true to false, animation finished
    if (
      !isDropping &&
      lastResult?.roundId &&
      lastResult.serverSeed === "HIDDEN_UNTIL_REVEAL"
    ) {
      console.log(
        "🔓 Animation finished, auto-revealing round:",
        lastResult.roundId,
      );

      // Small delay to let confetti finish
      setTimeout(() => {
        revealRound(lastResult.roundId!)
          .then((seed) => {
            console.log("✅ Round revealed, server seed:", seed);
          })
          .catch((err) => {
            console.error("❌ Failed to reveal round:", err);
          });
      }, 500);
    }
  }, [isDropping, lastResult?.roundId]);

  // Manual reveal button handler
  const handleReveal = async () => {
    console.log("🔓 MANUAL REVEAL BUTTON CLICKED");

    if (!lastResult?.roundId) {
      console.error("❌ No roundId available");
      return;
    }

    if (lastResult.serverSeed !== "HIDDEN_UNTIL_REVEAL") {
      console.log("⚠️ Already revealed:", lastResult.serverSeed);
      return;
    }

    try {
      const seed = await revealRound(lastResult.roundId);
      console.log("✅ Reveal successful:", seed);
    } catch (error) {
      console.error("❌ Reveal failed:", error);
    }
  };

  const handleMuteToggle = () => {
    const newState = toggleMute();
    setIsMuted(newState);
  };

  // Keyboard accessibility (Only in Game view)
  useEffect(() => {
    if (view !== "game") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDropping) return;

      if (e.code === "Space") {
        e.preventDefault();
        handleDrop();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        setDropColumn((prev) => Math.max(0, prev - 1));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        setDropColumn((prev) => Math.min(12, prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dropColumn, betAmount, isDropping, view]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] text-slate-100 font-sans lg:h-screen lg:overflow-hidden">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50 shrink-0 h-14 md:h-16">
        <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-lg">
              PLINKO
            </h1>
            <div className="h-6 w-px bg-slate-700 mx-2 hidden md:block"></div>
            <div className="flex gap-1">
              <button
                onClick={() => setView("game")}
                className={`px-3 py-1 rounded-full text-xs md:text-sm font-bold transition-all ${view === "game" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" : "text-slate-400 hover:text-slate-200"}`}
              >
                Game
              </button>
              <button
                onClick={() => setView("verifier")}
                className={`px-3 py-1 rounded-full text-xs md:text-sm font-bold transition-all ${view === "verifier" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" : "text-slate-400 hover:text-slate-200"}`}
              >
                Verifier
              </button>
            </div>
          </div>

          <div className="text-[10px] md:text-xs text-slate-500 hidden sm:block">
            Provably Fair & Secure
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-2 lg:p-4 overflow-hidden flex flex-col">
        {view === "game" ? (
          <div className="flex flex-col lg:flex-row gap-4 h-full animate-fade-in overflow-y-auto lg:overflow-hidden pb-safe">
            {/* Game Board Section */}
            <div
              className="order-1 lg:order-2 shrink-0 w-full h-[50vh] min-h-[300px] lg:h-full lg:flex-1 bg-gradient-to-b from-slate-800/20 to-slate-900/80 rounded-3xl border border-slate-700/30 shadow-2xl relative overflow-hidden backdrop-blur-md flex flex-col p-1"
              role="application"
              aria-label="Plinko Board"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
              <PlinkoBoard
                dropColumn={dropColumn}
                isDropping={isDropping}
                path={lastResult?.path}
                finalBin={lastResult?.finalBin}
                onFinishDrop={finishDrop}
                multipliers={multipliers}
                isMuted={isMuted}
              />
            </div>

            {/* Controls Section */}
            <div className="order-2 lg:order-1 w-full lg:w-[400px] flex flex-col gap-4 lg:h-full lg:overflow-y-auto custom-scrollbar pr-1 pb-8 lg:pb-0">
              {/* Desktop Header Controls Info */}
              <header className="shrink-0 hidden lg:block">
                <p
                  className="text-slate-400 text-xs flex items-center gap-2"
                  role="status"
                  aria-label="Game controls"
                >
                  <span className="sr-only">Controls:</span>
                  <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-700 font-mono shadow-sm">
                    ←
                  </kbd>
                  <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-700 font-mono shadow-sm">
                    →
                  </kbd>{" "}
                  Aim
                  <span className="mx-1 text-slate-600">|</span>
                  <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-700 font-mono shadow-sm">
                    Space
                  </kbd>{" "}
                  Drop
                </p>
              </header>

              {/* Control Panel */}
              <div className="shrink-0">
                <ControlPanel
                  betAmount={betAmount}
                  setBetAmount={setBetAmount}
                  dropColumn={dropColumn}
                  setDropColumn={setDropColumn}
                  onDrop={handleDrop}
                  isDropping={isDropping}
                  isMuted={isMuted}
                  onToggleMute={handleMuteToggle}
                  clientSeed={clientSeed}
                  setClientSeed={setClientSeed}
                  nonce={nonce}
                />
              </div>

              {/* FIXED: Last Result Display */}
              {lastResult && (
                <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800 shadow-inner">
                  <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-3">
                    Last Drop Result
                  </h3>

                  {/* Result Summary */}
                  <div className="bg-slate-800/50 rounded-lg p-3 mb-3 border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-xs">Final Bin:</span>
                      <span className="text-cyan-400 font-mono font-bold text-lg">
                        {lastResult.finalBin}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-xs">
                        Multiplier:
                      </span>
                      <span
                        className={`font-mono font-bold text-lg ${lastResult.payout >= 1 ? "text-green-400" : "text-red-400"}`}
                      >
                        {lastResult.payout}x
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs">Payout:</span>
                      <span className="text-white font-bold text-lg">
                        ${(lastResult.bet * lastResult.payout).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Fairness Details */}
                  <h4 className="text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-2">
                    Fairness Details
                  </h4>
                  <div className="flex flex-col gap-2 text-xs font-mono text-slate-300">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-[10px]">
                        Client Seed:
                      </span>
                      <span className="bg-slate-800/50 px-2 py-1 rounded text-[10px] break-all">
                        {lastResult.clientSeed}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[10px]">Nonce:</span>
                      <span className="bg-slate-800/50 px-2 py-1 rounded text-[10px]">
                        {lastResult.nonce}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-[10px]">
                        Server Seed:
                      </span>
                      {lastResult.serverSeed === "HIDDEN_UNTIL_REVEAL" ? (
                        <button
                          onClick={handleReveal}
                          disabled={isDropping}
                          className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/50 px-3 py-1.5 rounded text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🔓 REVEAL SERVER SEED
                        </button>
                      ) : (
                        <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-[10px] break-all border border-green-500/30">
                          {lastResult.serverSeed}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* History */}
              <div
                className="bg-slate-900/40 rounded-xl p-4 border border-slate-800 flex-1 min-h-[200px] flex flex-col shadow-inner overflow-hidden"
                aria-label="Game History"
              >
                <div className="flex justify-between items-end mb-3 shrink-0">
                  <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    Recent Drops
                  </h3>
                  <span className="text-[9px] text-slate-600">
                    {history.length} games
                  </span>
                </div>
                <div className="flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar flex-1 max-h-[300px] lg:max-h-none">
                  {history.length === 0 && (
                    <div className="text-slate-600 text-xs italic text-center mt-6">
                      No games played yet.
                    </div>
                  )}
                  {history
                    .slice()
                    .reverse()
                    .map((game, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1 bg-slate-800/40 p-2 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors group shrink-0"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${game.payout >= 1 ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-red-400"}`}
                            ></div>
                            <span className="text-[10px] text-slate-500">
                              Bin {game.finalBin}
                            </span>
                            <span
                              className={`font-mono text-xs font-bold ${game.payout >= 1 ? "text-green-400" : "text-slate-400"}`}
                            >
                              {game.payout}x
                            </span>
                          </div>
                          <span className="text-slate-200 text-xs font-medium">
                            ${(game.bet * game.payout).toFixed(2)}
                          </span>
                        </div>
                        <div className="hidden group-hover:flex justify-between items-center border-t border-slate-700 pt-1 mt-1">
                          <div className="text-[9px] text-slate-500 font-mono">
                            #{game.nonce}
                          </div>
                          <button
                            onClick={() => setView("verifier")}
                            className="text-[9px] text-cyan-500 hover:text-cyan-300 uppercase font-bold"
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <Verifier />
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(71, 85, 105, 0.7); }
      `}</style>
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
