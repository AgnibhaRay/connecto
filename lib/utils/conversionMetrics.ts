/**
 * Simple metrics tracking for HEIC conversions
 * This module helps monitor the performance and usage of the HEIC conversion feature
 */

// Track conversion metrics
interface ConversionMetric {
  timestamp: Date;
  fileSize: number; // in bytes
  conversionTime: number; // in milliseconds
  success: boolean;
  error?: string;
  browser?: string;
}

// In-memory storage for metrics (will be lost on server restart)
const metrics: ConversionMetric[] = [];

// Maximum number of metrics to store in memory
const MAX_METRICS = 100;

/**
 * Record a HEIC conversion metric
 * @param metric The metric to record
 */
export const recordConversion = (metric: ConversionMetric) => {
  // Add browser info if available
  if (typeof window !== 'undefined' && window.navigator) {
    metric.browser = window.navigator.userAgent;
  }
  
  // Add to metrics array
  metrics.push(metric);
  
  // Trim array if needed
  if (metrics.length > MAX_METRICS) {
    metrics.shift(); // Remove oldest entry
  }
  
  // Log the metric
  console.log('[Conversion Metric]', JSON.stringify(metric));
  
  // We could send this to an analytics service in production
};

/**
 * Get conversion statistics
 * @returns Summary statistics about conversions
 */
export const getConversionStats = () => {
  if (metrics.length === 0) {
    return {
      totalConversions: 0,
      successRate: 0,
      averageTime: 0,
      averageFileSize: 0
    };
  }
  
  const successful = metrics.filter(m => m.success);
  
  return {
    totalConversions: metrics.length,
    successRate: successful.length / metrics.length,
    averageTime: successful.length > 0 
      ? successful.reduce((sum, m) => sum + m.conversionTime, 0) / successful.length 
      : 0,
    averageFileSize: metrics.reduce((sum, m) => sum + m.fileSize, 0) / metrics.length,
    recentConversions: metrics.slice(-10) // Last 10 conversions
  };
};
