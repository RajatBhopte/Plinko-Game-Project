import React, { useState, useEffect } from 'react';
import { generatePlinkoResult, FairResult } from '../utils/fairness';
import { PlinkoBoard } from './PlinkoBoard';
import { BIN_MULTIPLIERS } from "../utils/fairness";

export const Verifier = () => {
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState(0);
  const [dropColumn, setDropColumn] = useState(6);
  const [result, setResult] = useState<FairResult | null>(null);
  const [error, setError] = useState('');
  const [calculated, setCalculated] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCalculated(false);
    setResult(null);

    if (!serverSeed || !clientSeed) {
        setError('Please provide all seeds.');
        return;
    }

    try {
        const res = await generatePlinkoResult(serverSeed, clientSeed, Number(nonce), Number(dropColumn));
        setResult(res);
        setCalculated(true);
    } catch (err) {
        setError('Calculation failed.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 text-slate-100">
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
        <h2 className="text-3xl font-display font-bold text-cyan-400 mb-6 border-b border-slate-700 pb-4">
          Fairness Verifier
        </h2>

        <form
          onSubmit={handleVerify}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">
              Server Seed
            </label>
            <input
              type="text"
              value={serverSeed}
              onChange={(e) => setServerSeed(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
              placeholder="Enter Server Seed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">
              Client Seed
            </label>
            <input
              type="text"
              value={clientSeed}
              onChange={(e) => setClientSeed(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
              placeholder="Enter Client Seed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">
              Nonce
            </label>
            <input
              id="nonce-input"
              type="text"
              value={nonce}
              onChange={(e) => setNonce(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">
              Drop Column
            </label>
            <input
              type="number"
              min="0"
              max="12"
              value={dropColumn}
              onChange={(e) => setDropColumn(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold tracking-wider transition shadow-lg shadow-cyan-900/50"
            >
              VERIFY RESULT
            </button>
          </div>
        </form>

        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
      </div>

      {calculated && result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          {/* Results Data */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-slate-900 font-bold">
                ✓
              </div>
              <h3 className="text-xl font-bold text-green-400">
                Verified Outcome
              </h3>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-500 font-bold">
                Combined Seed Hash (SHA256)
              </label>
              <div className="font-mono text-xs text-slate-300 break-all bg-slate-900 p-2 rounded border border-slate-700/50">
                {result.hashHex}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-3 rounded border border-slate-700">
                <label className="text-[10px] uppercase text-slate-500 font-bold">
                  Final Bin
                </label>
                <div className="text-2xl font-mono text-cyan-400">
                  {result.finalBin}
                </div>
              </div>
              <div className="bg-slate-900 p-3 rounded border border-slate-700">
                <label className="text-[10px] uppercase text-slate-500 font-bold">
                  Multiplier
                </label>
                <div className="text-2xl font-mono text-green-400">
                  {result.payout}x
                </div>
              </div>
            </div>

            <div className="mt-2">
              <label className="text-[10px] uppercase text-slate-500 font-bold">
                Path
              </label>
              <div className="flex gap-1 flex-wrap mt-1">
                {result.path.map((dir, i) => (
                  <span
                    key={i}
                    className={`text-xs font-bold px-1.5 py-0.5 rounded ${dir === "L" ? "bg-indigo-900 text-indigo-200" : "bg-purple-900 text-purple-200"}`}
                  >
                    {dir}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Replay */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden relative h-[400px] lg:h-auto">
            <div className="absolute top-2 left-2 z-10 bg-slate-900/80 px-2 py-1 rounded text-xs text-cyan-400 font-bold uppercase border border-cyan-900">
              Replay Visualization
            </div>
            <PlinkoBoard
              dropColumn={dropColumn}
              isDropping={true} // Force animate
              path={result.path}
              finalBin={result.finalBin}
              onFinishDrop={() => {}}
              multipliers={BIN_MULTIPLIERS}
            />
          </div>
        </div>
      )}
    </div>
  );
};
