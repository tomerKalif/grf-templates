import * as dashboard from '@grafana/grafana-foundation-sdk/dashboard';
import * as prometheus from '@grafana/grafana-foundation-sdk/prometheus';
import * as timeseries from '@grafana/grafana-foundation-sdk/timeseries';
import * as units from '@grafana/grafana-foundation-sdk/units';
import * as common from '@grafana/grafana-foundation-sdk/common';
import { defaultTimeseries } from '../common.js';

export const cpuTimeseries = (serviceName: string, thresholds?: { yellow: number; red: number }): timeseries.PanelBuilder => {
  return defaultTimeseries()
    .title("CPU Usage")
    .description("CPU usage percentage for Node.js process")
    .datasource({ uid: "prometheus", type: "prometheus" })
    .unit(units.Percent)
    .thresholds(
      new dashboard.ThresholdsConfigBuilder()
        .mode(dashboard.ThresholdsMode.Absolute)
        .steps([
          { color: "green", value: null },
          { color: "yellow", value: thresholds?.yellow ?? 70 },
          { color: "red", value: thresholds?.red ?? 90 }
        ])
    )
    .thresholdsStyle(
      new common.GraphThresholdsStyleConfigBuilder()
        .mode(common.GraphThresholdsStyleMode.Line)
    )
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`irate(process_cpu_user_seconds_total{pod_container_name="${serviceName}"}[2m]) * 100`)
        .refId("A")
        .legendFormat("CPU Usage %")
    );
};

export const memoryTimeseries = (serviceName: string, thresholds?: { yellow: number; red: number }): timeseries.PanelBuilder => {
  return defaultTimeseries()
    .title("Memory Usage")
    .description("Resident memory usage for Node.js process")
    .datasource({ uid: "prometheus", type: "prometheus" })
    .unit(units.BytesSI)
    .thresholds(
      new dashboard.ThresholdsConfigBuilder()
        .mode(dashboard.ThresholdsMode.Absolute)
        .steps([
          { color: "green", value: null },
          { color: "yellow", value: thresholds?.yellow ?? 500 * 1024 * 1024 }, // 500MB
          { color: "red", value: thresholds?.red ?? 1024 * 1024 * 1024 }    // 1GB
        ])
    )
    .thresholdsStyle(
      new common.GraphThresholdsStyleConfigBuilder()
        .mode(common.GraphThresholdsStyleMode.Line)
    )
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`process_resident_memory_bytes{pod_container_name="${serviceName}"}`)
        .refId("A")
        .legendFormat("Memory Usage")
    );
};

export const activeHandlesTimeseries = (serviceName: string, thresholds?: { yellow: number; red: number }): timeseries.PanelBuilder => {
  return defaultTimeseries()
    .title("Active Handles")
    .description("Number of active handles in Node.js process")
    .datasource({ uid: "prometheus", type: "prometheus" })
    .unit(units.Short)
    .thresholds(
      new dashboard.ThresholdsConfigBuilder()
        .mode(dashboard.ThresholdsMode.Absolute)
        .steps([
          { color: "green", value: null },
          { color: "yellow", value: thresholds?.yellow ?? 1000 },
          { color: "red", value: thresholds?.red ?? 5000 }
        ])
    )
    .thresholdsStyle(
      new common.GraphThresholdsStyleConfigBuilder()
        .mode(common.GraphThresholdsStyleMode.Line)
    )
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`nodejs_active_handles{pod_container_name="${serviceName}"}`)
        .refId("A")
        .legendFormat("Active Handles")
    );
};

export const activeRequestsTimeseries = (serviceName: string, thresholds?: { yellow: number; red: number }): timeseries.PanelBuilder => {
  return defaultTimeseries()
    .title("Active Requests")
    .description("Number of active requests in Node.js process")
    .datasource({ uid: "prometheus", type: "prometheus" })
    .unit(units.Short)
    .thresholds(
      new dashboard.ThresholdsConfigBuilder()
        .mode(dashboard.ThresholdsMode.Absolute)
        .steps([
          { color: "green", value: null },
          { color: "yellow", value: thresholds?.yellow ?? 50 },
          { color: "red", value: thresholds?.red ?? 200 }
        ])
    )
    .thresholdsStyle(
      new common.GraphThresholdsStyleConfigBuilder()
        .mode(common.GraphThresholdsStyleMode.Line)
    )
    .withTarget(
      new prometheus.DataqueryBuilder()
        .expr(`nodejs_active_requests{pod_container_name="${serviceName}"}`)
        .refId("A")
        .legendFormat("Active Requests")
    );
};
