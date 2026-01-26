/// <reference types="vite/client" />
import { useState, useCallback } from "react";
// Assuming BIN_MULTIPLIERS is still used for UI purposes, though backend calculates actual payout.
import { BIN_MULTIPLIERS } from "../utils/fairness";

// 1. Define your API URL from the .env file at the top
// The '||' adds a safety fallback just in case the .env doesn't load
const API_URL =
  import.meta.env.VITE_API_URL || "https://plinko-game-project.onrender.com";

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
  roundId?: string;
};

export const usePlinkoGame = () => {
  const [isDropping, setIsDropping] = useState(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [history, setHistory] = useState<GameResult[]>([]);

  // Provably Fair State
  const [clientSeed, setClientSeed] = useState("client-seed-123");
  const [nonce, setNonce] = useState<string | number>(0);

 const dropBall = useCallback(
   async (
     startColumn: number,
     betAmount: number,
   ): Promise<GameResult | null> => {
     if (isDropping) {
       console.warn("Already dropping a ball");
       return null;
     }

     setIsDropping(true);

     try {
       // STEP 1: Commit Round
       console.log("📤 Step 1: Committing round...");
       const commitRes = await fetch(`${API_URL}/api/rounds/commit`, {
         method: "POST",
       });

       if (!commitRes.ok) {
         throw new Error(`Commit failed: ${commitRes.status}`);
       }

       const commitData = await commitRes.json();
       console.log("✅ Commit response:", commitData);
       setNonce(commitData.nonce);

       // STEP 2: Start Game
       console.log("📤 Step 2: Starting game...");
       const startRes = await fetch(
         `${API_URL}/api/rounds/${commitData.roundId}/start`,
         {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             clientSeed: clientSeed,
             betCents: betAmount * 100,
             dropColumn: startColumn,
           }),
         },
       );

       if (!startRes.ok) {
         throw new Error(`Game start failed: ${startRes.status}`);
       }

       const gameData = await startRes.json();
       console.log("✅ Game start response:", gameData);

       // CRITICAL: Extract the path correctly
       console.log("🔍 Raw pathJson:", gameData.pathJson);
       console.log("🔍 Raw path:", gameData.path);

       // Backend might return either "path" or "pathJson"
       const rawPath = gameData.pathJson || gameData.path;

       if (!rawPath || !Array.isArray(rawPath)) {
         console.error("❌ Invalid path data:", rawPath);
         throw new Error("Backend did not return valid path data");
       }

       console.log("🔍 Path array length:", rawPath.length);
       console.log("🔍 First path element:", rawPath[0]);

       // Extract direction strings from objects
       const simplePath: string[] = rawPath.map((step: any, index: number) => {
         if (typeof step === "object" && step.direction) {
           console.log(
             `  Row ${index}: ${step.direction} (peg ${step.peg}, bias ${step.finalBias}, rnd ${step.rnd})`,
           );
           return step.direction;
         } else if (typeof step === "string") {
           return step;
         } else {
           console.error(`  Row ${index}: Invalid step format:`, step);
           return "LEFT"; // Fallback
         }
       });

       console.log("✅ Processed path:", simplePath);
       console.log("✅ Final bin from backend:", gameData.binIndex);
       console.log("✅ Drop column:", startColumn);

       // Verify path math
       let debugPos = startColumn;
       simplePath.forEach((dir, i) => {
         if (dir.toUpperCase().includes("RIGHT") || dir === "R") {
           debugPos++;
           console.log(`  Row ${i}: ${dir} → position ${debugPos}`);
         } else {
           console.log(`  Row ${i}: ${dir} → position ${debugPos} (stay)`);
         }
       });
       console.log(
         `🧮 Calculated final position: ${debugPos}, Backend says: ${gameData.binIndex}`,
       );
       if (debugPos !== gameData.binIndex) {
         console.error(
           "⚠️ WARNING: Calculated position doesn't match backend!",
         );
       }

       const fullResult: GameResult = {
         path: simplePath,
         finalBin: gameData.binIndex,
         payout: gameData.payoutMultiplier,
         bet: betAmount,
         serverSeed: "HIDDEN_UNTIL_REVEAL",
         clientSeed,
         nonce: commitData.nonce,
         dropColumn: startColumn,
         timestamp: Date.now(),
         roundId: commitData.roundId,
       };

       console.log("✅ Full result object:", fullResult);
       setLastResult(fullResult);

       return fullResult;
     } catch (error) {
       console.error("❌ API Error during drop:", error);
       setIsDropping(false);
       return null;
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
      // STEP 3: Reveal Round (Using API_URL)
      const res = await fetch(`${API_URL}/api/rounds/${roundId}/reveal`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Reveal failed");
      const data = await res.json();

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
