// Configuration for the portfolio management application

export const API_CONFIG = {
  // Backend API base URL
  BASE_URL: 'http://localhost:3000',
  
  // User ID (hardcoded for demo purposes)
  USER_ID: 2,
  
  // Finnhub API configuration
  FINNHUB: {
    API_KEY: 'd2a73d9r01qvhs80eq50d2a73d9r01qvhs80eq5g',
    REST_URL: 'https://finnhub.io/api/v1',
    WS_URL: 'wss://ws.finnhub.io'
  }
};

// API endpoints
export const ENDPOINTS = {
  USER_STOCKS: (userId) => `/users/${userId}/stocks`,
  USER_DATA: (userId) => `/users/${userId}`,
  BUY_STOCK: '/stocks/buy',
  SELL_STOCK: '/stocks/sell',
  PORTFOLIO: (userId) => `/portfolio/${userId}`,
  TRANSACTIONS: (userId) => `/stocks/transactions/${userId}`
};

// WebSocket connection settings
export const WS_CONFIG = {
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_INTERVAL: 5000, // 5 seconds
  PING_INTERVAL: 30000, // 30 seconds
};

export default API_CONFIG;
