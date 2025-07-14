#!/usr/bin/env python3
"""
Test script for Google Search Console API
"""

import requests
import json
from datetime import datetime, timedelta

def fetch_total_clicks(site_url, access_token):
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

    print(f"🔍 Testing Search Console API...")
    print(f"URL: {url}")
    print(f"Site URL: {site_url}")
    print(f"Date Range: {payload['startDate']} to {payload['endDate']}")
    print(f"Access Token: {access_token[:20]}..." if access_token else "No access token")

    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Response received successfully")
            print(f"Response data: {json.dumps(data, indent=2)}")
            
            if "rows" in data and len(data["rows"]) > 0:
                clicks = data["rows"][0]["clicks"]
                print(f"🎯 Total Clicks: {clicks}")
                return clicks
            else:
                print(f"⚠️ No rows found in response")
                return 0
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Error response: {response.text}")
            return 0
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return 0

def test_with_sample_data():
    """Test with sample data to see the function structure"""
    print("=" * 50)
    print("🧪 Testing with sample data...")
    
    # Sample response data
    sample_data = {
        "rows": [
            {
                "clicks": 1250,
                "impressions": 15000,
                "ctr": 0.083,
                "position": 12.5
            }
        ]
    }
    
    print(f"Sample data: {json.dumps(sample_data, indent=2)}")
    
    if "rows" in sample_data and len(sample_data["rows"]) > 0:
        clicks = sample_data["rows"][0]["clicks"]
        print(f"🎯 Sample Total Clicks: {clicks}")
    else:
        print("⚠️ No sample data found")

def test_api_endpoint():
    """Test our backend API endpoint"""
    print("=" * 50)
    print("🧪 Testing backend API endpoint...")
    
    try:
        # Test if backend is running
        response = requests.get("http://localhost:5001/")
        print(f"Backend status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Backend is running")
            
            # Test search analytics endpoint (you'll need to provide a project ID)
            project_id = input("Enter a project ID to test (or press Enter to skip): ").strip()
            if project_id:
                response = requests.get(f"http://localhost:5001/api/projects/{project_id}/search-analytics")
                print(f"Search analytics endpoint status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Search analytics data: {json.dumps(data, indent=2)}")
                else:
                    print(f"❌ Error: {response.text}")
        else:
            print("❌ Backend not responding")
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend not running on localhost:5001")
    except Exception as e:
        print(f"❌ Error testing backend: {str(e)}")

if __name__ == "__main__":
    print("🔍 Google Search Console API Test")
    print("=" * 50)
    
    # Test with sample data first
    test_with_sample_data()
    
    # Test backend API
    test_api_endpoint()
    
    # Test actual API call (you'll need to provide real credentials)
    print("=" * 50)
    print("🧪 Testing actual API call...")
    
    site_url = input("Enter your site URL (e.g., https://example.com): ").strip()
    access_token = input("Enter your access token (or press Enter to skip): ").strip()
    
    if site_url and access_token:
        clicks = fetch_total_clicks(site_url, access_token)
        print(f"🎯 Final Result - Total Clicks: {clicks}")
    else:
        print("⚠️ Skipping actual API test - no credentials provided")
    
    print("=" * 50)
    print("✅ Test completed!") 