import { services } from "./services/index.js";
import { dashboards as expressDemo } from "./services/express-demo-server/index.js";
const a = services[expressDemo.serviceName]!.build();
console.log(a.main);