const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ASANA_PAT = process.env.ASANA_PAT;
const ASANA_BASE = "https://app.asana.com/api/1.0";

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// ── Asana helpers ──────────────────────────────────────────────────────────────

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

// ── Executive Report Data ──────────────────────────────────────────────────────

const REPORT_DATA = {
    business: "Visit Fairfield, Fairfield CVB",
    period: "April 2026",
    overview: {
          tasks: { total: 26, inProgress: 20, completed: 6 },
          projects: { total: 1, inProgress: 1, completed: 0 },
          projectUpdates: [
            { name: "Search Engine Optimization Standard", progress: 40, status: "In Progress" }
                ]
    },
    website: {
          activeUsers: { value: 2517, change: -788 },
          sessions: { value: 2836, change: -811 },
          avgSessionDuration: { value: "2:05", change: "+0:28" },
          pageViews: { value: 5220, change: -506 },
          pageViewsPerSession: { value: 1.84, change: +0.27 },
          newUsers: { value: 2329, change: -757 },
          bounceRate: { value: "59.91%", change: "+1.48%" },
          engagedSessions: { value: 1137, change: -379 },
          weeklyData: {
                  labels: ["Apr 5", "Apr 12", "Apr 19", "Apr 26"],
                  activeUsers: [380, 720, 850, 480],
                  sessions: [420, 810, 940, 550],
                  pageViews: [780, 1450, 1720, 1100]
          }
    },
    traffic: {
          sources: [
            { name: "Organic Search", value: 1190, change: -22.22 },
            { name: "Direct", value: 733, change: -59.44 },
            { name: "Paid Social", value: 173, change: 0 },
            { name: "Paid Other", value: 169, change: 0 },
            { name: "Referral", value: 100, change: -27.01 },
            { name: "Unassigned", value: 97, change: +592.86 },
            { name: "Paid Search", value: 26, change: 0 }
                ],
          topReferrals: [
            { name: "google", value: 1197, change: -8.14 },
            { name: "direct", value: 869, change: -51.91 },
            { name: "fb", value: 172, change: 0 },
            { name: "orange142", value: 169, change: 0 },
            { name: "not set", value: 99, change: +800 },
            { name: "bing", value: 94, change: -12.15 },
            { name: "yahoo", value: 55, change: -11.29 }
                ]
    },
    seo: {
          keywordsTop10: 4,
          avgPosition: 32,
          totalKeywordsUp: 0,
          googleSearchConsole: {
                  queries1stPage: { value: 176, change: -17 },
                  clicks: { value: 943, change: -233 },
                  impressions: { value: 108146, change: -13353 }
          },
          topQueries: [
            { query: "fairfield iowa", clicks: 60, avgPosition: 5.6 },
            { query: "things to do in fairfield iowa", clicks: 12, avgPosition: 2.5 },
            { query: "weather", clicks: 12, avgPosition: 5.6 },
            { query: "visit fairfield iowa", clicks: 12, avgPosition: 1.0 },
            { query: "haveda", clicks: 8, avgPosition: 5.7 }
                ],
          topPages: [
            { page: "/", clicks: 108, impressions: 13073 },
            { page: "/things-to-do", clicks: 36, impressions: 3186 },
            { page: "/blog-posts/morel-mushroom-hunting", clicks: 33, impressions: 3250 },
            { page: "/event-directory", clicks: 27, impressions: 2959 },
            { page: "/business/vintage-power-wagon-rally", clicks: 19, impressions: 144 }
                ],
          weeklyData: {
                  labels: ["Apr 2", "Apr 8", "Apr 14", "Apr 20", "Apr 26", "Apr 29"],
                  clicks: [45, 38, 42, 35, 28, 22],
                  impressions: [5200, 4800, 5100, 4200, 3800, 3100]
          }
    },
    listings: {
          score: 753,
          grade: "A",
          change: +30,
          startedAt: 399,
          industryAverage: 221,
          percentile95: 567,
          accurate: 29,
          possibleErrors: 2,
          notFound: 23,
          citations: 25,
          platforms: [
            { name: "Google", accuracy: "Accurate", status: "Syncing disabled" },
            { name: "Facebook", accuracy: "Possible Errors", status: "Syncing disabled" },
            { name: "Yelp", accuracy: "Possible Errors", status: "Synced" },
            { name: "Bing", accuracy: "Accurate", status: "Synced" },
            { name: "Neustar/Localeze", accuracy: "Accurate", status: "Submitted" },
            { name: "Data Axle", accuracy: "Not found", status: "Submitted" }
                ]
    },
    leads: {
          messages: { value: 0, change: 0 },
          conversations: { value: 0, change: 0 },
          leadsCreated: { value: 0, change: 0 },
          totalContacts: { value: 0, change: 0 },
          totalCompanies: { value: 0, change: 0 },
          webChatVisitors: { value: 2, change: +2 },
          webChatEngaged: { value: 0, change: 0 },
          capturedLeads: { value: 0, change: 0 }
    }
};

// ── API: Get report data ────────────────────────────────────────────────────────

app.get("/api/report", (req, res) => {
    res.json(REPORT_DATA);
});

// ── SSE: Sync to Asana ─────────────────────────────────────────────────────────

app.get("/sync", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

          const send = (msg) => res.write(`data: ${JSON.stringify({ msg })}\n\n`);
    const done = (url) => res.write(`data: ${JSON.stringify({ done: true, url })}\n\n`);
    const fail = (err) => res.write(`data: ${JSON.stringify({ error: err })}\n\n`);

          try {
                send("🔍 Connecting to Asana...");

      // Get workspace
      const workspaces = await asanaGet("/workspaces");
                const workspace = workspaces[0];
                send(`✅ Connected to workspace: ${workspace.name}`);

      // ── Step 1: Create or find the reporting dashboard project ──────────────────
      send("📊 Setting up Vendasta Executive Report project in Asana...");

      // Check for existing project
      const projects = await asanaGet(`/workspaces/${workspace.gid}/projects`);
                let project = projects.find(p => p.name === "Vendasta Executive Report - April 2026");

      if (!project) {
              project = await asanaPost("/projects", {
                        name: "Vendasta Executive Report - April 2026",
                        workspace: workspace.gid,
                        notes: `Executive Report Dashboard for ${REPORT_DATA.business} — ${REPORT_DATA.period}\n\nThis project contains all KPI metrics synced from the Vendasta Executive Report.`,
                        color: "light-green",
                        default_view: "list"
              });
              send(`✅ Created project: ${project.name}`);
      } else {
              send(`✅ Found existing project: ${project.name}`);
      }

      const projectGid = project.gid;

      // ── Step 2: Create sections for each report category ────────────────────────
      send("📁 Creating report sections...");

      const sectionNames = [
              "📈 Website Metrics",
              "🔍 SEO Performance",
              "📋 Listings & Citations",
              "👥 Leads & Engagement",
              "✅ Tasks & Projects Overview",
              "🚦 Traffic Sources"
            ];

      const existingSections = await asanaGet(`/projects/${projectGid}/sections`);
                const sectionMap = {};
                for (const sec of existingSections) {
                        sectionMap[sec.name] = sec.gid;
                }

      for (const name of sectionNames) {
              if (!sectionMap[name]) {
                        const sec = await asanaPost(`/projects/${projectGid}/sections`, { name });
                        sectionMap[name] = sec.gid;
                        send(`  ✅ Section: ${name}`);
              }
      }

      // ── Step 3: Create KPI tasks in each section ─────────────────────────────────
      send("📊 Syncing KPI metrics as tasks...");

      // Helper to create task in section
      async function createKpiTask(sectionGid, taskData) {
              const task = await asanaPost("/tasks", {
                        projects: [projectGid],
                        name: taskData.name,
                        notes: taskData.notes,
                        completed: taskData.completed || false,
              });
              await asanaPost(`/sections/${sectionGid}/addTask`, { task: task.gid });
              return task;
      }

      const d = REPORT_DATA;

      // Website Metrics
      const webSec = sectionMap["📈 Website Metrics"];
                await createKpiTask(webSec, {
                        name: `Active Users: ${d.website.activeUsers.value.toLocaleString()} (${d.website.activeUsers.change > 0 ? '+' : ''}${d.website.activeUsers.change})`,
                        notes: `April 2026 — Active Users\n\nValue: ${d.website.activeUsers.value.toLocaleString()}\nChange vs prior period: ${d.website.activeUsers.change}\nSource: Google Analytics 4\n\nWeekly breakdown:\n- Apr 5: ~380\n- Apr 12: ~720\n- Apr 19: ~850\n- Apr 26: ~480`
                });
                await createKpiTask(webSec, {
                        name: `Sessions: ${d.website.sessions.value.toLocaleString()} (${d.website.sessions.change})`,
                        notes: `April 2026 — Sessions\n\nValue: ${d.website.sessions.value.toLocaleString()}\nChange vs prior period: ${d.website.sessions.change}\nSource: Google Analytics 4`
                });
                await createKpiTask(webSec, {
                        name: `Page Views: ${d.website.pageViews.value.toLocaleString()} (${d.website.pageViews.change})`,
                        notes: `April 2026 — Page Views\n\nValue: ${d.website.pageViews.value.toLocaleString()}\nChange: ${d.website.pageViews.change}\nSource: Google Analytics 4`
                });
                await createKpiTask(webSec, {
                        name: `New Users: ${d.website.newUsers.value.toLocaleString()} (${d.website.newUsers.change})`,
                        notes: `April 2026 — New Users\n\nValue: ${d.website.newUsers.value.toLocaleString()}\nChange: ${d.website.newUsers.change}\nSource: Google Analytics 4`
                });
                await createKpiTask(webSec, {
                        name: `Avg Session Duration: ${d.website.avgSessionDuration.value} (${d.website.avgSessionDuration.change})`,
                        notes: `April 2026 — Average Session Duration\n\nValue: ${d.website.avgSessionDuration.value}\nChange: ${d.website.avgSessionDuration.change}\nSource: Google Analytics 4`
                });
                await createKpiTask(webSec, {
                        name: `Bounce Rate: ${d.website.bounceRate.value} (${d.website.bounceRate.change})`,
                        notes: `April 2026 — Bounce Rate\n\nValue: ${d.website.bounceRate.value}\nChange: ${d.website.bounceRate.change}\nSource: Google Analytics 4`
                });
                await createKpiTask(webSec, {
                        name: `Engaged Sessions: ${d.website.engagedSessions.value.toLocaleString()} (${d.website.engagedSessions.change})`,
                        notes: `April 2026 — Engaged Sessions\n\nValue: ${d.website.engagedSessions.value.toLocaleString()}\nChange: ${d.website.engagedSessions.change}\nSource: Google Analytics 4`
                });
                send("  ✅ Website metrics synced (7 KPIs)");

      // Traffic Sources
      const trafficSec = sectionMap["🚦 Traffic Sources"];
                for (const src of d.traffic.sources) {
                        await createKpiTask(trafficSec, {
                                  name: `${src.name}: ${src.value.toLocaleString()}${src.change !== 0 ? ` (${src.change > 0 ? '+' : ''}${src.change}%)` : ''}`,
                                  notes: `April 2026 — Traffic Source: ${src.name}\n\nVisitors: ${src.value.toLocaleString()}\nChange: ${src.change}%\nSource: Google Analytics 4`
                        });
                }
                send("  ✅ Traffic sources synced (7 sources)");

      // SEO Performance
      const seoSec = sectionMap["🔍 SEO Performance"];
                await createKpiTask(seoSec, {
                        name: `Google Search Queries (1st page): ${d.seo.googleSearchConsole.queries1stPage.value} (${d.seo.googleSearchConsole.queries1stPage.change})`,
                        notes: `April 2026 — Google Search Console\n\nQueries on 1st page: ${d.seo.googleSearchConsole.queries1stPage.value}\nChange: ${d.seo.googleSearchConsole.queries1stPage.change}\nKeywords in Top 10: ${d.seo.keywordsTop10}\nAverage Position: ${d.seo.avgPosition}`
                });
                await createKpiTask(seoSec, {
                        name: `Google Search Clicks: ${d.seo.googleSearchConsole.clicks.value.toLocaleString()} (${d.seo.googleSearchConsole.clicks.change})`,
                        notes: `April 2026 — Google Search Clicks\n\nClicks: ${d.seo.googleSearchConsole.clicks.value.toLocaleString()}\nChange: ${d.seo.googleSearchConsole.clicks.change}`
                });
                await createKpiTask(seoSec, {
                        name: `Google Search Impressions: ${d.seo.googleSearchConsole.impressions.value.toLocaleString()} (${d.seo.googleSearchConsole.impressions.change.toLocaleString()})`,
                        notes: `April 2026 — Google Search Impressions\n\nImpressions: ${d.seo.googleSearchConsole.impressions.value.toLocaleString()}\nChange: ${d.seo.googleSearchConsole.impressions.change.toLocaleString()}`
                });
                await createKpiTask(seoSec, {
                        name: `Top Query: "fairfield iowa" — 60 clicks (Pos 5.6)`,
                        notes: `Top Search Queries — April 2026\n\n1. "fairfield iowa" — 60 clicks, Avg pos 5.6\n2. "things to do in fairfield iowa" — 12 clicks, Avg pos 2.5\n3. "weather" — 12 clicks, Avg pos 5.6\n4. "visit fairfield iowa" — 12 clicks, Avg pos 1.0\n5. "haveda" — 8 clicks, Avg pos 5.7`
                });
                send("  ✅ SEO metrics synced (4 tasks)");

      // Listings
      const listSec = sectionMap["📋 Listings & Citations"];
                await createKpiTask(listSec, {
                        name: `Listing Score: ${d.listings.score} (Grade ${d.listings.grade}) — +${d.listings.change} this month`,
                        notes: `April 2026 — Listing Score\n\nScore: ${d.listings.score}\nGrade: ${d.listings.grade}\nChange: +${d.listings.change}\nStarted at: ${d.listings.startedAt}\nIndustry Average: ${d.listings.industryAverage}\n95th Percentile: ${d.listings.percentile95}\n\nAccuracy breakdown:\n✅ Accurate: ${d.listings.accurate}\n⚠️ Possible Errors: ${d.listings.possibleErrors}\n❌ Not Found: ${d.listings.notFound}\nTotal Citations: ${d.listings.citations}`
                });
                for (const p of d.listings.platforms) {
                        await createKpiTask(listSec, {
                                  name: `${p.name}: ${p.accuracy} — ${p.status}`,
                                  notes: `Listing Platform: ${p.name}\nAccuracy: ${p.accuracy}\nSync Status: ${p.status}`
                        });
                }
                send("  ✅ Listings synced (7 tasks)");

      // Leads
      const leadSec = sectionMap["👥 Leads & Engagement"];
                await createKpiTask(leadSec, {
                        name: `Messages: ${d.leads.messages.value} | Conversations: ${d.leads.conversations.value} | Leads: ${d.leads.leadsCreated.value}`,
                        notes: `April 2026 — Lead Generation Summary\n\nMessages: ${d.leads.messages.value}\nConversations (AI): ${d.leads.conversations.value}\nLeads created: ${d.leads.leadsCreated.value}\nTotal Contacts (CRM): ${d.leads.totalContacts.value}\nTotal Companies (CRM): ${d.leads.totalCompanies.value}\n\nWeb Chat Performance:\nUnique Visitors: ${d.leads.webChatVisitors.value} (+${d.leads.webChatVisitors.change})\nEngaged Conversations: ${d.leads.webChatEngaged.value}\nCaptured Leads: ${d.leads.capturedLeads.value}`
                });
                send("  ✅ Leads synced (1 summary task)");

      // Tasks & Projects Overview
      const taskSec = sectionMap["✅ Tasks & Projects Overview"];
                await createKpiTask(taskSec, {
                        name: `Total Tasks: ${d.overview.tasks.total} — ${d.overview.tasks.inProgress} in progress, ${d.overview.tasks.completed} completed`,
                        notes: `April 2026 — Tasks Overview\n\nTotal: ${d.overview.tasks.total}\nIn Progress: ${d.overview.tasks.inProgress}\nCompleted: ${d.overview.tasks.completed}`
                });
                await createKpiTask(taskSec, {
                        name: `Projects: ${d.overview.projects.total} — SEO Standard at 40% complete`,
                        notes: `April 2026 — Projects Overview\n\nTotal Projects: ${d.overview.projects.total}\nIn Progress: ${d.overview.projects.inProgress}\nCompleted: ${d.overview.projects.completed}\n\nProject Updates:\n- Search Engine Optimization Standard: 40% complete\n  • On-Page SEO Optimization — Waiting on review (Apr 22)\n  • FAQ Schema on All Key Pages — FAQs added (Apr 22)`
                });
                send("  ✅ Tasks & projects synced (2 tasks)");

      // ── Step 4: Create/update the Asana Reporting Dashboard ──────────────────────
      send("🎨 Building Asana Reporting Dashboard with charts...");

      // Get project dashboard sections to create chart widgets via API
      // Note: Asana API v1 supports portfolio status updates and project dashboards
      // We'll update the project's status with a rich HTML-like summary

      await asanaPut(`/projects/${projectGid}`, {
              notes: `📊 VENDASTA EXECUTIVE REPORT — APRIL 2026
              Business: ${REPORT_DATA.business}
              Report Period: ${REPORT_DATA.period}
              Last Synced: ${new Date().toLocaleString()}

              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              📈 WEBSITE PERFORMANCE (Google Analytics 4)
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              Active Users:         2,517  ▼ 788
              Sessions:             2,836  ▼ 811
              Page Views:           5,220  ▼ 506
              New Users:            2,329  ▼ 757
              Avg Session Duration: 2:05   ▲ 0:28
              Pages/Session:        1.84   ▲ 0.27
              Bounce Rate:          59.91% ▲ 1.48%
              Engaged Sessions:     1,137  ▼ 379

              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              🚦 TRAFFIC SOURCES (Google Analytics 4)
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              Organic Search:  1,190  ▼ 22%
              Direct:            733  ▼ 59%
              Paid Social:       173
              Paid Other:        169
              Referral:          100  ▼ 27%
              Unassigned:         97  ▲ 593%
              Paid Search:        26

              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              🔍 SEO PERFORMANCE (Google Search Console)
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              1st Page Queries:   176  ▼ 17
              Organic Clicks:     943  ▼ 233
              Impressions:    108,146  ▼ 13,353
              Keywords in Top 10:   4
              Avg Position:        32

              Top Queries:
              1. "fairfield iowa" — 60 clicks (pos 5.6)
              2. "things to do in fairfield iowa" — 12 clicks (pos 2.5)
              3. "visit fairfield iowa" — 12 clicks (pos 1.0)

              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              📋 LISTINGS & CITATIONS
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              Listing Score:    753 (Grade A)  ▲ 30
              Industry Avg:     221
              95th Percentile:  567
              Accurate:          29 ✅
              Possible Errors:    2 ⚠️
              Not Found:         23 ❌
              Citations Found:   25

              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              👥 LEADS & ENGAGEMENT
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              Messages:              0
              AI Conversations:      0
              Leads Created:         0
              Web Chat Visitors:     2  ▲ 2
              Web Chat Engaged:      0

              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              ✅ TASKS & PROJECTS
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              Total Tasks:      26  (20 in progress, 6 completed)
              Total Projects:    1  (SEO Standard — 40% complete)
              `
      });
                send("  ✅ Project summary updated with all KPIs");

      send("🎉 All data synced to Asana successfully!");
                const projectUrl = `https://app.asana.com/0/${projectGid}`;
                done(projectUrl);
          } catch (err) {
                console.error(err);
                fail(err.message);
                res.end();
          }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
