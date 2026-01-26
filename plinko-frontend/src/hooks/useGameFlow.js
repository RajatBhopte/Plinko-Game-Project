import { useReducer, useCallback, useEffect, useRef } from "react";

const initialState = {
  phase: "IDLE", // IDLE | COMMITTED | ANIMATING | COMPLETED | REVEALED
  roundId: null,
  commitHex: null,
  nonce: null,
  clientSeed: null,
  serverSeed: null,
  binIndex: null,
  payoutMultiplier: null,
  path: null,
  pegMapHash: null,
  betAmount: 100,
  dropColumn: 6,
  error: null,
  isLoading: false,
  history: [], // Track round history
  stats: {
    totalRounds: 0,
    totalWagered: 0,
    totalPayout: 0,
    biggestWin: 0,
    biggestMultiplier: 0,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error, // Clear error when starting new action
      };

    case "COMMIT_SUCCESS":
      // Validation
      if (!action.payload.roundId || !action.payload.commitHex) {
        console.error("Invalid commit data:", action.payload);
        return {
          ...state,
          error: "Invalid server response for commit",
          phase: "IDLE",
          isLoading: false,
        };
      }

      return {
        ...state,
        phase: "COMMITTED",
        roundId: action.payload.roundId,
        commitHex: action.payload.commitHex,
        nonce: action.payload.nonce,
        error: null,
        isLoading: false,
      };

    case "START_SUCCESS":
      // Validation
      if (!action.payload.path || action.payload.binIndex === undefined) {
        console.error("Invalid start data:", action.payload);
        return {
          ...state,
          error: "Invalid game data received",
          phase: "IDLE",
          isLoading: false,
        };
      }

      return {
        ...state,
        phase: "ANIMATING",
        clientSeed: action.payload.clientSeed,
        path: action.payload.path,
        binIndex: action.payload.binIndex,
        payoutMultiplier: action.payload.payoutMultiplier,
        pegMapHash: action.payload.pegMapHash,
        error: null,
        isLoading: false,
      };

    case "ANIMATION_COMPLETE":
      return {
        ...state,
        phase: "COMPLETED",
      };

    case "REVEAL_SUCCESS":
      if (!action.payload.serverSeed) {
        console.error("Invalid reveal data:", action.payload);
        return {
          ...state,
          error: "Failed to reveal server seed",
          isLoading: false,
        };
      }

      // Calculate round stats
      const payout = (state.betAmount * state.payoutMultiplier) / 100;
      const profit = payout - state.betAmount / 100;

      // Add to history
      const newHistoryEntry = {
        roundId: state.roundId,
        betAmount: state.betAmount,
        dropColumn: state.dropColumn,
        binIndex: state.binIndex,
        multiplier: state.payoutMultiplier,
        payout,
        profit,
        timestamp: Date.now(),
      };

      const updatedHistory = [newHistoryEntry, ...state.history].slice(0, 50); // Keep last 50 rounds

      // Update stats
      const updatedStats = {
        totalRounds: state.stats.totalRounds + 1,
        totalWagered: state.stats.totalWagered + state.betAmount / 100,
        totalPayout: state.stats.totalPayout + payout,
        biggestWin: Math.max(state.stats.biggestWin, profit),
        biggestMultiplier: Math.max(
          state.stats.biggestMultiplier,
          state.payoutMultiplier,
        ),
      };

      return {
        ...state,
        phase: "REVEALED",
        serverSeed: action.payload.serverSeed,
        history: updatedHistory,
        stats: updatedStats,
        error: null,
        isLoading: false,
      };

    case "SET_BET":
      // Validate bet amount
      const newBet = parseInt(action.payload);
      if (isNaN(newBet) || newBet < 1) {
        console.warn("Invalid bet amount:", action.payload);
        return state;
      }
      if (newBet > 100000) {
        // Max bet limit
        console.warn("Bet amount exceeds maximum:", newBet);
        return { ...state, betAmount: 100000 };
      }
      return { ...state, betAmount: newBet };

    case "SET_DROP_COLUMN":
      // Validate column
      const newColumn = parseInt(action.payload);
      if (isNaN(newColumn) || newColumn < 0 || newColumn > 12) {
        console.warn("Invalid drop column:", action.payload);
        return state;
      }
      return { ...state, dropColumn: newColumn };

    case "RESET":
      // Preserve important data across resets
      return {
        ...initialState,
        betAmount: state.betAmount,
        dropColumn: state.dropColumn,
        history: state.history,
        stats: state.stats,
      };

    case "CLEAR_HISTORY":
      return {
        ...state,
        history: [],
        stats: { ...initialState.stats },
      };

    case "ERROR":
      console.error("Game flow error:", action.payload);
      return {
        ...state,
        error:
          action.payload?.message ||
          action.payload ||
          "An unknown error occurred",
        phase: state.phase === "ANIMATING" ? state.phase : "IDLE", // Don't reset if animating
        isLoading: false,
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "FORCE_RESET":
      // Nuclear option - complete reset including history
      return {
        ...initialState,
      };

    default:
      console.warn("Unknown action type:", action.type);
      return state;
  }
}

export function useGameFlow() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const phaseTimeoutRef = useRef(null);

  // Phase timeout protection - prevent getting stuck
  useEffect(() => {
    // Clear any existing timeout
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
    }

    // Set timeout for phases that should resolve
    if (state.phase === "COMMITTED" || state.phase === "ANIMATING") {
      phaseTimeoutRef.current = setTimeout(() => {
        console.error(`Phase timeout: stuck in ${state.phase} for too long`);
        dispatch({
          type: "ERROR",
          payload: `Game got stuck in ${state.phase} phase. Please try again.`,
        });
      }, 30000); // 30 second timeout
    }

    return () => {
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
      }
    };
  }, [state.phase]);

  // Enhanced dispatch with logging (only in development)
  const enhancedDispatch = useCallback((action) => {
    if (process.env.NODE_ENV === "development") {
      console.log("🎮 Game Flow Action:", action.type, action.payload);
    }
    dispatch(action);
  }, []);

  // Derived state helpers
  const canDrop = state.phase === "IDLE" && !state.isLoading;
  const isPlaying = state.phase === "COMMITTED" || state.phase === "ANIMATING";
  const hasResult = state.phase === "COMPLETED" || state.phase === "REVEALED";

  // Stats helpers
  const netProfit = state.stats.totalPayout - state.stats.totalWagered;
  const averageMultiplier =
    state.stats.totalRounds > 0
      ? (state.stats.totalPayout / state.stats.totalWagered).toFixed(2)
      : 0;

  return [
    state,
    enhancedDispatch,
    {
      canDrop,
      isPlaying,
      hasResult,
      netProfit,
      averageMultiplier,
    },
  ];
}

// Export action creators for type safety
export const gameActions = {
  setLoading: (isLoading) => ({ type: "SET_LOADING", payload: isLoading }),

  commitSuccess: (data) => ({
    type: "COMMIT_SUCCESS",
    payload: data,
  }),

  startSuccess: (data) => ({
    type: "START_SUCCESS",
    payload: data,
  }),

  animationComplete: () => ({ type: "ANIMATION_COMPLETE" }),

  revealSuccess: (data) => ({
    type: "REVEAL_SUCCESS",
    payload: data,
  }),

  setBet: (amount) => ({
    type: "SET_BET",
    payload: amount,
  }),

  setDropColumn: (column) => ({
    type: "SET_DROP_COLUMN",
    payload: column,
  }),

  reset: () => ({ type: "RESET" }),

  clearHistory: () => ({ type: "CLEAR_HISTORY" }),

  error: (error) => ({
    type: "ERROR",
    payload: error,
  }),

  clearError: () => ({ type: "CLEAR_ERROR" }),

  forceReset: () => ({ type: "FORCE_RESET" }),
};
