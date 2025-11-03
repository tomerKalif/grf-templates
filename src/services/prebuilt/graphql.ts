import { createGraphQLDashboard } from '../../templates/dashboard.js';
import type { DashboardSet } from '../index.js';

const serviceName = 'graphql';

export const graphqlService: DashboardSet = {
  serviceName,
  build: () => {
    return {
      main: createGraphQLDashboard({
        dashboardTitle: 'GraphQL Envelop',
        serviceName,
        tags: ['generated', serviceName, 'graphql'],
        refresh: '30s'
      })
    };
  }
};

