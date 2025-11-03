import {  DashboardBuilder } from "../../templates/dashboard.js";
import { toBytesMB } from "../../utils/index.js";
import type { DashboardSet } from "../index.js";

const serviceName = 'express-demo-server';

export const dashboards: DashboardSet = {
  serviceName,
  build: () => {
    const builder = DashboardBuilder.create({
      dashboardTitle: 'Service Monitoring Dashboard',
      serviceName,
      tags: ['generated', serviceName],
      refresh: '30s',
      timeRange: { from: 'now-1h', to: 'now' }
    })
      .withApiMetrics({
        errorRateThresholds: { yellow: 2, red: 10 },
        durationThresholds: { red: 2 }
      })
      .withNodeJSMetrics({
        cpuThresholds: { yellow: 60, red: 85 },
        memoryThresholds: { yellow: toBytesMB(300), red: toBytesMB(800) },
        handlesThresholds: { yellow: 500, red: 2000 },
        requestsThresholds: { yellow: 25, red: 100 }
      }).withGraphQLMetrics({
        successRateThresholds: { yellow: 95, red: 90 },
        latencyThresholds: { red: 0.5 },
        errorsThresholds: { yellow: 5, red: 10 }
      });

    return builder.build();
  }
};


