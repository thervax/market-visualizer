import React, { useState, useEffect } from "react";

const INITIAL_POOL_VSOL = 30.0;
const INITIAL_POOL_VTOKENS = 1_073_000_000.0;
const TOTAL_SUPPLY = 1_000_000_000;

const PumpFun: React.FC = () => {
  const [mode, setMode] = useState<"solToTokens" | "tokensToSol" | "slippage">(
    "solToTokens",
  );
  const [existingSolInCurve, setExistingSolInCurve] = useState<string>("");
  const [solInput, setSolInput] = useState<string>("");
  const [tokenInput, setTokenInput] = useState<string>("");
  const [result, setResult] = useState<number | null>(null);
  const [poolState, setPoolState] = useState<{
    vsol: number;
    vtokens: number;
  } | null>(null);

  // Slippage calculator state
  const [slippageFrontRunSol, setSlippageFrontRunSol] = useState<string>("");
  const [slippageMySol, setSlippageMySol] = useState<string>("");

  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [solPriceError, setSolPriceError] = useState(false);

  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSolPrice(data.solana.usd);
        setSolPriceError(false);
      } catch {
        setSolPriceError(true);
      }
    };

    fetchSolPrice();
    const interval = setInterval(fetchSolPrice, 60_000);
    return () => clearInterval(interval);
  }, []);

  const getPoolAfterExistingSol = (existingSol: number) => {
    const k = INITIAL_POOL_VSOL * INITIAL_POOL_VTOKENS;
    const newSolReserve = INITIAL_POOL_VSOL + existingSol;
    const newTokenReserve = k / newSolReserve;
    return { vsol: newSolReserve, vtokens: newTokenReserve };
  };

  const calculateTokensForSol = (
    vsol: number,
    vtokens: number,
    solAmount: number,
  ): number => {
    const k = vsol * vtokens;
    const newSolReserve = vsol + solAmount;
    const newTokenReserve = k / newSolReserve;
    return vtokens - newTokenReserve;
  };

  const calculateSolForTokens = (
    vsol: number,
    vtokens: number,
    tokenAmount: number,
  ): number => {
    const k = vsol * vtokens;
    const newTokenReserve = vtokens - tokenAmount;
    const newSolReserve = k / newTokenReserve;
    return newSolReserve - vsol;
  };

  const marketCap = (() => {
    const existing = parseFloat(existingSolInCurve);
    if (isNaN(existing) || existing < 0) return null;
    const { vsol, vtokens } = getPoolAfterExistingSol(existing);
    const pricePerToken = vsol / vtokens;
    const mcSol = pricePerToken * TOTAL_SUPPLY;
    const mcUsd = solPrice != null ? mcSol * solPrice : null;
    return { sol: mcSol, usd: mcUsd };
  })();

  const slippageResult = (() => {
    const existing = parseFloat(existingSolInCurve);
    const frontRun = parseFloat(slippageFrontRunSol);
    const mySol = parseFloat(slippageMySol);
    if (
      isNaN(existing) ||
      existing < 0 ||
      isNaN(frontRun) ||
      frontRun < 0 ||
      isNaN(mySol) ||
      mySol <= 0
    )
      return null;

    // Pool at the state I see (my expected reference)
    const pool0 = getPoolAfterExistingSol(existing);

    // What I'd expect to get buying at pool0 (no front-run)
    const expectedTokens = calculateTokensForSol(
      pool0.vsol,
      pool0.vtokens,
      mySol,
    );

    // Pool after front-run buys go through
    const k = pool0.vsol * pool0.vtokens;
    const pool1vsol = pool0.vsol + frontRun;
    const pool1vtokens = k / pool1vsol;

    // What I actually get after the front-run
    const actualTokens = calculateTokensForSol(pool1vsol, pool1vtokens, mySol);

    const slippagePct =
      ((expectedTokens - actualTokens) / expectedTokens) * 100;

    return {
      expectedTokens,
      actualTokens,
      slippagePct,
      pool0,
      pool1: { vsol: pool1vsol, vtokens: pool1vtokens },
    };
  })();

  const handleCalculate = () => {
    const existingSol = parseFloat(existingSolInCurve);
    if (isNaN(existingSol) || existingSol < 0) {
      setResult(null);
      return;
    }

    const { vsol, vtokens } = getPoolAfterExistingSol(existingSol);
    setPoolState({ vsol, vtokens });

    if (mode === "solToTokens") {
      const solAmount = parseFloat(solInput);
      if (isNaN(solAmount) || solAmount <= 0) {
        setResult(null);
        return;
      }
      const tokens = calculateTokensForSol(vsol, vtokens, solAmount);
      setResult(tokens);
    } else {
      const cleanedInput = tokenInput.replace(/,/g, "");
      const tokensAmount = parseFloat(cleanedInput);
      if (isNaN(tokensAmount) || tokensAmount <= 0) {
        setResult(null);
        return;
      }
      const solCost = calculateSolForTokens(vsol, vtokens, tokensAmount);
      setResult(solCost);
    }
  };

  const slippageColor = (pct: number) => {
    if (pct < 1) return "text-green-400";
    if (pct < 5) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <div className="bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          PumpFun Bonding Curve Calculator
        </h1>

        {/* SOL Price indicator */}
        <div className="mb-6 text-center text-sm text-gray-400">
          {solPriceError ? (
            <span className="text-red-400">Failed to fetch SOL price</span>
          ) : solPrice != null ? (
            <span>
              SOL price:{" "}
              <span className="text-white font-semibold">
                $
                {solPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          ) : (
            <span className="text-gray-500">Fetching SOL price...</span>
          )}
        </div>

        {/* Mode tabs */}
        <div className="flex justify-center mb-6">
          <button
            className={`px-4 py-2 rounded-l-md font-semibold text-sm ${
              mode === "solToTokens"
                ? "bg-blue-600"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => setMode("solToTokens")}
          >
            SOL → Tokens
          </button>
          <button
            className={`px-4 py-2 font-semibold text-sm border-l border-gray-600 ${
              mode === "tokensToSol"
                ? "bg-blue-600"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => setMode("tokensToSol")}
          >
            Tokens → SOL
          </button>
          <button
            className={`px-4 py-2 rounded-r-md font-semibold text-sm border-l border-gray-600 ${
              mode === "slippage"
                ? "bg-blue-600"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => setMode("slippage")}
          >
            Slippage
          </button>
        </div>

        {/* Shared: SOL in bonding curve input */}
        <label className="block mb-2 text-sm text-gray-400">
          Existing SOL Already in Bonding Curve:
        </label>
        <input
          type="number"
          step="any"
          className="w-full p-2 rounded-md text-white bg-gray-700 mb-4"
          placeholder="e.g. 5"
          value={existingSolInCurve}
          onChange={(e) => setExistingSolInCurve(e.target.value)}
        />

        {/* Market Cap display (shown in all modes) */}
        {marketCap && (
          <div className="mb-6 bg-gray-700 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-3 font-semibold uppercase tracking-wide">
              Market Cap at {existingSolInCurve} SOL in curve
            </p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300 text-sm">SOL Market Cap</span>
              <span className="text-purple-400 font-bold text-lg">
                {marketCap.sol.toFixed(2)} SOL
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">USD Market Cap</span>
              {marketCap.usd != null ? (
                <span className="text-green-400 font-bold text-lg">
                  $
                  {marketCap.usd.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              ) : (
                <span className="text-gray-500 text-sm">
                  {solPriceError ? "Price unavailable" : "Loading..."}
                </span>
              )}
            </div>
          </div>
        )}

        {/* SOL → Tokens mode */}
        {mode === "solToTokens" && (
          <>
            <label className="block mb-2 text-sm text-gray-400">
              SOL Amount to Spend:
            </label>
            <input
              type="number"
              step="any"
              className="w-full p-2 rounded-md text-white bg-gray-700"
              placeholder="e.g. 1.5"
              value={solInput}
              onChange={(e) => setSolInput(e.target.value)}
            />
            <button
              onClick={handleCalculate}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition-all rounded-md py-2 font-semibold"
            >
              Calculate Tokens
            </button>
          </>
        )}

        {/* Tokens → SOL mode */}
        {mode === "tokensToSol" && (
          <>
            <label className="block mb-2 text-sm text-gray-400">
              Tokens Amount to Buy:
            </label>
            <input
              type="text"
              className="w-full p-2 rounded-md text-white bg-gray-700"
              placeholder="e.g. 10000"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
            />
            <button
              onClick={handleCalculate}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition-all rounded-md py-2 font-semibold"
            >
              Calculate SOL Cost
            </button>
          </>
        )}

        {/* Slippage mode */}
        {mode === "slippage" && (
          <>
            <label className="block mb-2 text-sm text-gray-400">
              SOL Bought Before Me (front-run):
            </label>
            <input
              type="number"
              step="any"
              className="w-full p-2 rounded-md text-white bg-gray-700 mb-4"
              placeholder="e.g. 2"
              value={slippageFrontRunSol}
              onChange={(e) => setSlippageFrontRunSol(e.target.value)}
            />
            <label className="block mb-2 text-sm text-gray-400">
              My SOL Buy:
            </label>
            <input
              type="number"
              step="any"
              className="w-full p-2 rounded-md text-white bg-gray-700"
              placeholder="e.g. 1"
              value={slippageMySol}
              onChange={(e) => setSlippageMySol(e.target.value)}
            />

            {slippageResult && (
              <div className="mt-6 space-y-3">
                {/* Slippage % — main result */}
                <div className="bg-gray-700 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-400 mb-1">Slippage</p>
                  <p
                    className={`text-4xl font-bold ${slippageColor(slippageResult.slippagePct)}`}
                  >
                    {slippageResult.slippagePct.toFixed(2)}%
                  </p>
                </div>

                {/* Breakdown */}
                <div className="bg-gray-700 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected tokens</span>
                    <span className="text-white font-semibold">
                      {Math.floor(
                        slippageResult.expectedTokens,
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Actual tokens received
                    </span>
                    <span className="text-white font-semibold">
                      {Math.floor(slippageResult.actualTokens).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-600 pt-2">
                    <span className="text-gray-400">
                      Tokens lost to slippage
                    </span>
                    <span className="text-red-400 font-semibold">
                      -
                      {Math.floor(
                        slippageResult.expectedTokens -
                          slippageResult.actualTokens,
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Pool states */}
                <div className="bg-gray-700 rounded-xl p-4 text-xs text-gray-400 space-y-1">
                  <p className="font-semibold text-gray-300 mb-2">
                    Pool States
                  </p>
                  <div className="flex justify-between">
                    <span>Before front-run (pool₀)</span>
                    <span>{slippageResult.pool0.vsol.toFixed(3)} VSOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>After front-run (pool₁)</span>
                    <span>{slippageResult.pool1.vsol.toFixed(3)} VSOL</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Results for SOL/Token modes */}
        {(mode === "solToTokens" || mode === "tokensToSol") && (
          <>
            {poolState && (
              <div className="mt-6 text-center text-gray-400">
                <p>
                  Current Pool → VSOL:{" "}
                  <span className="text-white font-semibold">
                    {poolState.vsol.toFixed(6)}
                  </span>
                  , VTOKENS:{" "}
                  <span className="text-white font-semibold">
                    {poolState.vtokens.toFixed(0)}
                  </span>
                </p>
              </div>
            )}
            {result !== null && (
              <div className="mt-6 text-center">
                <p className="text-lg font-semibold">
                  {mode === "solToTokens"
                    ? "You will receive approximately:"
                    : "This will cost approximately:"}
                </p>
                <p
                  className={`text-3xl font-bold ${
                    mode === "solToTokens"
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  {mode === "solToTokens"
                    ? `${Math.floor(result).toLocaleString()} Tokens`
                    : `${result.toFixed(6)} SOL`}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PumpFun;
