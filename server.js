const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ASANA_PAT = process.env.ASANA_PAT;
const ASANA_BASE = "https://app.asana.com/api/1.0";
const PROJECT_GID = "1214507349561917";

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// — Asana helpers —————————————————————————————————

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

// — Report Data ————————————————————————————————————

const REPORT_DATA = {
    period: "April 2026",
    business: "Visit Fairfield, Fairfield CVB",
    overview: {
        tasks: { total: 26, inProgress: 20, completed: 6 },
        projects: { total: 1, name: "SEO Standard", completion: 40 },
    },
    website: {
        activeUsers: { value: 2517, change: -788 },
        sessions: { value: 2836, change: -811 },
        avgSessionDuration: { value: "2:05", change: "+0:28" },
        pageViews: { value: 5220, change: -506 },
        pagesPerSession: { value: 1.84, change: +0.27 },
        newUsers: { value: 2329, change: -757 },
        bounceRate: { value: 59.91, change: +1.48 },
        engagedSessions: { value: 1137, change: -379 },
        weeklyActiveUsers: [390, 620, 820, 810, 500],
        weeklyLabels: ["Apr 5", "Apr 12", "Apr 19", "Apr 26", "May 3"],
    },
    traffic: {
        sources: [
            { name: "Organic Search", sessions: 1190, change: -22 },
            { name: "Direct", sessions: 733, change: -59 },
            { name: "Paid Social", sessions: 173, change: 0 },
            { name: "Paid Other", sessions: 169, change: 0 },
            { name: "Referral", sessions: 100, change: -27 },
            { name: "Unassigned", sessions: 97, change: +593 },
            { name: "Paid Search", sessions: 26, change: 0 },
        ],
        topReferrals: [
            { source: "google", sessions: 1197 },
            { source: "direct", sessions: 869 },
            { source: "fb", sessions: 172 },
            { source: "orange142", sessions: 169 },
            { source: "bing", sessions: 94 },
            { source: "yahoo", sessions: 55 },
        ],
    },
    seo: {
        keywordsTop10: 4,
        avgPosition: 32,
        keywordsUp: 0,
        queries1stPage: 176,
        queries1stPageChange: -17,
        organicClicks: 943,
        organicClicksChange: -233,
        impressions: 108146,
        impressionsChange: -13353,
        topQueries: [
            { query: "fairfield iowa", clicks: 60, position: 5.6 },
            { query: "things to do in fairfield iowa", clicks: 12, position: 2.5 },
            { query: "weather fairfield iowa", clicks: 12, position: 5.6 },
            { query: "visit fairfield iowa", clicks: 12, position: 1.0 },
            { query: "haveda", clicks: 8, position: 5.7 },
        ],
        topPages: [
            { page: "/", clicks: 108, impressions: 13073 },
            { page: "/things-to-do", clicks: 36, impressions: 3186 },
            { page: "/blog-posts/morel-mushroom-hunting", clicks: 33, impressions: 3250 },
            { page: "/event-directory", clicks: 27, impressions: 2959 },
            { page: "/business/vintage-power-wagon-rally", clicks: 19, impressions: 144 },
        ],
        weeklyClicks: [190, 270, 230, 180, 73],
        weeklyImpressions: [22500, 29000, 28000, 22000, 6646],
        weeklyLabels: ["Apr 5", "Apr 12", "Apr 19", "Apr 26", "May 3"],
    },
    listings: {
        score: 753,
        scoreChange: +30,
        grade: "A",
        startScore: 399,
        industryAvg: 221,
        percentile95: 567,
        accurate: 29,
        possibleErrors: 2,
        notFound: 23,
        citations: 25,
        scoreHistory: [399, 480, 560, 650, 723, 753],
        scoreHistoryLabels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
    },
    leads: {
        messages: 0,
        aiConversations: 0,
        leadsCreated: 0,
        totalContactsCRM: 0,
        totalCompaniesCRM: 0,
        webChatVisitors: 2,
        webChatVisitorsChange: +2,
        webChatEngaged: 0,
        capturedLeads: 0,
    },
};

// — API endpoint ——————————————————————————————————

app.get("/api/report", (req, res) => {
    res.json(REPORT_DATA);
});

// — Custom Field Management ———————————————————————

const KPI_CUSTOM_FIELDS = [
    { name: "Active Users", type: "number" },
    { name: "Sessions", type: "number" },
    { name: "Page Views", type: "number" },
    { name: "New Users", type: "number" },
    { name: "Engaged Sessions", type: "number" },
    { name: "Bounce Rate %", type: "number" },
    { name: "Organic Clicks", type: "number" },
    { name: "Impressions", type: "number" },
    { name: "Avg Position", type: "number" },
    { name: "Keywords Top 10", type: "number" },
    { name: "Listing Score", type: "number" },
    { name: "Accurate Listings", type: "number" },
    { name: "Web Chat Visitors", type: "number" },
    { name: "KPI Value", type: "number" },
];

async function ensureCustomFields(send) {
    send("Checking custom fields on Asana project...");
    
    // Get existing custom fields on project
    const existing = await asanaGet(`/projects/${PROJECT_GID}/custom_field_settings?opt_fields=custom_field.name,custom_field.gid,custom_field.type`);
    const existingMap = {};
    for (const cf of existing) {
        existingMap[cf.custom_field.name] = cf.custom_field.gid;
    }
    
    send(`Found ${existing.length} existing custom fields`);
    
    const fieldGids = { ...existingMap };
    
    // Create missing custom fields
    for (const field of KPI_CUSTOM_FIELDS) {
        if (!existingMap[field.name]) {
            try {
                send(`Creating custom field: ${field.name}`);
                const created = await asanaPost("/custom_fields", {
                    workspace: "1214501987923785",
                    name: field.name,
                    type: field.type,
                    precision: 0,
                });
                // Add to project
                await asanaPost(`/projects/${PROJECT_GID}/addCustomFieldSetting`, {
                    custom_field: created.gid,
                    is_important: true,
                });
                fieldGids[field.name] = created.gid;
                send(`✓ Created: ${field.name}`);
            } catch (e) {
                send(`⚠ Could not create ${field.name}: ${e.message}`);
            }
        }
    }
    
    return fieldGids;
}

// — Section Management ————————————————————————————

async function ensureSection(name, send) {
    const sections = await asanaGet(`/projects/${PROJECT_GID}/sections?opt_fields=name,gid`);
    const existing = sections.find(s => s.name === name);
    if (existing) return existing.gid;
    send(`Creating section: ${name}`);
    const created = await asanaPost(`/projects/${PROJECT_GID}/sections`, { name, project: PROJECT_GID });
    return created.gid;
}

// — Task Management ————————————————————————————————

async function upsertKPITask(sectionGid, taskName, notes, customFields, send) {
    // Find existing task by name in this section
    const tasks = await asanaGet(`/sections/${sectionGid}/tasks?opt_fields=name,gid,completed`);
    const existing = tasks.find(t => t.name === taskName);
    
    const taskData = {
        name: taskName,
        notes: notes,
        completed: false,
    };
    
    if (customFields && Object.keys(customFields).length > 0) {
        taskData.custom_fields = customFields;
    }
    
    if (existing) {
        await asanaPut(`/tasks/${existing.gid}`, taskData);
        send(`↻ Updated: ${taskName}`);
        return existing.gid;
    } else {
        taskData.projects = [PROJECT_GID];
        taskData.memberships = [{ project: PROJECT_GID, section: sectionGid }];
        const created = await asanaPost("/tasks", taskData);
        send(`✓ Created: ${taskName}`);
        return created.gid;
    }
}

// — Update Project Description ————————————————————

function buildProjectDescription() {
    const r = REPORT_DATA;
    const now = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    
    return `📊 VENDASTA EXECUTIVE REPORT — ${r.period}
Business: ${r.business}
Last Synced: ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tasks:    ${r.overview.tasks.total} total  |  ${r.overview.tasks.inProgress} in progress  |  ${r.overview.tasks.completed} completed
Projects: ${r.overview.projects.total} (${r.overview.projects.name}) — ${r.overview.projects.completion}% complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 WEBSITE (Google Analytics 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Active Users:       ${r.website.activeUsers.value.toLocaleString()}   (${r.website.activeUsers.change > 0 ? "▲" : "▼"} ${Math.abs(r.website.activeUsers.change)})
Sessions:           ${r.website.sessions.value.toLocaleString()}   (${r.website.sessions.change > 0 ? "▲" : "▼"} ${Math.abs(r.website.sessions.change)})
Page Views:         ${r.website.pageViews.value.toLocaleString()}   (${r.website.pageViews.change > 0 ? "▲" : "▼"} ${Math.abs(r.website.pageViews.change)})
New Users:          ${r.website.newUsers.value.toLocaleString()}   (${r.website.newUsers.change > 0 ? "▲" : "▼"} ${Math.abs(r.website.newUsers.change)})
Avg Session:        ${r.website.avgSessionDuration.value}
Bounce Rate:        ${r.website.bounceRate.value}%
Engaged Sessions:   ${r.website.engagedSessions.value.toLocaleString()}

Weekly Active Users:
  Apr 5:   ${"█".repeat(Math.round(r.website.weeklyActiveUsers[0]/50))} ${r.website.weeklyActiveUsers[0]}
  Apr 12:  ${"█".repeat(Math.round(r.website.weeklyActiveUsers[1]/50))} ${r.website.weeklyActiveUsers[1]}
  Apr 19:  ${"█".repeat(Math.round(r.website.weeklyActiveUsers[2]/50))} ${r.website.weeklyActiveUsers[2]}
  Apr 26:  ${"█".repeat(Math.round(r.website.weeklyActiveUsers[3]/50))} ${r.website.weeklyActiveUsers[3]}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚦 TRAFFIC SOURCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Organic Search:  1,190 sessions (${r.traffic.sources[0].change}%)
Direct:            733 sessions
Paid Social:       173 sessions
Referral:          100 sessions
Paid Search:        26 sessions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 SEO PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Keywords in Top 10:  ${r.seo.keywordsTop10}
Avg Position:        ${r.seo.avgPosition}
Queries on 1st Page: ${r.seo.queries1stPage}
Organic Clicks:      ${r.seo.organicClicks.toLocaleString()}
Impressions:         ${r.seo.impressions.toLocaleString()}

Top Queries:
  "fairfield iowa"          — 60 clicks, pos 5.6
  "things to do fairfield"  — 12 clicks, pos 2.5
  "visit fairfield iowa"    — 12 clicks, pos 1.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 LISTINGS & CITATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score:          ${r.listings.score} (Grade ${r.listings.grade}) ▲ ${r.listings.scoreChange}
Industry Avg:   ${r.listings.industryAvg}
Accurate:       ${r.listings.accurate} listings
Possible Errors:${r.listings.possibleErrors}
Not Found:      ${r.listings.notFound}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 LEADS & ENGAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Web Chat Visitors:  ${r.leads.webChatVisitors}
Leads Created:      ${r.leads.leadsCreated}
AI Conversations:   ${r.leads.aiConversations}
Total CRM Contacts: ${r.leads.totalContactsCRM}

View full visual dashboard: https://migrationvendastatoasana-production.up.railway.app/`;
}

// — Main Sync Endpoint ————————————————————————————

app.get("/sync", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (msg) => {
        res.write(`data: ${msg}\n\n`);
    };

    try {
        send("🚀 Starting full Executive Report sync to Asana...");

        if (!ASANA_PAT) throw new Error("ASANA_PAT not set");

        // Step 1: Ensure custom fields exist
        send("\n📐 Step 1: Setting up KPI custom fields...");
        const fieldGids = await ensureCustomFields(send);

        // Step 2: Update project description
        send("\n📄 Step 2: Updating project description...");
        await asanaPut(`/projects/${PROJECT_GID}`, {
            notes: buildProjectDescription(),
        });
        send("✓ Project description updated with all KPI data");

        // Step 3: Ensure all sections exist
        send("\n📁 Step 3: Setting up project sections...");
        const sections = {
            website: await ensureSection("🌐 Website Performance", send),
            traffic: await ensureSection("🚦 Traffic Sources", send),
            seo: await ensureSection("🔍 SEO Metrics", send),
            listings: await ensureSection("📍 Listings Score", send),
            leads: await ensureSection("👥 Leads & Engagement", send),
            overview: await ensureSection("📊 Overview KPIs", send),
        };
        send("✓ All sections ready");

        // Step 4: Create/update KPI snapshot tasks with custom fields
        send("\n📊 Step 4: Syncing KPI tasks with metrics...");
        const r = REPORT_DATA;

        // Overview KPIs
        await upsertKPITask(
            sections.overview,
            "📊 KPI Snapshot — " + r.period,
            `Overview KPIs for ${r.period}\n\nTotal Tasks: ${r.overview.tasks.total}\nIn Progress: ${r.overview.tasks.inProgress}\nCompleted: ${r.overview.tasks.completed}\nActive Users: ${r.website.activeUsers.value}\nOrganic Clicks: ${r.seo.organicClicks}\nListing Score: ${r.listings.score}`,
            fieldGids["KPI Value"] ? { [fieldGids["KPI Value"]]: r.overview.tasks.total } : {},
            send
        );

        // Website KPIs
        if (fieldGids["Active Users"] || fieldGids["Sessions"]) {
            const wFields = {};
            if (fieldGids["Active Users"]) wFields[fieldGids["Active Users"]] = r.website.activeUsers.value;
            if (fieldGids["Sessions"]) wFields[fieldGids["Sessions"]] = r.website.sessions.value;
            if (fieldGids["Page Views"]) wFields[fieldGids["Page Views"]] = r.website.pageViews.value;
            if (fieldGids["New Users"]) wFields[fieldGids["New Users"]] = r.website.newUsers.value;
            if (fieldGids["Engaged Sessions"]) wFields[fieldGids["Engaged Sessions"]] = r.website.engagedSessions.value;
            if (fieldGids["Bounce Rate %"]) wFields[fieldGids["Bounce Rate %"]] = Math.round(r.website.bounceRate.value);

            await upsertKPITask(
                sections.website,
                "🌐 Website KPIs — " + r.period,
                `Website Performance — ${r.period}\n\nActive Users: ${r.website.activeUsers.value.toLocaleString()} (▼${Math.abs(r.website.activeUsers.change)})\nSessions: ${r.website.sessions.value.toLocaleString()} (▼${Math.abs(r.website.sessions.change)})\nPage Views: ${r.website.pageViews.value.toLocaleString()} (▼${Math.abs(r.website.pageViews.change)})\nNew Users: ${r.website.newUsers.value.toLocaleString()} (▼${Math.abs(r.website.newUsers.change)})\nEngaged Sessions: ${r.website.engagedSessions.value}\nBounce Rate: ${r.website.bounceRate.value}%\nAvg Session Duration: ${r.website.avgSessionDuration.value}\n\nWeekly Active Users:\nApr 5: ${r.website.weeklyActiveUsers[0]}\nApr 12: ${r.website.weeklyActiveUsers[1]}\nApr 19: ${r.website.weeklyActiveUsers[2]}\nApr 26: ${r.website.weeklyActiveUsers[3]}`,
                wFields,
                send
            );
        }

        // Traffic KPIs
        await upsertKPITask(
            sections.traffic,
            "🚦 Traffic Sources — " + r.period,
            `Traffic Source Breakdown — ${r.period}\n\nOrganic Search: 1,190 sessions (-22%)\nDirect: 733 sessions (-59%)\nPaid Social: 173 sessions\nPaid Other: 169 sessions\nReferral: 100 sessions (-27%)\nUnassigned: 97 sessions (+593%)\nPaid Search: 26 sessions\n\nTop Referrers:\ngoogle.com: 1,197 sessions\nfacebook.com: 172 sessions\norange142.com: 169 sessions\nbing.com: 94 sessions\nyahoo.com: 55 sessions`,
            fieldGids["KPI Value"] ? { [fieldGids["KPI Value"]]: 1190 } : {},
            send
        );

        // SEO KPIs
        const seoFields = {};
        if (fieldGids["Organic Clicks"]) seoFields[fieldGids["Organic Clicks"]] = r.seo.organicClicks;
        if (fieldGids["Impressions"]) seoFields[fieldGids["Impressions"]] = r.seo.impressions;
        if (fieldGids["Avg Position"]) seoFields[fieldGids["Avg Position"]] = r.seo.avgPosition;
        if (fieldGids["Keywords Top 10"]) seoFields[fieldGids["Keywords Top 10"]] = r.seo.keywordsTop10;

        await upsertKPITask(
            sections.seo,
            "🔍 SEO KPIs — " + r.period,
            `SEO Performance — ${r.period}\n\nKeywords in Top 10: ${r.seo.keywordsTop10}\nAvg Position: ${r.seo.avgPosition}\nQueries on 1st Page: ${r.seo.queries1stPage} (-17)\nOrganic Clicks: ${r.seo.organicClicks.toLocaleString()} (-233)\nImpressions: ${r.seo.impressions.toLocaleString()} (-13,353)\n\nTop Queries:\n"fairfield iowa" — 60 clicks, pos 5.6\n"things to do in fairfield iowa" — 12 clicks, pos 2.5\n"visit fairfield iowa" — 12 clicks, pos 1.0\n\nTop Pages:\n/ — 108 clicks, 13,073 impressions\n/things-to-do — 36 clicks, 3,186 impressions\n/blog-posts/morel-mushroom-hunting — 33 clicks, 3,250 impressions`,
            seoFields,
            send
        );

        // Listings KPIs
        const listFields = {};
        if (fieldGids["Listing Score"]) listFields[fieldGids["Listing Score"]] = r.listings.score;
        if (fieldGids["Accurate Listings"]) listFields[fieldGids["Accurate Listings"]] = r.listings.accurate;

        await upsertKPITask(
            sections.listings,
            "📍 Listings KPIs — " + r.period,
            `Listings & Citations — ${r.period}\n\nScore: ${r.listings.score} (Grade ${r.listings.grade}) ▲${r.listings.scoreChange}\nStarted at: ${r.listings.startScore}\nIndustry Average: ${r.listings.industryAvg}\n95th Percentile: ${r.listings.percentile95}\nAccurate: ${r.listings.accurate} listings\nPossible Errors: ${r.listings.possibleErrors}\nNot Found: ${r.listings.notFound}\nTotal Citations: ${r.listings.citations}\n\nScore History:\nNov: ${r.listings.scoreHistory[0]}\nDec: ${r.listings.scoreHistory[1]}\nJan: ${r.listings.scoreHistory[2]}\nFeb: ${r.listings.scoreHistory[3]}\nMar: ${r.listings.scoreHistory[4]}\nApr: ${r.listings.scoreHistory[5]}`,
            listFields,
            send
        );

        // Leads KPIs
        const leadFields = {};
        if (fieldGids["Web Chat Visitors"]) leadFields[fieldGids["Web Chat Visitors"]] = r.leads.webChatVisitors;

        await upsertKPITask(
            sections.leads,
            "👥 Leads KPIs — " + r.period,
            `Leads & Engagement — ${r.period}\n\nMessages: ${r.leads.messages}\nAI Conversations: ${r.leads.aiConversations}\nLeads Created: ${r.leads.leadsCreated}\nTotal Contacts CRM: ${r.leads.totalContactsCRM}\nTotal Companies CRM: ${r.leads.totalCompaniesCRM}\nWeb Chat Visitors: ${r.leads.webChatVisitors} (▲${Math.abs(r.leads.webChatVisitorsChange)})\nWeb Chat Engaged: ${r.leads.webChatEngaged}\nCaptured Leads: ${r.leads.capturedLeads}`,
            leadFields,
            send
        );

        send("\n✅ All KPI tasks synced successfully!");
        send("\n📈 Step 5: Dashboard summary");
        send("Your Asana project now has:");
        send("  • Custom fields: Active Users, Sessions, Page Views, Organic Clicks, Listing Score, etc.");
        send("  • KPI snapshot tasks with all metric values stored in custom fields");
        send("  • Updated project description with full data summary");
        send("\n🎯 To view KPI charts in Asana:");
        send("  1. Go to your project Dashboard tab");
        send("  2. Click 'Add widget' → 'Custom field total'");
        send("  3. Select any KPI field (Active Users, Listing Score, etc.)");
        send("  4. Each widget will show the current value prominently");
        send("\n🔗 Full visual dashboard: https://migrationvendastatoasana-production.up.railway.app/");
        send("DONE");
    } catch (err) {
        send("ERROR: " + err.message);
        console.error(err);
    } finally {
        res.end();
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
