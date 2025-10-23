class LiveStockAPI {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes cache to reduce API calls
    this.apiKey = "ac64de7fe95c4f90ba42d449a51c2c7d";
    this.baseUrl = "https://api.twelvedata.com";
    this.subscribers = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.requestCount = 0;
    this.requestResetTime = Date.now() + 60000; // Reset every minute
    this.maxRequestsPerMinute = 6; // Conservative limit (leave 2 buffer)
  }

  // Rate limiting management
  canMakeRequest() {
    const now = Date.now();
    
    // Reset counter every minute
    if (now >= this.requestResetTime) {
      this.requestCount = 0;
      this.requestResetTime = now + 60000;
    }
    
    return this.requestCount < this.maxRequestsPerMinute;
  }

  incrementRequestCount() {
    this.requestCount++;
  }

  // Get market status
  getMarketStatus() {
    const now = new Date();
    const day = now.getUTCDay();
    const hours = now.getUTCHours();
    
    const isWeekday = day >= 1 && day <= 5;
    const isMarketTime = hours >= 4 && hours < 10;
    
    return { 
      isOpen: isWeekday && isMarketTime,
      status: isWeekday && isMarketTime ? "Market Open" : "Market Closed"
    };
  }

  // Get trending stocks
  getTrendingStocks() {
    return ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL'];
  }

  // Generate fallback data when API fails
  generateFallbackData(symbol) {
    const basePrices = {
      'RELIANCE': 2456.75,
      'TCS': 3842.50,
      'HDFCBANK': 1654.30,
      'INFY': 1567.25,
      'ICICIBANK': 956.40,
      'BHARTIARTL': 1234.80,
      'SBIN': 542.30,
      'ITC': 458.90
    };

    const basePrice = basePrices[symbol] || 1000;
    const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
    const currentPrice = basePrice * (1 + changePercent / 100);
    const changeAmount = currentPrice - basePrice;

    return {
      symbol,
      company_name: `${symbol} Limited`,
      current_price: Math.round(currentPrice * 100) / 100,
      change_percent: Math.round(changePercent * 100) / 100,
      change_amount: Math.round(changeAmount * 100) / 100,
      day_high: Math.round(currentPrice * 1.02 * 100) / 100,
      day_low: Math.round(currentPrice * 0.98 * 100) / 100,
      previous_close: basePrice,
      volume: Math.floor(Math.random() * 1000000) + 500000,
      exchange: 'NSE',
      last_updated: new Date().toISOString(),
      isFallback: true
    };
  }

  // Process request queue with rate limiting
  async processRequestQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0 && this.canMakeRequest()) {
      const { symbol, resolve, reject } = this.requestQueue.shift();
      
      try {
        const data = await this.fetchStockFromAPI(symbol);
        resolve(data);
      } catch (error) {
        // Use fallback data instead of rejecting
        const fallbackData = this.generateFallbackData(symbol);
        this.cache.set(symbol, { ...fallbackData, timestamp: Date.now() });
        resolve(fallbackData);
      }
      
      // Wait 10 seconds between API calls to be extra safe
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    this.isProcessingQueue = false;
    
    // Process remaining requests with fallback data
    while (this.requestQueue.length > 0) {
      const { symbol, resolve } = this.requestQueue.shift();
      const fallbackData = this.generateFallbackData(symbol);
      this.cache.set(symbol, { ...fallbackData, timestamp: Date.now() });
      resolve(fallbackData);
    }
  }

  // Actual API fetch method
  async fetchStockFromAPI(symbol) {
    this.incrementRequestCount();
    
    const response = await fetch(
      `${this.baseUrl}/quote?symbol=${symbol}&exchange=NSE&apikey=${this.apiKey}`
    );
    
    const data = await response.json();

    if (data.status === "error" || !data.symbol) {
      throw new Error(data.message || `No data for ${symbol}`);
    }

    return this.formatApiResponse(data);
  }

  // Format API response
  formatApiResponse(data) {
    return {
      symbol: data.symbol,
      company_name: data.name,
      current_price: parseFloat(data.close) || 0,
      change_percent: parseFloat(data.percent_change) || 0,
      change_amount: parseFloat(data.change) || 0,
      day_high: parseFloat(data.high) || 0,
      day_low: parseFloat(data.low) || 0,
      previous_close: parseFloat(data.previous_close) || 0,
      volume: parseInt(data.volume, 10) || 0,
      exchange: data.exchange,
      last_updated: data.datetime,
      isFallback: false
    };
  }

  // Main method to get stock price
  async getStockPrice(symbol) {
    if (!symbol) return null;

    // Check cache first (5 minute cache)
    const cached = this.cache.get(symbol);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached;
    }

    // If rate limit exceeded, return cached data or fallback
    if (!this.canMakeRequest()) {
      if (cached) {
        return cached; // Return stale cache
      } else {
        const fallbackData = this.generateFallbackData(symbol);
        this.cache.set(symbol, { ...fallbackData, timestamp: Date.now() });
        return fallbackData;
      }
    }

    // Add to request queue
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ symbol, resolve, reject });
      this.processRequestQueue();
    });
  }

  // Fetch multiple stocks with proper queuing
  async getMultipleStocks(symbols) {
    const promises = symbols.map(symbol => this.getStockPrice(symbol));
    const results = await Promise.all(promises);
    return results.filter(r => r !== null);
  }

  // Subscribe to updates (much less frequent)
  subscribe(symbol, callback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
    }
    this.subscribers.get(symbol).push(callback);

    // Start periodic updates (every 2 minutes to respect limits)
    const updateInterval = setInterval(async () => {
      const data = await this.getStockPrice(symbol);
      if (data && this.subscribers.has(symbol)) {
        this.subscribers.get(symbol).forEach(cb => cb(data));
      }
    }, 120000); // 2 minutes

    // Return unsubscribe function
    return () => {
      clearInterval(updateInterval);
      const symbolSubscribers = this.subscribers.get(symbol);
      if (symbolSubscribers) {
        const index = symbolSubscribers.indexOf(callback);
        if (index > -1) {
          symbolSubscribers.splice(index, 1);
        }
      }
    };
  }
}

// Export singleton instance
export const stockAPI = new LiveStockAPI();