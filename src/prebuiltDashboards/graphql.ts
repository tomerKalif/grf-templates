import { prometheusDatasource } from '../templates/datasources.js';



export function createGraphQLDashboard(datasourceUid: string = prometheusDatasource.uid, tags: string[] = [], serviceName?: string) {
  const dashboard = {
  "__inputs": [
    {
      "name": "DS_PROMETHEUS_CENTRALIZED",
      "label": "Prometheus Centralized",
      "description": "",
      "type": "datasource",
      "pluginId": "prometheus",
      "pluginName": "Prometheus"
    }
  ],
  "__elements": [],
  "__requires": [
    {
      "type": "grafana",
      "id": "grafana",
      "name": "Grafana",
      "version": "8.4.7"
    },
    {
      "type": "datasource",
      "id": "prometheus",
      "name": "Prometheus",
      "version": "1.0.0"
    },
    {
      "type": "panel",
      "id": "stat",
      "name": "Stat",
      "version": ""
    },
    {
      "type": "panel",
      "id": "table",
      "name": "Table",
      "version": ""
    }
  ],
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": {
          "type": "grafana",
          "uid": "-- Grafana --"
        },
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "target": {
          "limit": 100,
          "matchAny": false,
          "tags": [],
          "type": "dashboard"
        },
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 0,
  "id": null,
  "iteration": 1698319749493,
  "links": [],
  "liveNow": false,
  "panels": [
    {
      "collapsed": false,
      "gridPos": {
        "h": 1,
        "w": 24,
        "x": 0,
        "y": 0
      },
      "id": 24,
      "panels": [],
      "title": "Success rate",
      "type": "row"
    },
    {
      "fieldConfig": {
        "defaults": {
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "red",
                "value": null
              },
              {
                "color": "green",
                "value": 95
              }
            ]
          },
          "unit": "percent"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 24,
        "x": 0,
        "y": 1
      },
      "id": 6,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto"
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": true,
          "expr": "(1-(sum(graphql_envelop_error_result{ pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"})/sum(graphql_envelop_request{ pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"})))*100",
          "instant": false,
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Success rate",
      "transformations": [],
      "type": "stat"
    },
    {
      "fieldConfig": {
        "defaults": {
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "red",
                "value": null
              }
            ]
          },
          "unit": "short"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 6,
        "x": 0,
        "y": 9
      },
      "id": 8,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto"
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": true,
          "expr": "sum(graphql_envelop_error_result{ operationType=\"query\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"})",
          "instant": false,
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Query errors",
      "type": "stat"
    },
    {
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "custom": {
            "align": "auto",
            "displayMode": "auto",
            "filterable": true
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 6,
        "x": 6,
        "y": 9
      },
      "id": 14,
      "options": {
        "footer": {
          "fields": [],
          "reducer": [
            "sum"
          ],
          "show": true
        },
        "frameIndex": 2,
        "showHeader": true,
        "sortBy": [
          {
            "desc": true,
            "displayName": "Value"
          }
        ]
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": false,
          "expr": "sum(graphql_envelop_error_result{ operationType=\"query\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}) by (operationName)",
          "format": "table",
          "instant": true,
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Queries error",
      "transformations": [
        {
          "id": "organize",
          "options": {
            "excludeByName": {
              "Time": true
            },
            "indexByName": {},
            "renameByName": {
              "Value": ""
            }
          }
        }
      ],
      "type": "table"
    },
    {
      "fieldConfig": {
        "defaults": {
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "red",
                "value": null
              }
            ]
          },
          "unit": "short"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 6,
        "x": 12,
        "y": 9
      },
      "id": 10,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto"
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": false,
          "expr": "count(graphql_envelop_error_result{ operationType=\"mutation\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"})",
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Mutation errors",
      "type": "stat"
    },
    {
      "fieldConfig": {
        "defaults": {
          "custom": {
            "align": "auto",
            "displayMode": "auto",
            "filterable": true
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 6,
        "x": 18,
        "y": 9
      },
      "id": 15,
      "options": {
        "footer": {
          "fields": "",
          "reducer": [
            "sum"
          ],
          "show": false
        },
        "frameIndex": 2,
        "showHeader": true,
        "sortBy": [
          {
            "desc": true,
            "displayName": "Value"
          }
        ]
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": false,
          "expr": "sum(graphql_envelop_error_result{ operationType=\"mutation\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}) by (operationName)",
          "format": "table",
          "instant": true,
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Mutations error",
      "transformations": [
        {
          "id": "organize",
          "options": {
            "excludeByName": {
              "Time": true
            },
            "indexByName": {},
            "renameByName": {}
          }
        }
      ],
      "type": "table"
    },
    {
      "collapsed": false,
      "gridPos": {
        "h": 1,
        "w": 24,
        "x": 0,
        "y": 17
      },
      "id": 22,
      "panels": [],
      "title": "Performance",
      "type": "row"
    },
    {
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 0.5
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 18
      },
      "id": 28,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto"
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": true,
          "expr": "histogram_quantile(0.5, sum(rate(graphql_envelop_request_duration_bucket{ pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[5m])) by (le))",
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Median query latency (query & mutation)",
      "type": "stat"
    },
    {
      "description": "",
      "fieldConfig": {
        "defaults": {
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 0.25
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 18
      },
      "id": 12,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto"
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": false,
          "expr": "sum(rate(graphql_envelop_request_time_summary_sum{ pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[5m]))/sum(rate(graphql_envelop_request_time_summary_count{ pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[5m]))",
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Average query latency (query & mutation)",
      "type": "stat"
    },
    {
      "description": "Over the last 5 minutes",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 0.5
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 4,
        "x": 0,
        "y": 26
      },
      "id": 26,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto"
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": true,
          "expr": "histogram_quantile(0.95, sum(rate(graphql_envelop_request_duration_bucket{ operationType=\"query\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[5m])) by (le))",
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Query latency (p95)",
      "type": "stat"
    },
    {
      "description": "Over the last 5 minutes",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 0.5
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 4,
        "x": 4,
        "y": 26
      },
      "id": 32,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto"
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": true,
          "expr": "histogram_quantile(0.9, sum(rate(graphql_envelop_request_duration_bucket{ operationType=\"query\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[5m])) by (le))",
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Query latency (p90)",
      "type": "stat"
    },
    {
      "description": "Over the last 5 minutes",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 0.5
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 4,
        "x": 8,
        "y": 26
      },
      "id": 33,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto"
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": true,
          "expr": "histogram_quantile(0.5, sum(rate(graphql_envelop_request_duration_bucket{ operationType=\"query\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[5m])) by (le))",
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Query latency (p50)",
      "type": "stat"
    },
    {
      "description": "Over the last 5 minutes",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 0.5
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 4,
        "x": 12,
        "y": 26
      },
      "id": 34,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto"
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": true,
          "expr": "histogram_quantile(0.95, sum(rate(graphql_envelop_request_duration_bucket{ operationType=\"mutation\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[5m])) by (le))",
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Mutation latency (p95)",
      "type": "stat"
    },
    {
      "description": "Over the last 5 minutes",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 0.5
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 4,
        "x": 16,
        "y": 26
      },
      "id": 27,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto"
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": true,
          "expr": "histogram_quantile(0.9, sum(rate(graphql_envelop_request_duration_bucket{ operationType=\"mutation\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[5m])) by (le))",
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Mutation latency (p90)",
      "type": "stat"
    },
    {
      "description": "Over the last 5 minutes",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 0.5
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 4,
        "x": 20,
        "y": 26
      },
      "id": 35,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto"
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": true,
          "expr": "histogram_quantile(0.5, sum(rate(graphql_envelop_request_duration_bucket{ operationType=\"mutation\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[5m])) by (le))",
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Mutation latency (p50)",
      "type": "stat"
    },
    {
      "description": "Over the current duration frame",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "custom": {
            "align": "auto",
            "displayMode": "auto",
            "filterable": true
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 8,
        "x": 0,
        "y": 34
      },
      "id": 30,
      "options": {
        "footer": {
          "fields": [],
          "reducer": [
            "sum"
          ],
          "show": false
        },
        "frameIndex": 2,
        "showHeader": true,
        "sortBy": [
          {
            "desc": true,
            "displayName": "Value"
          }
        ]
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": false,
          "expr": "round((sum(increase(graphql_envelop_request_duration_bucket{ le=\"2.5\", operationType=\"query\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[$__range])) by (operationName)) - (sum(increase(graphql_envelop_request_duration_bucket{ le=\"1\", operationType=\"query\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[$__range])) by (operationName)))",
          "format": "table",
          "instant": true,
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Slow queries (>1s)",
      "transformations": [
        {
          "id": "organize",
          "options": {
            "excludeByName": {
              "Time": true
            },
            "indexByName": {
              "Time": 0,
              "Value": 2,
              "operationName": 1
            },
            "renameByName": {
              "Value": ""
            }
          }
        }
      ],
      "type": "table"
    },
    {
      "description": "Over selected time frame \n1.00-0.94 = Excellent\n0.93-0.85 = Good\n0.84-0.70 = Fair\n69 and 0.49 = Poor\n>0.49 = Bad",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "red",
                "value": null
              },
              {
                "color": "green",
                "value": 0.75
              }
            ]
          },
          "unit": "percentunit"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 8,
        "x": 8,
        "y": 34
      },
      "id": 25,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto"
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": false,
          "expr": "(sum(rate(graphql_envelop_request_duration_bucket{ le=\"0.25\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[$__range]))+sum(rate(graphql_envelop_request_duration_bucket{ le=\"1\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[$__range])))/2/sum(rate(graphql_envelop_request_duration_count{ pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[$__range]))",
          "instant": true,
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Apdex score (customer satisfaction)",
      "transformations": [],
      "type": "stat"
    },
    {
      "description": "Over the current duration frame",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "custom": {
            "align": "auto",
            "displayMode": "auto",
            "filterable": true
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 8,
        "x": 16,
        "y": 34
      },
      "id": 36,
      "options": {
        "footer": {
          "fields": [],
          "reducer": [
            "sum"
          ],
          "show": false
        },
        "frameIndex": 2,
        "showHeader": true,
        "sortBy": [
          {
            "desc": true,
            "displayName": "Value"
          }
        ]
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": false,
          "expr": "round((sum(increase(graphql_envelop_request_duration_bucket{ le=\"2.5\", operationType=\"mutation\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[$__range])) by (operationName)) - (sum(increase(graphql_envelop_request_duration_bucket{ le=\"1\", operationType=\"mutation\", pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}[$__range])) by (operationName)))",
          "format": "table",
          "instant": true,
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Slow mutations (>1s)",
      "transformations": [
        {
          "id": "organize",
          "options": {
            "excludeByName": {
              "Time": true
            },
            "indexByName": {
              "Time": 0,
              "Value": 2,
              "operationName": 1
            },
            "renameByName": {
              "Value": ""
            }
          }
        }
      ],
      "type": "table"
    },
    {
      "collapsed": false,
      "gridPos": {
        "h": 1,
        "w": 24,
        "x": 0,
        "y": 42
      },
      "id": 38,
      "panels": [],
      "title": "Deprecated fields",
      "type": "row"
    },
    {
      "description": "",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "custom": {
            "align": "auto",
            "displayMode": "auto",
            "filterable": true
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 24,
        "x": 0,
        "y": 43
      },
      "id": 41,
      "options": {
        "footer": {
          "fields": [],
          "reducer": [
            "sum"
          ],
          "show": false
        },
        "frameIndex": 2,
        "showHeader": true,
        "sortBy": [
          {
            "desc": true,
            "displayName": "Value"
          }
        ]
      },
      "pluginVersion": "8.4.7",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": datasourceUid
          },
          "exemplar": false,
          "expr": "sum(graphql_envelop_deprecated_field{ pod_container_name=\"$serviceName\", cluster_name=\"$cluster_name\"}) by (fieldName)",
          "format": "table",
          "instant": true,
          "interval": "",
          "legendFormat": "",
          "refId": "A"
        }
      ],
      "title": "Deprecated fields",
      "transformations": [
        {
          "id": "organize",
          "options": {
            "excludeByName": {
              "Time": true
            },
            "indexByName": {
              "Time": 0,
              "Value": 2,
              "fieldName": 1
            },
            "renameByName": {
              "Value": ""
            }
          }
        }
      ],
      "type": "table"
    }
  ],
  "refresh": "30s",
  "schemaVersion": 35,
  "style": "dark",
  "tags": tags,
  "templating": {
    "list": [
      {
        "current": {
          "selected": true,
          "text": "alpha",
          "value": "alpha"
        },
        "description": "Environment",
        "hide": 0,
        "includeAll": false,
        "label": "Environment",
        "multi": false,
        "name": "env",
        "options": [
          {
            "selected": true,
            "text": "alpha",
            "value": "alpha"
          },
          {
            "selected": false,
            "text": "dogfood",
            "value": "dogfood"
          }
        ],
        "query": "alpha,dogfood",
        "queryValue": "",
        "skipUrlSync": false,
        "type": "custom"
      },
      {
        "current": {
          "selected": true,
          "text": serviceName || "$__all",
          "value": serviceName || "$__all"
        },
        "description": "Service name",
        "hide": 0,
        "includeAll": true,
        "label": "Service",
        "multi": false,
        "name": "serviceName",
        "options": [],
        "query": "",
        "queryValue": "",
        "skipUrlSync": false,
        "type": "textbox"
      },
      {
        "current": {
          "selected": false,
          "text": "All",
          "value": "$__all"
        },
        "description": "Cluster",
        "hide": 0,
        "includeAll": true,
        "label": "Cluster",
        "multi": true,
        "name": "cluster_name",
        "options": [],
        "query": "",
        "queryValue": "",
        "skipUrlSync": false,
        "type": "custom",
        "allValue": ".*"
      }
    ]
  },
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "GraphQL Envelop",
  "uid": "iTbLeUAVk",
  "version": 53,
  "weekStart": "",
  "gnetId": 19864,
  "description": "GraphQL dashboard based on the Envelop wrapper by The Guild\r\n👉 https://the-guild.dev/graphql/envelop/plugins/use-prometheus"
  };

  return dashboard;
}

// Export default dashboard with central datasource
export const graphqlDashboard = createGraphQLDashboard();