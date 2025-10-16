import React, { useState } from "react";

const INITIAL_POOL_VSOL = 30.0;
const INITIAL_POOL_VTOKENS = 1_073_000_000.0;

const PumpFun: React.FC = () => {
  const [initialSolBuy, setInitialSolBuy] = useState<string>("");
  const [tokensToBuy, setTokensToBuy] = useState<string>("");
  const [solCost, setSolCost] = useState<number | null>(null);
  const [updatedPool, setUpdatedPool] = useState<{
    vsol: number;
    vtokens: number;
  } | null>(null);

  const calculateTokensForSol = (solAmount: number): number => {
    const k = INITIAL_POOL_VSOL * INITIAL_POOL_VTOKENS;
    const newSolReserve = INITIAL_POOL_VSOL + solAmount;
    const newTokenReserve = k / newSolReserve;
    return INITIAL_POOL_VTOKENS - newTokenReserve;
  };

  const calculateSolCost = (
    vsol_in_bc: number,
    vtokens_in_bc: number,
    tokenAmount: number
  ): number => {
    const k = vsol_in_bc * vtokens_in_bc;
    const newTokenReserve = vtokens_in_bc - tokenAmount;
    const newSolReserve = k / newTokenReserve;
    return newSolReserve - vsol_in_bc;
  };

  const handleCalculate = () => {
    const solBuy = parseFloat(initialSolBuy);
    const tokensBuy = parseFloat(tokensToBuy);

    if (isNaN(solBuy) || solBuy <= 0 || isNaN(tokensBuy) || tokensBuy <= 0) {
      setSolCost(null);
      return;
    }

    const tokensSold = calculateTokensForSol(solBuy);
    console.log(tokensSold);

    const vsol_in_bc = INITIAL_POOL_VSOL + solBuy;
    const vtokens_in_bc = INITIAL_POOL_VTOKENS - tokensSold;

    setUpdatedPool({ vsol: vsol_in_bc, vtokens: vtokens_in_bc });

    const solCostForTokens = calculateSolCost(
      vsol_in_bc,
      vtokens_in_bc,
      tokensBuy
    );
    setSolCost(solCostForTokens);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <div className="bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          PumpFun Bonding Curve Calculator
        </h1>

        <label className="block mb-2 text-sm text-gray-400">
          Initial SOL Buy Amount:
        </label>
        <input
          type="number"
          step="any"
          className="w-full p-2 rounded-md text-white"
          placeholder="e.g. 1.5"
          value={initialSolBuy}
          onChange={(e) => setInitialSolBuy(e.target.value)}
        />

        <label className="block mt-4 mb-2 text-sm text-gray-400">
          Tokens to Buy After That:
        </label>
        <input
          type="number"
          step="any"
          className="w-full p-2 rounded-md text-white"
          placeholder="e.g. 10000"
          value={tokensToBuy}
          onChange={(e) => setTokensToBuy(e.target.value)}
        />

        <button
          onClick={handleCalculate}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition-all rounded-md py-2 font-semibold"
        >
          Calculate SOL Cost
        </button>

        {updatedPool && (
          <div className="mt-6 text-center text-gray-400">
            <p>
              Updated Pool → VSOL:{" "}
              <span className="text-white font-semibold">
                {updatedPool.vsol.toFixed(6)}
              </span>
              , VTOKENS:{" "}
              <span className="text-white font-semibold">
                {updatedPool.vtokens.toFixed(0)}
              </span>
            </p>
          </div>
        )}

        {solCost !== null && (
          <div className="mt-6 text-center">
            <p className="text-lg font-semibold">SOL Cost for Next Purchase:</p>
            <p className="text-3xl font-bold text-green-400">
              {solCost.toFixed(6)} SOL
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PumpFun;
