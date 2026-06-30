# PortfolioLens

A full-stack portfolio risk and return analyzer for Indian equities. Enter any combination of NSE/BSE stocks and instantly get expected return, volatility, Sharpe ratio, beta, Value at Risk, and an efficient frontier simulation, all computed from live market data.

**Live demo:** https://portfolio-lens-alpha.vercel.app

---

## Overview

PortfolioLens applies standard empirical asset pricing methodology, the same framework used in academic portfolio theory, to give retail-style users an institutional view of their holdings. Built as an extension of ongoing research in empirical finance on Indian equity markets, the tool computes:

- **Expected return** - annualized, weighted by holding
- **Volatility (σ)** - annualized standard deviation using the full covariance matrix
- **Sharpe ratio** - risk-adjusted return using the RBI repo rate as the risk-free benchmark
- **Beta** - systematic risk relative to the Nifty 50
- **Value at Risk (95%, 1-day)** - historical VaR from the portfolio's return distribution
- **Efficient frontier** - Monte Carlo simulation of 800 random portfolios for risk-return comparison

## Features

- Live stock search with autocomplete across NSE, BSE, and global exchanges
- Real-time price data fetched via yFinance
- Interactive efficient frontier, allocation, and risk decomposition charts
- Full methodology page explaining every formula used
- Research page linking to the underlying empirical asset pricing papers

## Tech Stack

**Frontend:** React, Recharts, deployed on Vercel
**Backend:** Python, Flask, deployed on Render
**Data:** yFinance, Yahoo Finance Search API
**Core libraries:** NumPy, Pandas, SciPy

## Architecture

```
portfoliolens/
├── frontend/          React app - UI, charts, ticker search
│   └── src/App.js
├── backend/           Flask API - portfolio calculations
│   └── app.py
│       /analyze       POST - computes risk/return metrics for a portfolio
│       /search        GET  - autocomplete stock search
```

## Methodology

All metrics are computed from 3 years of daily adjusted closing prices. Expected return and volatility are annualized using 252 trading days. Beta is estimated via the covariance of portfolio returns against the Nifty 50 index. Full formulas are documented on the [Methodology page](https://portfolio-lens-alpha.vercel.app) of the live app.

This tool extends the empirical framework developed in two working papers on Indian equity asset pricing — a CAPM test and a Carhart four-factor analysis of momentum in NSE Midcap 150 stocks. See the Research page for details.

## Running locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

The backend runs on `localhost:5000`, frontend on `localhost:3000`.

## Author

Krishika Nishad - B.A. (Hons.) Economics, Hansraj College, University of Delhi
