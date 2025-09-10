import { useEffect, useState, useRef } from 'react';

export default function useFinnhubPrices(symbols = [], apiKey) {
  const [prices, setPrices] = useState({});
  const [previousClose, setPreviousClose] = useState({});
  const [changes, setChanges] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState({});
  const [connectionError, setConnectionError] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const isMountedRef = useRef(true);
  
  useEffect(() => {
    if (!symbols || symbols.length === 0) return;
    
    isMountedRef.current = true;
    let socket = null;

    const fetchInitialData = async () => {
      setConnectionError(null);
      let hasAnyValidData = false;
      
      for (const symbol of symbols) {
        try {
          const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log(`💰 ${symbol} quote data:`, data);
          
          // Handle API errors first
          if (data.error) {
            console.error(`❌ API Error for ${symbol}:`, data.error);
            continue; // Skip to next symbol
          }
          
          // Check if we have valid numeric data - allow 0 values but not null/undefined
          const currentPrice = typeof data.c === 'number' ? data.c : parseFloat(data.c);
          const previousClose = typeof data.pc === 'number' ? data.pc : parseFloat(data.pc);
          const change = typeof data.d === 'number' ? data.d : (parseFloat(data.d) || 0);
          
          
          // Process data if component is mounted and we have current price
          if (!isMountedRef.current) {
            continue;
          }
          
          if (data.c === undefined || data.c === null) {
            console.warn(`⚠️ No current price data for ${symbol}`, { 'data.c': data.c });
            continue;
          }
          
          if (isNaN(currentPrice) || currentPrice < 0) {
            console.warn(`⚠️ Invalid price for ${symbol}:`, { 'data.c': data.c, currentPrice });
            continue;
          }
          
          // If we get here, we have valid data to process
          setPrices(prev => ({ ...prev, [symbol]: currentPrice }));
          setLastUpdate(prev => ({ ...prev, [symbol]: Date.now() }));
          hasAnyValidData = true;
          
          // Handle previous close and change
          if (!isNaN(previousClose)) {
            setPreviousClose(prev => ({ ...prev, [symbol]: previousClose }));
            setChanges(prev => ({ ...prev, [symbol]: change }));
            console.log(`✅ ${symbol}: $${currentPrice} (${change > 0 ? '+' : ''}${change})`);
          } else {
            setChanges(prev => ({ ...prev, [symbol]: 0 }));
            console.log(`✅ ${symbol}: $${currentPrice} (no previous close data)`);
          }
        } catch (err) {
          console.error(`❌ Error fetching initial data for ${symbol}:`, err);
          // Don't set connection error for individual symbol failures
          console.log(`Continuing with other symbols despite error for ${symbol}: ${err.message}`);
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    const connectWebSocket = () => {
      if (isReconnecting) {
        console.log(`🔄 Reconnecting to Finnhub WebSocket (Attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})...`);
      } else {
        console.log('🔌 Connecting to Finnhub WebSocket...');
      }
      
      try {
        socket = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);
        socketRef.current = socket;
      } catch (err) {
        console.error('❌ Failed to create WebSocket:', err);
        if (isMountedRef.current) {
          setConnectionError(`WebSocket creation failed: ${err.message}`);
          attemptReconnect();
        }
        return;
      }

      socket.onopen = () => {
        if (!isMountedRef.current) return;
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        setIsReconnecting(false);
        reconnectAttemptsRef.current = 0;
        
        symbols.forEach(symbol => {
          console.log(`📡 Subscribing to ${symbol}`);
          socket.send(JSON.stringify({ type: 'subscribe', symbol }));
        });
      };

      socket.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const message = JSON.parse(event.data);
          if (message.type === 'trade' && message.data && Array.isArray(message.data)) {
            message.data.forEach(trade => {
              if (trade && trade.s && typeof trade.p === 'number' && !isNaN(trade.p) && trade.p > 0) {
                console.log(`📈 Real-time update - ${trade.s}: $${trade.p}`);
                setPrices(prev => ({ ...prev, [trade.s]: trade.p }));
                
                // Calculate change using current previousClose state
                setPreviousClose(prevPreviousClose => {
                  if (prevPreviousClose[trade.s]) {
                    const change = trade.p - prevPreviousClose[trade.s];
                    setChanges(prevChange => ({ ...prevChange, [trade.s]: change }));
                  }
                  return prevPreviousClose;
                });
                
                setLastUpdate(prev => ({ ...prev, [trade.s]: Date.now() }));
              } else {
                console.warn(`⚠️ Invalid trade data received:`, trade);
              }
            });
          } else if (message.type === 'ping') {
            console.log('💓 WebSocket ping received');
          } else {
            console.log('📨 WebSocket message:', message);
          }
        } catch (err) {
          console.error('❌ WebSocket message error:', err);
          setConnectionError(`Message parsing error: ${err.message}`);
        }
      };

      socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        if (isMountedRef.current) {
          setIsConnected(false);
          setConnectionError('WebSocket connection error');
          attemptReconnect();
        }
      };

      socket.onclose = (event) => {
        console.log(`🔌 WebSocket closed: Code ${event.code}, Reason: ${event.reason}`);
        if (isMountedRef.current) {
          setIsConnected(false);
          if (event.code !== 1000) { // 1000 is normal closure
            setConnectionError(`WebSocket closed unexpectedly: ${event.code}`);
            attemptReconnect();
          }
        }
      };
    };

    const attemptReconnect = () => {
      if (!isMountedRef.current) return;
      
      // Clear any existing reconnect timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current += 1;
        setIsReconnecting(true);
        
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 16000);
        console.log(`🕑 Scheduling reconnect in ${delay/1000} seconds...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            // Close existing socket if it's still around
            if (socketRef.current) {
              try {
                socketRef.current.close();
              } catch (e) {
                console.error("Error closing existing socket:", e);
              }
            }
            connectWebSocket();
          }
        }, delay);
      } else {
        console.error(`❌ Maximum reconnection attempts (${maxReconnectAttempts}) reached.`);
        setIsReconnecting(false);
        setConnectionError("Maximum reconnection attempts reached. Please refresh the page.");
      }
    };
    
    fetchInitialData();
    connectWebSocket();

    return () => {
      isMountedRef.current = false;
      
      // Clear any pending reconnect timers
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Clean up socket
      if (socket) {
        try {
          if (socket.readyState === WebSocket.OPEN) {
            symbols.forEach(symbol => {
              socket.send(JSON.stringify({ type: 'unsubscribe', symbol }));
            });
          }
        } catch (e) {
          console.error("Unsubscribe failed:", e);
        }
        socket.close();
      }
    };
  }, [symbols.join(','), apiKey]); // join to avoid refiring unnecessarily

  return {
    prices,
    changes,
    previousClose,
    lastUpdate,
    isConnected,
    isReconnecting,
    connectionError
  };
}
