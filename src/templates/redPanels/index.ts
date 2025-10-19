import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard';
import * as testdata from '@grafana/grafana-foundation-sdk/testdata';
import * as prometheus from '@grafana/grafana-foundation-sdk/prometheus';
import * as timeseries from '@grafana/grafana-foundation-sdk/timeseries';
import * as stat from '@grafana/grafana-foundation-sdk/stat';
import * as units from '@grafana/grafana-foundation-sdk/units';
import * as common from '@grafana/grafana-foundation-sdk/common';
import { defaultTimeseries } from '../common.js';

export interface redConfig {
  dashboardTitle: string;
  serviceIds: string[];
}

export const red = (config: redConfig): dashboard.DashboardBuilder => {
  let builder = new dashboard.DashboardBuilder(`[Example] ${config.dashboardTitle}`)
    .uid("example-red-method")
    .tags(["generated", "red"])
    .editable()
    .tooltip(dashboard.DashboardCursorSync.Crosshair)
    .refresh("30s")
    .time({ from: "now-30m", to: "now" })
    .timezone("browser")
    .timepicker(
      new dashboard.TimePickerBuilder()
        .refreshIntervals(["5s", "10s", "30s", "1m", "5m", "15m", "30m", "1h", "2h", "1d"])
    )
    // More info about the RED method
    .link(
      new dashboard.DashboardLinkBuilder("Grafana Agent Dashboards")
        .type(dashboard.DashboardLinkType.Link)
        .icon("question")
        .targetBlank(true)
        .url("https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/#the-red-method")
    );

  for (const serviceID of config.serviceIds) {
    builder = builder
      .withRow(new dashboard.RowBuilder(serviceID))
      .withPanel(requestRateTimeseries(serviceID).span(24).height(10))
      .withPanel(errorRateStat(serviceID).span(12).height(8))
      .withPanel(durationTimeseries(serviceID).span(12).height(8));
  }

  return builder;
};

export const requestRateTimeseries = (serviceName: string): timeseries.PanelBuilder => {
  return defaultTimeseries()
    .title("Request rate")
    .description("Number of requests handled by the service, per second.")
    .datasource({ uid: "prometheus", type: "prometheus" })
    .unit(units.RequestsPerSecond)
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`sum(rate(http_request_duration_seconds_count{service="${serviceName}"}[10m])) by (route)`)
        .refId("A")
    );
};

export const errorRateStat = (serviceName: string): stat.PanelBuilder => {
  return new stat.PanelBuilder()
    .title("Error rate")
    .description("Percentage of failed requests.")
    .datasource({ uid: "prometheus", type: "prometheus" })
    .unit(units.Percent)
    .thresholds(
      new dashboard.ThresholdsConfigBuilder()
        .mode(dashboard.ThresholdsMode.Absolute)
        .steps([
          { color: "green", value: null },
          { color: "yellow", value: 1 },
          { color: "red", value: 5 }
        ])
    )
    .colorMode(common.BigValueColorMode.Value)
    .graphMode(common.BigValueGraphMode.Area)
    .justifyMode(common.BigValueJustifyMode.Center)
    .textMode(common.BigValueTextMode.Auto)
    .wideLayout(true)
    .reduceOptions(
      new common.ReduceDataOptionsBuilder()
        .values(false)
        .calcs(["lastNotNull"])
        .fields("")
    )
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`(sum(rate(http_request_duration_seconds_count{service="${serviceName}", code=~"5.."}[10m])) / sum(rate(http_request_duration_seconds_count{service="${serviceName}"}[10m]))) * 100`)
        .refId("A").legendFormat("{{__auto}}")
    );
};

export const durationTimeseries = (serviceName: string): timeseries.PanelBuilder => {
  return defaultTimeseries()
    .title("90th percentile of request duration")
    .description("90th percentile of request duration, per second.")
    .datasource({ uid: "prometheus", type: "prometheus" })
    .unit(units.Seconds)
    .thresholds(
      new dashboard.ThresholdsConfigBuilder()
        .mode(dashboard.ThresholdsMode.Absolute)
        .steps([
          { color: "green", value: null },
          { color: "red", value: 1 }
        ])
    )
    .thresholdsStyle(
      new common.GraphThresholdsStyleConfigBuilder()
        .mode(common.GraphThresholdsStyleMode.Line)
    )
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`histogram_quantile(0.90, sum(rate(http_request_duration_seconds_bucket{service="${serviceName}"}[10m])) by (le, route))`)
        .refId("A").legendFormat("{{__auto}}")
    );
};