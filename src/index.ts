import { config } from "dotenv";
config();

import { createInterface } from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";

import { services } from "./services/index.js";
import { uploadDashboardToGrafana as uploadToGrafana, ensureFolderId, findFolderByTitle } from "./services/grafana-upload.js";

type ServiceName = keyof typeof services;

function createRl() {
  return createInterface({ input, output });
}

function renderHeader(title: string): void {
  const termWidth = typeof output.columns === "number" ? output.columns : 80;
  const innerWidth = Math.max(68, Math.min(termWidth - 4, title.length + 20));

  const padCenter = (text: string, w: number): string => {
    if (text.length >= w) return text.slice(0, w);
    const left = Math.floor((w - text.length) / 2);
    const right = w - text.length - left;
    return " ".repeat(left) + text + " ".repeat(right);
  };

  const colors = [
    chalk.magentaBright,
    chalk.blueBright,
    chalk.cyanBright,
    chalk.greenBright,
    chalk.yellowBright,
    chalk.redBright
  ];

  const colorizeGradient = (text: string): string => {
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const fn = colors[i % colors.length];
      out += fn(text[i]);
    }
    return out;
  };

  const horiz = "=".repeat(innerWidth + 2);
  const mid = "-".repeat(innerWidth + 2);
  const borderTop = "+" + colorizeGradient(horiz) + "+";
  const borderSep = "+" + colorizeGradient(mid) + "+";
  const emptyLine = chalk.blueBright("|") + " ".repeat(innerWidth + 2) + chalk.blueBright("|");

  const rawTitle = padCenter(title.toUpperCase(), innerWidth);
  const rawSub = padCenter("Grafana Dashboard Builder", innerWidth);
  const titleColored = colorizeGradient(rawTitle);
  const subColored = colorizeGradient(rawSub);

  const titleLine = chalk.blueBright("|") + " " + chalk.bold(titleColored) + " " + chalk.blueBright("|");
  const subLine = chalk.blueBright("|") + " " + chalk.dim(subColored) + " " + chalk.blueBright("|");

  console.log(borderTop);
  console.log(emptyLine);
  console.log(titleLine);
  console.log(borderSep);
  console.log(subLine);
  console.log(emptyLine);
  console.log(borderTop);
  console.log();
}

async function selectFromList(options: string[], title: string): Promise<number | null> {
  if (options.length === 0) return null;
  const rl = createRl();
  output.write("\x1b[?25l"); // hide cursor
  const stdin = process.stdin;
  let idx = 0;
  let start = 0; // viewport start index

  const termRows = typeof (process.stdout as { rows?: number }).rows === "number" ? (process.stdout as { rows: number }).rows : 24;
  const headerRows = 8; // approximate rows used by header
  const footerRows = 3; // help + spacing
  const maxVisible = Math.max(8, termRows - headerRows - footerRows);

  function render() {
    console.clear();
    renderHeader(title);
    console.log(chalk.dim("Use ") + chalk.white("↑/↓") + chalk.dim(
      " to move • "
    ) + chalk.white("Enter") + chalk.dim(" to select • ") + chalk.red("q") + chalk.dim(" to cancel"));

    // Ensure idx within viewport
    if (idx < start) start = idx;
    if (idx >= start + maxVisible) start = idx - maxVisible + 1;

    const end = Math.min(options.length, start + maxVisible);
    const before = start;
    const after = options.length - end;

    if (before > 0) {
      console.log(chalk.gray(`… ${before} more above …`));
    }

    for (let i = start; i < end; i++) {
      const isSel = i === idx;
      const prefix = isSel ? chalk.green("➤") : " ";
      const text = isSel ? chalk.bold.white(options[i]) : chalk.dim(options[i]);
      console.log(`${prefix} ${text}`);
    }

    if (after > 0) {
      console.log(chalk.gray(`… ${after} more below …`));
    }
  }

  render();

  return new Promise((resolve) => {
    function cleanup(result: number | null) {
      stdin.setRawMode?.(false);
      stdin.pause();
      output.write("\x1b[?25h"); // show cursor
      rl.close();
      resolve(result);
    }

    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    stdin.on("data", (key: string) => {
      if (key === "\u0003" || key.toLowerCase() === "q") {
        // Ctrl+C or q
        console.log();
        console.log(chalk.yellow("Cancelled."));
        return cleanup(null);
      }
      if (key === "\r" || key === "\n") {
        // Enter
        return cleanup(idx);
      }
      if (key === "\u001b[A") {
        // up
        idx = (idx - 1 + options.length) % options.length;
        // move cursor up by options.length + header lines and re-render
        console.clear();
        render();
        return;
      }
      if (key === "\u001b[B") {
        // down
        idx = (idx + 1) % options.length;
        console.clear();
        render();
        return;
      }
    });
  });
}

async function exportSingleDashboard(): Promise<void> {
  const entries = Object.entries(services) as Array<[ServiceName, (typeof services)[ServiceName]]>;
  if (entries.length === 0) {
    console.log("No services available.");
    return;
  }

  const names = entries.map(([name]) => name as string);
  const picked = await selectFromList(names, "Select a service");
  if (picked === null) return;

  const selected = entries[picked]!; // safe due to bounds check above
  const serviceName = selected[0];
  const service = selected[1];
  const defaultPath = join(process.cwd(), "out.json");

  const built = service.build();
  await fs.writeFile(defaultPath, JSON.stringify(built.main, null, 2), "utf-8");
  console.log(`Wrote ${serviceName} main dashboard -> ${defaultPath}`);
}

async function uploadDashboardToGrafana(): Promise<void> {
  const entries = Object.entries(services) as Array<[ServiceName, (typeof services)[ServiceName]]>;
  if (entries.length === 0) {
    console.log(chalk.red("No services available."));
    return;
  }

  const names = entries.map(([name]) => name as string);
  const picked = await selectFromList(names, "Select a service to upload");
  if (picked === null) return;

  const selected = entries[picked]!;
  const serviceName = selected[0];
  const service = selected[1];

  // Get Grafana configuration
  const defaultBaseUrl = process.env.GRAFANA_URL || "";
  const defaultToken = process.env.GRAFANA_API_KEY || "";

  console.log();
  const baseUrl = defaultBaseUrl
  if (!baseUrl) {
    console.log(chalk.red("Grafana URL is required."));
    return;
  }

const token = defaultToken;
  if (!token) {
    console.log(chalk.red("Grafana API Key is required."));
    return;
  }

  const parentFolder = "Services";

  console.log();
  console.log(chalk.yellow("Building dashboards..."));
  const built = service.build();

  const dashboardsToUpload = [
    { name: "main", dashboard: built.main },
    ...(built.apiDeepDive ? [{ name: "API Deep Dive", dashboard: built.apiDeepDive }] : []),
    ...(built.graphqlDeepDive ? [{ name: "GraphQL Deep Dive", dashboard: built.graphqlDeepDive }] : [])
  ];

  console.log(chalk.yellow(`Found ${dashboardsToUpload.length} dashboard(s) to upload`));
  console.log(chalk.yellow("Ensuring folder structure..."));

  // Ensure folders are created sequentially before parallel uploads to avoid race conditions
  // First create the parent folder
  await ensureFolderId(baseUrl, token, parentFolder);
  const parentFolderDetails = await findFolderByTitle(baseUrl, token, parentFolder);
  const parentFolderUid = parentFolderDetails?.uid;

  // Then create the service folder nested under the parent
  await ensureFolderId(baseUrl, token, String(serviceName), parentFolderUid);

  const results = await Promise.all(
    dashboardsToUpload.map(async ({ name, dashboard }) => {
      console.log(chalk.yellow(`Uploading ${name} to folder '${parentFolder}/${serviceName}'...`));
      return {
        name,
        result: await uploadToGrafana({
          baseUrl,
          token,
          parentFolder,
          serviceName: String(serviceName),
          dashboard
        }, parentFolderUid)
      };
    })
  );

  console.log();
  let successCount = 0;
  let failCount = 0;

  for (const { name, result } of results) {
    if (result.success) {
      successCount++;
      console.log(chalk.green(`✓ Successfully uploaded ${name}!`));
      console.log(chalk.dim(`  Folder: ${result.folderPath}`));
      console.log(chalk.dim(`  UID: ${result.uid}`));
      console.log(chalk.dim(`  URL: ${result.dashboardUrl}`));
      console.log();
    } else {
      failCount++;
      console.log(chalk.red(`✗ Failed to upload ${name}:`));
      console.log(chalk.red(result.error));
      console.log();
    }
  }

  if (successCount > 0 && failCount === 0) {
    console.log(chalk.green(`✓ All ${successCount} dashboard(s) uploaded successfully!`));
  } else if (failCount > 0) {
    console.log(chalk.yellow(`⚠ Uploaded ${successCount}/${results.length} dashboard(s) successfully`));
  }
}

async function uploadAllServicesDashboards(): Promise<void> {
  const entries = Object.entries(services) as Array<[ServiceName, (typeof services)[ServiceName]]>;
  if (entries.length === 0) {
    console.log(chalk.red("No services available."));
    return;
  }

  // Get Grafana configuration
  const defaultBaseUrl = process.env.GRAFANA_URL || "";
  const defaultToken = process.env.GRAFANA_API_KEY || "";
  const defaultParentFolder = process.env.GRAFANA_PARENT_FOLDER || "Services";

  const baseUrl = defaultBaseUrl;
  if (!baseUrl) {
    console.log(chalk.red("Grafana URL is required. Set GRAFANA_URL in .env file."));
    return;
  }

  const token = defaultToken;
  if (!token) {
    console.log(chalk.red("Grafana API Key is required. Set GRAFANA_API_KEY in .env file."));
    return;
  }

  const parentFolder = defaultParentFolder;

  console.log();
  console.log(chalk.yellow(`Found ${entries.length} service(s) to process`));
  console.log(chalk.yellow("Ensuring parent folder structure..."));

  // Ensure parent folder exists once for all services
  await ensureFolderId(baseUrl, token, parentFolder);
  const parentFolderDetails = await findFolderByTitle(baseUrl, token, parentFolder);
  const parentFolderUid = parentFolderDetails?.uid;

  console.log(chalk.yellow("Building and uploading dashboards for all services..."));
  console.log();

  let totalSuccess = 0;
  let totalFail = 0;
  const serviceResults: Array<{ serviceName: string; success: number; fail: number }> = [];

  for (const [serviceName, service] of entries) {
    const serviceNameStr = String(serviceName);
    console.log(chalk.cyan(`\n→ Processing service: ${serviceNameStr}`));
    
    try {
      // Build dashboards
      const built = service.build();
      const dashboardsToUpload = [
        { name: "main", dashboard: built.main },
        ...(built.apiDeepDive ? [{ name: "API Deep Dive", dashboard: built.apiDeepDive }] : []),
        ...(built.graphqlDeepDive ? [{ name: "GraphQL Deep Dive", dashboard: built.graphqlDeepDive }] : [])
      ];

      console.log(chalk.dim(`  Building ${dashboardsToUpload.length} dashboard(s)...`));

      // Ensure service folder exists
      await ensureFolderId(baseUrl, token, serviceNameStr, parentFolderUid);

      // Upload all dashboards for this service
      const results = await Promise.all(
        dashboardsToUpload.map(async ({ name, dashboard }) => {
          return {
            name,
            result: await uploadToGrafana({
              baseUrl,
              token,
              parentFolder,
              serviceName: serviceNameStr,
              dashboard
            }, parentFolderUid)
          };
        })
      );

      let serviceSuccess = 0;
      let serviceFail = 0;

      for (const { name, result } of results) {
        if (result.success) {
          serviceSuccess++;
          totalSuccess++;
          console.log(chalk.green(`  ✓ ${name}`));
        } else {
          serviceFail++;
          totalFail++;
          console.log(chalk.red(`  ✗ ${name}: ${result.error}`));
        }
      }

      serviceResults.push({ serviceName: serviceNameStr, success: serviceSuccess, fail: serviceFail });
    } catch (error) {
      console.log(chalk.red(`  ✗ Error processing service: ${String(error)}`));
      totalFail++;
      serviceResults.push({ serviceName: serviceNameStr, success: 0, fail: 1 });
    }
  }

  // Summary
  console.log();
  console.log(chalk.bold.cyan("=".repeat(50)));
  console.log(chalk.bold("Upload Summary"));
  console.log(chalk.bold.cyan("=".repeat(50)));
  console.log();
  
  for (const { serviceName, success, fail } of serviceResults) {
    if (fail === 0) {
      console.log(chalk.green(`✓ ${serviceName}: ${success} dashboard(s) uploaded`));
    } else {
      console.log(chalk.yellow(`⚠ ${serviceName}: ${success} succeeded, ${fail} failed`));
    }
  }

  console.log();
  console.log(chalk.bold(`Total: ${totalSuccess} succeeded, ${totalFail} failed`));
  
  if (totalFail === 0) {
    console.log(chalk.green.bold(`✓ All dashboards uploaded successfully!`));
  } else {
    console.log(chalk.yellow.bold(`⚠ Some dashboards failed to upload`));
  }
}

async function main(): Promise<void> {
  const rl = createRl();
  try {
    console.clear();
    renderHeader("Minimal Grafana Dashboard CLI");
    const mainOptions = [
      "Export a single service's dashboard to file",
      "Upload single service dashboard to Grafana",
      "Upload all services dashboards to Grafana",
      "Quit"
    ];
    const picked = await selectFromList(mainOptions, "Select an action");
    if (picked === 0) {
      await exportSingleDashboard();
    } else if (picked === 1) {
      await uploadDashboardToGrafana();
    } else if (picked === 2) {
      await uploadAllServicesDashboards();
    }
  } finally {
    rl.close();
  }
}

void main();