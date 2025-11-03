import * as prometheus from '@grafana/grafana-foundation-sdk/prometheus';
import * as stat from '@grafana/grafana-foundation-sdk/stat';
import * as units from '@grafana/grafana-foundation-sdk/units';
import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard';
import { defaultTimeseries } from '../common.js';
import { prometheusDatasource } from '../datasources.js';

export const successRateStat = (serviceName: string, thresholds?: { yellow: number; red: number }): stat.PanelBuilder => {
  const yellow = thresholds?.yellow ?? 95;
  const red = thresholds?.red ?? 90;
  
  return new stat.PanelBuilder()
    .title('Success rate')
    .description('Percentage of successful GraphQL requests')
    .datasource(prometheusDatasource)
    .unit(units.Percent)
    .thresholds(
      new dashboard.ThresholdsConfigBuilder()
        .mode(dashboard.ThresholdsMode.Absolute)
        .steps([
          { value: null, color: 'red' },
          { value: red, color: 'yellow' },
          { value: yellow, color: 'green' }
        ])
    )
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`(1-(sum(graphql_envelop_error_result{ pod_container_name="${serviceName}"})/sum(graphql_envelop_request{ pod_container_name="${serviceName}"})))*100`)
        .refId('A')
        .legendFormat('{{__auto}}')
    );
};

export const queryLatencyStat = (serviceName: string, thresholds?: { red: number }): stat.PanelBuilder => {
  const red = thresholds?.red ?? 0.5;
  
  return new stat.PanelBuilder()
    .title('Median query latency')
    .description('Median latency for GraphQL queries and mutations')
    .datasource(prometheusDatasource)
    .unit(units.Seconds)
    .thresholds(
      new dashboard.ThresholdsConfigBuilder()
        .mode(dashboard.ThresholdsMode.Absolute)
        .steps([
          { value: null, color: 'green' },
          { value: red, color: 'red' }
        ])
    )
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`histogram_quantile(0.5, sum(rate(graphql_envelop_request_duration_bucket{ pod_container_name="${serviceName}"}[5m])) by (le))`)
        .refId('A')
        .legendFormat('{{__auto}}')
    );
};

export const queryErrorsStat = (serviceName: string, thresholds?: { yellow: number; red: number }): stat.PanelBuilder => {
  const yellow = thresholds?.yellow ?? 5;
  const red = thresholds?.red ?? 10;
  
  return new stat.PanelBuilder()
    .title('Query errors')
    .description('Total number of GraphQL query errors')
    .datasource(prometheusDatasource)
    .unit(units.Short)
    .thresholds(
      new dashboard.ThresholdsConfigBuilder()
        .mode(dashboard.ThresholdsMode.Absolute)
        .steps([
          { value: null, color: 'green' },
          { value: yellow, color: 'yellow' },
          { value: red, color: 'red' }
        ])
    )
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`sum(graphql_envelop_error_result{ operationType="query", pod_container_name="${serviceName}"})`)
        .refId('A')
        .legendFormat('{{__auto}}')
    );
};

