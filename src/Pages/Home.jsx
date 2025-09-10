import { useEffect, useState } from "react";
import TopMovers from "../Components/TopMovers";
import PortfolioAnalysis from "../Components/PortfolioAnalysis";
import MyPortfolio from "../Components/MyPortfolio";
import { API_CONFIG, ENDPOINTS } from "../config/config";
import { History, TrendingUp, TrendingDown, Clock } from "lucide-react";

export default function HomePage() {
  console.log('🏠 HomePage rendering start');
  
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  
  const [portfolioStocks, setPortfolioStocks] = useState([
    {
      id: 1,
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 10,
      buyPrice: 150.00,
      currentPrice: 175.23,
      change: +16.82,
      changePercent: +16.82
    },
    {
      id: 2,
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      shares: 5,
      buyPrice: 2800.00,
      currentPrice: 2750.40,
      change: -49.60,
      changePercent: -1.77
    },
    {
      id: 3,
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      shares: 8,
      buyPrice: 320.00,
      currentPrice: 338.11,
      change: +18.11,
      changePercent: +5.65
    }
  ]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:3000/users/2");
        const result = await response.json();
        setUser(result.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    const fetchTransactions = async () => {
      try {
        setIsLoadingTransactions(true);
        const url = `${API_CONFIG.BASE_URL}${ENDPOINTS.TRANSACTIONS(API_CONFIG.USER_ID)}`;
        const response = await fetch(url);
        const result = await response.json();
        setTransactions(result.data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchUser();
    fetchTransactions();
  }, []);

  // Function to update portfolio after buy/sell transactions
  const updatePortfolio = (stockId, transactionType, quantity) => {
    setPortfolioStocks(prevStocks => {
      return prevStocks.map(stock => {
        if (stock.id === stockId) {
          const newShares = transactionType === 'buy' 
            ? stock.shares + quantity 
            : stock.shares - quantity;
          
          // If selling all shares, we might want to remove the stock or keep it with 0 shares
          if (newShares <= 0 && transactionType === 'sell') {
            return { ...stock, shares: 0 }; // or filter it out completely
          }
          
          // Calculate new average buy price for buy transactions
          let newBuyPrice = stock.buyPrice;
          if (transactionType === 'buy') {
            const totalValue = (stock.shares * stock.buyPrice) + (quantity * stock.currentPrice);
            newBuyPrice = totalValue / newShares;
          }
          
          return {
            ...stock,
            shares: newShares,
            buyPrice: newBuyPrice
          };
        }
        return stock;
      }).filter(stock => stock.shares > 0); // Remove stocks with 0 shares
    });
  };



  // Debug: Always render something to test
  console.log('🏠 HomePage rendering return statement');
  
  try {
    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Portfolio Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          Monitor your investments and track market movements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        <div className="lg:col-span-3">
          <TopMovers />
        </div>
        <div className="lg:col-span-5">
          <PortfolioAnalysis user={user} />
        </div>
        <div className="lg:col-span-4">
          <MyPortfolio portfolioStocks={portfolioStocks} updatePortfolio={updatePortfolio} />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <History className="h-6 w-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
              Recent Transactions
            </h2>
          </div>

          {isLoadingTransactions ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-violet-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Loading transactions...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg">No transactions yet</p>
              <p className="text-gray-400 text-sm">Start trading to see your transaction history here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((transaction) => {
                    const isBuy = transaction.transaction_type === 'BUY';
                    
                    // Safely convert to numbers with fallbacks
                    const pricePerStock = parseFloat(transaction.transaction_per_stock) || 0;
                    const quantity = parseFloat(transaction.transaction_quantity) || 0;
                    const total = (pricePerStock * quantity).toFixed(2);
                    const date = new Date(transaction.transaction_date);
                    const formattedDate = date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <tr key={transaction.transaction_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{transaction.stock_id}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className={`flex items-center gap-1 ${
                            isBuy ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isBuy ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="font-medium text-sm">{transaction.transaction_type}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900">
                          {transaction.transaction_quantity}
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900">
                          ${pricePerStock.toFixed(2)}
                        </td>
                        <td className={`py-4 px-4 text-right font-bold ${
                          isBuy ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {isBuy ? '-' : '+'}${total}
                        </td>
                        <td className="py-4 px-4 text-right text-sm text-gray-500">
                          {formattedDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {transactions.length > 10 && (
                <div className="mt-4 text-center">
                  <p className="text-gray-500 text-sm">
                    Showing latest 10 transactions. Total: {transactions.length}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('❌ HomePage rendering error:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <h2 className="text-red-800 font-medium text-lg mb-2">HomePage Error</h2>
          <p className="text-red-600 text-sm mb-4">Error: {error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}
