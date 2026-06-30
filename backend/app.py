from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import numpy as np
import pandas as pd
import requests

app = Flask(__name__)
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        tickers = data['tickers']
        weights = np.array(data['weights'], dtype=float)
        weights = weights / weights.sum()

       prices = yf.download(tickers, period='3y', auto_adjust=True, progress=False)['Close']
        if len(tickers) == 1:
            prices = prices.to_frame(name=tickers[0])
        prices = prices.dropna(axis=1, how='all').dropna()

        valid_tickers = list(prices.columns)
        if len(valid_tickers) < 2:
            return jsonify({'error': 'Could not fetch data for enough tickers. Check ticker symbols.'}), 400

        # Match weights to valid_tickers using original ticker order, not column order
        ticker_to_weight = dict(zip(tickers, weights))
        weights = np.array([ticker_to_weight[t] for t in valid_tickers])
        weights = weights / weights.sum()

        returns = prices.pct_change().dropna()
        ann_returns = returns.mean() * 252
        port_return = float(np.dot(weights, ann_returns))

        cov_matrix = returns.cov() * 252
        port_vol = float(np.sqrt(np.dot(weights, np.dot(cov_matrix, weights))))

        risk_free = 0.065
        sharpe = (port_return - risk_free) / port_vol

        market = yf.download('^NSEI', period='3y', auto_adjust=True, progress=False)['Close']
        market_returns = market.pct_change().dropna().squeeze()

        port_daily = returns.dot(weights)
        common_index = port_daily.index.intersection(market_returns.index)
        port_aligned = port_daily.loc[common_index].values
        market_aligned = market_returns.loc[common_index].values

        cov_with_market = np.cov(port_aligned, market_aligned)[0][1]
        market_var = np.var(market_aligned)
        beta = float(cov_with_market / market_var)

        var_95 = float(np.percentile(port_daily.dropna(), 5))

        frontier = []
        for _ in range(800):
            w = np.random.random(len(valid_tickers))
            w /= w.sum()
            r = float(np.dot(w, ann_returns))
            v = float(np.sqrt(np.dot(w, np.dot(cov_matrix, w))))
            frontier.append({'x': round(v * 100, 2), 'y': round(r * 100, 2)})

        stock_details = []
        for i, ticker in enumerate(valid_tickers):
            stock_details.append({
                'ticker': ticker,
                'weight': round(float(weights[i]) * 100, 1),
                'return': round(float(ann_returns[ticker]) * 100, 2),
                'volatility': round(float(np.sqrt(cov_matrix.loc[ticker, ticker])) * 100, 2),
            })

        return jsonify({
            'expected_return': round(port_return * 100, 2),
            'volatility': round(port_vol * 100, 2),
            'sharpe': round(float(sharpe), 3),
            'beta': round(beta, 3),
            'var_95': round(var_95 * 100, 3),
            'frontier': frontier,
            'stocks': stock_details
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
import requests

@app.route('/search', methods=['GET'])
def search_ticker():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    try:
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&lang=en-US&region=IN&quotesCount=8&newsCount=0"
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.get(url, headers=headers, timeout=5)
        data = res.json()
        results = []
        for q in data.get('quotes', []):
            if q.get('symbol') and q.get('shortname'):
                results.append({
                    'symbol': q['symbol'],
                    'name': q.get('shortname', ''),
                    'exchange': q.get('exchange', '')
                })
        return jsonify(results)
    except:
        return jsonify([])
if __name__ == '__main__':
    app.run(debug=True, port=5000)

    