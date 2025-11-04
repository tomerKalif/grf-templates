import type * as dashboard from '@grafana/grafana-foundation-sdk/dashboard';
import { dashboards as expressDemo } from './express-demo-server/index.js';
import { expressDemoServer2 } from './express-demo-server2/index.js';
import { graphqlService } from './prebuilt/graphql.js';

export type DashboardBuildResult = {
  main: dashboard.Dashboard;
  apiDeepDive?: dashboard.Dashboard;
  graphqlDeepDive?: dashboard.Dashboard;
};

export type DashboardSet = {
  serviceName: string;
  build: () => DashboardBuildResult;
};

export type BuiltDashboards = {
  [serviceName: string]: {
    build: () => DashboardBuildResult;
  };
};

export const services: BuiltDashboards = {
  [expressDemo.serviceName]: {
    build: expressDemo.build
  },
  [expressDemoServer2.serviceName]: {
    build: expressDemoServer2.build
  },
  [graphqlService.serviceName]: {
    build: graphqlService.build
  },
} as const ;
  

