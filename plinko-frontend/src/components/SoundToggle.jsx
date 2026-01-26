import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function SoundToggle({ isMuted, onToggle }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [justToggled, setJustToggled] = useState(false);

  const handleToggle = () => {
    onToggle();
    setJustToggled(true);
    setTimeout(() => setJustToggled(false), 300);
  };

  return (
    <div
      className="fixed top-4 right-4 z-50"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
          >
            <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">
                {isMuted ? "Sound Off" : "Sound On"}
              </p>
              <p className="text-xs text-gray-400">
                Click to {isMuted ? "unmute" : "mute"}
              </p>
            </div>
            {/* Arrow */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
              <div className="w-2 h-2 bg-gray-900 border-r border-t border-gray-700 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={justToggled ? { rotate: [0, -15, 15, 0] } : {}}
        className={`relative p-2.5 rounded-xl shadow-xl transition-all duration-300 overflow-hidden group
    ${
      isMuted
        ? "bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700"
        : "bg-gradient-to-br from-amber-600 to-orange-600 border-2 border-amber-500"
    }`}
        aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
      >
        {/* Animated background pulse */}
        <AnimatePresence>
          {!isMuted && (
            <>
              <motion.div
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute inset-0 bg-amber-400 rounded-xl"
              />
              <motion.div
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.5,
                }}
                className="absolute inset-0 bg-orange-400 rounded-xl"
              />
            </>
          )}
        </AnimatePresence>

        {/* Icon with animation */}
        <motion.div
          className="relative z-10"
          animate={{
            scale: justToggled ? [1, 1.3, 1] : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {isMuted ? (
              <motion.span
                key="muted"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                className="text-xl block"
              >
                🔇
              </motion.span>
            ) : (
              <motion.span
                key="unmuted"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                className="text-xl block"
              >
                🔊
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Sound waves animation when unmuted */}
        <AnimatePresence>
          {!isMuted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-full h-full border-2 border-white/30 rounded-xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [0.8, 1.4],
                    opacity: [0.5, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Hover glow effect */}
        <motion.div
          className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
            isMuted
              ? "bg-gray-700/0 group-hover:bg-gray-700/30"
              : "bg-white/0 group-hover:bg-white/10"
          }`}
        />
      </motion.button>

      {/* Visual indicator badge */}
      <AnimatePresence>
        {isMuted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 border-2 border-gray-900 rounded-full flex items-center justify-center"
          >
            <span className="text-white text-[8px] font-bold">✕</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
