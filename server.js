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
              throw new Error(`GET ${path} → ${res.status}: ${body}`);
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
              throw new Error(`POST ${path} → ${res.status}: ${text}`);
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
              throw new Error(`PUT ${path} → ${res.status}: ${text}`);
      }
      return (await res.json()).data;
}

// ── Report Data for both months ──────────────────────────────────
const REPORT_DATA = {
      "April 2026": {
              month: "April 2026",
              website: {
                        activeUsers: 2517, sessions: 2836, pageViews: 5220,
                        newUsers: 2329, engagedSessions: 1606, avgSessionDuration: "00:02:05",
                        bounceRate: 55.2, pageViewsPerSession: 1.84
              },
              traffic: {
                        direct: 1245, organicSearch: 1102, organicSocial: 98,
                        referral: 89, unassigned: 302
              },
              seo: {
                        organicClicks: 943, impressions: 108146, avgPosition: 1,
                        queriesOnPage1: 196, keywordsTop10: 4
              },
              listings: {
                        listingScore: 753, citations: 3, accurate: 29,
                        possibleErrors: 2, notFound: 22
              },
              leads: {
                        messages: 2, conversations: 0, leads: 0,
                        totalContacts: 0, totalCompanies: 0, webChatVisitors: 2
              },
              tasks: { total: 26, inProgress: 20, completed: 6 },
              projects: { total: 1, inProgress: 1, completed: 0, progress: 40 }
      },
      "March 2026": {
              month: "March 2026",
              website: {
                        activeUsers: 3423, sessions: 3778, pageViews: 5932,
                        newUsers: 3204, engagedSessions: 1561, avgSessionDuration: "00:01:36",
                        bounceRate: 58.68, pageViewsPerSession: 1.57
              },
              traffic: {
                        direct: 1882, organicSearch: 1581, organicSocial: 161,
                        referral: 140, unassigned: 14
              },
              seo: {
                        organicClicks: 1216, impressions: 125176, avgPosition: 1,
                        queriesOnPage1: 193, keywordsTop10: 2
              },
              listings: {
                        listingScore: 718, citations: 2, accurate: 29,
                        possibleErrors: 2, notFound: 22
              },
              leads: {
                        messages: 0, conversations: 0, leads: 0,
                        totalContacts: 0, totalCompanies: 0, webChatVisitors: 0
              },
              tasks: { total: 26, inProgress: 19, completed: 7 },
              projects: { total: 1, inProgress: 1, completed: 0, progress: 38 }
      }
};

// ── Custom field definitions ──────────────────────────────────────
const CUSTOM_FIELDS = [
    { name: "Active Users", type: "number" },
    { name: "Sessions", type: "number" },
    { name: "Page Views", type: "number" },
    { name: "New Users", type: "number" },
    { name: "Engaged Sessions", type: "number" },
    { name: "Organic Clicks", type: "number" },
    { name: "Impressions", type: "number" },
    { name: "Avg Position", type: "number" },
    { name: "Keywords Top 10", type: "number" },
    { name: "Listing Score", type: "number" },
    { name: "Accurate Listings", type: "number" },
    { name: "Web Chat Visitors", type: "number" }
    ];

// ── Ensure custom fields on a project ──────────────────────────
async function ensureCustomFields(projectGid, send) {
      send("⚙️ Checking custom fields...");

  // Get existing custom fields on this project
  const existing = await asanaGet(`/projects/${projectGid}/custom_field_settings`);
      const existingNames = existing.map(cf => cf.custom_field.name);

  const fieldGids = {};

  // Map existing fields
  for (const cf of existing) {
          fieldGids[cf.custom_field.name] = cf.custom_field.gid;
  }

  // Create missing fields
  for (const field of CUSTOM_FIELDS) {
          if (!existingNames.includes(field.name)) {
                    send(`  Creating field: ${field.name}`);
                    const created = await asanaPost("/custom_fields", {
                                workspace: WORKSPACE_GID,
                                name: field.name,
                                type: field.type,
                                precision: 0
                    });
                    await asanaPost(`/projects/${projectGid}/addCustomFieldSetting`, {
                                custom_field: created.gid,
                                is_important: true
                    });
                    fieldGids[field.name] = created.gid;
          }
  }

  send(`✅ Custom fields ready (${Object.keys(fieldGids).length} fields)`);
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

// ── Upsert a task in a section ──────────────────────────────────
async function upsertTask(projectGid, sectionGid, taskName, notes, customFields, send) {
      // Search for existing task
  const tasks = await asanaGet(`/projects/${projectGid}/tasks?opt_fields=name,gid`);
      const existing = tasks.find(t => t.name === taskName);

  if (existing) {
          send(`  ✏️ Updating: ${taskName}`);
          await asanaPut(`/tasks/${existing.gid}`, { notes, custom_fields: customFields });
          return existing.gid;
  } else {
          send(`  ➕ Creating: ${taskName}`);
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

// ── Create new Asana project for a month ──────────────────────
async function createMonthProject(monthKey, send) {
      const data = REPORT_DATA[monthKey];
      send(`🏗️ Creating new Asana project: "Executive Report — ${monthKey}"`);

  const project = await asanaPost("/projects", {
          workspace: WORKSPACE_GID,
          name: `Executive Report — ${monthKey}`,
          notes: `Auto-generated from Executive Report PDF for ${monthKey}. Visit Fairfield, Fairfield CVB — 107 North Main Street, Fairfield, IA`,
          color: "dark-purple",
          default_view: "list"
  });

  send(`✅ Project created: ${project.gid}`);
      return project.gid;
}

// ── Main sync function ──────────────────────────────────────────
async function syncToAsana(projectGid, monthKey, send) {
      const data = REPORT_DATA[monthKey];
      if (!data) throw new Error(`No data found for month: ${monthKey}`);

  send(`\n📊 Syncing ${monthKey} data to Asana...`);

  // 1. Ensure custom fields
  const fieldGids = await ensureCustomFields(projectGid, send);

  // 2. Update project description
  send("📝 Updating project description...");
      await asanaPut(`/projects/${projectGid}`, {
              notes: `Executive Report — ${monthKey} | Visit Fairfield, Fairfield CVB\n\nWebsite: Active Users ${data.website.activeUsers} | Sessions ${data.website.sessions} | Page Views ${data.website.pageViews}\nSEO: Organic Clicks ${data.seo.organicClicks} | Impressions ${data.seo.impressions} | Avg Position ${data.seo.avgPosition}\nListings: Score ${data.listings.listingScore} | Accurate ${data.listings.accurate}\nLeads: Messages ${data.leads.messages} | Web Chat ${data.leads.webChatVisitors}`
      });

  // 3. Ensure sections
  send("📁 Ensuring sections...");
      const sections = {
              website: await ensureSection(projectGid, "🌐 Website Performance", send),
              traffic: await ensureSection(projectGid, "🚦 Traffic Sources", send),
              seo: await ensureSection(projectGid, "🔍 SEO Performance", send),
              listings: await ensureSection(projectGid, "📍 Listings & Citations", send),
              leads: await ensureSection(projectGid, "👥 Leads & Engagement", send),
              overview: await ensureSection(projectGid, "📊 Overview", send)
      };

  // 4. Upsert KPI tasks
  send("\n📌 Syncing KPI tasks...");

  // Website KPIs
  await upsertTask(projectGid, sections.website,
                       `📊 KPI Snapshot: Website — ${monthKey}`,
                       `Website Metrics for ${monthKey}\n• Active Users: ${data.website.activeUsers}\n• Sessions: ${data.website.sessions}\n• Page Views: ${data.website.pageViews}\n• New Users: ${data.website.newUsers}\n• Engaged Sessions: ${data.website.engagedSessions}\n• Avg Session Duration: ${data.website.avgSessionDuration}\n• Bounce Rate: ${data.website.bounceRate}%`,
                   {
                             [fieldGids["Active Users"]]: data.website.activeUsers,
                             [fieldGids["Sessions"]]: data.website.sessions,
                             [fieldGids["Page Views"]]: data.website.pageViews,
                             [fieldGids["New Users"]]: data.website.newUsers,
                             [fieldGids["Engaged Sessions"]]: data.website.engagedSessions
                   },
                       send
                     );

  // Traffic KPIs
  await upsertTask(projectGid, sections.traffic,
                       `🚦 Traffic Sources — ${monthKey}`,
                       `Traffic Sources for ${monthKey}\n• Direct: ${data.traffic.direct}\n• Organic Search: ${data.traffic.organicSearch}\n• Organic Social: ${data.traffic.organicSocial}\n• Referral: ${data.traffic.referral}\n• Unassigned: ${data.traffic.unassigned}`,
                   {},
                       send
                     );

  // SEO KPIs
  await upsertTask(projectGid, sections.seo,
                       `📊 KPI Snapshot: SEO — ${monthKey}`,
                       `SEO Performance for ${monthKey}\n• Organic Clicks: ${data.seo.organicClicks}\n• Impressions: ${data.seo.impressions}\n• Average Position: ${data.seo.avgPosition}\n• Queries on Page 1: ${data.seo.queriesOnPage1}\n• Keywords in Top 10: ${data.seo.keywordsTop10}`,
                   {
                             [fieldGids["Organic Clicks"]]: data.seo.organicClicks,
                             [fieldGids["Impressions"]]: data.seo.impressions,
                             [fieldGids["Avg Position"]]: data.seo.avgPosition,
                             [fieldGids["Keywords Top 10"]]: data.seo.keywordsTop10
                   },
                       send
                     );

  // Listings KPIs
  await upsertTask(projectGid, sections.listings,
                       `📊 KPI Snapshot: Listings — ${monthKey}`,
                       `Listings & Citations for ${monthKey}\n• Listing Score: ${data.listings.listingScore}\n• Accurate Listings: ${data.listings.accurate}\n• Possible Errors: ${data.listings.possibleErrors}\n• Not Found: ${data.listings.notFound}\n• Citations: ${data.listings.citations}`,
                   {
                             [fieldGids["Listing Score"]]: data.listings.listingScore,
                             [fieldGids["Accurate Listings"]]: data.listings.accurate
                   },
                       send
                     );

  // Leads KPIs
  await upsertTask(projectGid, sections.leads,
                       `📊 KPI Snapshot: Leads — ${monthKey}`,
                       `Leads & Engagement for ${monthKey}\n• Messages: ${data.leads.messages}\n• Conversations: ${data.leads.conversations}\n• Leads: ${data.leads.leads}\n• Total Contacts: ${data.leads.totalContacts}\n• Web Chat Visitors: ${data.leads.webChatVisitors}`,
                   {
                             [fieldGids["Web Chat Visitors"]]: data.leads.webChatVisitors
                   },
                       send
                     );

  // Overview
  await upsertTask(projectGid, sections.overview,
                       `📈 Overview — ${monthKey}`,
                       `Executive Report Overview for ${monthKey}\n\nTasks: ${data.tasks.total} total (${data.tasks.inProgress} in progress, ${data.tasks.completed} completed)\nProjects: ${data.projects.total} (${data.projects.progress}% complete)\n\nTop KPIs:\n• Active Users: ${data.website.activeUsers}\n• Listing Score: ${data.listings.listingScore}\n• Organic Clicks: ${data.seo.organicClicks}\n• Impressions: ${data.seo.impressions}`,
                   {},
                       send
                     );

  send(`\n✅ Sync complete for ${monthKey}!`);
      send(`\nYour Asana project now has:`);
      send(`  • Custom fields: Active Users, Sessions, Page Views, Organic Clicks, Listing Score, etc.`);
      send(`  • KPI snapshot tasks with all metric values`);
      send(`  • Updated project description with full data summary`);
      send(`\n📊 To view in Asana dashboard:`);
      send(`  1. Go to your project → Dashboard tab`);
      send(`  2. Click 'Add widget' → 'Custom field total'`);
      send(`  3. Select any KPI field (Active Users, Listing Score, etc.)`);
}

// ── API Routes ──────────────────────────────────────────────────

// Get available months
app.get("/api/months", (req, res) => {
      const months = Object.keys(REPORT_DATA).map(key => ({
              key,
              label: key,
              hasData: true
      }));
      res.json({ months });
});

// Get report data for a specific month
app.get("/api/report/:month", (req, res) => {
      const monthKey = decodeURIComponent(req.params.month);
      const data = REPORT_DATA[monthKey];
      if (!data) {
              return res.status(404).json({ error: `No data for ${monthKey}` });
      }
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
                  send(`❌ Error: ${err.message}`);
                  send("DONE");
          }
      res.end();
});

// Sync a specific month (creates new project if needed)
app.post("/sync-month", async (req, res) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

           const send = (msg) => res.write(`data: ${msg}\n\n`);
      const { monthKey, projectGid } = req.body;

           try {
                   let targetProjectGid = projectGid;

        if (!targetProjectGid) {
                  // Create a new project for this month
                     targetProjectGid = await createMonthProject(monthKey, send);
        }

        await syncToAsana(targetProjectGid, monthKey, send);
                   send(`PROJECT_GID:${targetProjectGid}`);
                   send("DONE");
           } catch (err) {
                   send(`❌ Error: ${err.message}`);
                   send("DONE");
           }
      res.end();
});

// List all Asana projects in workspace
app.get("/api/asana-projects", async (req, res) => {
      try {
              const projects = await asanaGet(`/workspaces/${WORKSPACE_GID}/projects`);
              res.json({ projects });
      } catch (err) {
              res.status(500).json({ error: err.message });
      }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
