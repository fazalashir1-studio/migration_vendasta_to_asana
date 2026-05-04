#!/usr/bin/env python3
"""
Populate Asana workspace with data from the Vendasta Executive Report
Client: Visit Fairfield / Fairfield CVB
Report Period: April 2026

Usage:
    export ASANA_ACCESS_TOKEN="your_personal_access_token"
    export ASANA_WORKSPACE_GID="your_workspace_gid"  # optional if only one workspace
    python populate_asana.py

Optional env vars:
    ASANA_TEAM_GID       - team to attach the project to
    ASANA_PROJECT_NAME   - override default project name
"""

import os
import sys
import time
import requests

# ---------------------------------------------------------------------------
# Vendasta Executive Report data – Visit Fairfield / Fairfield CVB, April 2026
# ---------------------------------------------------------------------------

REPORT_DATA = {
    "client": "Visit Fairfield / Fairfield CVB",
    "period": "April 2026",
    "generated_by": "Vendasta Executive Report",

    # -----------------------------------------------------------------------
    # Reputation Management
    # -----------------------------------------------------------------------
    "reputation": {
        "average_rating": 4.6,
        "total_reviews": 312,
        "new_reviews_this_month": 18,
        "reviews_responded_to": 15,
        "response_rate_pct": 83,
        "platforms": [
            {"name": "Google", "rating": 4.7, "total_reviews": 198, "new_this_month": 11},
            {"name": "TripAdvisor", "rating": 4.5, "total_reviews": 74, "new_this_month": 5},
            {"name": "Facebook", "rating": 4.6, "total_reviews": 40, "new_this_month": 2},
        ],
        "sentiment": {"positive_pct": 88, "neutral_pct": 8, "negative_pct": 4},
        "action_items": [
            "Respond to 3 unanswered Google reviews from April 22–28",
            "Flag and dispute one 1-star review on TripAdvisor (policy violation)",
            "Set up automated review request via Vendasta for post-stay emails",
        ],
    },

    # -----------------------------------------------------------------------
    # Listing Sync / Business Listings
    # -----------------------------------------------------------------------
    "listings": {
        "total_directories": 60,
        "synced": 54,
        "pending": 4,
        "errors": 2,
        "accuracy_score_pct": 91,
        "nap_consistency_pct": 96,
        "issues": [
            "Incorrect phone number on Yelp (old area code) – update pending",
            "Missing suite number on Foursquare – correction submitted April 18",
        ],
        "action_items": [
            "Resolve 2 listing errors (Yelp phone, Foursquare address) by May 10",
            "Submit to 4 remaining directories (Hotfrog, Cylex, n49, Brownbook)",
            "Verify Google Business Profile ownership for secondary location",
        ],
    },

    # -----------------------------------------------------------------------
    # Social Media
    # -----------------------------------------------------------------------
    "social_media": {
        "platforms": [
            {
                "name": "Facebook",
                "followers": 8_420,
                "follower_change": +112,
                "posts_published": 14,
                "total_reach": 31_500,
                "total_engagements": 2_840,
                "engagement_rate_pct": 9.0,
                "top_post": "Spring Bloom Festival recap – 1,240 likes, 320 shares",
            },
            {
                "name": "Instagram",
                "followers": 5_187,
                "follower_change": +203,
                "posts_published": 18,
                "total_reach": 22_100,
                "total_engagements": 3_610,
                "engagement_rate_pct": 16.3,
                "top_post": "Reel: 'Top 5 Things to Do in Fairfield This Spring' – 8,400 plays",
            },
            {
                "name": "X (Twitter)",
                "followers": 1_920,
                "follower_change": -14,
                "posts_published": 22,
                "total_reach": 5_400,
                "total_engagements": 310,
                "engagement_rate_pct": 5.7,
                "top_post": "Thread on Fairfield Wine & Food Week – 48 retweets",
            },
        ],
        "action_items": [
            "Schedule 12 posts for May using approved content calendar",
            "Boost top Instagram Reel with $150 paid promotion in May",
            "Review X (Twitter) strategy – follower decline 3 months running",
            "Create Instagram Story Highlights for 'Events', 'Dining', 'Stay'",
        ],
    },

    # -----------------------------------------------------------------------
    # Website & SEO
    # -----------------------------------------------------------------------
    "website_seo": {
        "sessions": 14_820,
        "sessions_change_pct": +12.4,
        "unique_visitors": 11_305,
        "pageviews": 38_640,
        "avg_session_duration_sec": 197,
        "bounce_rate_pct": 41.2,
        "top_pages": [
            {"url": "/events", "pageviews": 7_210},
            {"url": "/stay", "pageviews": 5_440},
            {"url": "/dining", "pageviews": 4_890},
            {"url": "/spring-bloom-festival", "pageviews": 4_200},
            {"url": "/plan-your-visit", "pageviews": 3_180},
        ],
        "organic_keywords_ranking": 284,
        "keywords_in_top_3": 22,
        "keywords_in_top_10": 71,
        "domain_authority": 38,
        "backlinks_total": 1_140,
        "backlinks_new_this_month": 23,
        "core_web_vitals": {
            "lcp_ms": 2_100,   # Largest Contentful Paint (good < 2500ms)
            "fid_ms": 45,      # First Input Delay (good < 100ms)
            "cls": 0.08,       # Cumulative Layout Shift (good < 0.1)
            "status": "Pass",
        },
        "action_items": [
            "Optimize /dining page meta title and description (CTR below 2%)",
            "Add schema markup to /events for rich result eligibility",
            "Fix 3 broken internal links identified in April crawl",
            "Publish 2 blog posts targeting 'things to do in Fairfield spring'",
            "Submit updated sitemap after adding 4 new event pages",
        ],
    },

    # -----------------------------------------------------------------------
    # Paid Advertising
    # -----------------------------------------------------------------------
    "advertising": {
        "total_spend_usd": 2_400,
        "total_impressions": 182_000,
        "total_clicks": 4_310,
        "avg_ctr_pct": 2.37,
        "avg_cpc_usd": 0.56,
        "conversions": 198,
        "cost_per_conversion_usd": 12.12,
        "roas": 4.8,
        "campaigns": [
            {
                "name": "Spring Bloom Festival – Google Search",
                "platform": "Google Ads",
                "spend_usd": 900,
                "impressions": 58_000,
                "clicks": 1_840,
                "ctr_pct": 3.17,
                "conversions": 87,
                "status": "Completed",
            },
            {
                "name": "Visit Fairfield – Brand Awareness (Display)",
                "platform": "Google Display",
                "spend_usd": 600,
                "impressions": 98_000,
                "clicks": 1_020,
                "ctr_pct": 1.04,
                "conversions": 41,
                "status": "Ongoing",
            },
            {
                "name": "Summer Travel Planning – Facebook/Instagram",
                "platform": "Meta Ads",
                "spend_usd": 900,
                "impressions": 26_000,
                "clicks": 1_450,
                "ctr_pct": 5.58,
                "conversions": 70,
                "status": "Ongoing",
            },
        ],
        "action_items": [
            "Increase Meta Ads budget by $200/month for May – strong ROAS",
            "Pause Google Display campaign and reallocate to Search in May",
            "Create retargeting campaign for /stay page visitors",
            "A/B test two new ad creatives for Summer Travel Planning campaign",
        ],
    },

    # -----------------------------------------------------------------------
    # Executive Summary
    # -----------------------------------------------------------------------
    "executive_summary": {
        "highlights": [
            "Website sessions up 12.4% MoM, driven by Spring Bloom Festival content",
            "Instagram engagement rate of 16.3% significantly exceeds 3% industry average",
            "Google review rating maintained at 4.7 – top quartile for CVBs nationally",
            "Paid advertising achieved 4.8x ROAS on $2,400 spend",
            "Listing accuracy improved from 88% to 91% after April corrections",
        ],
        "concerns": [
            "X (Twitter) follower count declining for 3 consecutive months",
            "2 listing errors remain unresolved (Yelp, Foursquare)",
            "Review response rate of 83% below 90% target",
            "/dining page organic CTR below 2% – needs SEO attention",
        ],
        "goals_next_month": [
            "Publish Spring/Summer content calendar for May–June",
            "Achieve 90%+ review response rate",
            "Resolve all listing errors",
            "Launch Summer Travel campaign by May 15",
            "Hit 15,500 website sessions for May",
        ],
    },
}

# ---------------------------------------------------------------------------
# Asana API helpers
# ---------------------------------------------------------------------------

BASE_URL = "https://app.asana.com/api/1.0"


def asana_get(token: str, endpoint: str, params: dict = None) -> dict:
    resp = requests.get(
        f"{BASE_URL}/{endpoint}",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
        params=params,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def asana_post(token: str, endpoint: str, payload: dict) -> dict:
    resp = requests.post(
        f"{BASE_URL}/{endpoint}",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        json={"data": payload},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def rate_limited_post(token: str, endpoint: str, payload: dict, delay: float = 0.3) -> dict:
    """POST with a small delay to stay within Asana's rate limits (150 req/min free tier)."""
    time.sleep(delay)
    return asana_post(token, endpoint, payload)


# ---------------------------------------------------------------------------
# Workspace / project resolution
# ---------------------------------------------------------------------------

def resolve_workspace(token: str, workspace_gid: str = None) -> str:
    data = asana_get(token, "workspaces")["data"]
    if not data:
        sys.exit("No Asana workspaces found for this token.")
    if workspace_gid:
        gids = [w["gid"] for w in data]
        if workspace_gid not in gids:
            sys.exit(f"Workspace GID {workspace_gid} not found. Available: {gids}")
        return workspace_gid
    if len(data) == 1:
        return data[0]["gid"]
    print("Multiple workspaces found:")
    for i, w in enumerate(data):
        print(f"  [{i}] {w['name']} (gid: {w['gid']})")
    idx = int(input("Select workspace index: "))
    return data[idx]["gid"]


def create_project(token: str, workspace_gid: str, team_gid: str = None) -> str:
    project_name = os.getenv(
        "ASANA_PROJECT_NAME",
        f"Vendasta Executive Report – {REPORT_DATA['client']} – {REPORT_DATA['period']}",
    )
    payload = {
        "name": project_name,
        "workspace": workspace_gid,
        "color": "light-blue",
        "layout": "list",
        "notes": (
            f"Auto-generated from the Vendasta Executive Report.\n"
            f"Client: {REPORT_DATA['client']}\n"
            f"Report Period: {REPORT_DATA['period']}\n"
            f"Source: {REPORT_DATA['generated_by']}"
        ),
    }
    if team_gid:
        payload["team"] = team_gid
    result = asana_post(token, "projects", payload)
    project_gid = result["data"]["gid"]
    print(f"  Created project: {project_name} (gid: {project_gid})")
    return project_gid


def create_section(token: str, project_gid: str, name: str) -> str:
    result = rate_limited_post(token, "sections", {"project": project_gid, "name": name})
    section_gid = result["data"]["gid"]
    print(f"    Section: {name}")
    return section_gid


def create_task(
    token: str,
    project_gid: str,
    section_gid: str,
    name: str,
    notes: str = "",
    due_on: str = None,
    tags: list = None,
) -> str:
    payload = {
        "name": name,
        "notes": notes,
        "projects": [project_gid],
        "memberships": [{"project": project_gid, "section": section_gid}],
    }
    if due_on:
        payload["due_on"] = due_on
    result = rate_limited_post(token, "tasks", payload)
    task_gid = result["data"]["gid"]
    print(f"      Task: {name}")
    return task_gid


# ---------------------------------------------------------------------------
# Section builders
# ---------------------------------------------------------------------------

def build_executive_summary(token, project_gid, data):
    section_gid = create_section(token, project_gid, "Executive Summary")
    report = data["executive_summary"]
    rep = data["reputation"]
    web = data["website_seo"]
    ads = data["advertising"]

    overview = (
        f"Report Period: {data['period']}\n"
        f"Client: {data['client']}\n\n"
        f"KEY METRICS:\n"
        f"  • Average Review Rating: {rep['average_rating']} ⭐ ({rep['total_reviews']} total reviews)\n"
        f"  • Website Sessions: {web['sessions']:,} ({web['sessions_change_pct']:+.1f}% MoM)\n"
        f"  • Paid Ad Spend: ${ads['total_spend_usd']:,} | ROAS: {ads['roas']}x\n"
        f"  • Listing Accuracy: {data['listings']['accuracy_score_pct']}%\n\n"
        f"HIGHLIGHTS:\n" + "\n".join(f"  • {h}" for h in report["highlights"]) + "\n\n"
        f"CONCERNS:\n" + "\n".join(f"  • {c}" for c in report["concerns"])
    )
    create_task(token, project_gid, section_gid, "📊 April 2026 Overview & KPIs", notes=overview)

    goals_notes = "GOALS FOR MAY 2026:\n" + "\n".join(f"  • {g}" for g in report["goals_next_month"])
    create_task(
        token, project_gid, section_gid, "🎯 May 2026 Goals & Targets",
        notes=goals_notes, due_on="2026-05-31"
    )


def build_reputation(token, project_gid, data):
    section_gid = create_section(token, project_gid, "Reputation Management")
    rep = data["reputation"]

    overview = (
        f"OVERALL REPUTATION – April 2026\n\n"
        f"Average Rating:        {rep['average_rating']} / 5.0\n"
        f"Total Reviews:         {rep['total_reviews']}\n"
        f"New Reviews (April):   {rep['new_reviews_this_month']}\n"
        f"Responses Sent:        {rep['reviews_responded_to']} / {rep['new_reviews_this_month']}\n"
        f"Response Rate:         {rep['response_rate_pct']}% (target: 90%)\n\n"
        f"SENTIMENT:\n"
        f"  Positive: {rep['sentiment']['positive_pct']}%\n"
        f"  Neutral:  {rep['sentiment']['neutral_pct']}%\n"
        f"  Negative: {rep['sentiment']['negative_pct']}%\n\n"
        f"PLATFORM BREAKDOWN:\n"
    )
    for p in rep["platforms"]:
        overview += (
            f"  {p['name']}: {p['rating']}⭐ | {p['total_reviews']} total | "
            f"+{p['new_this_month']} new this month\n"
        )
    create_task(token, project_gid, section_gid, "⭐ Reputation Metrics – April 2026", notes=overview)

    for action in rep["action_items"]:
        create_task(
            token, project_gid, section_gid,
            f"ACTION: {action}",
            notes="Reputation action item from Vendasta Executive Report – April 2026.",
            due_on="2026-05-15",
        )


def build_listings(token, project_gid, data):
    section_gid = create_section(token, project_gid, "Business Listings")
    lst = data["listings"]

    overview = (
        f"LISTING SYNC STATUS – April 2026\n\n"
        f"Total Directories:    {lst['total_directories']}\n"
        f"Synced:               {lst['synced']}\n"
        f"Pending:              {lst['pending']}\n"
        f"Errors:               {lst['errors']}\n"
        f"Accuracy Score:       {lst['accuracy_score_pct']}%\n"
        f"NAP Consistency:      {lst['nap_consistency_pct']}%\n\n"
        f"KNOWN ISSUES:\n" + "\n".join(f"  • {i}" for i in lst["issues"])
    )
    create_task(token, project_gid, section_gid, "📍 Listing Sync Status – April 2026", notes=overview)

    for action in lst["action_items"]:
        create_task(
            token, project_gid, section_gid,
            f"ACTION: {action}",
            notes="Listing action item from Vendasta Executive Report – April 2026.",
            due_on="2026-05-10",
        )


def build_social_media(token, project_gid, data):
    section_gid = create_section(token, project_gid, "Social Media")
    sm = data["social_media"]

    for platform in sm["platforms"]:
        change_sign = "+" if platform["follower_change"] >= 0 else ""
        notes = (
            f"PLATFORM: {platform['name']} – April 2026\n\n"
            f"Followers:          {platform['followers']:,} ({change_sign}{platform['follower_change']})\n"
            f"Posts Published:    {platform['posts_published']}\n"
            f"Total Reach:        {platform['total_reach']:,}\n"
            f"Total Engagements:  {platform['total_engagements']:,}\n"
            f"Engagement Rate:    {platform['engagement_rate_pct']}%\n\n"
            f"TOP POST:\n  {platform['top_post']}"
        )
        create_task(
            token, project_gid, section_gid,
            f"📱 {platform['name']} Performance – April 2026",
            notes=notes,
        )

    for action in sm["action_items"]:
        create_task(
            token, project_gid, section_gid,
            f"ACTION: {action}",
            notes="Social media action item from Vendasta Executive Report – April 2026.",
            due_on="2026-05-15",
        )


def build_website_seo(token, project_gid, data):
    section_gid = create_section(token, project_gid, "Website & SEO")
    web = data["website_seo"]

    cwv = web["core_web_vitals"]
    overview = (
        f"WEBSITE PERFORMANCE – April 2026\n\n"
        f"Sessions:              {web['sessions']:,} ({web['sessions_change_pct']:+.1f}% MoM)\n"
        f"Unique Visitors:       {web['unique_visitors']:,}\n"
        f"Pageviews:             {web['pageviews']:,}\n"
        f"Avg Session Duration:  {web['avg_session_duration_sec']}s "
        f"({web['avg_session_duration_sec']//60}m {web['avg_session_duration_sec']%60}s)\n"
        f"Bounce Rate:           {web['bounce_rate_pct']}%\n\n"
        f"TOP PAGES:\n"
    )
    for page in web["top_pages"]:
        overview += f"  {page['url']:<30} {page['pageviews']:>6,} pageviews\n"

    overview += (
        f"\nSEO:\n"
        f"  Organic Keywords Ranking:  {web['organic_keywords_ranking']}\n"
        f"  In Top 3:                  {web['keywords_in_top_3']}\n"
        f"  In Top 10:                 {web['keywords_in_top_10']}\n"
        f"  Domain Authority:          {web['domain_authority']}\n"
        f"  Total Backlinks:           {web['backlinks_total']:,}\n"
        f"  New Backlinks (April):     {web['backlinks_new_this_month']}\n\n"
        f"CORE WEB VITALS ({cwv['status']}):\n"
        f"  LCP: {cwv['lcp_ms']}ms | FID: {cwv['fid_ms']}ms | CLS: {cwv['cls']}"
    )
    create_task(token, project_gid, section_gid, "🌐 Website & SEO Metrics – April 2026", notes=overview)

    for action in web["action_items"]:
        create_task(
            token, project_gid, section_gid,
            f"ACTION: {action}",
            notes="Website/SEO action item from Vendasta Executive Report – April 2026.",
            due_on="2026-05-31",
        )


def build_advertising(token, project_gid, data):
    section_gid = create_section(token, project_gid, "Paid Advertising")
    ads = data["advertising"]

    overview = (
        f"ADVERTISING SUMMARY – April 2026\n\n"
        f"Total Spend:          ${ads['total_spend_usd']:,}\n"
        f"Total Impressions:    {ads['total_impressions']:,}\n"
        f"Total Clicks:         {ads['total_clicks']:,}\n"
        f"Avg CTR:              {ads['avg_ctr_pct']}%\n"
        f"Avg CPC:              ${ads['avg_cpc_usd']}\n"
        f"Conversions:          {ads['conversions']}\n"
        f"Cost/Conversion:      ${ads['cost_per_conversion_usd']}\n"
        f"ROAS:                 {ads['roas']}x\n\n"
        f"CAMPAIGNS:\n"
    )
    for c in ads["campaigns"]:
        overview += (
            f"\n  [{c['status']}] {c['name']} ({c['platform']})\n"
            f"    Spend: ${c['spend_usd']:,} | Impressions: {c['impressions']:,} | "
            f"Clicks: {c['clicks']:,} | CTR: {c['ctr_pct']}% | Conversions: {c['conversions']}\n"
        )
    create_task(token, project_gid, section_gid, "📣 Advertising Summary – April 2026", notes=overview)

    for c in ads["campaigns"]:
        campaign_notes = (
            f"Campaign: {c['name']}\n"
            f"Platform: {c['platform']}\n"
            f"Status: {c['status']}\n\n"
            f"Spend: ${c['spend_usd']:,}\n"
            f"Impressions: {c['impressions']:,}\n"
            f"Clicks: {c['clicks']:,}\n"
            f"CTR: {c['ctr_pct']}%\n"
            f"Conversions: {c['conversions']}\n"
        )
        create_task(
            token, project_gid, section_gid,
            f"Campaign: {c['name']}",
            notes=campaign_notes,
        )

    for action in ads["action_items"]:
        create_task(
            token, project_gid, section_gid,
            f"ACTION: {action}",
            notes="Advertising action item from Vendasta Executive Report – April 2026.",
            due_on="2026-05-15",
        )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    token = os.getenv("ASANA_ACCESS_TOKEN")
    if not token:
        sys.exit(
            "Error: ASANA_ACCESS_TOKEN environment variable not set.\n"
            "Get your Personal Access Token from https://app.asana.com/0/my-apps"
        )

    workspace_gid_env = os.getenv("ASANA_WORKSPACE_GID")
    team_gid = os.getenv("ASANA_TEAM_GID")

    print("Connecting to Asana...")
    workspace_gid = resolve_workspace(token, workspace_gid_env)
    print(f"Using workspace GID: {workspace_gid}")

    print("\nCreating project...")
    project_gid = create_project(token, workspace_gid, team_gid)

    print("\nPopulating sections and tasks...")

    print("\n[1/6] Executive Summary")
    build_executive_summary(token, project_gid, REPORT_DATA)

    print("\n[2/6] Reputation Management")
    build_reputation(token, project_gid, REPORT_DATA)

    print("\n[3/6] Business Listings")
    build_listings(token, project_gid, REPORT_DATA)

    print("\n[4/6] Social Media")
    build_social_media(token, project_gid, REPORT_DATA)

    print("\n[5/6] Website & SEO")
    build_website_seo(token, project_gid, REPORT_DATA)

    print("\n[6/6] Paid Advertising")
    build_advertising(token, project_gid, REPORT_DATA)

    print(
        f"\nDone! Open your project at:\n"
        f"  https://app.asana.com/0/{project_gid}"
    )


if __name__ == "__main__":
    main()
