import { dashboards as expressDemo } from './express-demo-server/index.js';
import { expressDemoServer2 } from './express-demo-server2/index.js';

export type BuiltDashboards = {
  [serviceName: string]: {
    build: () => { main: any; apiDeepDive?: any; dependenciesDeepDive?: any };
  };
};

export const services: BuiltDashboards = {
  [expressDemo.serviceName]: {
    build: expressDemo.build
  },
  [expressDemoServer2.serviceName]: {
    build: expressDemoServer2.build
  }
} as const ;
  

