import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const API = "https://portfoliolens-backend.onrender.com";
const COLORS = ["#2563eb", "#16a34a", "#7c3aed", "#d97706", "#dc2626", "#0891b2"];

function TickerSearch({ onAdd }) {
  const [query, setQuery] = useState("");
  const [weight, setWeight] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (query.length < 1) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/search?q=${query}`);
        const data = await res.json();
        setSuggestions(data);
      } catch { setSuggestions([]); }
      setLoading(false);
    }, 300);
  }, [query]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (s) => {
    setSelected(s);
    setQuery(s.name);
    setSuggestions([]);
  };

  const handleAdd = () => {
    if (!selected || !weight) return;
    onAdd({ ticker: selected.symbol, weight: parseFloat(weight) });
    setQuery("");
    setWeight("");
    setSelected(null);
  };

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ flex: 2, minWidth: 200, position: "relative" }} ref={dropdownRef}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null); }}
          placeholder="Search stock e.g. HDFC Bank, Reliance..."
          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none", boxSizing: "border-box" }}
        />
        {loading && (
          <div style={{ position: "absolute", top: 42, left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#6b7280", zIndex: 50 }}>
            Searching...
          </div>
        )}
        {suggestions.length > 0 && (
          <div style={{ position: "absolute", top: 42, left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, zIndex: 50, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", maxHeight: 260, overflowY: "auto" }}>
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => handleSelect(s)}
                style={{ padding: "10px 14px", cursor: "pointer", borderBottom: i < suggestions.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{s.symbol} · {s.exchange}</div>
                </div>
                <div style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{s.exchange}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <input
        value={weight}
        onChange={e => setWeight(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleAdd()}
        placeholder="Weight %"
        type="number"
        style={{ width: 110, padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }}
      />
      <button onClick={handleAdd} style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>+ Add</button>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("analyzer");
  const [holdings, setHoldings] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addHolding = (h) => setHoldings(prev => [...prev, h]);
  const removeHolding = (i) => setHoldings(holdings.filter((_, idx) => idx !== i));

  const analyze = async () => {
    if (holdings.length < 2) { setError("Add at least 2 stocks."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tickers: holdings.map(h => h.ticker),
          weights: holdings.map(h => h.weight)
        })
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setResult(data);
    } catch {
      setError("Could not connect to backend. Make sure it is running.");
    }
    setLoading(false);
  };

  const researchPapers = [
    {
      title: "Momentum Effect in NSE Midcap 150 Equities: A Carhart Four-Factor Analysis",
      year: "2026",
      desc: "Tests the Carhart (1997) four-factor model on NSE Midcap 150 equities. Constructs SMB, HML, and WML factors from NSE data. Key finding: the WML (momentum) factor earns ~1.47% per month with strong statistical significance, confirming momentum as a priced risk factor in Indian mid-cap equities.",
      tags: ["Asset Pricing", "Momentum", "NSE", "Carhart Model"],
      link: null,
      status: "Working paper"
    },
    {
      title: "Testing CAPM on Indian Equities: An Empirical Study",
      year: "2026",
      desc: "Tests the Capital Asset Pricing Model on a cross-section of Indian equities using OLS regression on daily return data. Includes full econometric diagnostics — Ramsey RESET, heteroskedasticity tests, and autocorrelation checks. Finds beta explains a significant portion of cross-sectional return variation but the intercept deviates from CAPM predictions.",
      tags: ["CAPM", "OLS Regression", "Indian Equities", "Gretl"],
      link: "https://papers.ssrn.com/abstract=6642298",
      status: "Published on SSRN"
    }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f9", fontFamily: "Inter, sans-serif" }}>

      {/* Navbar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#2563eb" strokeWidth="2.2"/>
            <path d="M16 16L21.5 21.5" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M7.5 12.5L9.5 9.5L11.5 11L14 7.5" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>PortfolioLens</span>
        </div>
        <div style={{ display: "flex", gap: 28, fontSize: 13 }}>
          {["analyzer", "methodology", "research", "about"].map(p => (
            <span key={p} onClick={() => setPage(p)} style={{ cursor: "pointer", color: page === p ? "#2563eb" : "#6b7280", fontWeight: page === p ? 600 : 400, textTransform: "capitalize", borderBottom: page === p ? "2px solid #2563eb" : "2px solid transparent", paddingBottom: 2 }}>
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* ===== ANALYZER PAGE ===== */}
      {page === "analyzer" && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 16px" }}>
          <div style={{ marginBottom: 28, textAlign: "center" }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "#111", marginBottom: 8, letterSpacing: "-0.5px" }}>Portfolio Risk & Return Analyzer</h1>
            <p style={{ fontSize: 15, color: "#6b7280", maxWidth: 520, margin: "0 auto" }}>Enter your NSE/BSE holdings to get real-time risk metrics, Sharpe ratio, beta, VaR, and efficient frontier analysis.</p>
          </div>

          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 14 }}>Add your holdings</div>
            <TickerSearch onAdd={addHolding} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              {holdings.map((h, i) => (
                <span key={i} style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 12, padding: "5px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                  {h.ticker} · {h.weight}%
                  <span onClick={() => removeHolding(i)} style={{ cursor: "pointer", color: "#93c5fd", fontWeight: 700 }}>×</span>
                </span>
              ))}
            </div>
            {error && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 10 }}>{error}</div>}
            <div style={{ marginTop: 16 }}>
              <button onClick={analyze} style={{ padding: "10px 24px", background: loading ? "#9ca3af" : "#111", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                {loading ? "Analyzing..." : "Analyze portfolio →"}
              </button>
            </div>
            {holdings.length === 0 && (
              <div style={{ marginTop: 14, padding: 14, background: "#f9fafb", borderRadius: 8, fontSize: 12, color: "#6b7280" }}>
                💡 Try searching: <strong>HDFC Bank</strong>, <strong>Reliance Industries</strong>, <strong>Infosys</strong>, <strong>TCS</strong>
              </div>
            )}
          </div>

          {result && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                {[
                  { label: "Expected Return", value: `${result.expected_return}%`, color: result.expected_return > 0 ? "#16a34a" : "#dc2626", sub: "Annualized" },
                  { label: "Volatility (σ)", value: `${result.volatility}%`, color: "#111", sub: "Annualized std dev" },
                  { label: "Sharpe Ratio", value: result.sharpe, color: result.sharpe > 1 ? "#16a34a" : result.sharpe > 0 ? "#d97706" : "#dc2626", sub: "Rf = 6.5% (RBI)" },
                  { label: "Portfolio Beta", value: result.beta, color: "#111", sub: "vs Nifty 50" },
                ].map((m, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "18px 20px" }}>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: 500 }}>{m.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{m.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#fff5f5", borderRadius: 12, border: "1px solid #fecaca", padding: "16px 22px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600, marginBottom: 4 }}>VALUE AT RISK — 95% CONFIDENCE, 1-DAY</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#dc2626" }}>{result.var_95}%</div>
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", maxWidth: 340, textAlign: "right" }}>
                  On a bad day (1-in-20 chance), your portfolio could lose <strong>{Math.abs(result.var_95)}%</strong> of its value.
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 22 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 4 }}>Efficient Frontier</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>800 simulated portfolios — yours is highlighted in blue</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                      <XAxis dataKey="x" name="Risk" unit="%" tick={{ fontSize: 11 }} label={{ value: "Risk (σ%)", position: "insideBottom", offset: -10, fontSize: 11, fill: "#6b7280" }} />
                      <YAxis dataKey="y" name="Return" unit="%" tick={{ fontSize: 11 }} label={{ value: "Return (%)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#6b7280" }} />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v) => `${v}%`} />
                      <Scatter name="Simulated" data={result.frontier} fill="#dbeafe" opacity={0.6} />
                      <Scatter name="Your Portfolio" data={[{ x: result.volatility, y: result.expected_return }]} fill="#2563eb" />
                    </ScatterChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#6b7280", marginTop: 8 }}>
                    <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#dbeafe", marginRight: 4 }}></span>Simulated portfolios</span>
                    <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#2563eb", marginRight: 4 }}></span>Your portfolio</span>
                  </div>
                </div>

                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 22 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 4 }}>Allocation</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Weight by holding</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={result.stocks} dataKey="weight" nameKey="ticker" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                        {result.stocks.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {result.stocks.map((s, i) => (
                      <span key={i} style={{ fontSize: 11, color: "#374151", display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "inline-block" }}></span>
                        {s.ticker} {s.weight}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 22 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 16 }}>Holdings Breakdown</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                        {["Ticker", "Weight", "Return", "Volatility"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "6px 0", color: "#6b7280", fontWeight: 500, fontSize: 11 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.stocks.map((s, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}>
                          <td style={{ padding: "10px 0" }}>
                            <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{s.ticker}</span>
                          </td>
                          <td style={{ padding: "10px 0", color: "#374151" }}>{s.weight}%</td>
                          <td style={{ padding: "10px 0", color: s.return > 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{s.return > 0 ? "+" : ""}{s.return}%</td>
                          <td style={{ padding: "10px 0", color: "#374151" }}>{s.volatility}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 22 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 4 }}>Risk Decomposition</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Each holding's volatility contribution</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={result.stocks} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <XAxis type="number" unit="%" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="ticker" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="volatility" radius={[0, 4, 4, 0]}>
                        {result.stocks.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: "#eff6ff", borderRadius: 12, border: "1px solid #bfdbfe", padding: "18px 22px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8", marginBottom: 6 }}>Methodology</div>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.8 }}>
                  Risk and return metrics are computed using 3 years of adjusted daily price data from NSE/BSE via yFinance. Expected return and volatility are annualized (×252 trading days). Sharpe ratio uses RBI risk-free rate of 6.5%. Beta is estimated against the Nifty 50 index (^NSEI). VaR is computed at the 5th percentile of daily portfolio returns. This tool applies the same empirical asset pricing framework used in the author's working papers on the Carhart four-factor model and momentum in NSE Midcap 150 equities.
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== METHODOLOGY PAGE ===== */}
      {page === "methodology" && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111", marginBottom: 8 }}>Methodology</h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 36 }}>How PortfolioLens computes risk and return metrics.</p>
          {[
            { title: "Expected Return", formula: "E(Rp) = Σ wᵢ × E(Rᵢ)", desc: "The portfolio's expected annual return is the weighted average of each asset's annualized mean daily return (×252 trading days). Returns are computed from adjusted closing prices to account for dividends and splits." },
            { title: "Portfolio Volatility", formula: "σp = √(wᵀ Σ w)", desc: "Volatility is the annualized standard deviation of portfolio returns, computed using the full variance-covariance matrix of asset returns. This captures both individual stock risk and cross-asset correlations." },
            { title: "Sharpe Ratio", formula: "S = (E(Rp) − Rf) / σp", desc: "Measures risk-adjusted return. We use the RBI repo rate (6.5%) as the risk-free rate. A Sharpe ratio above 1 is generally considered good; above 2 is excellent." },
            { title: "Portfolio Beta", formula: "β = Cov(Rp, Rm) / Var(Rm)", desc: "Beta measures systematic risk relative to the Nifty 50 index. A beta of 1.2 means the portfolio moves 1.2% for every 1% move in the market. Estimated via OLS regression of portfolio returns on market returns." },
            { title: "Value at Risk (VaR)", formula: "VaR₉₅ = Percentile(Rp, 5%)", desc: "Historical VaR at 95% confidence level. Computed as the 5th percentile of the portfolio's daily return distribution over the 3-year window. Represents the worst expected daily loss on 19 out of 20 trading days." },
            { title: "Efficient Frontier", formula: "Monte Carlo: 800 random weight vectors", desc: "We simulate 800 random portfolios using Dirichlet-distributed weights across the same asset universe, plotting each in risk-return space. This approximates the efficient frontier and shows where your portfolio sits relative to optimal combinations." },
          ].map((m, i) => (
            <div key={i} style={{ marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 8 }}>{m.title}</div>
              <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 16px", fontFamily: "monospace", fontSize: 15, color: "#2563eb", marginBottom: 10 }}>{m.formula}</div>
              <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.8 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* ===== RESEARCH PAGE ===== */}
      {page === "research" && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111", marginBottom: 8 }}>Research</h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 36 }}>Working papers underpinning this tool's empirical framework.</p>
          {researchPapers.map((p, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 24, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111", maxWidth: 500, lineHeight: 1.5 }}>{p.title}</div>
                <span style={{ fontSize: 12, color: "#6b7280", background: "#f3f4f6", padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap", marginLeft: 12 }}>{p.year}</span>
              </div>
              <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.8, marginBottom: 14 }}>{p.desc}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {p.tags.map((t, j) => (
                  <span key={j} style={{ fontSize: 11, background: "#eff6ff", color: "#1d4ed8", padding: "3px 10px", borderRadius: 20, fontWeight: 500 }}>{t}</span>
                ))}
              </div>
              {p.link ? (
                <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>View on SSRN →</a>
              ) : (
                <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>{p.status} · not yet linked</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== ABOUT PAGE ===== */}
      {page === "about" && (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#2563eb" }}>K</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>Krishika Nishad</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>B.A. (Hons.) Economics · Hansraj College, University of Delhi</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.9, marginBottom: 24 }}>
              PortfolioLens is a personal project built at the intersection of empirical asset pricing research and accessible financial tools. It applies the same quantitative framework from my working papers on factor models and momentum in Indian equities — making institutional-grade portfolio analysis available to anyone.
            </div>
            <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.9, marginBottom: 28 }}>
              I am a final-year Economics student with a focus on empirical finance, asset pricing, and development finance. My research has been uploaded to SSRN and targets publication in peer-reviewed undergraduate journals.
            </div>
            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 12 }}>LINKS</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { label: "SSRN Papers", url: "https://papers.ssrn.com/abstract=6642298" },
                  { label: "GitHub", url: "https://github.com/krishikanishad" },
                  { label: "LinkedIn", url: "https://linkedin.com" },
                ].map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563eb", fontWeight: 600, textDecoration: "none", background: "#eff6ff", padding: "6px 14px", borderRadius: 8 }}>{l.label} →</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
