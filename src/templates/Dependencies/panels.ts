import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard';
import * as prometheus from '@grafana/grafana-foundation-sdk/prometheus';
import * as timeseries from '@grafana/grafana-foundation-sdk/timeseries';
import * as stat from '@grafana/grafana-foundation-sdk/stat';
import * as units from '@grafana/grafana-foundation-sdk/units';
import * as common from '@grafana/grafana-foundation-sdk/common';
import { defaultTimeseries } from '../common.js';
import { prometheusDatasource } from '../datasources.js';

// Outgoing request rate grouped by target (upstream dependency)
export const outgoingRequestRateByTarget = (serviceName: string): timeseries.PanelBuilder => {
  return defaultTimeseries()
    .title('Outgoing request rate by target')
    .description('Number of outgoing requests per second grouped by target.')
    .datasource(prometheusDatasource)
    .unit(units.RequestsPerSecond)
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`sum(rate(http_outgoing_duration_seconds_count{pod_container_name="${serviceName}", cluster_name="$cluster_name"}[10m])) by (target)`)
        .refId('A').legendFormat('{{target}}')
    );
};

// Outgoing error rate percentage by target
export const outgoingErrorRateByTarget = (
  serviceName: string,
  thresholds?: { yellow: number; red: number }
): stat.PanelBuilder => {
  return new stat.PanelBuilder()
    .title('Outgoing error rate by target')
    .description('Percentage of 5xx for outgoing requests grouped by target.')
    .datasource(prometheusDatasource)
    .unit(units.Percent)
    .thresholds(
      new dashboard.ThresholdsConfigBuilder()
        .mode(dashboard.ThresholdsMode.Absolute)
        .steps([
          { color: 'green', value: null },
          { color: 'yellow', value: thresholds?.yellow ?? 1 },
          { color: 'red', value: thresholds?.red ?? 5 }
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
        .calcs(['lastNotNull'])
        .fields('')
    )
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`(sum(rate(http_outgoing_duration_seconds_count{pod_container_name="${serviceName}", code=~"5..", cluster_name="$cluster_name"}[10m])) by (target) / sum(rate(http_outgoing_duration_seconds_count{pod_container_name="${serviceName}", cluster_name="$cluster_name"}[10m])) by (target)) * 100`)
        .refId('A').legendFormat('{{target}}')
    );
};

// Outgoing latency P90 by target
export const outgoingDurationP90ByTarget = (
  serviceName: string,
  thresholds?: { red: number }
): timeseries.PanelBuilder => {
  return defaultTimeseries()
    .title('Outgoing P90 duration by target')
    .description('90th percentile of outgoing request duration grouped by target.')
    .datasource(prometheusDatasource)
    .unit(units.Seconds)
    .thresholds(
      new dashboard.ThresholdsConfigBuilder()
        .mode(dashboard.ThresholdsMode.Absolute)
        .steps([
          { color: 'green', value: null },
          { color: 'red', value: thresholds?.red ?? 1 }
        ])
    )
    .thresholdsStyle(
      new common.GraphThresholdsStyleConfigBuilder()
        .mode(common.GraphThresholdsStyleMode.Line)
    )
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`histogram_quantile(0.90, sum(rate(http_outgoing_duration_seconds_bucket{pod_container_name="${serviceName}", cluster_name="$cluster_name"}[10m])) by (le, target))`)
        .refId('A').legendFormat('{{target}}')
    );
};


