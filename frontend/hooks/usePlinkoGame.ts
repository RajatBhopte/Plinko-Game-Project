import { useState, useCallback } from "react";
// Assuming BIN_MULTIPLIERS is still used for UI purposes, though backend calculates actual payout.
import { BIN_MULTIPLIERS } from "../utils/fairness";

export type GameResult = {
  path: string[];
  finalBin: number;
  payout: number;
  bet: number;
  serverSeed: string; // Will show "HIDDEN" until the reveal endpoint is called
  clientSeed: string;
  nonce: string | number;
  dropColumn: number;
  timestamp: number;
};

export const usePlinkoGame = () => {
  const [isDropping, setIsDropping] = useState(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [history, setHistory] = useState<GameResult[]>([]);

  // Provably Fair State - We only manage clientSeed locally now.
  // The server generates and manages the serverSeed and nonce.
  const [clientSeed, setClientSeed] = useState("client-seed-123");
  const [nonce, setNonce] = useState<string | number>(0);

  const dropBall = useCallback(
    async (startColumn: number, betAmount: number) => {
      if (isDropping) return;
      setIsDropping(true);

      try {
        // STEP 1: Commit Round (Get Round ID and Nonce from Server)
        const commitRes = await fetch(
          "http://localhost:5000/api/rounds/commit",
          {
            method: "POST",
          },
        );
        if (!commitRes.ok) throw new Error("Commit failed");
        const commitData = await commitRes.json();

        // Update local nonce to match the server's generated nonce for this round
        setNonce(commitData.nonce);

        // STEP 2: Start Game (Send Bet and Get Deterministic Path)
        const startRes = await fetch(
          `http://localhost:5000/api/rounds/${commitData.roundId}/start`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientSeed: clientSeed,
              betCents: betAmount * 100, // Backend expects cents
              dropColumn: startColumn,
            }),
          },
        );
        if (!startRes.ok) throw new Error("Game start failed");
        const gameData = await startRes.json();

        // Map backend path objects {direction: 'L'} to array of strings ["L", "R"]
        const simplePath = gameData.path.map((step: any) => step.direction);

        const fullResult: GameResult = {
          path: simplePath,
          finalBin: gameData.binIndex,
          payout: gameData.payoutMultiplier,
          bet: betAmount,
          serverSeed: "HIDDEN_UNTIL_REVEAL", // Server holds this securely
          clientSeed,
          nonce: commitData.nonce,
          dropColumn: startColumn,
          timestamp: Date.now(),
        };

        setLastResult(fullResult);
        return fullResult;
      } catch (error) {
        console.error("API Error during drop:", error);
        setIsDropping(false);
      }
    },
    [clientSeed, isDropping],
  );

  const finishDrop = useCallback(() => {
    setIsDropping(false);
    if (lastResult) {
      setHistory((prev) => [...prev, lastResult]);
    }
  }, [lastResult]);

  const revealRound = useCallback(async (roundId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/rounds/${roundId}/reveal`,
        {
          method: "POST",
        },
      );

      if (!res.ok) throw new Error("Reveal failed");
      const data = await res.json();

      // Update the last result with the actual server seed
      setLastResult((prev) =>
        prev ? { ...prev, serverSeed: data.serverSeed } : null,
      );

      return data.serverSeed;
    } catch (error) {
      console.error("Error revealing round:", error);
    }
  }, []);

  return {
    dropBall,
    isDropping,
    lastResult,
    history,
    finishDrop,
    revealRound,
    multipliers: BIN_MULTIPLIERS,
    clientSeed,
    setClientSeed,
    nonce,
  };
};
