/**
 * Market Hours Utility Functions
 * Based on Indian Equity Market Timings (NSE/BSE)
 * 
 * Pre-market session: 9:00 AM - 9:15 AM
 *   - 9:00 AM - 9:07 AM: Order placement/modification allowed
 *   - 9:07 AM - 9:08 AM: Order matching period
 *   - 9:08 AM - 9:15 AM: Buffer period (no orders)
 * Normal trading session: 9:15 AM - 3:30 PM
 * Post-market session: 3:30 PM - 4:00 PM
 */

/**
 * Check if current time is within normal trading hours (9:15 AM - 3:30 PM IST)
 */
export const isMarketOpen = () => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const hour = istTime.getHours();
  const minute = istTime.getMinutes();
  const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Check if weekday (Monday-Friday)
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Market hours: 9:15 AM - 3:30 PM
  const currentMinutes = hour * 60 + minute;
  const marketOpenMinutes = 9 * 60 + 15; // 9:15 AM
  const marketCloseMinutes = 15 * 60 + 30; // 3:30 PM
  
  return currentMinutes >= marketOpenMinutes && currentMinutes < marketCloseMinutes;
};

/**
 * Check if current time is within pre-market order placement window (9:00-9:07 AM IST)
 */
export const isPreMarketOrderWindow = () => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const hour = istTime.getHours();
  const minute = istTime.getMinutes();
  const day = istTime.getDay();
  
  // Check if weekday
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Pre-market order window: 9:00 AM - 9:07 AM
  const currentMinutes = hour * 60 + minute;
  const windowStartMinutes = 9 * 60 + 0; // 9:00 AM
  const windowEndMinutes = 9 * 60 + 7; // 9:07 AM
  
  return currentMinutes >= windowStartMinutes && currentMinutes < windowEndMinutes;
};

/**
 * Check if current time is within pre-market matching period (9:07-9:08 AM IST)
 */
export const isPreMarketMatchingPeriod = () => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const hour = istTime.getHours();
  const minute = istTime.getMinutes();
  const day = istTime.getDay();
  
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Matching period: 9:07 AM - 9:08 AM
  const currentMinutes = hour * 60 + minute;
  return currentMinutes >= (9 * 60 + 7) && currentMinutes < (9 * 60 + 8);
};

/**
 * Check if current time is within pre-market buffer period (9:08-9:15 AM IST)
 */
export const isPreMarketBufferPeriod = () => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const hour = istTime.getHours();
  const minute = istTime.getMinutes();
  const day = istTime.getDay();
  
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Buffer period: 9:08 AM - 9:15 AM
  const currentMinutes = hour * 60 + minute;
  return currentMinutes >= (9 * 60 + 8) && currentMinutes < (9 * 60 + 15);
};

/**
 * Check if current time is within post-market session (3:30-4:00 PM IST)
 */
export const isPostMarketSession = () => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const hour = istTime.getHours();
  const minute = istTime.getMinutes();
  const day = istTime.getDay();
  
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Post-market: 3:30 PM - 4:00 PM
  const currentMinutes = hour * 60 + minute;
  const postMarketStart = 15 * 60 + 30; // 3:30 PM
  const postMarketEnd = 16 * 60 + 0; // 4:00 PM
  
  return currentMinutes >= postMarketStart && currentMinutes < postMarketEnd;
};

/**
 * Get the next market open time
 */
export const getNextMarketOpen = () => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const nextOpen = new Date(istTime);
  const currentDay = istTime.getDay();
  const currentHour = istTime.getHours();
  const currentMinute = istTime.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  // If it's Saturday (6), next open is Monday
  if (currentDay === 6) {
    nextOpen.setDate(nextOpen.getDate() + 2);
    nextOpen.setHours(9, 15, 0, 0);
  }
  // If it's Sunday (0), next open is Monday
  else if (currentDay === 0) {
    nextOpen.setDate(nextOpen.getDate() + 1);
    nextOpen.setHours(9, 15, 0, 0);
  }
  // If it's a weekday after market close (after 3:30 PM), next open is tomorrow
  else if (currentTimeInMinutes >= (15 * 60 + 30)) {
    // If it's Friday, next open is Monday
    if (currentDay === 5) {
      nextOpen.setDate(nextOpen.getDate() + 3);
    } else {
      nextOpen.setDate(nextOpen.getDate() + 1);
    }
    nextOpen.setHours(9, 15, 0, 0);
  }
  // Otherwise, next open is today at 9:15 AM
  else {
    nextOpen.setHours(9, 15, 0, 0);
  }
  
  return nextOpen;
};

/**
 * Get market status as human-readable string
 */
export const getMarketStatus = () => {
  if (isMarketOpen()) {
    return { status: 'open', message: 'Market is open for trading' };
  }
  
  if (isPreMarketOrderWindow()) {
    return { status: 'pre_market_orders', message: 'Pre-market: Order placement window (9:00-9:07 AM)' };
  }
  
  if (isPreMarketMatchingPeriod()) {
    return { status: 'pre_market_matching', message: 'Pre-market: Order matching in progress (9:07-9:08 AM)' };
  }
  
  if (isPreMarketBufferPeriod()) {
    return { status: 'pre_market_buffer', message: 'Pre-market: Buffer period (9:08-9:15 AM)' };
  }
  
  if (isPostMarketSession()) {
    return { status: 'post_market', message: 'Post-market session (3:30-4:00 PM)' };
  }
  
  const nextOpen = getNextMarketOpen();
  return { 
    status: 'closed', 
    message: `Market is closed. Opens at ${nextOpen.toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    })}` 
  };
};