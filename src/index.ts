import { createDashboard } from "./templates/dashboard.js";
import { appendApiMetricsRow } from "./templates/APIMetrics/index.js";
import { appendNodeJSMetricsRow } from "./templates/NodeJSMetrics/index.js";

// Create a generic dashboard
const dashboardBuilder = createDashboard({
  dashboardTitle: "Service Monitoring Dashboard",
  serviceName: "express-demo-server",
  uid: "service-monitoring",
  tags: ["monitoring", "services"],
  refresh: "30s",
  timeRange: { from: "now-1h", to: "now" }
});

// Add API metrics row for a specific service
appendApiMetricsRow(dashboardBuilder, {
  serviceName: "express-demo-server",
  errorRateThresholds: {
    yellow: 2,  // 2% error rate threshold for yellow
    red: 10     // 10% error rate threshold for red
  },
  durationThresholds: {
    red: 2      // 2 seconds duration threshold for red
  }
});

// Add Node.js metrics row
appendNodeJSMetricsRow(dashboardBuilder, {
  serviceName: "express-demo-server",
  cpuThresholds: {
    yellow: 60,  // 60% CPU threshold for yellow
    red: 85      // 85% CPU threshold for red
  },
  memoryThresholds: {
    yellow: 300 * 1024 * 1024,  // 300MB threshold for yellow
    red: 800 * 1024 * 1024      // 800MB threshold for red
  },
  handlesThresholds: {
    yellow: 500,  // 500 handles threshold for yellow
    red: 2000     // 2000 handles threshold for red
  },
  requestsThresholds: {
    yellow: 25,   // 25 requests threshold for yellow
    red: 100      // 100 requests threshold for red
  }
});

const dashboard = dashboardBuilder.build();

// Copy to clipboard
const dashboardJson = JSON.stringify(dashboard, null, 2);


console.log(dashboardJson);