import { useState } from "react";
import { verifyRound } from "../utils/api";
import PlinkoBoard from "../components/PlinkoBoard";

export default function Verify() {
  const [form, setForm] = useState({
    serverSeed: "",
    clientSeed: "",
    nonce: "",
    dropColumn: 6,
  });

  const [result, setResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [showReplay, setShowReplay] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);
    setResult(null);
    setShowReplay(false);

    try {
      const data = await verifyRound(
        form.serverSeed,
        form.clientSeed,
        form.nonce,
        parseInt(form.dropColumn),
      );
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-extrabold mb-2">
            🔍 Provably Fair Verifier
          </h1>
          <p className="text-gray-400">
            Enter round details to verify fairness
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Server Seed
                </label>
                <input
                  type="text"
                  value={form.serverSeed}
                  onChange={(e) =>
                    setForm({ ...form, serverSeed: e.target.value })
                  }
                  placeholder="21c5091c6966559b1a78ee59f777c011"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Client Seed
                </label>
                <input
                  type="text"
                  value={form.clientSeed}
                  onChange={(e) =>
                    setForm({ ...form, clientSeed: e.target.value })
                  }
                  placeholder="candidate-hello"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Nonce
                </label>
                <input
                  type="text"
                  value={form.nonce}
                  onChange={(e) => setForm({ ...form, nonce: e.target.value })}
                  placeholder="2442aa1f"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Drop Column (0-12)
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={form.dropColumn}
                  onChange={(e) =>
                    setForm({ ...form, dropColumn: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold text-lg shadow-lg transition"
              >
                {isVerifying ? "⏳ Verifying..." : "✓ Verify Round"}
              </button>
            </form>
          </div>

          {/* Result */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-900 border-2 border-red-600 p-6 rounded-xl">
                <p className="font-bold text-xl mb-2">❌ Verification Failed</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs text-gray-400 mt-3">
                  This could mean:
                  <ul className="list-disc ml-5 mt-2">
                    <li>No round exists with these parameters</li>
                    <li>The round hasn't been revealed yet</li>
                    <li>You entered incorrect data</li>
                  </ul>
                </p>
              </div>
            )}

            {result && (
              <div
                className={`border-2 p-6 rounded-xl ${
                  result.isValid
                    ? "bg-green-900 border-green-600"
                    : "bg-red-900 border-red-600"
                }`}
              >
                <h2 className="text-3xl font-bold mb-4">
                  {result.isValid ? "✅ VERIFIED!" : "❌ INVALID!"}
                </h2>

                {result.isValid ? (
                  <p className="text-sm mb-4">
                    This round is <strong>provably fair</strong>. All recomputed
                    values match the original game perfectly.
                  </p>
                ) : (
                  <p className="text-sm mb-4">
                    ⚠️ <strong>WARNING:</strong> The recomputed data does NOT
                    match the stored round. The game may have been tampered
                    with.
                  </p>
                )}

                <div className="space-y-4 text-sm">
                  <div className="bg-black/30 p-4 rounded">
                    <p className="text-gray-300 mb-2">Round ID:</p>
                    <p className="font-mono text-amber-400">{result.roundId}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/30 p-3 rounded">
                      <p className="text-gray-400 text-xs mb-1">Original Bin</p>
                      <p className="text-2xl font-bold">
                        {result.original.binIndex}
                      </p>
                    </div>
                    <div className="bg-black/30 p-3 rounded">
                      <p className="text-gray-400 text-xs mb-1">
                        Recomputed Bin
                      </p>
                      <p
                        className={`text-2xl font-bold ${result.matches.binIndex ? "text-green-400" : "text-red-400"}`}
                      >
                        {result.recomputed.binIndex}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Commit Hash:</span>
                      <span
                        className={
                          result.matches.commitHex
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {result.matches.commitHex ? "✓ Match" : "✗ Mismatch"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Combined Seed:</span>
                      <span
                        className={
                          result.matches.combinedSeed
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {result.matches.combinedSeed ? "✓ Match" : "✗ Mismatch"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Peg Map Hash:</span>
                      <span
                        className={
                          result.matches.pegMapHash
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {result.matches.pegMapHash ? "✓ Match" : "✗ Mismatch"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Bin Index:</span>
                      <span
                        className={
                          result.matches.binIndex
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {result.matches.binIndex ? "✓ Match" : "✗ Mismatch"}
                      </span>
                    </div>
                  </div>

                  <details className="bg-black/30 p-3 rounded">
                    <summary className="cursor-pointer text-gray-400 hover:text-white">
                      Show Full Details
                    </summary>
                    <div className="mt-3 space-y-2 text-xs break-all">
                      <div>
                        <p className="text-gray-400">Original Commit Hash:</p>
                        <p className="text-blue-400">
                          {result.original.commitHex}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Original Combined Seed:</p>
                        <p className="text-purple-400">
                          {result.original.combinedSeed}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Original Peg Map Hash:</p>
                        <p className="text-green-400">
                          {result.original.pegMapHash}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Payout Multiplier:</p>
                        <p className="text-amber-400">
                          {result.original.payoutMultiplier}x
                        </p>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            )}

            {result?.recomputed?.path && (
              <div>
                <button
                  onClick={() => setShowReplay(!showReplay)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold mb-4 transition"
                >
                  {showReplay ? "⏸ Hide Replay" : "▶️ Show Replay Animation"}
                </button>

                {showReplay && (
                  <div className="flex justify-center">
                    <PlinkoBoard
                      path={result.recomputed.path}
                      dropColumn={parseInt(form.dropColumn)}
                      isAnimating={true}
                      onAnimationComplete={() => {}}
                      onPegHit={() => {}}
                    />
                  </div>
                )}
              </div>
            )}

            {!result && !error && (
              <div className="bg-gray-800 p-8 rounded-xl text-center text-gray-400">
                <p className="text-lg">📋 Enter round details to verify</p>
                <p className="text-sm mt-2">
                  You can find these values after clicking "Reveal Server Seed"
                  in a completed game
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
