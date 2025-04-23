import { RateLimiterMemory } from 'rate-limiter-flexible';

// Create rate limiter instance
const rateLimiter = new RateLimiterMemory({
  points: 100, // Number of points
  duration: 60, // Per 60 seconds
  blockDuration: 60 * 2, // Block for 2 minutes if consumed more than points
});

// Helper function to check if a request is allowed
export const checkRateLimit = async (userId: string) => {
  try {
    await rateLimiter.consume(userId);
    return true;
  } catch (error) {
    console.error('Rate limit error:', error);
    return false;
  }
};

// Helper function to get remaining points
export const getRemainingPoints = async (userId: string) => {
  try {
    const res = await rateLimiter.get(userId);
    return res?.remainingPoints || 0;
  } catch (error) {
    console.error('Error getting remaining points:', error);
    return 0;
  }
};

// Helper function to reset rate limit
export const resetRateLimit = async (userId: string) => {
  try {
    await rateLimiter.delete(userId);
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
}; 