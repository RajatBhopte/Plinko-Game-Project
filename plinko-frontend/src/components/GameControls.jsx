import { motion } from "framer-motion";
import { useState } from "react";

export default function GameControls({
  betAmount,
  dropColumn,
  onBetChange,
  onColumnChange,
  onDrop,
  disabled,
}) {
  const [isFocused, setIsFocused] = useState({ bet: false, column: false });

  const handleBetChange = (e) => {
    const value = e.target.value;
    // Allow empty input for better UX while typing
    if (value === "") {
      onBetChange(1);
      return;
    }
    const parsed = parseInt(value);
    onBetChange(Math.max(1, Math.min(10000, parsed || 1))); // Add max limit
  };

  const quickBetAmounts = [10, 50, 100, 500];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 rounded-2xl shadow-2xl border border-gray-700/50 backdrop-blur-sm"
    >
      {/* Bet Amount Section */}
      <div>
        <label className="block text-sm font-semibold mb-3 text-gray-200 tracking-wide">
          Bet Amount
          <span className="text-xs text-gray-500 ml-2 font-normal">
            (Rupee)
          </span>
        </label>

        <div className="relative">
          <input
            type="number"
            value={betAmount}
            onChange={handleBetChange}
            onFocus={() => setIsFocused({ ...isFocused, bet: true })}
            onBlur={() => setIsFocused({ ...isFocused, bet: false })}
            disabled={disabled}
            min="1"
            max="10000"
            className={`w-full px-4 py-3.5 bg-gray-900/80 text-white text-lg font-medium rounded-xl 
              border-2 transition-all duration-200 outline-none disabled:opacity-40 disabled:cursor-not-allowed
              ${isFocused.bet && !disabled ? "border-amber-500 ring-4 ring-amber-500/20" : "border-gray-700"}
              hover:border-gray-600 disabled:hover:border-gray-700`}
            placeholder="Enter amount"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
            $
          </span>
        </div>

        {/* Quick Bet Buttons */}
        <div className="flex gap-2 mt-3">
          {quickBetAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => onBetChange(amount)}
              disabled={disabled}
              className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200
                ${
                  betAmount === amount
                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                    : "bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white"
                }
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-700/50`}
            >
              {amount}$
            </button>
          ))}
        </div>
      </div>

      {/* Drop Column Section */}
      <div>
        <label className="block text-sm font-semibold mb-3 text-gray-200 tracking-wide">
          Drop Position
          <span className="ml-3 inline-flex items-center px-3 py-1 bg-amber-500/20 text-amber-400 text-base font-bold rounded-lg border border-amber-500/30">
            {dropColumn}
          </span>
        </label>

        <div className="relative pt-2 pb-4">
          <input
            type="range"
            min="0"
            max="12"
            value={dropColumn}
            onChange={(e) => onColumnChange(parseInt(e.target.value))}
            onFocus={() => setIsFocused({ ...isFocused, column: true })}
            onBlur={() => setIsFocused({ ...isFocused, column: false })}
            disabled={disabled}
            className="w-full h-3 bg-gray-900/80 rounded-full appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
              slider-thumb"
            style={{
              background: `linear-gradient(to right, 
                rgb(245, 158, 11) 0%, 
                rgb(245, 158, 11) ${(dropColumn / 12) * 100}%, 
                rgb(17, 24, 39) ${(dropColumn / 12) * 100}%, 
                rgb(17, 24, 39) 100%)`,
            }}
          />

          {/* Column markers */}
          <div className="flex justify-between text-xs font-medium text-gray-500 mt-2 px-1">
            {[0, 3, 6, 9, 12].map((num) => (
              <span
                key={num}
                className={`${dropColumn === num ? "text-amber-400 font-bold" : ""}`}
              >
                {num}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Drop Button */}
      <motion.button
        onClick={onDrop}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        className={`w-full py-4 rounded-xl font-bold text-lg shadow-2xl transition-all duration-200 relative overflow-hidden
          ${
            disabled
              ? "bg-gray-700 cursor-not-allowed text-gray-400"
              : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white shadow-amber-500/50"
          }`}
      >
        {disabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        )}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {disabled ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                ⏳
              </motion.span>
              DROPPING...
            </>
          ) : (
            <>🎯 DROP BALL</>
          )}
        </span>
      </motion.button>

      {/* Keyboard Hint */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <kbd className="px-2 py-1 bg-gray-900 rounded border border-gray-700 font-mono">
          ←
        </kbd>
        <kbd className="px-2 py-1 bg-gray-900 rounded border border-gray-700 font-mono">
          →
        </kbd>
        <span>or</span>
        <kbd className="px-2.5 py-1 bg-gray-900 rounded border border-gray-700 font-mono">
          Space
        </kbd>
        <span>to drop</span>
      </div>
    </motion.div>
  );
}
