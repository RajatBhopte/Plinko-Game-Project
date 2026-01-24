import React, { useState } from "react";

interface ControlPanelProps {
  betAmount: number;
  setBetAmount: (n: number) => void;
  dropColumn: number;
  setDropColumn: (n: number) => void;
  onDrop: () => void;
  isDropping: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  clientSeed?: string;
  setClientSeed?: (s: string) => void;
  nonce?: number;
}

const PayTableLegend = () => {
  const payouts = [10, 5, 2.5, 1.2, 0.5, 0.2, 0.2, 0.2, 0.5, 1.2, 2.5, 5, 10];
  return (
    <div className="mt-2">
      <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 block">
        Paytable (xMultipliers)
      </label>
      <div className="flex justify-between items-end h-8 gap-0.5">
        {payouts.map((p, i) => {
          const height = Math.min(100, p * 8 + 20) + "%";
          const color = p >= 1 ? "bg-green-500/80" : "bg-red-500/60";
          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end items-center group relative"
            >
              <div
                className={`w-full rounded-t-sm ${color} transition-all hover:bg-cyan-400`}
                style={{ height }}
              ></div>
              <span className="text-[9px] text-slate-400 mt-1 opacity-0 group-hover:opacity-100 absolute -bottom-4 whitespace-nowrap z-10 bg-slate-900/90 px-1 rounded border border-slate-700">
                {p}x
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  betAmount,
  setBetAmount,
  dropColumn,
  setDropColumn,
  onDrop,
  isDropping,
  isMuted,
  onToggleMute,
  clientSeed,
  setClientSeed,
  nonce,
}) => {
  const [showFairness, setShowFairness] = useState(false);

  const generateRandomSeed = () => {
    if (setClientSeed) {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setClientSeed(result);
    }
  };

  const handleBetChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setBetAmount(num);
    } else if (value === "" || value === ".") {
      setBetAmount(0);
    }
  };

  const halveBet = () => {
    const newBet = betAmount / 2;
    setBetAmount(Math.max(0.01, parseFloat(newBet.toFixed(2))));
  };

  const doubleBet = () => {
    const newBet = betAmount * 2;
    setBetAmount(parseFloat(newBet.toFixed(2)));
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl flex flex-col gap-4">
      {/* Bet Amount */}
      <div className="space-y-1">
        <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          Bet Amount ($)
        </label>
        <div className="relative group">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => handleBetChange(e.target.value)}
            disabled={isDropping}
            step="0.01"
            min="0"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-3 pr-24 text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 transition-all"
            placeholder="0.00"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 bg-slate-800/50 p-1 rounded-md backdrop-blur-sm">
            <button
              onClick={halveBet}
              className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-[10px] text-slate-300 font-bold transition hover:text-white border border-slate-600"
              disabled={isDropping}
              type="button"
              title="Halve Bet"
            >
              ½
            </button>
            <button
              onClick={doubleBet}
              className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-[10px] text-slate-300 font-bold transition hover:text-white border border-slate-600"
              disabled={isDropping}
              type="button"
              title="Double Bet"
            >
              2x
            </button>
          </div>
        </div>
      </div>

      {/* Drop Column Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            Drop Position
          </label>
          <span className="font-mono text-cyan-400 font-bold text-sm">
            {dropColumn}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="12"
          step="1"
          value={dropColumn}
          onChange={(e) => setDropColumn(Number(e.target.value))}
          disabled={isDropping}
          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition"
        />
        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>Left</span>
          <span>Center</span>
          <span>Right</span>
        </div>
      </div>

      <div className="h-px bg-slate-700/50 my-1"></div>

      {/* Drop Button */}
      <button
        onClick={onDrop}
        disabled={isDropping}
        type="button"
        className={`
          w-full py-3 rounded-lg font-display font-bold text-lg tracking-widest transition-all transform shadow-lg relative overflow-hidden
          ${
            isDropping
              ? "bg-slate-700 text-slate-500 cursor-not-allowed scale-[0.98]"
              : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white hover:scale-[1.02] shadow-cyan-500/20 active:scale-[0.98]"
          }
        `}
      >
        {isDropping ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-slate-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-sm">DROPPING</span>
          </span>
        ) : (
          "DROP"
        )}
      </button>

      {/* Footer Controls */}
      <div className="flex justify-between items-center px-1">
        <button
          onClick={onToggleMute}
          type="button"
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-[10px] transition group"
        >
          {isMuted ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 group-hover:text-red-400 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
              <span>Muted</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 group-hover:text-cyan-400 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
              <span>Sound On</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowFairness(!showFairness)}
          type="button"
          className={`text-[10px] flex items-center gap-1 transition ${showFairness ? "text-cyan-400 font-bold" : "text-slate-500 hover:text-cyan-400"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Fairness
        </button>
      </div>

      {/* Fairness Panel */}
      {showFairness && setClientSeed && (
        <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
          <div className="bg-slate-950/50 px-3 py-1.5 border-b border-slate-700/50 flex justify-between items-center">
            <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">
              Provably Fair
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-500 uppercase font-bold">
                Nonce
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-900/20 px-1 rounded">
                {nonce ?? 0}
              </span>
            </div>
          </div>

          <div className="p-3 space-y-2">
            <div>
              <label className="text-slate-400 text-[10px] block mb-1">
                Client Seed
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={clientSeed ?? ""}
                  onChange={(e) => setClientSeed?.(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
                <button
                  onClick={generateRandomSeed}
                  type="button"
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white rounded p-1 transition-colors"
                  title="Randomize Seed"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PayTableLegend />
    </div>
  );
};
