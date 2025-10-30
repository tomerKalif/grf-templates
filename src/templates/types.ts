export interface DashboardConfig {
  dashboardTitle: string;
  serviceName: string;
  uid?: string;
  tags?: string[];
  refresh?: string;
  timeRange?: {
    from: string;
    to: string;
  };
  timezone?: string;
}

export interface ApiMetricsConfig {
  serviceName?: string;
  errorRateThresholds?: {
    yellow: number;
    red: number;
  };
  durationThresholds?: {
    red: number;
  };
}
