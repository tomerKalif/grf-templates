/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type GrafanaFolder = {
  id: number;
  uid: string;
  title: string;
};

type GrafanaSearchItem = {
  id: number; // for folders, this is folderId
  uid: string;
  title: string;
  type: 'dash-db' | 'dash-folder' | string;
};

function getEnv(name: string, fallback?: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

function readJsonFilesFromOut(globLike: string): string[] {
  // Very simple glob: only supports directory + *.json
  // Default: out/*.json
  const dirname = path.dirname(globLike);
  const pattern = path.basename(globLike);
  if (!pattern.endsWith('.json')) return [];
  if (!fs.existsSync(dirname)) return [];
  return fs
    .readdirSync(dirname)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(dirname, f));
}

function deriveServiceName(dashboard: any): string {
  const tags: string[] = Array.isArray(dashboard?.tags) ? dashboard.tags : [];
  const ignore = new Set(['generated', 'deep-dive', 'api', 'dependencies', 'traffic', 'service']);
  for (const t of tags) {
    if (!ignore.has(t.toLowerCase())) return t;
  }
  const title: string = String(dashboard?.title ?? '');
  const idx = title.lastIndexOf(' - ');
  if (idx !== -1) return title.slice(idx + 3).trim();
  return 'unknown-service';
}

async function grafanaFetch(url: string, init: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Grafana API ${init.method || 'GET'} ${url} failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res;
}

async function findFolderByTitle(baseUrl: string, token: string, title: string): Promise<GrafanaFolder | undefined> {
  const url = `${baseUrl}/api/search?type=dash-folder&query=${encodeURIComponent(title)}`;
  const res = await grafanaFetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const items = (await res.json()) as GrafanaSearchItem[];
  const match = items.find((i) => i.type === 'dash-folder' && i.title === title);
  if (!match) return undefined;
  return { id: match.id, uid: match.uid, title: match.title };
}

async function createFolder(baseUrl: string, token: string, title: string): Promise<GrafanaFolder> {
  const url = `${baseUrl}/api/folders`;
  const res = await grafanaFetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  const json = (await res.json()) as GrafanaFolder;
  return json;
}

async function ensureFolderId(baseUrl: string, token: string, title: string): Promise<number> {
  const existing = await findFolderByTitle(baseUrl, token, title);
  if (existing) return existing.id;
  const created = await createFolder(baseUrl, token, title);
  return created.id;
}

async function uploadDashboard(baseUrl: string, token: string, folderId: number, dashboard: any): Promise<any> {
  const url = `${baseUrl}/api/dashboards/db`;
  const res = await grafanaFetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ dashboard, folderId, overwrite: true })
  });
  return res.json();
}

async function main(): Promise<void> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Default glob: out/*.json relative to project root
  const defaultGlob = path.resolve(__dirname, '..', 'out', '*.json');
  const fileGlob = getEnv('DASHBOARD_FILE_GLOB', defaultGlob) as string;
  const baseUrl = getEnv('GRAFANA_URL');
  const token = getEnv('GRAFANA_API_KEY');
  const parentFolder = getEnv('GRAFANA_PARENT_FOLDER', 'Services');
  const dryRun = getEnv('DRY_RUN', '')?.toLowerCase() === 'true';

  if (!baseUrl || !token) {
    throw new Error('Missing GRAFANA_URL or GRAFANA_API_KEY');
  }

  const files = readJsonFilesFromOut(fileGlob);
  if (files.length === 0) {
    console.log('No dashboard files found. Nothing to upload.');
    return;
  }

  // Ensure the single top-level parent folder exists (we simulate nesting by title naming)
  const parentFolderId = await ensureFolderId(baseUrl, token, parentFolder as string);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const dashboard = JSON.parse(content);
    const serviceName = deriveServiceName(dashboard);

    // Grafana folders are flat; we simulate nesting under the single parent via naming convention
    const targetFolderTitle = `${parentFolder}/${serviceName}`;
    const folderId = await ensureFolderId(baseUrl, token, targetFolderTitle);

    if (dryRun) {
      console.log(`[dry-run] Would upload ${path.basename(file)} to folder '${targetFolderTitle}' (id=${folderId})`);
      continue;
    }

    const result = await uploadDashboard(baseUrl, token, folderId, dashboard);
    console.log(`Uploaded ${path.basename(file)} → folder '${targetFolderTitle}' uid=${result?.uid ?? dashboard?.uid}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


