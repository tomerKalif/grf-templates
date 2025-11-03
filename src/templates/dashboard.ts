import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard';
import type { DashboardConfig, ApiMetricsConfig, GraphQLMetricsConfig } from './types.js';
import type { NodeJSMetricsConfig } from './NodeJSMetrics/index.js';
import { requestRateTimeseries, errorRateStat, durationTimeseries, requestRateByMethodTimeseries, requestRateByStatusTimeseries, cpuVsRequestsTimeseries } from './APIMetrics/panels.js';
import { cpuTimeseries, memoryTimeseries, activeHandlesTimeseries, activeRequestsTimeseries, eventLoopLagTimeseries, cpuPerInstanceTable } from './NodeJSMetrics/Panels.js';
import { successRateStat, queryLatencyStat, queryErrorsStat } from './GraphQL/Panels.js';
import * as text from '@grafana/grafana-foundation-sdk/text';
import * as dashlist from '@grafana/grafana-foundation-sdk/dashboardlist';
import { outgoingRequestRateByTarget, outgoingErrorRateByTarget, outgoingDurationP90ByTarget } from './Dependencies/index.js';
import { UidFactory } from '../utils/index.js';
import { createGraphQLDashboard as createGraphQLDashboardPrebuilt } from '../prebuiltDashboards/graphql.js';

/**
 * Custom Dashboard Builder that provides a fluent API for building Grafana dashboards
 */
export class DashboardBuilder {
  // Core builder and identity
  private grafanaBuilder: dashboard.DashboardBuilder;
  private readonly initialServiceName?: string; // Used for defaults and linking

  // Deep-dive generation controls
  private shouldGenerateApiDeepDive: boolean = false;
  private shouldGenerateGraphQLDeepDive: boolean = false;
  private apiDeepDiveUid?: string;
  private graphqlDeepDiveUid?: string;

  // Generated deep-dive dashboards (computed once)
  private generatedApiDeepDive?: dashboard.Dashboard;
  private generatedGraphQLDeepDive?: dashboard.Dashboard;

  // UI state for dashboard list panel
  private deepDiveListPanel?: dashlist.PanelBuilder;
  private deepDivesAppended: boolean = false;

  /**
   * @deprecated Use UidFactory.create() instead
   * Ensures UID is within Grafana's 40 character limit
   */
  static truncateUid(uid: string, maxLength: number = 40): string {
    return UidFactory.create(uid);
  }

  private constructor(config: DashboardConfig) {
    this.initialServiceName = config.serviceName;
    // Infer UID from serviceName using UidFactory
    const mainUid = config.uids?.main || config.uid || UidFactory.main(config.serviceName);
    this.grafanaBuilder = new dashboard.DashboardBuilder(`${config.dashboardTitle} - ${config.serviceName}`)
      .uid(mainUid)
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
    const svc = config.serviceName ?? (this.initialServiceName as string);
    this.grafanaBuilder = this.grafanaBuilder
      .withRow(new dashboard.RowBuilder("API metrics"))
      .withPanel(requestRateTimeseries(svc).span(24).height(8))
      .withPanel(errorRateStat(svc, config.errorRateThresholds).span(12).height(8))
      .withPanel(durationTimeseries(svc, config.durationThresholds).span(12).height(8));

    // Auto-create deep dive dashboard and list it
    const apiDeepDiveUid = UidFactory.apiDeepDive(svc);
    // Set generation flag only once to avoid double usage
    if (!this.shouldGenerateApiDeepDive && !this.generatedApiDeepDive) {
      this.shouldGenerateApiDeepDive = true;
      this.apiDeepDiveUid = apiDeepDiveUid;
    }
    this.withDeepDiveDashboardList([
      { uid: apiDeepDiveUid, title: 'API Deep Dive' }
    ]);
    return this;
  }

  /**
   * Adds Node.js metrics row to the dashboard
   */
  withNodeJSMetrics(config: NodeJSMetricsConfig): this {
    const svc = config.serviceName ?? (this.initialServiceName as string);
    this.grafanaBuilder = this.grafanaBuilder
      .withRow(new dashboard.RowBuilder("Node.js Metrics"))
      .withPanel(cpuPerInstanceTable(svc).span(12).height(8))
      .withPanel(memoryTimeseries(svc, config.memoryThresholds).span(12).height(8))
      .withPanel(activeHandlesTimeseries(svc, config.handlesThresholds).span(12).height(8))
      .withPanel(activeRequestsTimeseries(svc, config.requestsThresholds).span(12).height(8))
      .withPanel(eventLoopLagTimeseries(svc, { red: 0.2 }).span(24).height(8));
    return this;
  }

  /**
   * Adds GraphQL metrics row to the dashboard
   */
  withGraphQLMetrics(config: GraphQLMetricsConfig): this {
    const svc = config.serviceName ?? (this.initialServiceName as string);
    this.grafanaBuilder = this.grafanaBuilder
      .withRow(new dashboard.RowBuilder("GraphQL Metrics"))
      .withPanel(successRateStat(svc, config.successRateThresholds).span(8).height(8))
      .withPanel(queryLatencyStat(svc, config.latencyThresholds).span(8).height(8))
      .withPanel(queryErrorsStat(svc, config.errorsThresholds).span(8).height(8));
    
    // Auto-create GraphQL deep dive dashboard and add it to the list
    const graphqlDeepDiveUid = UidFactory.graphqlDeepDive(svc);
    if (!this.shouldGenerateGraphQLDeepDive && !this.generatedGraphQLDeepDive) {
      this.shouldGenerateGraphQLDeepDive = true;
      this.graphqlDeepDiveUid = graphqlDeepDiveUid;
    }
    this.withDeepDiveDashboardList([
      { uid: graphqlDeepDiveUid, title: 'GraphQL Deep Dive' }
    ]);
    return this;
  }

  /**
   * Adds API Traffic Deep Dive row (by route, method, status)
   */
  withApiTrafficDeepDive(config: ApiMetricsConfig): this {
    const svc = config.serviceName ?? (this.initialServiceName as string);
    this.grafanaBuilder = this.grafanaBuilder
      .withRow(new dashboard.RowBuilder("API Traffic Deep Dive"))
      .withPanel(requestRateTimeseries(svc).span(8).height(8))
      .withPanel(requestRateByMethodTimeseries(svc).span(8).height(8))
      .withPanel(requestRateByStatusTimeseries(svc).span(8).height(8));
    return this;
  }

  /**
   * Adds Dependencies (upstream/downstream) deep dive row
   */
  withDependenciesDeepDive(config: ApiMetricsConfig): this {
    const svc = config.serviceName ?? (this.initialServiceName as string);
    this.grafanaBuilder = this.grafanaBuilder
      .withRow(new dashboard.RowBuilder('Dependencies Deep Dive'))
      .withPanel(outgoingRequestRateByTarget(svc).span(8).height(8))
      .withPanel(outgoingDurationP90ByTarget(svc).span(8).height(8))
      .withPanel(outgoingErrorRateByTarget(svc).span(8).height(8));
    return this;
  }

  /**
   * Adds API Deep Dive: Traffic + Dependencies rows together
   */
  withApiDeepDive(config: ApiMetricsConfig): this {
    this.withApiTrafficDeepDive(config);
    this.withDependenciesDeepDive(config);
    // Saturation row: CPU vs Requests overlay
    const svc = config.serviceName ?? (this.initialServiceName as string);
    this.grafanaBuilder = this.grafanaBuilder
      .withRow(new dashboard.RowBuilder('Saturation'))
      .withPanel(cpuVsRequestsTimeseries(svc).span(24).height(8));
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
   * Builds and returns all dashboards including main and deep dives
   */
  build(): { main: dashboard.Dashboard; apiDeepDive?: dashboard.Dashboard; graphqlDeepDive?: dashboard.Dashboard } {
    this.appendDeepDivesRowIfAny();
    // Inline generation of deep-dive dashboards if requested by withApiMetrics
    const svc = this.initialServiceName ?? '';
    if (svc) {
      if (this.shouldGenerateApiDeepDive && !this.generatedApiDeepDive) {
        const apiDeepDiveBuilder = DashboardBuilder.create({
          dashboardTitle: 'API Deep Dive',
          serviceName: svc,
          uids: { main: this.apiDeepDiveUid ?? UidFactory.apiDeepDive(svc) },
          tags: ['generated', svc, 'deep-dive', 'api']
        });
        this.generatedApiDeepDive = apiDeepDiveBuilder.withApiDeepDive({ serviceName: svc }).build().main;
        this.shouldGenerateApiDeepDive = false;
      }
      if (this.shouldGenerateGraphQLDeepDive && !this.generatedGraphQLDeepDive) {
        this.generatedGraphQLDeepDive = createGraphQLDashboard({
          dashboardTitle: 'GraphQL',
          serviceName: svc,
          uids: { main: this.graphqlDeepDiveUid ?? UidFactory.graphqlDeepDive(svc) },
          tags: ['generated', svc, 'deep-dive', 'graphql']
        });
        this.shouldGenerateGraphQLDeepDive = false;
      }
    }
    const main = this.grafanaBuilder.build();
    const result: { main: dashboard.Dashboard; apiDeepDive?: dashboard.Dashboard; graphqlDeepDive?: dashboard.Dashboard } = { main };
    if (this.generatedApiDeepDive) {
      result.apiDeepDive = this.generatedApiDeepDive;
    }
    if (this.generatedGraphQLDeepDive) {
      result.graphqlDeepDive = this.generatedGraphQLDeepDive;
    }
    return result;
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
  const baseUid = config.uids?.main || config.uid || `${config.serviceName}-api-traffic-deep-dive`;
  const builder = DashboardBuilder.create({
    ...config,
    dashboardTitle: config.dashboardTitle || 'API Traffic Deep Dive',
    uids: {
      ...config.uids,
      main: UidFactory.create(baseUid)
    },
    tags: config.tags || ['generated', config.serviceName, 'deep-dive', 'traffic']
  });

  return builder
    .withApiTrafficDeepDive({ serviceName: config.serviceName })
    .build().main;
};

/**
 * Create a standalone Dependencies Deep Dive dashboard
 */
// Removed: createDependenciesDeepDiveDashboard (migrated into DashboardBuilder private method)

/**
 * Create a standalone API Deep Dive (Traffic + Dependencies) dashboard
 */
// Removed: createApiDeepDiveDashboard (migrated into DashboardBuilder private method)

/**
 * Create a GraphQL dashboard from prebuilt template
 */
export const createGraphQLDashboard = (config: DashboardConfig): dashboard.Dashboard => {
  const baseUid = config.uids?.main || config.uid || `${config.serviceName}-graphql`;
  const tags = config.tags || ['generated', config.serviceName, 'graphql'];
  
  const prebuiltDashboard = createGraphQLDashboardPrebuilt(
    undefined, // datasourceUid - use default Prometheus datasource
    tags,
    config.serviceName
  );

  // Convert the prebuilt dashboard to Grafana dashboard format
  return prebuiltDashboard as unknown as dashboard.Dashboard;
};
