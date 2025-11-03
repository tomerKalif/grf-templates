export interface DashboardConfig {
  dashboardTitle: string;
  serviceName: string;
  // Deprecated: prefer `uids.main`
  uid?: string;
  // UIDs are kept in a separate section to clearly control idempotency per dashboard
  uids?: {
    main?: string;
    apiDeepDive?: string;
  };
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
