const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ASANA_PAT = process.env.ASANA_PAT;
const ASANA_BASE = "https://app.asana.com/api/1.0";
const WORKSPACE_GID = "1214501987923785";

// April 2026 project (existing)
const APRIL_PROJECT_GID = "1214507349561917";

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// ── Asana helpers ──────────────────────────────────────────
function asanaHeaders() {
        return {
                  Authorization: `Bearer ${ASANA_PAT}`,
                  "Content-Type": "application/json",
                  Accept: "application/json",
        };
}

async function asanaGet(path) {
        const res = await fetch(`${ASANA_BASE}${path}`, { headers: asanaHeaders() });
        if (!res.ok) {
                  const body = await res.text();
                  throw new Error(`GET ${path} -> ${res.status}: ${body}`);
        }
        return (await res.json()).data;
}

async function asanaPost(path, body) {
        const res = await fetch(`${ASANA_BASE}${path}`, {
                  method: "POST",
                  headers: asanaHeaders(),
                  body: JSON.stringify({ data: body }),
        });
        if (!res.ok) {
                  const text = await res.text();
                  throw new Error(`POST ${path} -> ${res.status}: ${text}`);
        }
        return (await res.json()).data;
}

async function asanaPut(path, body) {
        const res = await fetch(`${ASANA_BASE}${path}`, {
                  method: "PUT",
                  headers: asanaHeaders(),
                  body: JSON.stringify({ data: body }),
        });
        if (!res.ok) {
                  const text = await res.text();
                  throw new Error(`PUT ${path} -> ${res.status}: ${text}`);
        }
        return (await res.json()).data;
}

// ── Report Data ──────────────────────────────────────────────────
const REPORT_DATA = {
        "April 2026": {
                  month: "April 2026",
                  website: { activeUsers: 2517, sessions: 2836, pageViews: 5220, newUsers: 2329, engagedSessions: 1606, avgSessionDuration: "00:02:05", bounceRate: 55.2, pageViewsPerSession: 1.84 },
                  traffic: { direct: 1245, organicSearch: 1102, organicSocial: 98, referral: 89, unassigned: 302 },
                  seo: { organicClicks: 943, impressions: 108146, avgPosition: 1, queriesOnPage1: 196, keywordsTop10: 4 },
                  listings: { listingScore: 753, citations: 3, accurate: 29, possibleErrors: 2, notFound: 22 },
                  leads: { messages: 2, conversations: 0, leads: 0, totalContacts: 0, totalCompanies: 0, webChatVisitors: 2 },
                  tasks: { total: 26, inProgress: 20, completed: 6 },
                  projects: { total: 1, inProgress: 1, completed: 0, progress: 40 }
        },
        "March 2026": {
                  month: "March 2026",
                  website: { activeUsers: 3423, sessions: 3778, pageViews: 5932, newUsers: 3204, engagedSessions: 1561, avgSessionDuration: "00:01:36", bounceRate: 58.68, pageViewsPerSession: 1.57 },
                  traffic: { direct: 1882, organicSearch: 1581, organicSocial: 161, referral: 140, unassigned: 14 },
                  seo: { organicClicks: 1216, impressions: 125176, avgPosition: 1, queriesOnPage1: 193, keywordsTop10: 2 },
                  listings: { listingScore: 718, citations: 2, accurate: 29, possibleErrors: 2, notFound: 22 },
                  leads: { messages: 0, conversations: 0, leads: 0, totalContacts: 0, totalCompanies: 0, webChatVisitors: 0 },
                  tasks: { total: 26, inProgress: 19, completed: 7 },
                  projects: { total: 1, inProgress: 1, completed: 0, progress: 38 }
        }
};

// ── Known custom field GIDs (from April project) ──────────────────
const KNOWN_FIELD_GIDS = {
        "Active Users": "1214510299458961",
        "Sessions": "1214510155353880",
        "Page Views": "1214510493004254",
        "New Users": "1214510299501618",
        "Engaged Sessions": "1214510210969752",
        "Organic Clicks": "1214510153508385",
        "Impressions": "1214510210913717",
        "Avg Position": "1214510155277663",
        "Keywords Top 10": "1214510324491246",
        "Listing Score": "1214510324149020",
        "Accurate Listings": "1214510324228549",
        "Web Chat Visitors": "1214510210988487"
};

// ── Ensure custom fields on a project (reuse existing workspace fields) ──
async function ensureCustomFields(projectGid, send) {
        send("Setting up custom fields...");

  // Get existing custom fields on this project
  const existing = await asanaGet(`/projects/${projectGid}/custom_field_settings`);
        const existingGids = existing.map(cf => cf.custom_field.gid);

  const fieldGids = {};

  // Add existing fields to map
  for (const cf of existing) {
            fieldGids[cf.custom_field.name] = cf.custom_field.gid;
  }

  // Add known fields that aren't yet on this project
  for (const [name, gid] of Object.entries(KNOWN_FIELD_GIDS)) {
            if (!existingGids.includes(gid)) {
                        send(`  Adding field: ${name}`);
                        try {
                                      await asanaPost(`/projects/${projectGid}/addCustomFieldSetting`, {
                                                      custom_field: gid,
                                                      is_important: true
                                      });
                        } catch(e) {
                                      send(`  (field already exists on project)`);
                        }
            }
            fieldGids[name] = gid;
  }

  send(`Custom fields ready (${Object.keys(fieldGids).length} fields)`);
        return fieldGids;
}

// ── Ensure section exists ──────────────────────────────────────
async function ensureSection(projectGid, name, send) {
        const sections = await asanaGet(`/projects/${projectGid}/sections`);
        const existing = sections.find(s => s.name === name);
        if (existing) return existing.gid;
        send(`  Creating section: ${name}`);
        const created = await asanaPost(`/projects/${projectGid}/sections`, { name });
        return created.gid;
}

// ── Upsert a task ──────────────────────────────────────────────
async function upsertTask(projectGid, sectionGid, taskName, notes, customFields, send) {
        const tasks = await asanaGet(`/projects/${projectGid}/tasks?opt_fields=name,gid`);
        const existing = tasks.find(t => t.name === taskName);

  if (existing) {
            send(`  Updating: ${taskName}`);
            await asanaPut(`/tasks/${existing.gid}`, { notes, custom_fields: customFields });
            return existing.gid;
  } else {
            send(`  Creating: ${taskName}`);
            const task = await asanaPost("/tasks", {
                        name: taskName,
                        notes,
                        projects: [projectGid],
                        custom_fields: customFields
            });
            await asanaPost(`/sections/${sectionGid}/addTask`, { task: task.gid });
            return task.gid;
  }
}

// ── Create new Asana project ──────────────────────────────────
async function createMonthProject(monthKey, send) {
        send(`Creating new Asana project: "Executive Report - ${monthKey}"`);
        const project = await asanaPost("/projects", {
                  workspace: WORKSPACE_GID,
                  name: `Executive Report - ${monthKey}`,
                  notes: `Auto-generated from Executive Report PDF for ${monthKey}. Visit Fairfield, Fairfield CVB`,
                  color: "dark-purple",
                  default_view: "list"
        });
        send(`Project created: ${project.gid}`);
        return project.gid;
}

// ── Main sync function ──────────────────────────────────────────
async function syncToAsana(projectGid, monthKey, send) {
        const data = REPORT_DATA[monthKey];
        if (!data) throw new Error(`No data found for month: ${monthKey}`);

  send(`Syncing ${monthKey} data to Asana...`);

  const fieldGids = await ensureCustomFields(projectGid, send);

  send("Updating project description...");
        await asanaPut(`/projects/${projectGid}`, {
                  notes: `Executive Report - ${monthKey} | Visit Fairfield, Fairfield CVB\n\nWebsite: Active Users ${data.website.activeUsers} | Sessions ${data.website.sessions} | Page Views ${data.website.pageViews}\nSEO: Organic Clicks ${data.seo.organicClicks} | Impressions ${data.seo.impressions}\nListings: Score ${data.listings.listingScore}\nLeads: Messages ${data.leads.messages}`
        });

  send("Ensuring sections...");
        const sections = {
                  website: await ensureSection(projectGid, "Website Performance", send),
                  traffic: await ensureSection(projectGid, "Traffic Sources", send),
                  seo: await ensureSection(projectGid, "SEO Performance", send),
                  listings: await ensureSection(projectGid, "Listings and Citations", send),
                  leads: await ensureSection(projectGid, "Leads and Engagement", send),
                  overview: await ensureSection(projectGid, "Overview", send)
        };

  send("Syncing KPI tasks...");

  await upsertTask(projectGid, sections.website,
                       `KPI Snapshot: Website - ${monthKey}`,
                       `Website Metrics for ${monthKey}\n- Active Users: ${data.website.activeUsers}\n- Sessions: ${data.website.sessions}\n- Page Views: ${data.website.pageViews}\n- New Users: ${data.website.newUsers}\n- Engaged Sessions: ${data.website.engagedSessions}\n- Avg Duration: ${data.website.avgSessionDuration}\n- Bounce Rate: ${data.website.bounceRate}%`,
                   {
                               [fieldGids["Active Users"]]: data.website.activeUsers,
                               [fieldGids["Sessions"]]: data.website.sessions,
                               [fieldGids["Page Views"]]: data.website.pageViews,
                               [fieldGids["New Users"]]: data.website.newUsers,
                               [fieldGids["Engaged Sessions"]]: data.website.engagedSessions
                   },
                       send
                     );

  await upsertTask(projectGid, sections.traffic,
                       `Traffic Sources - ${monthKey}`,
                       `Traffic Sources for ${monthKey}\n- Direct: ${data.traffic.direct}\n- Organic Search: ${data.traffic.organicSearch}\n- Organic Social: ${data.traffic.organicSocial}\n- Referral: ${data.traffic.referral}\n- Unassigned: ${data.traffic.unassigned}`,
                   {}, send
                     );

  await upsertTask(projectGid, sections.seo,
                       `KPI Snapshot: SEO - ${monthKey}`,
                       `SEO Performance for ${monthKey}\n- Organic Clicks: ${data.seo.organicClicks}\n- Impressions: ${data.seo.impressions}\n- Avg Position: ${data.seo.avgPosition}\n- Queries on Page 1: ${data.seo.queriesOnPage1}\n- Keywords Top 10: ${data.seo.keywordsTop10}`,
                   {
                               [fieldGids["Organic Clicks"]]: data.seo.organicClicks,
                               [fieldGids["Impressions"]]: data.seo.impressions,
                               [fieldGids["Avg Position"]]: data.seo.avgPosition,
                               [fieldGids["Keywords Top 10"]]: data.seo.keywordsTop10
                   },
                       send
                     );

  await upsertTask(projectGid, sections.listings,
                       `KPI Snapshot: Listings - ${monthKey}`,
                       `Listings for ${monthKey}\n- Listing Score: ${data.listings.listingScore}\n- Accurate: ${data.listings.accurate}\n- Possible Errors: ${data.listings.possibleErrors}\n- Not Found: ${data.listings.notFound}\n- Citations: ${data.listings.citations}`,
                   {
                               [fieldGids["Listing Score"]]: data.listings.listingScore,
                               [fieldGids["Accurate Listings"]]: data.listings.accurate
                   },
                       send
                     );

  await upsertTask(projectGid, sections.leads,
                       `KPI Snapshot: Leads - ${monthKey}`,
                       `Leads for ${monthKey}\n- Messages: ${data.leads.messages}\n- Conversations: ${data.leads.conversations}\n- Leads: ${data.leads.leads}\n- Total Contacts: ${data.leads.totalContacts}\n- Web Chat: ${data.leads.webChatVisitors}`,
                   { [fieldGids["Web Chat Visitors"]]: data.leads.webChatVisitors },
                       send
                     );

  await upsertTask(projectGid, sections.overview,
                       `Overview - ${monthKey}`,
                       `Overview for ${monthKey}\nTasks: ${data.tasks.total} (${data.tasks.inProgress} in progress, ${data.tasks.completed} completed)\nProjects: ${data.projects.total} (${data.projects.progress}% complete)\nTop KPIs: Active Users ${data.website.activeUsers} | Listing Score ${data.listings.listingScore} | Organic Clicks ${data.seo.organicClicks}`,
                   {}, send
                     );

  send(`Sync complete for ${monthKey}!`);
        send(`Your Asana project now has: Custom fields + KPI snapshot tasks with all metric values`);
        send(`Go to Dashboard tab -> Add widget -> Custom field total to add KPI widgets`);
}

// ── API Routes ──────────────────────────────────────────────────

app.get("/api/months", (req, res) => {
        res.json({ months: Object.keys(REPORT_DATA).map(key => ({ key, label: key })) });
});

app.get("/api/report/:month", (req, res) => {
        const monthKey = decodeURIComponent(req.params.month);
        const data = REPORT_DATA[monthKey];
        if (!data) return res.status(404).json({ error: `No data for ${monthKey}` });
        res.json(data);
});

// Sync April 2026 (existing project)
app.get("/sync", async (req, res) => {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();
        const send = (msg) => res.write(`data: ${msg}\n\n`);
        try {
                  await syncToAsana(APRIL_PROJECT_GID, "April 2026", send);
                  send("DONE");
        } catch (err) {
                  send(`Error: ${err.message}`);
                  send("DONE");
        }
        res.end();
});

// Sync any month (creates new project if no projectGid provided)
app.post("/sync-month", async (req, res) => {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();
        const send = (msg) => res.write(`data: ${msg}\n\n`);
        const { monthKey, projectGid } = req.body;
        try {
                  let targetGid = projectGid;
                  if (!targetGid) {
                              targetGid = await createMonthProject(monthKey, send);
                  }
                  await syncToAsana(targetGid, monthKey, send);
                  send(`PROJECT_GID:${targetGid}`);
                  send("DONE");
        } catch (err) {
                  send(`Error: ${err.message}`);
                  send("DONE");
        }
        res.end();
});

app.get("/api/asana-projects", async (req, res) => {
        try {
                  const projects = await asanaGet(`/workspaces/${WORKSPACE_GID}/projects`);
                  res.json({ projects });
        } catch (err) {
                  res.status(500).json({ error: err.message });
        }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
