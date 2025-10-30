import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard';
import type { DashboardConfig, ApiMetricsConfig } from './types.js';
import type { NodeJSMetricsConfig } from './NodeJSMetrics/index.js';
import { requestRateTimeseries, errorRateStat, durationTimeseries, requestRateByMethodTimeseries, requestRateByStatusTimeseries, cpuVsRequestsTimeseries } from './APIMetrics/panels.js';
import { cpuTimeseries, memoryTimeseries, activeHandlesTimeseries, activeRequestsTimeseries, eventLoopLagTimeseries, cpuPerInstanceTable } from './NodeJSMetrics/Panels.js';
import * as text from '@grafana/grafana-foundation-sdk/text';
import * as dashlist from '@grafana/grafana-foundation-sdk/dashboardlist';
import { outgoingRequestRateByTarget, outgoingErrorRateByTarget, outgoingDurationP90ByTarget } from './Dependencies/index.js';

/**
 * Custom Dashboard Builder that provides a fluent API for building Grafana dashboards
 */
export class DashboardBuilder {
  private grafanaBuilder: dashboard.DashboardBuilder;
  
  // Keep initial service name for linking convenience
  private readonly initialServiceName?: string;
  private generatedApiDeepDive?: dashboard.Dashboard;
  private generatedDependenciesDeepDive?: dashboard.Dashboard;
  private deepDiveListPanel?: dashlist.PanelBuilder;
  private deepDivesAppended: boolean = false;

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

    // Auto-create deep dive dashboards and list them
    const apiDeepDiveUid = `${config.serviceName}-api-deep-dive`;
    this.generatedApiDeepDive = createApiDeepDiveDashboard({
      dashboardTitle: 'API Deep Dive',
      serviceName: config.serviceName,
      uid: apiDeepDiveUid,
      tags: ['generated', config.serviceName, 'deep-dive', 'api']
    });
    const depsDeepDiveUid = `${config.serviceName}-dependencies-deep-dive`;
    this.generatedDependenciesDeepDive = createDependenciesDeepDiveDashboard({
      dashboardTitle: 'Dependencies Deep Dive',
      serviceName: config.serviceName,
      uid: depsDeepDiveUid,
      tags: ['generated', config.serviceName, 'deep-dive', 'dependencies']
    });
    this.withDeepDiveDashboardList([
      { uid: apiDeepDiveUid, title: 'API Deep Dive' },
      { uid: depsDeepDiveUid, title: 'Dependencies Deep Dive' }
    ]);
    return this;
  }

  /**
   * Adds Node.js metrics row to the dashboard
   */
  withNodeJSMetrics(config: NodeJSMetricsConfig): this {
    this.grafanaBuilder = this.grafanaBuilder
      .withRow(new dashboard.RowBuilder("Node.js Metrics"))
      .withPanel(cpuPerInstanceTable(config.serviceName).span(12).height(8))
      .withPanel(memoryTimeseries(config.serviceName, config.memoryThresholds).span(12).height(8))
      .withPanel(activeHandlesTimeseries(config.serviceName, config.handlesThresholds).span(12).height(8))
      .withPanel(activeRequestsTimeseries(config.serviceName, config.requestsThresholds).span(12).height(8))
      .withPanel(eventLoopLagTimeseries(config.serviceName, { red: 0.2 }).span(24).height(8));
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
    // Saturation row: CPU vs Requests overlay
    this.grafanaBuilder = this.grafanaBuilder
      .withRow(new dashboard.RowBuilder('Saturation'))
      .withPanel(cpuVsRequestsTimeseries(config.serviceName).span(24).height(8));
    return this;
  }

  /**
   * Adds a link panel to a separate API Traffic Deep Dive dashboard
   */
  withDeepDiveDashboardList(_items: Array<{ uid: string; title: string }>): this {
    const service = this.initialServiceName ?? '';
    // Native Dashboard list panel per docs: https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/dashboard-list/
    // Configure to show ALL dashboards associated with the service (tagged with service name)
    this.deepDiveListPanel = new dashlist.PanelBuilder()
      .title('Deep Dives')
      .description('All dashboards tagged with this service; links keep time range and variables')
      .keepTime(true)
      .includeVars(true)
      .showStarred(false)
      .showRecentlyViewed(false)
      .showSearch(true)
      .showHeadings(false)
      .showFolderNames(true)
      .maxItems(50)
      .query('')
      .tags([service]);
    return this;
  }

  private appendDeepDivesRowIfAny(): void {
    if (this.deepDivesAppended) return;
    if (this.deepDiveListPanel) {
      this.grafanaBuilder = this.grafanaBuilder
        .withRow(new dashboard.RowBuilder('Deep Dives'))
        .withPanel(this.deepDiveListPanel.span(24).height(6));
      this.deepDivesAppended = true;
    }
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
    this.appendDeepDivesRowIfAny();
    return this.grafanaBuilder.build(); 
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
}
