/**
 * Simple Rate Limiting for AI Operations
 * Prevents abuse of expensive AI feedback generation
 */

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class SimpleRateLimit {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private maxRequests: number;
  private window: number; // in milliseconds

  constructor(limit: number = 10, windowMs: number = 60000) { // 10 requests per minute
    this.maxRequests = limit;
    this.window = windowMs;
  }

  public async limit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const userLimit = this.requests.get(identifier);
    
    // Clean up expired entries
    if (userLimit && now > userLimit.resetTime) {
      this.requests.delete(identifier);
    }
    
    const currentData = this.requests.get(identifier) || {
      count: 0,
      resetTime: now + this.window
    };
    
    if (currentData.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: Math.ceil(currentData.resetTime / 1000)
      };
    }
    
    currentData.count++;
    this.requests.set(identifier, currentData);
    
    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - currentData.count,
      reset: Math.ceil(currentData.resetTime / 1000)
    };
  }

  public reset(identifier?: string) {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

// Export singleton instances for different types of operations
export const ratelimit = new SimpleRateLimit(5, 300000); // 5 requests per 5 minutes for AI operations
export const instructorApiRateLimit = new SimpleRateLimit(100, 60000); // 100 requests per minute for instructor API
export const hierarchicalApiRateLimit = new SimpleRateLimit(50, 60000); // 50 requests per minute for hierarchical data
export const exportApiRateLimit = new SimpleRateLimit(10, 300000); // 10 exports per 5 minutes