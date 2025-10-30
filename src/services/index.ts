import { dashboards as expressDemo } from './express-demo-server/index.js';

export type BuiltDashboards = {
  [serviceName: string]: {
    uids: { main: string; apiDeepDive?: string; dependenciesDeepDive?: string };
    build: () => { main: any;};
  };
};

export const services: BuiltDashboards = {
  [expressDemo.serviceName]: {
    uids: expressDemo.uids,
    build: expressDemo.build
  }
} as const ;
  

