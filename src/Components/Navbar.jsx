import { Search, User, Briefcase, Heart, TrendingUp, X, DollarSign, Plus, Minus, Calculator, Wallet, RefreshCw, CreditCard } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { API_CONFIG, ENDPOINTS } from "../config/config";

const FINNHUB_API_KEY = 'd29hvl1r01qhoencbd9gd29hvl1r01qhoencbda0';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  
  // Trading modal state
  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionMode, setTransactionMode] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userStocks, setUserStocks] = useState([]);
  
  // Price history chart state
  const [stockChartData, setStockChartData] = useState([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  
  // Wallet modal state
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target) && 
          resultsRef.current && !resultsRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search for stocks
  const searchStocks = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Search for stock symbols
      const response = await fetch(`https://finnhub.io/api/v1/search?q=${query}&token=${FINNHUB_API_KEY}`);
      const data = await response.json();
      
      if (data.result) {
        // Get detailed info for top 5 results
        const topResults = data.result.slice(0, 5);
        const detailedResults = await Promise.all(
          topResults.map(async (stock) => {
            try {
              const [profileRes, quoteRes] = await Promise.all([
                fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${stock.symbol}&token=${FINNHUB_API_KEY}`),
                fetch(`https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${FINNHUB_API_KEY}`)
              ]);
              
              const [profile, quote] = await Promise.all([
                profileRes.json(),
                quoteRes.json()
              ]);
              
              return {
                symbol: stock.symbol,
                description: stock.description,
                name: profile.name || stock.description,
                price: quote.c,
                change: quote.d,
                changePercent: quote.dp,
                logo: profile.logo
              };
            } catch (error) {
              return {
                symbol: stock.symbol,
                description: stock.description,
                name: stock.description,
                price: null,
                change: null,
                changePercent: null,
                logo: null
              };
            }
          })
        );
        
        setSearchResults(detailedResults);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      searchStocks(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch user stocks for ownership info
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

  // Fetch historical stock data
  const fetchHistoricalData = async (symbol) => {
    setIsLoadingChart(true);
    try {
      const to = Math.floor(Date.now() / 1000); // Current timestamp
      const from = to - (30 * 24 * 60 * 60); // 30 days ago
      
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${API_CONFIG.FINNHUB.API_KEY}`
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


  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    setIsLoadingWallet(true);
    try {
      const userUrl = `${API_CONFIG.BASE_URL}${ENDPOINTS.USER_DATA(API_CONFIG.USER_ID)}`;
      const userResponse = await fetch(userUrl);
      const userResult = await userResponse.json();
      
      if (userResult.success && userResult.data) {
        setWalletBalance(parseFloat(userResult.data.balance) || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setWalletBalance(0);
    } finally {
      setIsLoadingWallet(false);
    }
  };

  // Handle wallet modal
  const openWalletModal = () => {
    setIsWalletModalOpen(true);
    fetchWalletBalance();
  };

  const closeWalletModal = () => {
    setIsWalletModalOpen(false);
    setAddFundsAmount('');
  };

  // Handle add funds (dummy function)
  const handleAddFunds = () => {
    if (!addFundsAmount || parseFloat(addFundsAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    // Dummy implementation - just update local state
    const amount = parseFloat(addFundsAmount);
    setWalletBalance(prev => prev + amount);
    alert(`Successfully added $${amount.toFixed(2)} to your wallet!`);
    closeWalletModal();
  };

  const handleStockSelect = (stock) => {
    console.log('Selected stock:', stock);
    setSearchQuery('');
    setShowResults(false);
    
    // Open trading modal
    const userStock = userStocks.find(us => us.stock_id === stock.symbol);
    setSelectedStock({
      ...stock,
      currentPrice: stock.price || 0,
      shares: userStock ? userStock.share_quantity || 0 : 0,
      change: stock.change || 0,
      changePercent: stock.changePercent || 0
    });
    setIsModalOpen(true);
    
    // Fetch historical chart data for the selected stock
    fetchHistoricalData(stock.symbol);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };
  
  // Trading modal functions
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
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockId: null,
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

  return (
    <nav className="w-full bg-white shadow-lg px-6 py-4 flex items-center justify-between border-b border-blue-600">
      {/* Left: MoneyTrack Logo */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <div className="text-2xl font-bold bg-blue-600 bg-clip-text text-transparent">
            MoneyTrack
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-8">
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
            placeholder="Search stocks (e.g., AAPL, TSLA, GOOGL)..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-blue-50 hover:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Loading indicator */}
          {isSearching && (
            <div className="absolute right-10 top-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div 
              ref={resultsRef}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-violet-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto"
            >
              {searchResults.map((stock, index) => (
                <div
                  key={stock.symbol}
                  onClick={() => handleStockSelect(stock)}
                  className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {stock.logo && (
                      <img 
                        src={stock.logo} 
                        alt={`${stock.symbol} logo`}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">{stock.symbol}</div>
                      <div className="text-sm text-gray-600 truncate max-w-xs">{stock.name}</div>
                    </div>
                  </div>
                  
                  {stock.price && (
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${stock.price.toFixed(2)}</div>
                      {stock.changePercent && (
                        <div className={`text-sm ${
                          stock.changePercent > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* No Results Message */}
          {showResults && searchResults.length === 0 && searchQuery && !isSearching && (
            <div 
              ref={resultsRef}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-violet-200 rounded-xl shadow-lg z-50"
            >
              <div className="p-4 text-center text-gray-500">
                No stocks found for "{searchQuery}"
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Navigation Icons */}
      <div className="flex items-center gap-3">
        {/* Wallet Icon */}
        <button 
          onClick={openWalletModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors group"
        >
          <Wallet className="h-5 w-5 text-gray-600 group-hover:text-emerald-500" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-500">Wallet</span>
        </button>
        
        {/* Portfolio Icon */}
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors group">
          <Briefcase className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Portfolio</span>
        </button>
        
        {/* Wishlist Icon */}
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors group">
          <Heart className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
          <span className="text-sm font-medium text-gray-700 group-hover:text--blue-600">Wishlist</span>
        </button>
        
        {/* Profile Icon */}
        <button className="p-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg">
          <User className="h-5 w-5 text-white" />
        </button>
      </div>
      
      {/* Trading Modal */}
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
                  <span className={`font-bold ${selectedStock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedStock.changePercent >= 0 ? '+' : ''}${selectedStock.change?.toFixed(2) || '0.00'}
                    ({selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent?.toFixed(2) || '0.00'}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Price History Chart */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Price History (30 Days)</h3>
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
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No chart data available</p>
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

      {/* Wallet Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-emerald-100 ring-1 ring-emerald-200/20">
            <button onClick={closeWalletModal} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Wallet Balance</h2>
                  <p className="text-gray-600">Manage your funds</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Current Balance</p>
                {isLoadingWallet ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-emerald-600">${walletBalance.toFixed(2)}</p>
                )}
              </div>
            </div>

            {/* Add Funds Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-800">Add Funds</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount to Add
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={addFundsAmount}
                    onChange={(e) => setAddFundsAmount(e.target.value)}
                    placeholder="Enter amount ($)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[100, 500, 1000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setAddFundsAmount(amount.toString())}
                      className="py-2 px-3 text-sm border border-emerald-300 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                {addFundsAmount && (
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-gray-700">Transaction Preview</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current balance:</span>
                        <span className="font-medium">${walletBalance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount to add:</span>
                        <span className="font-medium text-emerald-600">+${parseFloat(addFundsAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 mt-2">
                        <span className="font-medium text-gray-900">New balance:</span>
                        <span className="font-bold text-lg text-emerald-600">
                          ${(walletBalance + parseFloat(addFundsAmount || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeWalletModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFunds}
                disabled={!addFundsAmount || parseFloat(addFundsAmount) <= 0}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <div className="flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Funds
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
