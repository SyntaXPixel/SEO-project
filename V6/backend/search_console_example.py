#!/usr/bin/env python3
"""
Example script demonstrating Google Search Console API usage.
This shows how to use the functions added to app.py
"""

import requests
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId

def fetch_total_clicks(site_url, access_token):
    """Original function from your example - simplified version"""
    url = f"https://searchconsole.googleapis.com/webmasters/v3/sites/{site_url}/searchAnalytics/query"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "startDate": "2024-06-10",
        "endDate": "2024-07-10",
        "aggregationType": "auto"
    }

    response = requests.post(url, json=payload, headers=headers)
    data = response.json()

    if "rows" in data and len(data["rows"]) > 0:
        clicks = data["rows"][0]["clicks"]
        return clicks
    else:
        return 0

def fetch_search_analytics_enhanced(site_url, access_token, start_date=None, end_date=None):
    """Enhanced version with more comprehensive data"""
    url = f"https://searchconsole.googleapis.com/webmasters/v3/sites/{site_url}/searchAnalytics/query"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Default to last 30 days if no dates provided
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
    
    payload = {
        "startDate": start_date,
        "endDate": end_date,
        "aggregationType": "auto"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Search Console API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "rows" in data and len(data["rows"]) > 0:
                total_clicks = sum(row["clicks"] for row in data["rows"])
                total_impressions = sum(row["impressions"] for row in data["rows"])
                total_ctr = sum(row["ctr"] for row in data["rows"]) / len(data["rows"]) if data["rows"] else 0
                total_position = sum(row["position"] for row in data["rows"]) / len(data["rows"]) if data["rows"] else 0
                
                print(f"✅ Search Analytics: {total_clicks} clicks, {total_impressions} impressions")
                
                return {
                    "success": True,
                    "clicks": total_clicks,
                    "impressions": total_impressions,
                    "ctr": round(total_ctr * 100, 2),  # Convert to percentage
                    "position": round(total_position, 1),
                    "rows": data["rows"][:10]  # Top 10 results
                }
            else:
                print("⚠️ No search analytics data found.")
                return {
                    "success": True,
                    "clicks": 0,
                    "impressions": 0,
                    "ctr": 0,
                    "position": 0,
                    "rows": []
                }
        elif response.status_code == 401:
            print("❌ Token expired or invalid for Search Console")
            return {
                "success": False,
                "error": "token_expired",
                "message": "Access token expired. Please re-verify your site."
            }
        else:
            print(f"❌ Error fetching search analytics: {response.text}")
            return {
                "success": False,
                "error": response.status_code,
                "message": response.text
            }
    except Exception as e:
        print(f"❌ Exception while fetching search analytics: {str(e)}")
        return {
            "success": False,
            "error": "exception",
            "message": str(e)
        }

def fetch_detailed_search_analytics(site_url, access_token, start_date=None, end_date=None):
    """Fetch detailed search analytics with top queries and pages"""
    url = f"https://searchconsole.googleapis.com/webmasters/v3/sites/{site_url}/searchAnalytics/query"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
    
    # Get top queries
    queries_payload = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": ["query"],
        "rowLimit": 10
    }
    
    try:
        queries_response = requests.post(url, json=queries_payload, headers=headers)
        queries_data = queries_response.json() if queries_response.status_code == 200 else {"rows": []}
        
        # Get top pages
        pages_payload = {
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": ["page"],
            "rowLimit": 10
        }
        
        pages_response = requests.post(url, json=pages_payload, headers=headers)
        pages_data = pages_response.json() if pages_response.status_code == 200 else {"rows": []}
        
        result = {
            "success": True,
            "topQueries": queries_data.get("rows", []),
            "topPages": pages_data.get("rows", [])
        }
        
        return result
        
    except Exception as e:
        print(f"❌ Exception while fetching detailed search analytics: {str(e)}")
        return {
            "success": False,
            "error": "exception",
            "message": str(e)
        }

def get_project_from_db(project_id=None):
    MONGO_URI = "mongodb+srv://test:test@venkatesh.nvutauw.mongodb.net/?retryWrites=true&w=majority"
    DB_NAME = "user_db"
    PROJECTS_COLLECTION = "projects"
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    projects = db[PROJECTS_COLLECTION]
    if project_id:
        project = projects.find_one({"_id": ObjectId(project_id)})
    else:
        project = projects.find_one({"google_access_token": {"$exists": True, "$ne": None}})
    return project

if __name__ == "__main__":
    PROJECT_ID = None  # or set to a specific project ID string
    project = get_project_from_db(PROJECT_ID)
    if not project:
        print("No project found with a Google Search Console access token.")
        exit(1)

    SITE_URL = project.get("url")
    ACCESS_TOKEN = project.get("google_access_token")

    print(f"Using site: {SITE_URL}")
    print(f"Using access token: {ACCESS_TOKEN[:8]}...")

    # Now call your analytics functions as before
    print("🔍 Google Search Console API Examples")
    print("=" * 50)

    # Example 1: Simple clicks fetch (your original function)
    print("\n1. Simple Clicks Fetch:")
    clicks = fetch_total_clicks(SITE_URL, ACCESS_TOKEN)
    print(f"Total clicks: {clicks}")

    # Example 2: Enhanced analytics fetch
    print("\n2. Enhanced Analytics Fetch:")
    analytics = fetch_search_analytics_enhanced(SITE_URL, ACCESS_TOKEN)
    if analytics["success"]:
        print(f"Clicks: {analytics['clicks']}")
        print(f"Impressions: {analytics['impressions']}")
        print(f"CTR: {analytics['ctr']}%")
        print(f"Average Position: {analytics['position']}")
    else:
        print(f"Error: {analytics['message']}")

    # Example 3: Detailed analytics with queries and pages
    print("\n3. Detailed Analytics:")
    detailed = fetch_detailed_search_analytics(SITE_URL, ACCESS_TOKEN)
    if detailed["success"]:
        print("Top Queries:")
        for i, query in enumerate(detailed["topQueries"][:5], 1):
            print(f"  {i}. {query['keys'][0]} - {query['clicks']} clicks")

        print("\nTop Pages:")
        for i, page in enumerate(detailed["topPages"][:5], 1):
            print(f"  {i}. {page['keys'][0]} - {page['clicks']} clicks")
    else:
        print(f"Error: {detailed['message']}")

    print("\n✅ Examples completed!")
    print("\nTo use these in your Flask app:")
    print("1. Make sure your site is verified in Google Search Console")
    print("2. Get an access token with Search Console API scope")
    print("3. Call the endpoints: /api/projects/<id>/search-analytics")
    print("4. Or use the detailed endpoint: /api/projects/<id>/search-analytics/detailed") 