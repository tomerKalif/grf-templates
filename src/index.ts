import { red } from "./templates/redPanels/index.js";

const redDashboard = red({
  dashboardTitle: "RED method",
  serviceIds: ["express-demo-server"],
});

const dashboard = redDashboard.build();

// Copy to clipboard
const dashboardJson = JSON.stringify(dashboard, null, 2);


console.log(dashboardJson);