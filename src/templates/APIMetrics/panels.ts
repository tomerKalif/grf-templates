import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard';
import * as prometheus from '@grafana/grafana-foundation-sdk/prometheus';
import * as timeseries from '@grafana/grafana-foundation-sdk/timeseries';
import * as stat from '@grafana/grafana-foundation-sdk/stat';
import * as units from '@grafana/grafana-foundation-sdk/units';
import * as common from '@grafana/grafana-foundation-sdk/common';
import { defaultTimeseries } from '../common.js';

export const requestRateTimeseries = (serviceName: string): timeseries.PanelBuilder => {
  return defaultTimeseries()
    .title("Request rate")
    .description("Number of requests handled by the service, per second.")
    .datasource({ uid: "prometheus", type: "prometheus" })
    .unit(units.RequestsPerSecond)
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`sum(rate(http_request_duration_seconds_count{pod_container_name="${serviceName}"}[10m])) by (route)`)
        .refId("A").legendFormat("{{__auto}}")
    );
};

export const errorRateStat = (serviceName: string, thresholds?: { yellow: number; red: number }): stat.PanelBuilder => {
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
          { color: "yellow", value: thresholds?.yellow ?? 1 },
          { color: "red", value: thresholds?.red ?? 5 }
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
        .expr(`(sum(rate(http_request_duration_seconds_count{pod_container_name="${serviceName}", code=~"5.."}[10m])) / sum(rate(http_request_duration_seconds_count{pod_container_name="${serviceName}"}[10m]))) * 100`)
        .refId("A").legendFormat("{{__auto}}")
    );
};

export const durationTimeseries = (serviceName: string, thresholds?: { red: number }): timeseries.PanelBuilder => {
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
          { color: "red", value: thresholds?.red ?? 1 }
        ])
    )
    .thresholdsStyle(
      new common.GraphThresholdsStyleConfigBuilder()
        .mode(common.GraphThresholdsStyleMode.Line)
    )
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`histogram_quantile(0.90, sum(rate(http_request_duration_seconds_bucket{pod_container_name="${serviceName}"}[10m])) by (le, route))`)
        .refId("A").legendFormat("{{__auto}}")
    );
};

export const requestRateByMethodTimeseries = (serviceName: string): timeseries.PanelBuilder => {
  return defaultTimeseries()
    .title("Request rate by method")
    .description("Requests per second grouped by HTTP method.")
    .datasource({ uid: "prometheus", type: "prometheus" })
    .unit(units.RequestsPerSecond)
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`sum(rate(http_request_duration_seconds_count{pod_container_name="${serviceName}"}[10m])) by (method)`)
        .refId("A").legendFormat("{{method}}")
    );
};

export const requestRateByStatusTimeseries = (serviceName: string): timeseries.PanelBuilder => {
  return defaultTimeseries()
    .title("Request rate by status code")
    .description("Requests per second grouped by HTTP status code.")
    .datasource({ uid: "prometheus", type: "prometheus" })
    .unit(units.RequestsPerSecond)
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`sum(rate(http_request_duration_seconds_count{pod_container_name="${serviceName}"}[10m])) by (code)`)
        .refId("A").legendFormat("{{code}}")
    );
};
