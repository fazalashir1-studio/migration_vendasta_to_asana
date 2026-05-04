import os
import requests

# Set via: export ASANA_PAT="your_personal_access_token"
TOKEN = os.environ["ASANA_PAT"]
BASE_URL = "https://app.asana.com/api/1.0"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/json"
}

def get(path, params=None):
    r = requests.get(f"{BASE_URL}{path}", headers=HEADERS, params=params)
    r.raise_for_status()
    return r.json()

def post(path, data):
    r = requests.post(f"{BASE_URL}{path}", headers=HEADERS, json={"data": data})
    r.raise_for_status()
    return r.json()

# Step 1: Get workspace GID
print("Fetching workspaces...")
workspaces = get("/workspaces")
workspace = workspaces["data"][0]
workspace_gid = workspace["gid"]
print(f"Workspace: {workspace['name']} (GID: {workspace_gid})")

# Step 2: Create the project
print("\nCreating project...")
project_data = {
    "name": "Vendasta Executive Report - April 2026",
    "workspace": workspace_gid,
    "notes": "Executive report for April 2026 covering SEO, website metrics, traffic sources, listings, and leads.",
    "color": "dark-blue",
    "default_view": "list"
}
project = post("/projects", project_data)
project_gid = project["data"]["gid"]
print(f"Project created: {project['data']['name']} (GID: {project_gid})")

# Step 3: Create sections
def create_section(name):
    s = post("/sections", {"name": name, "project": project_gid})
    gid = s["data"]["gid"]
    print(f"  Section created: {name} (GID: {gid})")
    return gid

# Step 4: Create a task in a section
def create_task(name, section_gid, notes=None, due_on=None, completed=False):
    task_data = {
        "name": name,
        "projects": [project_gid],
        "memberships": [{"project": project_gid, "section": section_gid}],
        "completed": completed,
    }
    if notes:
        task_data["notes"] = notes
    if due_on:
        task_data["due_on"] = due_on
    t = post("/tasks", task_data)
    gid = t["data"]["gid"]
    print(f"    Task created: {name} (GID: {gid})")
    return gid

# ── Section 1: Tasks ─────────────────────────────────────────────────────────
print("\nCreating 'Tasks' section...")
tasks_section_gid = create_section("Tasks")

# Named tasks
create_task(
    "On-Page SEO Optimization",
    tasks_section_gid,
    notes="Status: In Progress\nWaiting on approval",
    due_on="2026-04-22"
)
create_task(
    "FAQ Schema on All Key Pages",
    tasks_section_gid,
    notes="Status: In Progress\nFAQs added",
    due_on="2026-04-22"
)

# Remaining tasks: 20 in progress + 6 completed = 26 total, minus 2 already created above = 24 more
# In progress remaining: 20 - 2 = 18 more in-progress tasks
print("  Creating remaining in-progress tasks...")
in_progress_tasks = [
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
]
for task_name in in_progress_tasks:
    create_task(task_name, tasks_section_gid, notes="Status: In Progress")

# 6 completed tasks
print("  Creating completed tasks...")
completed_tasks = [
    "Initial SEO Audit",
    "Competitor Analysis",
    "Target Keyword Research",
    "Google My Business Optimization",
    "NAP Consistency Check",
    "Website Structure Review",
]
for task_name in completed_tasks:
    create_task(task_name, tasks_section_gid, notes="Status: Completed", completed=True)

# ── Section 2: Projects ──────────────────────────────────────────────────────
print("\nCreating 'Projects' section...")
projects_section_gid = create_section("Projects")

create_task(
    "Search Engine Optimization Standard",
    projects_section_gid,
    notes="Status: In Progress\nCompletion: 40%\n\nProject is currently 40% complete with ongoing optimization work across all key deliverables."
)

# ── Section 3: Website Metrics ───────────────────────────────────────────────
print("\nCreating 'Website Metrics' section...")
metrics_section_gid = create_section("Website Metrics")

metrics = [
    ("Active Users", "2,517"),
    ("Sessions", "2,836"),
    ("Avg Session Duration", "2m 5s"),
    ("Page Views", "5,220"),
    ("New Users", "2,329"),
    ("Bounce Rate", "59.91%"),
    ("Engaged Sessions", "1,137"),
]
for metric_name, metric_value in metrics:
    create_task(
        f"{metric_name}: {metric_value}",
        metrics_section_gid,
        notes=f"Metric: {metric_name}\nValue: {metric_value}\nPeriod: April 2026"
    )

# ── Section 4: Traffic Sources ───────────────────────────────────────────────
print("\nCreating 'Traffic Sources' section...")
traffic_section_gid = create_section("Traffic Sources")

traffic_sources = [
    ("Organic", "1,190"),
    ("Direct", "733"),
    ("Paid Social", "173"),
    ("Referral", "100"),
    ("Paid Search", "26"),
]
for source, sessions in traffic_sources:
    create_task(
        f"{source}: {sessions} sessions",
        traffic_section_gid,
        notes=f"Traffic Source: {source}\nSessions: {sessions}\nPeriod: April 2026"
    )

# ── Section 5: SEO Metrics ───────────────────────────────────────────────────
print("\nCreating 'SEO Metrics' section...")
seo_section_gid = create_section("SEO Metrics")

seo_metrics = [
    ("Keywords in Top 10", "4"),
    ("Average Position", "32"),
    ("Page 1 Queries", "176"),
    ("Clicks", "943"),
    ("Impressions", "108,146"),
]
for metric, value in seo_metrics:
    create_task(
        f"{metric}: {value}",
        seo_section_gid,
        notes=f"SEO Metric: {metric}\nValue: {value}\nPeriod: April 2026"
    )

# ── Section 6: Listings ──────────────────────────────────────────────────────
print("\nCreating 'Listings' section...")
listings_section_gid = create_section("Listings")

listings_data = [
    ("Listings Score", "753 — Grade A"),
    ("Accurate Listings", "29"),
    ("Listing Errors", "2"),
    ("Not Found", "23"),
    ("Citations", "25"),
]
for item, value in listings_data:
    create_task(
        f"{item}: {value}",
        listings_section_gid,
        notes=f"Listings Data: {item}\nValue: {value}\nPeriod: April 2026"
    )

# ── Section 7: Leads ─────────────────────────────────────────────────────────
print("\nCreating 'Leads' section...")
leads_section_gid = create_section("Leads")

leads_data = [
    ("Messages", "0"),
    ("Web Chat Visitors", "2"),
    ("Conversations", "0"),
    ("Captured Leads", "0"),
]
for lead_type, value in leads_data:
    create_task(
        f"{lead_type}: {value}",
        leads_section_gid,
        notes=f"Lead Metric: {lead_type}\nValue: {value}\nPeriod: April 2026"
    )

print("\n✓ Project setup complete!")
print(f"Project URL: https://app.asana.com/0/{project_gid}/list")
