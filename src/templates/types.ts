export interface DashboardConfig {
  dashboardTitle: string;
  serviceName: string;
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

export interface GraphQLMetricsConfig {
  serviceName?: string;
  successRateThresholds?: {
    yellow: number;
    red: number;
  };
  latencyThresholds?: {
    red: number;
  };
  errorsThresholds?: {
    yellow: number;
    red: number;
  };
}
