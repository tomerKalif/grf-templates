// Export panel creation functions
export { cpuTimeseries, memoryTimeseries, activeHandlesTimeseries, activeRequestsTimeseries } from './Panels.js';

// Export types
export interface NodeJSMetricsConfig {
  serviceName?: string;
  cpuThresholds?: {
    yellow: number;
    red: number;
  };
  memoryThresholds?: {
    yellow: number; // in bytes
    red: number;    // in bytes
  };
  handlesThresholds?: {
    yellow: number;
    red: number;
  };
  requestsThresholds?: {
    yellow: number;
    red: number;
  };
}
