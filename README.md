# GRF Templates – CI/CD Dashboards

## Local development

- Use the root docker compose to run Grafana + Prometheus:

```bash
docker compose up -d
```

- Build the project:

```bash
pnpm install
pnpm build
```

## Generate dashboards JSON

```bash
pnpm dashboards:build
```

Multiple dashboards:
- Preferred: add per-service builders under `src/templates/services/<service>/index.ts` and export them from `src/templates/services/index.ts`. The generator will discover and build all services automatically.
- Or provide a JSON file via `DASHBOARDS_CONFIG` env listing dashboard entries. Example:

```json
[
  {
    "dashboardTitle": "Service Monitoring Dashboard",
    "serviceName": "express-demo-server",
    "tags": ["generated", "express-demo-server"],
    "refresh": "30s",
    "timeRange": { "from": "now-1h", "to": "now" },
    "uids": {
      "main": "service-monitoring",
      "apiDeepDive": "express-demo-server-api-deep-dive",
      "dependenciesDeepDive": "express-demo-server-dependencies-deep-dive"
    }
  }
]
```

Environment (optional):
- SERVICE_NAME (default "express-demo-server")
- DASHBOARD_TITLE (default "Service Monitoring Dashboard")
- DASHBOARD_UID (default "service-monitoring")
- DASHBOARD_TAGS (comma-separated, default "generated,<SERVICE_NAME>")
- DASHBOARD_REFRESH (default "30s")
- DASHBOARD_TIME_FROM (default "now-1h")
- DASHBOARD_TIME_TO (default "now")
- DASHBOARDS_CONFIG (path to JSON array; overrides single-dashboard envs)

Outputs three files under out/:
- Main dashboard: <DASHBOARD_UID>.json
- API Deep Dive: <SERVICE_NAME>-api-deep-dive.json
- Dependencies Deep Dive: <SERVICE_NAME>-dependencies-deep-dive.json

## Upload dashboards to Grafana

```bash
pnpm dashboards:upload
```

Required:
- GRAFANA_URL
- GRAFANA_API_KEY

Optional:
- GRAFANA_PARENT_FOLDER – parent folder name (default "Services"); per-service folders are titled <PARENT>/<SERVICE>
- DASHBOARD_FILE_GLOB – defaults to out/*.json
- DRY_RUN=true – print actions, no API calls

 Notes:
 - All dashboards are organized under a single parent folder (default "Services"). Each service gets its own subfolder via naming convention: <PARENT>/<SERVICE>.
 - Uploads use overwrite: true and respect any uid present in the dashboard JSON for idempotency.

## CI

GitHub Actions workflow .github/workflows/dashboards.yml will:
- Install, build, generate dashboards
- Upload JSON artifacts
- Upload to Grafana if GRAFANA_URL and GRAFANA_API_KEY secrets are configured
