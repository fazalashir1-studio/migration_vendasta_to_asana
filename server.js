const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ASANA_PAT = process.env.ASANA_PAT;
const ASANA_BASE = "https://app.asana.com/api/1.0";

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// ── Asana helpers ─────────────────────────────────────────────────────────────

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

async function asanaPost(path, data) {
  const res = await fetch(`${ASANA_BASE}${path}`, {
    method: "POST",
    headers: asanaHeaders(),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`POST ${path} → ${res.status}: ${body}`);
  }
  return (await res.json()).data;
}

// ── Sync logic ────────────────────────────────────────────────────────────────

async function buildProject(emit) {
  if (!ASANA_PAT) throw new Error("ASANA_PAT environment variable is not set.");

  // 1. Workspace
  emit("Fetching workspace…");
  const workspaces = await asanaGet("/workspaces");
  const workspaceGid = workspaces[0].gid;
  emit(`Workspace: ${workspaces[0].name} (${workspaceGid})`);

  // 2. Project
  emit("Creating project…");
  const project = await asanaPost("/projects", {
    name: "Vendasta Executive Report - April 2026",
    workspace: workspaceGid,
    notes: "Executive report for April 2026 covering SEO, website metrics, traffic sources, listings, and leads.",
    color: "dark-blue",
    default_view: "list",
  });
  const projectGid = project.gid;
  emit(`Project created: ${project.name} (${projectGid})`);

  async function createSection(name) {
    const s = await asanaPost("/sections", { name, project: projectGid });
    emit(`  Section: ${name}`);
    return s.gid;
  }

  async function createTask(name, sectionGid, { notes, dueOn, completed } = {}) {
    const body = {
      name,
      projects: [projectGid],
      memberships: [{ project: projectGid, section: sectionGid }],
      completed: completed || false,
    };
    if (notes) body.notes = notes;
    if (dueOn) body.due_on = dueOn;
    const t = await asanaPost("/tasks", body);
    emit(`    Task: ${name}`);
    return t.gid;
  }

  // ── Section 1: Tasks ─────────────────────────────────────────────────────
  emit("Creating 'Tasks' section…");
  const tasksSec = await createSection("Tasks");

  await createTask("On-Page SEO Optimization", tasksSec, {
    notes: "Status: In Progress\nWaiting on approval",
    dueOn: "2026-04-22",
  });
  await createTask("FAQ Schema on All Key Pages", tasksSec, {
    notes: "Status: In Progress\nFAQs added",
    dueOn: "2026-04-22",
  });

  const inProgressTasks = [
    "Title Tag Optimization",
    "Meta Description Updates",
    "Header Tag Structure Review",
    "Image Alt Text Optimization",
    "Internal Linking Strategy",
    "Mobile Responsiveness Audit",
    "Page Speed Optimization",
    "Schema Markup Implementation",
    "Content Gap Analysis",
    "Keyword Density Review",
    "Canonical Tag Audit",
    "XML Sitemap Update",
    "Robots.txt Review",
    "301 Redirect Mapping",
    "Google Search Console Setup",
    "Google Analytics Configuration",
    "Local SEO Citations Audit",
    "Backlink Profile Analysis",
  ];
  for (const name of inProgressTasks) {
    await createTask(name, tasksSec, { notes: "Status: In Progress" });
  }

  const completedTasks = [
    "Initial SEO Audit",
    "Competitor Analysis",
    "Target Keyword Research",
    "Google My Business Optimization",
    "NAP Consistency Check",
    "Website Structure Review",
  ];
  for (const name of completedTasks) {
    await createTask(name, tasksSec, { notes: "Status: Completed", completed: true });
  }

  // ── Section 2: Projects ──────────────────────────────────────────────────
  emit("Creating 'Projects' section…");
  const projectsSec = await createSection("Projects");
  await createTask("Search Engine Optimization Standard", projectsSec, {
    notes: "Status: In Progress\nCompletion: 40%\n\nProject is currently 40% complete with ongoing optimization work across all key deliverables.",
  });

  // ── Section 3: Website Metrics ───────────────────────────────────────────
  emit("Creating 'Website Metrics' section…");
  const metricsSec = await createSection("Website Metrics");
  const websiteMetrics = [
    ["Active Users", "2,517"],
    ["Sessions", "2,836"],
    ["Avg Session Duration", "2m 5s"],
    ["Page Views", "5,220"],
    ["New Users", "2,329"],
    ["Bounce Rate", "59.91%"],
    ["Engaged Sessions", "1,137"],
  ];
  for (const [metric, value] of websiteMetrics) {
    await createTask(`${metric}: ${value}`, metricsSec, {
      notes: `Metric: ${metric}\nValue: ${value}\nPeriod: April 2026`,
    });
  }

  // ── Section 4: Traffic Sources ───────────────────────────────────────────
  emit("Creating 'Traffic Sources' section…");
  const trafficSec = await createSection("Traffic Sources");
  const trafficSources = [
    ["Organic", "1,190"],
    ["Direct", "733"],
    ["Paid Social", "173"],
    ["Referral", "100"],
    ["Paid Search", "26"],
  ];
  for (const [source, sessions] of trafficSources) {
    await createTask(`${source}: ${sessions} sessions`, trafficSec, {
      notes: `Traffic Source: ${source}\nSessions: ${sessions}\nPeriod: April 2026`,
    });
  }

  // ── Section 5: SEO Metrics ───────────────────────────────────────────────
  emit("Creating 'SEO Metrics' section…");
  const seoSec = await createSection("SEO Metrics");
  const seoMetrics = [
    ["Keywords in Top 10", "4"],
    ["Average Position", "32"],
    ["Page 1 Queries", "176"],
    ["Clicks", "943"],
    ["Impressions", "108,146"],
  ];
  for (const [metric, value] of seoMetrics) {
    await createTask(`${metric}: ${value}`, seoSec, {
      notes: `SEO Metric: ${metric}\nValue: ${value}\nPeriod: April 2026`,
    });
  }

  // ── Section 6: Listings ──────────────────────────────────────────────────
  emit("Creating 'Listings' section…");
  const listingsSec = await createSection("Listings");
  const listingsData = [
    ["Listings Score", "753 — Grade A"],
    ["Accurate Listings", "29"],
    ["Listing Errors", "2"],
    ["Not Found", "23"],
    ["Citations", "25"],
  ];
  for (const [item, value] of listingsData) {
    await createTask(`${item}: ${value}`, listingsSec, {
      notes: `Listings Data: ${item}\nValue: ${value}\nPeriod: April 2026`,
    });
  }

  // ── Section 7: Leads ─────────────────────────────────────────────────────
  emit("Creating 'Leads' section…");
  const leadsSec = await createSection("Leads");
  const leadsData = [
    ["Messages", "0"],
    ["Web Chat Visitors", "2"],
    ["Conversations", "0"],
    ["Captured Leads", "0"],
  ];
  for (const [leadType, value] of leadsData) {
    await createTask(`${leadType}: ${value}`, leadsSec, {
      notes: `Lead Metric: ${leadType}\nValue: ${value}\nPeriod: April 2026`,
    });
  }

  return `https://app.asana.com/0/${projectGid}/list`;
}

// ── /sync endpoint (SSE streaming) ──────────────────────────────────────────

app.get("/sync", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (type, payload) =>
    res.write(`data: ${JSON.stringify({ type, payload })}\n\n`);

  try {
    const projectUrl = await buildProject((msg) => send("log", msg));
    send("done", projectUrl);
  } catch (err) {
    send("error", err.message);
  } finally {
    res.end();
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
