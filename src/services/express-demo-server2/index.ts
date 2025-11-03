import {  DashboardBuilder } from "../../templates/dashboard.js";
import { toBytesMB } from "../../utils/index.js";

export type DashboardSet = {
  serviceName: string;
  build: () => { main: any};
};

const serviceName = 'express-demo-server-2';

export const expressDemoServer2: DashboardSet = {
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
      });

    return builder.build();
  }
};


