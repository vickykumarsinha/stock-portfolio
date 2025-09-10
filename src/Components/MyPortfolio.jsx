import { Briefcase, Star, X, Edit3, Plus, Minus, Calculator, Wallet, RefreshCw } from "lucide-react";
import useFinnhubPrices from "../finHubapi/connectApi";
import { useState, useEffect } from "react";
import { API_CONFIG, ENDPOINTS } from "../config/config";

export default function MyPortfolio({ portfolioStocks, updatePortfolio }) {
    const [selectedStock, setSelectedStock] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactionMode, setTransactionMode] = useState(null); // 'buy' or 'sell'
    const [quantity, setQuantity] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [userStock, setUserStock] = useState(null);
    const [stockCount, setStockCount] = useState(0);
    //const [prices, setPrices] = useState({}); // real-time prices from WebSocket
    const [portfolioValue, setPortfolioValue] = useState(0); // total current value
    const [profitLoss, setProfitLoss] = useState(0); // total profit/loss
    const [walletBalance, setWalletBalance] = useState(0);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);

    // Fetch wallet balance function
    const fetchWalletBalance = async () => {
        setIsLoadingBalance(true);
        try {
            const userUrl = `http://localhost:3000/users/2`;
            const userResponse = await fetch(userUrl);
            const userResult = await userResponse.json();
            
            if (userResult.data.balance && userResult.data) {
                setWalletBalance(parseFloat(userResult.data?.balance));
            }
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            setWalletBalance(0);
        } finally {
            setIsLoadingBalance(false);
        }
    };

    // Fetch user stocks and wallet balance on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.USER_STOCKS(API_CONFIG.USER_ID)}`;
                console.log('📡 Fetching user stocks from:', url);
                
                const response = await fetch(url);
                const result = await response.json();
                
                console.log('📊 Fetched user stocks:', result);
                setUserStock(result.data || []);
                setStockCount(result.count || 0);
                
                // Also fetch wallet balance
                await fetchWalletBalance();
            } catch (error) {
                console.error('❌ Error fetching user stocks:', error);
                setUserStock([]);
                setStockCount(0);
            }
        };
    
        fetchUserData();
    }, []);
    
    // Get symbols for price fetching
    const symbols = userStock ? userStock.map(stock => stock.stock_id) : [];
    const { prices, isConnected, isReconnecting, connectionError } = useFinnhubPrices(symbols, API_CONFIG.FINNHUB.API_KEY);
  
    // Calculate portfolio metrics when prices or userStock changes
    useEffect(() => {
        if (!userStock || userStock.length === 0 || Object.keys(prices).length === 0) {
            console.log("Waiting for userStock and prices data...");
            return;
        }

        let totalValue = 0;
        let totalCost = 0;

        const updatedStocks = userStock.map(stock => {
            const currentPrice = prices[stock.stock_id] || parseFloat(stock.share_value) || 0;
            const boughtPrice = parseFloat(stock.share_value) || 0;
            const quantity = stock.share_quantity || 0;

            // Calculate current value and profit/loss
            const currentValue = currentPrice * quantity;
            const costBasis = boughtPrice * quantity;
            const stockProfitLoss = (currentValue - costBasis).toFixed(2);

            // Add to portfolio totals
            totalValue += currentValue;
            totalCost += costBasis;

            console.log(`Stock: ${stock.stock_id}, Current: $${currentPrice}, Bought: $${boughtPrice}, P/L: $${stockProfitLoss}`);

            return {
                ...stock,
                profitLoss: stockProfitLoss,
                currentPrice
            };
        });

        setUserStock(updatedStocks);
        setPortfolioValue(totalValue.toFixed(2));
        setProfitLoss((totalValue - totalCost).toFixed(2));
        
        console.log(`Portfolio Total Value: $${totalValue.toFixed(2)}, Total P/L: $${(totalValue - totalCost).toFixed(2)}`);
    }, [prices, userStock?.length]); // Only depend on prices and userStock length to avoid infinite loops

    const openModal = (stock) => {
        setSelectedStock({
            ...stock,
            symbol: stock.stock_id,
            name: stock.share_name,
            shares: stock.share_quantity,
            buyPrice: parseFloat(stock.share_value) || 0,
            currentPrice: prices[stock.stock_id] || parseFloat(stock.share_value) || 0,
            change: (prices[stock.stock_id] || parseFloat(stock.share_value) || 0) - (parseFloat(stock.share_value) || 0),
            changePercent: (((prices[stock.stock_id] || parseFloat(stock.share_value) || 0) - (parseFloat(stock.share_value) || 0)) / (parseFloat(stock.share_value) || 1)) * 100
        });
        setIsModalOpen(true);
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
                    stockId: selectedStock.holding_id,
                    symbol: selectedStock.symbol,
                    quantity: parseInt(quantity),
                    price: selectedStock.currentPrice,
                    userId: API_CONFIG.USER_ID
                })
            });

            if (response.ok) {
                if (updatePortfolio) {
                    updatePortfolio(selectedStock.holding_id, transactionMode, parseInt(quantity));
                }
                alert(`Successfully ${transactionMode === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${selectedStock.symbol}`);
                
                // Refresh the page to update transactions
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
                closeModal();
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Transaction error:', error);
            alert('Transaction failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const totalValue = userStock?.reduce((acc, stock) => {
        return acc + (parseFloat(stock.share_value) * stock.share_quantity || 0);
    }, 0) || 0;

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Briefcase className="h-6 w-6 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
                        My Portfolio
                    </h2>
                </div>
                
                {/* Connection Status Indicator */}
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                        isConnected ? 'bg-green-400' : 
                        isReconnecting ? 'bg-yellow-400' : 
                        'bg-red-400'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                        isConnected ? 'text-green-600' : 
                        isReconnecting ? 'text-yellow-600' : 
                        'text-red-600'
                    }`}>
                        {isConnected ? 'Live Prices' : 
                         isReconnecting ? 'Reconnecting...' : 
                         'Offline'}
                    </span>
                </div>
            </div>
            
            {/* Connection Error */}
            {/* {connectionError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Connection Error</p>
                    <p className="text-xs text-red-500">{connectionError}</p>
                    {connectionError.includes("Maximum reconnection attempts reached") && (
                        <button 
                            onClick={() => window.location.reload()} 
                            className="mt-2 px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            Refresh Page
                        </button>
                    )}
                </div>
            )} */}

            {/* Summary */}
            <div className="mb-6">
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                            <Wallet className="h-4 w-4 text-emerald-600" />
                            <p className="text-sm text-gray-600">Wallet Balance</p>
                            <button 
                                onClick={fetchWalletBalance} 
                                disabled={isLoadingBalance}
                                className="p-1 hover:bg-emerald-100 rounded transition-colors ml-auto"
                            >
                                <RefreshCw className={`h-3 w-3 text-emerald-600 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        <p className="text-xl font-bold text-emerald-700">
                            {isLoadingBalance ? 'Loading...' : `$${walletBalance.toLocaleString()}`}
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total P&L</p>
                        <p className="text-xl font-bold text-gray-900">${profitLoss}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Invested Value</p>
                        <p className="text-xl font-bold text-gray-900">${totalValue.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Value</p>
                        <p className="text-xl font-bold text-gray-900">${portfolioValue}</p>
                    </div>
                </div>
            </div>

            {/* Holdings */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">My Holdings</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {userStock?.map((stock) => (
                        <div
                            key={stock.holding_id}
                            onClick={() => openModal(stock)}
                            className="p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors border border-transparent hover:border-violet-200"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-gray-900">{stock.stock_id}</p>
                                        <span className="text-xs text-gray-500">
                                            {stock.share_quantity} shares
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{stock.share_name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Avg: ${parseFloat(stock.share_value).toFixed(2)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {prices[stock.stock_id] && stock.profitLoss ? (
                                        <p className={`text-xl font-bold ${stock.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ${stock.profitLoss}
                                        </p>
                                    ) : (
                                        <p className="text-xl font-bold text-gray-500">Loading...</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Total: ${(prices[stock.stock_id] * stock.share_quantity || parseFloat(stock.share_value) * stock.share_quantity || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
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
                                    <Edit3 className="h-6 w-6 text-blue-600" />
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
                                <div>
                                    <p className="text-sm text-gray-600">Avg Buy Price</p>
                                    <p className="font-bold text-lg">${selectedStock.buyPrice.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Value</p>
                                    <p className="font-bold text-lg">${(selectedStock.currentPrice * selectedStock.shares).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-violet-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Profit/Loss</span>
                                    <span className={`font-bold ${selectedStock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {selectedStock.changePercent >= 0 ? '+' : ''}${(selectedStock.change * selectedStock.shares).toFixed(2)}
                                        ({selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
                                    </span>
                                </div>
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
                                            {transactionMode === 'buy' ? 'Buy More Shares' : 'Sell Shares'}
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
                                    Buy More
                                </button>
                                <button
                                    onClick={handleSellClick}
                                    className="flex-1 flex items-center justify-center gap-2 bg-rose-500 text-white py-3 rounded-lg hover:bg-rose-600 font-medium shadow-lg hover:shadow-xl"
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
}