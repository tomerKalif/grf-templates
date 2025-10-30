import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard';
import type { DashboardConfig, ApiMetricsConfig } from './types.js';
import type { NodeJSMetricsConfig } from './NodeJSMetrics/index.js';
import { requestRateTimeseries, errorRateStat, durationTimeseries, requestRateByMethodTimeseries, requestRateByStatusTimeseries } from './APIMetrics/panels.js';
import { cpuTimeseries, memoryTimeseries, activeHandlesTimeseries, activeRequestsTimeseries } from './NodeJSMetrics/Panels.js';
import * as text from '@grafana/grafana-foundation-sdk/text';
import { outgoingRequestRateByTarget, outgoingErrorRateByTarget, outgoingDurationP90ByTarget } from './Dependencies/index.js';

/**
 * Custom Dashboard Builder that provides a fluent API for building Grafana dashboards
 */
export class DashboardBuilder {
  private grafanaBuilder: dashboard.DashboardBuilder;
  
  // Keep initial service name for linking convenience
  private readonly initialServiceName?: string;

  private constructor(config: DashboardConfig) {
    this.initialServiceName = config.serviceName;
    this.grafanaBuilder = new dashboard.DashboardBuilder(`${config.dashboardTitle} - ${config.serviceName}`)
      .uid(config.uid || `${config.serviceName}-dashboard`)
      .tags(config.tags || ["generated", config.serviceName])
      .editable()
      .tooltip(dashboard.DashboardCursorSync.Crosshair)
      .refresh(config.refresh || "30s")
      .time(config.timeRange || { from: "now-30m", to: "now" })
      .timezone(config.timezone || "browser")
      .timepicker(
        new dashboard.TimePickerBuilder()
          .refreshIntervals(["5s", "10s", "30s", "1m", "5m", "15m", "30m", "1h", "2h", "1d"])
      );
  }

  /**
   * Creates a new DashboardBuilder instance
   */
  static create(config: DashboardConfig): DashboardBuilder {
    return new DashboardBuilder(config);
  }

  /**
   * Adds API metrics row to the dashboard
   */
  withApiMetrics(config: ApiMetricsConfig): this {
    this.grafanaBuilder = this.grafanaBuilder
      .withRow(new dashboard.RowBuilder("API metrics"))
      .withPanel(requestRateTimeseries(config.serviceName).span(24).height(8))
      .withPanel(errorRateStat(config.serviceName, config.errorRateThresholds).span(12).height(8))
      .withPanel(durationTimeseries(config.serviceName, config.durationThresholds).span(12).height(8));
    return this;
  }

  /**
   * Adds Node.js metrics row to the dashboard
   */
  withNodeJSMetrics(config: NodeJSMetricsConfig): this {
    this.grafanaBuilder = this.grafanaBuilder
      .withRow(new dashboard.RowBuilder("Node.js Metrics"))
      .withPanel(cpuTimeseries(config.serviceName, config.cpuThresholds).span(12).height(8))
      .withPanel(memoryTimeseries(config.serviceName, config.memoryThresholds).span(12).height(8))
      .withPanel(activeHandlesTimeseries(config.serviceName, config.handlesThresholds).span(12).height(8))
      .withPanel(activeRequestsTimeseries(config.serviceName, config.requestsThresholds).span(12).height(8));
    return this;
  }

  /**
   * Adds API Traffic Deep Dive row (by route, method, status)
   */
  withApiTrafficDeepDive(config: ApiMetricsConfig): this {
    this.grafanaBuilder = this.grafanaBuilder
      .withRow(new dashboard.RowBuilder("API Traffic Deep Dive"))
      .withPanel(requestRateTimeseries(config.serviceName).span(8).height(8))
      .withPanel(requestRateByMethodTimeseries(config.serviceName).span(8).height(8))
      .withPanel(requestRateByStatusTimeseries(config.serviceName).span(8).height(8));
    return this;
  }

  /**
   * Adds Dependencies (upstream/downstream) deep dive row
   */
  withDependenciesDeepDive(config: ApiMetricsConfig): this {
    this.grafanaBuilder = this.grafanaBuilder
      .withRow(new dashboard.RowBuilder('Dependencies Deep Dive'))
      .withPanel(outgoingRequestRateByTarget(config.serviceName).span(8).height(8))
      .withPanel(outgoingDurationP90ByTarget(config.serviceName).span(8).height(8))
      .withPanel(outgoingErrorRateByTarget(config.serviceName).span(8).height(8));
    return this;
  }

  /**
   * Adds API Deep Dive: Traffic + Dependencies rows together
   */
  withApiDeepDive(config: ApiMetricsConfig): this {
    this.withApiTrafficDeepDive(config);
    this.withDependenciesDeepDive(config);
    return this;
  }

  /**
   * Adds a link panel to a separate API Traffic Deep Dive dashboard
   */
  withLinkToApiTrafficDeepDive(deepDiveUid: string, title: string = 'Open API Traffic Deep Dive'): this {
    const service = this.initialServiceName ?? '';
    const markdown = `[${title}](\/d\/${deepDiveUid}?var-pod_container_name=${service})`;
    const linkPanel = new text.PanelBuilder()
      .title('Deep Dives')
      .mode(text.TextMode.Markdown)
      .content(markdown);

    this.grafanaBuilder = this.grafanaBuilder
      .withRow(new dashboard.RowBuilder('Deep Dives'))
      .withPanel(linkPanel.span(24).height(4));
    return this;
  }

  /**
   * Adds a custom row to the dashboard
   */
  withRow(row: dashboard.RowBuilder): this {
    this.grafanaBuilder = this.grafanaBuilder.withRow(row);
    return this;
  }

  /**
   * Adds a custom panel to the dashboard
   */
  withPanel(panel: dashboard.PanelBuilder): this {
    this.grafanaBuilder = this.grafanaBuilder.withPanel(panel);
    return this;
  }

  /**
   * Sets the dashboard UID
   */
  uid(uid: string): this {
    this.grafanaBuilder = this.grafanaBuilder.uid(uid);
    return this;
  }

  /**
   * Sets the dashboard tags
   */
  tags(tags: string[]): this {
    this.grafanaBuilder = this.grafanaBuilder.tags(tags);
    return this;
  }

  /**
   * Sets the refresh interval
   */
  refresh(interval: string): this {
    this.grafanaBuilder = this.grafanaBuilder.refresh(interval);
    return this;
  }

  /**
   * Sets the time range
   */
  time(timeRange: { from: string; to: string }): this {
    this.grafanaBuilder = this.grafanaBuilder.time(timeRange);
    return this;
  }

  /**
   * Builds and returns the final dashboard
   */
  build(): dashboard.Dashboard {
    return this.grafanaBuilder.build();
  }

  /**
   * Gets the underlying Grafana dashboard builder (for advanced usage)
   */
  getGrafanaBuilder(): dashboard.DashboardBuilder {
    return this.grafanaBuilder;
  }
}

/**
 * Factory function to create a new DashboardBuilder
 * @deprecated Use DashboardBuilder.create() instead
 */
export const createDashboard = (config: DashboardConfig): DashboardBuilder => {
  return DashboardBuilder.create(config);
};

/**
 * Create a standalone API Traffic Deep Dive dashboard
 */
export const createApiTrafficDeepDiveDashboard = (config: DashboardConfig): dashboard.Dashboard => {
  const builder = DashboardBuilder.create({
    ...config,
    dashboardTitle: config.dashboardTitle || 'API Traffic Deep Dive',
    uid: config.uid || `${config.serviceName}-api-traffic-deep-dive`,
    tags: config.tags || ['generated', config.serviceName, 'deep-dive', 'traffic']
  });

  return builder
    .withApiTrafficDeepDive({ serviceName: config.serviceName })
    .build();
};

/**
 * Create a standalone Dependencies Deep Dive dashboard
 */
export const createDependenciesDeepDiveDashboard = (config: DashboardConfig): dashboard.Dashboard => {
  const builder = DashboardBuilder.create({
    ...config,
    dashboardTitle: config.dashboardTitle || 'Dependencies Deep Dive',
    uid: config.uid || `${config.serviceName}-dependencies-deep-dive`,
    tags: config.tags || ['generated', config.serviceName, 'deep-dive', 'dependencies']
  });

  return builder
    .withDependenciesDeepDive({ serviceName: config.serviceName })
    .build();
};

/**
 * Create a standalone API Deep Dive (Traffic + Dependencies) dashboard
 */
export const createApiDeepDiveDashboard = (config: DashboardConfig): dashboard.Dashboard => {
  const builder = DashboardBuilder.create({
    ...config,
    dashboardTitle: config.dashboardTitle || 'API Deep Dive',
    uid: config.uid || `${config.serviceName}-api-deep-dive`,
    tags: config.tags || ['generated', config.serviceName, 'deep-dive', 'api']
  });

  return builder
    .withApiDeepDive({ serviceName: config.serviceName })
    .build();
};
