import { dashboards as expressDemo } from './express-demo-server/index.js';
import { expressDemoServer2 } from './express-demo-server2/index.js';

export type BuiltDashboards = {
  [serviceName: string]: {
    uids: { main: string; apiDeepDive?: string; dependenciesDeepDive?: string };
    build: () => { main: any; apiDeepDive?: any; dependenciesDeepDive?: any };
  };
};

export const services: BuiltDashboards = {
  [expressDemo.serviceName]: {
    uids: expressDemo.uids,
    build: expressDemo.build
  },
  [expressDemoServer2.serviceName]: {
    uids: expressDemoServer2.uids,
    build: expressDemoServer2.build
  }
} as const ;
  

