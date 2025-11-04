import type * as dashboard from '@grafana/grafana-foundation-sdk/dashboard';

type GrafanaFolder = {
  id: number;
  uid: string;
  title: string;
};

type GrafanaSearchItem = {
  id: number;
  uid: string;
  title: string;
  type: 'dash-db' | 'dash-folder' | string;
};

async function grafanaFetch(url: string, init: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Grafana API ${init.method || 'GET'} ${url} failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res;
}

export async function findFolderByTitle(baseUrl: string, token: string, title: string): Promise<GrafanaFolder | undefined> {
  // Search for folders with the exact title
  const url = `${baseUrl}/api/search?type=dash-folder&query=${encodeURIComponent(title)}`;
  const res = await grafanaFetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const items = (await res.json()) as GrafanaSearchItem[];
  
  // Find exact match (case-sensitive to match Grafana's folder names exactly)
  const match = items.find((i) => i.type === 'dash-folder' && i.title === title);
  if (!match) return undefined;
  
  // Get full folder details by UID
  try {
    const folderUrl = `${baseUrl}/api/folders/${match.uid}`;
    const folderRes = await grafanaFetch(folderUrl, { headers: { Authorization: `Bearer ${token}` } });
    const folder = (await folderRes.json()) as GrafanaFolder;
    return folder;
  } catch {
    // Fallback to search result if folder fetch fails
    return { id: match.id, uid: match.uid, title: match.title };
  }
}

async function createFolder(baseUrl: string, token: string, title: string, parentUid?: string): Promise<GrafanaFolder> {
  const url = `${baseUrl}/api/folders`;
  const body: { title: string; parentUid?: string } = { title };
  if (parentUid) {
    body.parentUid = parentUid;
  }
  const res = await grafanaFetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = (await res.json()) as GrafanaFolder;
  return json;
}

export async function ensureFolderId(baseUrl: string, token: string, title: string, parentUid?: string): Promise<number> {
  const existing = await findFolderByTitle(baseUrl, token, title);
  if (existing) return existing.id;
  const created = await createFolder(baseUrl, token, title, parentUid);
  return created.id;
}

async function uploadDashboard(baseUrl: string, token: string, folderId: number, dashboardData: dashboard.Dashboard): Promise<{ uid?: string }> {
  const url = `${baseUrl}/api/dashboards/db`;
  const res = await grafanaFetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ dashboard: dashboardData, folderId, overwrite: true })
  });
  return (await res.json()) as { uid?: string };
}

export type UploadConfig = {
  baseUrl: string;
  token: string;
  parentFolder: string;
  serviceName: string;
  dashboard: dashboard.Dashboard;
};

export type UploadResult = {
  success: true;
  uid: string;
  folderPath: string;
  dashboardUrl: string;
} | {
  success: false;
  error: string;
};

export async function uploadDashboardToGrafana(config: UploadConfig, parentFolderUid?: string): Promise<UploadResult> {
  try {
    // Note: Folders should be ensured before calling this function to avoid race conditions
    // Use just the service name as the folder title, not the full path
    const serviceFolderId = await ensureFolderId(config.baseUrl, config.token, config.serviceName, parentFolderUid);

    const result = await uploadDashboard(config.baseUrl, config.token, serviceFolderId, config.dashboard);
    const uid = result?.uid ?? config.dashboard.uid;
    
    if (!uid) {
      throw new Error('Dashboard UID is required but not available');
    }

    return {
      success: true,
      uid,
      folderPath: `${config.parentFolder}/${config.serviceName}`,
      dashboardUrl: `${config.baseUrl}/d/${uid}`
    };
  } catch (error) {
    return {
      success: false,
      error: String(error)
    };
  }
}

