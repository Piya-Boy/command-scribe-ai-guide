import { RateLimiter } from 'limiter';

// Create a rate limiter that allows 100 requests per minute
export const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'minute',
  fireImmediately: true
});

// Helper function to check if a request is allowed
export const checkRateLimit = async (userId: string) => {
  try {
    const remainingRequests = await limiter.removeTokens(1);
    return remainingRequests >= 0;
  } catch (error) {
    console.error('Rate limit error:', error);
    return false;
  }
}; 