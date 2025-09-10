import { Activity, ArrowUpRight, ArrowDownRight, ShoppingCart, DollarSign, X, Plus, Minus, Calculator, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import useFinnhubPrices from "../finHubapi/connectApi.js";
import { API_CONFIG, ENDPOINTS } from "../config/config";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const FINNHUB_API_KEY = 'd2a73d9r01qvhs80eq50d2a73d9r01qvhs80eq5g';
const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'NFLX', name: 'Netflix, Inc.' }
];

export default function TopMovers() {
  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionMode, setTransactionMode] = useState(null); // 'buy' or 'sell'
  const [quantity, setQuantity] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userStocks, setUserStocks] = useState([]);
  const [stockChartData, setStockChartData] = useState([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Fetch user stocks to check ownership for sell functionality
  useEffect(() => {
    const fetchUserStocks = async () => {
      try {
        const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.USER_STOCKS(API_CONFIG.USER_ID)}`;
        const response = await fetch(url);
        const result = await response.json();
        setUserStocks(result.data || []);
      } catch (error) {
        console.error('Error fetching user stocks:', error);
        setUserStocks([]);
      }
    };
    fetchUserStocks();
  }, []);

  const symbols = STOCKS.map(stock => stock.symbol);
  const {
    prices,
    changes,
    previousClose,
    lastUpdate,
    isConnected,
    isReconnecting,
    connectionError
  } = useFinnhubPrices(symbols, FINNHUB_API_KEY);

  // Debug logging
  console.log('🚀 TopMovers component rendering with:', {
    symbols,
    pricesCount: Object.keys(prices).length,
    prices,
    previousClose,
    changes,
    isConnected,
    connectionError
  });

  const getPercentChange = (symbol) => {
    if (!prices[symbol] || !previousClose[symbol]) return null;
    const change = ((prices[symbol] - previousClose[symbol]) / previousClose[symbol]) * 100;
    return change.toFixed(2);
  };

  // Get time since last update
  const getTimeSinceUpdate = (symbol) => {
    if (!lastUpdate[symbol]) return null;
    const seconds = Math.floor((Date.now() - lastUpdate[symbol]) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  // Fetch historical stock data
  const fetchHistoricalData = async (symbol) => {
    setIsLoadingChart(true);
    try {
      const to = Math.floor(Date.now() / 1000); // Current timestamp
      const from = to - (30 * 24 * 60 * 60); // 30 days ago

      const response = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }

      const data = await response.json();

      if (data.s === 'ok' && data.c && data.t) {
        // Transform data for chart
        const chartData = data.c.map((close, index) => ({
          date: new Date(data.t[index] * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          price: close,
          high: data.h[index],
          low: data.l[index],
          open: data.o[index],
          volume: data.v[index]
        }));

        setStockChartData(chartData);
      } else {
        // Fallback to sample data if API fails
        const currentPrice = prices[symbol] || 100;
        const sampleData = Array.from({ length: 30 }, (_, i) => {
          const variance = (Math.random() - 0.5) * 10;
          const price = Math.max(currentPrice + variance - (i * 0.5), 1);
          return {
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            }),
            price: parseFloat(price.toFixed(2)),
            high: parseFloat((price * 1.02).toFixed(2)),
            low: parseFloat((price * 0.98).toFixed(2)),
            open: parseFloat(price.toFixed(2))
          };
        });
        setStockChartData(sampleData);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      // Generate sample data as fallback
      const currentPrice = prices[symbol] || 100;
      const sampleData = Array.from({ length: 30 }, (_, i) => {
        const variance = (Math.random() - 0.5) * 10;
        const price = Math.max(currentPrice + variance - (i * 0.5), 1);
        return {
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          price: parseFloat(price.toFixed(2)),
          high: parseFloat((price * 1.02).toFixed(2)),
          low: parseFloat((price * 0.98).toFixed(2)),
          open: parseFloat(price.toFixed(2))
        };
      });
      setStockChartData(sampleData);
    } finally {
      setIsLoadingChart(false);
    }
  };

  // Modal functions
  const openModal = (stock) => {
    const userStock = userStocks.find(us => us.stock_id === stock.symbol || us.symbol === stock.symbol);
    setSelectedStock({
      ...stock,
      currentPrice: prices[stock.symbol] || 0,
      shares: userStock ? userStock.shares || userStock.share_quantity || 0 : 0,
      change: changes[stock.symbol] || 0,
      changePercent: getPercentChange(stock.symbol) || 0
    });
    setIsModalOpen(true);
    // Fetch historical chart data for the selected stock
    fetchHistoricalData(stock.symbol);
  };

  const closeModal = () => {
    setSelectedStock(null);
    setIsModalOpen(false);
    setTransactionMode(null);
    setQuantity('');
    setIsProcessing(false);
  };

  const handleBuyClick = () => {
    setTransactionMode('buy');
    setQuantity('');
  };

  const handleSellClick = () => {
    setTransactionMode('sell');
    setQuantity('');
  };

  const calculateTotalValue = () => {
    const qty = parseInt(quantity) || 0;
    return (qty * (selectedStock?.currentPrice || 0)).toFixed(2);
  };

  const handleTransaction = async () => {
    if (!quantity || parseInt(quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (transactionMode === 'sell' && parseInt(quantity) > selectedStock.shares) {
      alert('Cannot sell more shares than you own');
      return;
    }

    setIsProcessing(true);

    try {
      const endpoint = transactionMode === 'buy' ? ENDPOINTS.BUY_STOCK : ENDPOINTS.SELL_STOCK;
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;

      console.log(`💸 ${transactionMode.toUpperCase()} transaction:`, {
        symbol: selectedStock.symbol,
        quantity: parseInt(quantity),
        price: selectedStock.currentPrice
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockId: null, // TopMovers doesn't have holdingId
          symbol: selectedStock.symbol,
          quantity: parseInt(quantity),
          price: selectedStock.currentPrice,
          userId: API_CONFIG.USER_ID
        })
      });

      if (response.ok) {
        // Refresh user stocks data
        const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.USER_STOCKS(API_CONFIG.USER_ID)}`;
        const response = await fetch(url);
        const result = await response.json();
        setUserStocks(result.data || []);

        alert(`Successfully ${transactionMode === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${selectedStock.symbol}`);

        // Refresh the page to update transactions
        setTimeout(() => {
          window.location.reload();
        }, 1000);

        closeModal();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Debug: Always render something to test
  console.log('💼 TopMovers rendering return statement');

  // Add error boundary check
  try {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-400">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
              Top Stocks
            </h2>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-500' :
                  isReconnecting ? 'bg-yellow-500' :
                    'bg-red-500'
                }`}
            ></div>
            <span className="text-xs text-gray-500">
              {isConnected ? 'Live Data' :
                isReconnecting ? 'Reconnecting...' :
                  'Disconnected'}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {Object.keys(prices).length === 0 && !connectionError && (
          <div className="mb-6 p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading stock data...</span>
            </div>
          </div>
        )}

        {/* Top Gainers */}
        <div className="mb-6">
          <div className="space-y-3">
            {STOCKS.map((stock) => {
              const price = prices[stock.symbol];
              const percentChange = getPercentChange(stock.symbol);
              const change = changes[stock.symbol];
              const timeSinceUpdate = getTimeSinceUpdate(stock.symbol);
              const isPositive = percentChange > 0;
              const hasData = price && previousClose[stock.symbol];

              return (
                <div
                  key={stock.symbol}
                  className={`relative flex justify-between items-center p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${hasData
                      ? isPositive
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : 'bg-red-50 border-red-200 hover:bg-red-100'
                      : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  {/* Live indicator dot for recent updates */}
                  {lastUpdate[stock.symbol] && Date.now() - lastUpdate[stock.symbol] < 30000 && (
                    <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800 text-lg">{stock.symbol}</p>
                      {hasData && (
                        <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {isPositive ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{stock.name}</p>
                    {timeSinceUpdate && (
                      <p className="text-xs text-gray-400 mt-1">
                        Updated {timeSinceUpdate}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-lg">
                      {price ? `$${price.toFixed(2)}` : 'Loading...'}
                    </p>
                    <div className="flex flex-col items-end">
                      {hasData && (
                        <>
                          <p className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {isPositive ? '+' : ''}{percentChange}%
                          </p>
                          {change && (
                            <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'
                              }`}>
                              {isPositive ? '+' : ''}${change.toFixed(2)}
                            </p>
                          )}
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(stock);
                        }}
                        className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        <ShoppingCart className="h-3 w-3 inline mr-1" />
                        Trade
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && selectedStock && (
          <div className="fixed inset-0 bg-gradient-to-br from-white via-blue-50/40 to-blue-100/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 relative border border-blue-100 ring-1 ring-violet-200/20">
              <button onClick={closeModal} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedStock.symbol}</h2>
                    <p className="text-gray-600">{selectedStock.name}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Price</p>
                    <p className="font-bold text-lg">${selectedStock.currentPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Your Shares</p>
                    <p className="font-bold text-lg">{selectedStock.shares}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-violet-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Change</span>
                    <span className={`font-bold ${(parseFloat(selectedStock.changePercent) || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(parseFloat(selectedStock.changePercent) || 0) >= 0 ? '+' : ''}${selectedStock.change?.toFixed(2) || '0.00'}
                      ({(parseFloat(selectedStock.changePercent) || 0) >= 0 ? '+' : ''}{selectedStock.changePercent || '0.00'}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Chart */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">30-Day Price History</h3>
                </div>
                <div className="h-48 bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-100">
                  {isLoadingChart ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p>Loading price chart...</p>
                      </div>
                    </div>
                  ) : stockChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stockChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis
                          dataKey="date"
                          stroke="#6b7280"
                          fontSize={10}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          stroke="#6b7280"
                          fontSize={10}
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                          domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px'
                          }}
                          formatter={(value, name) => [
                            `$${value.toFixed(2)}`,
                            'Price'
                          ]}
                          labelStyle={{ color: '#374151', fontWeight: 'medium' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{
                            r: 4,
                            stroke: '#8b5cf6',
                            strokeWidth: 2,
                            fill: '#ffffff'
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No chart data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Interface */}
              {transactionMode ? (
                <div className="mb-6">
                  <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`p-2 rounded-lg ${transactionMode === 'buy' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                        {transactionMode === 'buy' ? (
                          <Plus className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Minus className="h-5 w-5 text-rose-600" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {transactionMode === 'buy' ? 'Buy Shares' : 'Sell Shares'}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={transactionMode === 'sell' ? selectedStock.shares : undefined}
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="Enter number of shares"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        />
                        {transactionMode === 'sell' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Maximum: {selectedStock.shares} shares
                          </p>
                        )}
                      </div>

                      {quantity && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Calculator className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Transaction Summary</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Price per share:</span>
                              <span className="font-medium">${selectedStock.currentPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-medium">{quantity} shares</span>
                            </div>
                            <div className="flex justify-between border-t pt-1 mt-2">
                              <span className="font-medium text-gray-900">Total Value:</span>
                              <span className="font-bold text-lg text-blue-600">
                                ${calculateTotalValue()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setTransactionMode(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTransaction}
                      disabled={!quantity || parseInt(quantity) <= 0 || isProcessing}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${transactionMode === 'buy'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'
                        : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : (
                        `${transactionMode === 'buy' ? 'Buy' : 'Sell'} ${quantity || 0} Shares`
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleBuyClick}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 font-medium shadow-lg hover:shadow-xl"
                  >
                    <Plus className="h-4 w-4" />
                    Buy
                  </button>
                  <button
                    onClick={handleSellClick}
                    disabled={selectedStock.shares === 0}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-500 text-white py-3 rounded-lg hover:bg-rose-600 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                    Sell
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('❌ TopMovers rendering error:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <h3 className="text-red-800 font-medium">TopMovers Error</h3>
        <p className="text-red-600 text-sm mt-2">Error: {error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
        >
          Refresh Page
        </button>
      </div>
    );
  }
}
