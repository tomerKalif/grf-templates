import { createInterface } from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";

import { services } from "./services/index.js";

type ServiceName = keyof typeof services;

function createRl() {
  return createInterface({ input, output });
}

function askQuestion(rl: ReturnType<typeof createRl>, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
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

  const termRows = typeof (process.stdout as any).rows === "number" ? (process.stdout as any).rows : 24;
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

async function exportSingleDashboard(rl: ReturnType<typeof createRl>): Promise<void> {
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

async function main(): Promise<void> {
  const rl = createRl();
  try {
    console.clear();
    renderHeader("Minimal Grafana Dashboard CLI");
    const mainOptions = [
      "Export a single service's dashboard to file",
      "Quit"
    ];
    const picked = await selectFromList(mainOptions, "Select an action");
    if (picked === 0) {
      await exportSingleDashboard(rl);
    }
  } finally {
    rl.close();
  }
}

void main();