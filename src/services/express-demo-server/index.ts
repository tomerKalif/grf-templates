import {  DashboardBuilder } from "../../templates/dashboard.js";
import   {toBytesMB}  from "../../utils.js";

export type DashboardSet = {
  serviceName: string;
  uids: { main: string; apiDeepDive?: string; dependenciesDeepDive?: string };
  build: () => { main: any; };
};

const serviceName = 'express-demo-server';

export const dashboards: DashboardSet = {
  serviceName,
  uids: {
    main: 'service-monitoring',
    apiDeepDive: `${serviceName}-api-deep-dive`,
    dependenciesDeepDive: `${serviceName}-dependencies-deep-dive`
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

    const main = builder.build();

    return { main };
  }
};


