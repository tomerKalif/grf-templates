import {  DashboardBuilder } from "../../templates/dashboard.js";
import { toBytesMB } from "../../utils/index.js";

export type DashboardSet = {
  serviceName: string;
  uids: { main: string; apiDeepDive?: string; dependenciesDeepDive?: string };
  build: () => { main: any; apiDeepDive?: any; dependenciesDeepDive?: any };
};

const serviceName = 'express-demo-server';

export const dashboards: DashboardSet = {
  serviceName,
  uids: {
    main: 'service-monitoring',
    apiDeepDive: `${serviceName}-api-deep-dive`,
    dependenciesDeepDive: `${serviceName}-deps-deep-dive` // Shortened to fit Grafana's 40 char UID limit
  },
  build: () => {
    const builder = DashboardBuilder.create({
      dashboardTitle: 'Service Monitoring Dashboard',
      serviceName,
      uids: { main: 'service-monitoring' },
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


