import { BarChart3, PieChart, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart,
  Bar,
  Pie
} from 'recharts';
import { API_CONFIG, ENDPOINTS } from '../config/config.js';

export default function PortfolioAnalysis({ user }) {
      const [userStock, setUserStock] = useState(null);
      const [performanceData, setPerformanceData] = useState([]);
      const [timeRange, setTimeRange] = useState('weekly'); // 'weekly' or 'monthly'

    // Fetch user stocks
    useEffect(() => {
        const fetchUserData = async () => {
          try {
            // Fetch user stocks
            const stocksUrl = `${API_CONFIG.BASE_URL}${ENDPOINTS.USER_STOCKS(API_CONFIG.USER_ID)}`;
            const stocksResponse = await fetch(stocksUrl);
            const stocksResult = await stocksResponse.json();
            setUserStock(stocksResult.data);
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        };
    
        fetchUserData();
      }, []);

      // Generate performance data based on time range
      useEffect(() => {
        if (userStock) {
          generatePerformanceData();
        }
      }, [userStock, timeRange]);

      const generatePerformanceData = () => {
        const today = new Date();
        const data = [];
        
        if (timeRange === 'weekly') {
          // Generate 7 days of data
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const baseValue = 25000 + (Math.random() - 0.5) * 5000;
            data.push({
              date: date.toLocaleDateString('en-US', { weekday: 'short' }),
              value: Math.round(baseValue),
              profit: Math.round((baseValue - 20000) * 0.1)
            });
          }
        } else if (timeRange === 'monthly') {
          // Generate 4 weeks of data
          for (let i = 3; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - (i * 7));
            const baseValue = 25000 + (Math.random() - 0.5) * 8000;
            data.push({
              date: `Week ${4 - i}`,
              value: Math.round(baseValue),
              profit: Math.round((baseValue - 20000) * 0.15)
            });
          }
        }
        
        setPerformanceData(data);
      };

      const totalValue = userStock?.reduce((acc, stock) => {
        return acc + parseFloat(stock.share_value) * stock.share_quantity;
      }, 0);

      // Prepare pie chart data
      const pieData = userStock?.map(stock => ({
        name: stock.stock_id,
        value: parseFloat(stock.share_value) * stock.share_quantity,
        quantity: stock.share_quantity
      })) || [];

      // Colors for pie chart
      const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

      // Calculate total P&L
      const totalProfitLoss = performanceData.length > 0 ? 
        performanceData[performanceData.length - 1].profit : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-400">
      {/* Portfolio Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
            Portfolio Analysis
          </h2>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            totalProfitLoss >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {totalProfitLoss >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            ${Math.abs(totalProfitLoss).toLocaleString()}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-xl font-bold text-gray-900">${totalValue?.toLocaleString() || '0'}</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Holdings</p>
            <p className="text-xl font-bold text-gray-900">{userStock?.length || 0}</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">P&L Today</p>
            <p className={`text-xl font-bold ${
              totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Performance Chart</h3>
          </div>
          
          {/* Time Range Toggle */}
          <div className="flex items-center gap-1 bg-blue-100 rounded-lg p-1">
            <Calendar className="h-4 w-4 text-blue-600 ml-2" />
            <button
              onClick={() => setTimeRange('weekly')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === 'weekly' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-blue-600 hover:bg-blue-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === 'monthly' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-blue-600 hover:bg-blue-200'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
        <div className="h-64 bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-100">
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [
                    `$${value.toLocaleString()}`,
                    name === 'value' ? 'Portfolio Value' : 'Profit/Loss'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Loading performance data...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Portfolio Breakdown</h3>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-100">
          {pieData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [
                        `$${value.toLocaleString()}`,
                        name
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {pieData.map((stock, index) => (
                  <div key={stock.name} className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <div>
                        <p className="font-medium text-gray-900">{stock.name}</p>
                        <p className="text-xs text-gray-500">{stock.quantity} shares</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${stock.value.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {((stock.value / totalValue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <PieChart className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No portfolio data available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
