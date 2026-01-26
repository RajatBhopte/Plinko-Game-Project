import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function RoundInfo({ state }) {
  const [copiedField, setCopiedField] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!state.roundId) return null;

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const InfoRow = ({ label, value, fullValue, color, icon, fieldName }) => {
    const displayValue = value || fullValue;
    const isCopied = copiedField === fieldName;

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="group flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-gray-600/80 hover:bg-gray-900/70 transition-all duration-200"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">{icon}</span>
          <span className="text-gray-400 text-xs font-medium whitespace-nowrap">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <span
            className={`${color} font-mono text-sm truncate max-w-[120px] ${
              isExpanded ? "max-w-none" : ""
            }`}
            title={fullValue}
          >
            {displayValue}
          </span>
          <motion.button
            onClick={() => copyToClipboard(fullValue, fieldName)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex-shrink-0 p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 transition-all duration-200 opacity-0 group-hover:opacity-100"
            title="Copy to clipboard"
          >
            <AnimatePresence mode="wait">
              {isCopied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className="text-green-400 text-xs block"
                >
                  ✓
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-gray-400 text-xs block"
                >
                  📋
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-gray-700/50 shadow-2xl"
    >
      {/* Header */}
      <div className="relative p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <span className="text-xl">🔒</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Provably Fair</h3>
              <p className="text-xs text-gray-400">
                Cryptographic Verification
              </p>
            </div>
          </div>

          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600/50 transition-all duration-200"
          >
            {isExpanded ? "Collapse" : "Expand All"}
          </motion.button>
        </div>

        {/* Decorative line */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {/* Info Grid */}
      <div className="p-4 space-y-2">
        <InfoRow
          label="Round ID"
          value={`${state.roundId.slice(0, 8)}...${state.roundId.slice(-6)}`}
          fullValue={state.roundId}
          color="text-amber-400"
          icon="🎲"
          fieldName="roundId"
        />

        <InfoRow
          label="Commit Hash"
          value={
            state.commitHex
              ? `${state.commitHex.slice(0, 10)}...${state.commitHex.slice(-8)}`
              : "N/A"
          }
          fullValue={state.commitHex || "N/A"}
          color="text-blue-400"
          icon="🔐"
          fieldName="commitHash"
        />

        <InfoRow
          label="Nonce"
          value={state.nonce?.toString()}
          fullValue={state.nonce?.toString()}
          color="text-green-400"
          icon="🔢"
          fieldName="nonce"
        />

        {state.clientSeed && (
          <InfoRow
            label="Client Seed"
            value={`${state.clientSeed.slice(0, 8)}...${state.clientSeed.slice(-6)}`}
            fullValue={state.clientSeed}
            color="text-purple-400"
            icon="👤"
            fieldName="clientSeed"
          />
        )}

        {state.serverSeed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <InfoRow
              label="Server Seed"
              value={`${state.serverSeed.slice(0, 8)}...${state.serverSeed.slice(-6)}`}
              fullValue={state.serverSeed}
              color="text-pink-400"
              icon="🖥️"
              fieldName="serverSeed"
            />
          </motion.div>
        )}
      </div>

      {/* Verification Status */}
      <div className="px-4 pb-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`p-3 rounded-lg border ${
            state.serverSeed
              ? "bg-green-500/10 border-green-500/30"
              : "bg-yellow-500/10 border-yellow-500/30"
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">{state.serverSeed ? "✅" : "⏳"}</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-white mb-1">
                {state.serverSeed
                  ? "Verified & Transparent"
                  : "Awaiting Verification"}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                {state.serverSeed
                  ? "This round's outcome has been cryptographically verified. All seeds are now visible for independent verification."
                  : "Server seed will be revealed after the round completes, allowing you to verify the fairness of this game."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Info Footer */}
      <div className="px-4 pb-4">
        <button
          onClick={() => {
            // You can link this to a modal or external page explaining provably fair
            window.open(
              "https://en.wikipedia.org/wiki/Provably_fair_algorithm",
              "_blank",
            );
          }}
          className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors duration-200 flex items-center justify-center gap-1 py-2"
        >
          <span>❓</span>
          <span>Learn more about Provably Fair gaming</span>
        </button>
      </div>

      {/* Subtle animated background */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
    </motion.div>
  );
}
