import os
import json
from re import S
from dotenv import load_dotenv
load_dotenv()
import asyncio
import httpx

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, date, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from otp import otp_service
from ga4 import ga4
import requests
import spacy
from pytrends.request import TrendReq
import time
from bs4 import BeautifulSoup
import textstat

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Register GA4 Blueprint
app.register_blueprint(ga4)

# MongoDB connection
client = MongoClient("mongodb+srv://test:test@venkatesh.nvutauw.mongodb.net/?retryWrites=true&w=majority")
db = client['user_db']
users = db['users']
projects = db['projects']

# Load spaCy model (en_core_web_sm)
nlp = spacy.load('en_core_web_sm')

# Helper function to get user from request
def get_user_from_request():
    user_id = request.headers.get('User-ID')
    if not user_id:
        return None
    return users.find_one({"_id": ObjectId(user_id)})

# ✅ Health check route
@app.route('/')
def home():
    return "Backend is running!"

# ✅ Send OTP for registration
@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({"message": "Email is required!"}), 400
    
    # Check if email already exists
    if users.find_one({"email": email}):
        return jsonify({"message": "Email already registered!"}), 400
    
    # Send OTP
    result = otp_service.create_otp(email)
    if result["success"]:
        return jsonify({"message": "OTP sent successfully!"})
    else:
        return jsonify({"message": result["message"]}), 500

# ✅ Verify OTP and register
@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    name = data.get('name')
    password = data.get('password')
    
    if not all([email, otp, name, password]):
        return jsonify({"message": "All fields are required!"}), 400
    
    # Verify OTP
    result = otp_service.verify_otp(email, otp)
    if not result["success"]:
        return jsonify({"message": result["message"]}), 400
    
    # Check if email still exists (in case someone else registered while OTP was pending)
    if users.find_one({"email": email}):
        return jsonify({"message": "Email already registered!"}), 400
    
    # Create user
    hashed_password = generate_password_hash(password)
    user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "emailVerified": True,
        "createdAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    result = users.insert_one(user)
    user_id = str(result.inserted_id)
    return jsonify({
        "message": "Registration successful!",
        "user": {
            "_id": user_id,
            "name": name,
            "email": email,
            "emailVerified": True,
            "createdAt": user["createdAt"]
        }
    })

# ✅ Resend OTP
@app.route('/api/resend-otp', methods=['POST'])
def resend_otp():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({"message": "Email is required!"}), 400
    
    # Check if email already exists
    if users.find_one({"email": email}):
        return jsonify({"message": "Email already registered!"}), 400
    
    # Resend OTP
    result = otp_service.resend_otp(email)
    if result["success"]:
        return jsonify({"message": "OTP resent successfully!"})
    else:
        return jsonify({"message": result["message"]}), 500

# ✅ Register (legacy endpoint - now requires OTP)
@app.route('/api/register', methods=['POST'])
def register():
    return jsonify({"message": "Please use /api/send-otp and /api/verify-otp for registration!"}), 400

# ✅ Login
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = users.find_one({"email": data['email']})
    if user and check_password_hash(user["password"], data["password"]):
        return jsonify({
            "message": "Login successful!",
            "user": {
                "_id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "emailVerified": user.get("emailVerified", False),
                "createdAt": user["createdAt"]
            }
        })
    return jsonify({"message": "Invalid email or password!"}), 401


# ✅ Projects CRUD API
# 🔹 Get user's projects
@app.route('/api/projects', methods=['GET'])
def get_projects():
    user = get_user_from_request()
    if not user:
        return jsonify({"message": "User not authenticated!"}), 401
    
    project_list = []
    for proj in projects.find({"userId": str(user["_id"])}):
        proj['_id'] = str(proj['_id'])
        project_list.append(proj)
    return jsonify(project_list)


# 🔹 Create a new project
@app.route('/api/projects', methods=['POST'])
def create_project():
    user = get_user_from_request()
    if not user:
        return jsonify({"message": "User not authenticated!"}), 401
    
    data = request.json
    # Prevent duplicate URLs for the same user
    if projects.find_one({"userId": str(user["_id"]), "url": data.get('url')}):
        return jsonify({"message": "A project with this URL already exists."}), 400
    # Prevent duplicate names for the same user
    if projects.find_one({"userId": str(user["_id"]), "name": data.get('name')}):
        return jsonify({"message": "A project with this name already exists."}), 400
    project = {
        "name": data.get('name'),
        "url": data.get('url'),
        "type": data.get('type', 'own'),
        "userId": str(user["_id"]),
        "createdAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    result = projects.insert_one(project)
    return jsonify({"message": "Project added!", "id": str(result.inserted_id)})


# 🔹 Update a project
@app.route('/api/projects/<id>', methods=['PUT'])
def update_project(id):
    user = get_user_from_request()
    if not user:
        return jsonify({"message": "User not authenticated!"}), 401
    
    # Check if project belongs to user
    project = projects.find_one({"_id": ObjectId(id), "userId": str(user["_id"])})
    if not project:
        return jsonify({"message": "Project not found or access denied!"}), 404
    
    data = request.json
    print(f"Received update data for project {id}: {data}")
    
    # Prevent duplicate URLs for the same user (if url is being changed)
    new_url = data.get('url')
    if new_url and new_url != project['url']:
        if projects.find_one({"userId": str(user["_id"]), "url": new_url}):
            return jsonify({"message": "A project with this URL already exists."}), 400
    # Prevent duplicate names for the same user (if name is being changed)
    new_name = data.get('name')
    if new_name and new_name != project['name']:
        if projects.find_one({"userId": str(user["_id"]), "name": new_name}):
            return jsonify({"message": "A project with this name already exists."}), 400
    
    update_fields = {}
    
    # Only update fields that are provided in the request
    if 'name' in data:
        update_fields['name'] = data.get('name')
    if 'url' in data:
        update_fields['url'] = data.get('url')
    if 'type' in data:
        update_fields['type'] = data.get('type', 'own')
    
    # If G-ID is being updated, call GA4 Admin API to get property information
    if 'gtag' in data:
        print(f"Updating G-ID for project {id}: {data['gtag']}")
        update_fields['gtag'] = data['gtag']
        
        # Check if project has Google access token
        if not project.get('google_access_token'):
            print(f"Project {id} missing Google access token")
            return jsonify({"message": "Google OAuth not completed for this project. Please verify your site first."}), 400
        
        print(f"Project {id} has access token, calling GA4 API...")
        try:
            print(f"Storing G-ID: {data['gtag']}")
            
            # Basic G-ID validation
            if not data['gtag'].startswith('G-') or len(data['gtag']) != 12:
                return jsonify({
                    "message": "Invalid G-ID format. G-ID must start with 'G-' and be 12 characters long."
                }), 400
            
            # Call GA4 API to get properties and find matching property
            headers = {
                "Authorization": f"Bearer {project['google_access_token']}"
            }
            print(f"Calling GA4 API to find property for G-ID: {data['gtag']}")
            
            # Try to validate G-ID using GA4 Admin API
            print("Attempting to validate G-ID using GA4 Admin API...")
            
            def get_ga4_property_id(access_token: str, gtag_id: str):
                # 1. Fetch account summaries
                summaries_url = "https://analyticsadmin.googleapis.com/v1beta/accountSummaries"
                headers = {
                    "Authorization": f"Bearer {access_token}"
                }

                response = requests.get(summaries_url, headers=headers)
                if response.status_code != 200:
                    print("❌ Failed to fetch account summaries:", response.text)
                    return None

                data = response.json()
                print("\n📊 Account Summaries Response:", json.dumps(data, indent=2))

                # 2. Loop through all properties
                for account in data.get("accountSummaries", []):
                    print(f"\n👤 Checking Account: {account.get('displayName')}")
                    for prop in account.get("propertySummaries", []):
                        property_id = prop.get("property").split("/")[-1]
                        display_name = prop.get("displayName")
                        print(f"\n🔍 Checking Property: {display_name} (ID: {property_id})")

                        # 3. For each property, fetch dataStreams
                        stream_url = f"https://analyticsadmin.googleapis.com/v1beta/properties/{property_id}/dataStreams"
                        print(f"📡 Fetching streams from: {stream_url}")
                        
                        stream_res = requests.get(stream_url, headers=headers)
                        if stream_res.status_code != 200:
                            print(f"⚠️ Failed to get dataStreams for property {property_id}: {stream_res.text}")
                            continue

                        streams = stream_res.json().get("dataStreams", [])
                        print(f"Found {len(streams)} streams")
                        
                        for stream in streams:
                            web_data = stream.get("webStreamData", {})
                            measurement_id = web_data.get("measurementId")
                            print(f"Stream measurement ID: {measurement_id}")

                            # 4. Check if it matches the provided G-ID
                            if measurement_id == gtag_id:
                                print(f"✅ Found matching PROPERTY_ID: {property_id} for G-ID: {gtag_id}")
                                return property_id

                print("❌ No matching PROPERTY_ID found.")
                return None

            # Add required scope for GA4 Admin API
            if 'https://www.googleapis.com/auth/analytics.readonly' not in project['google_token_scope']:
                return jsonify({
                    "message": "Missing required Google Analytics scope. Please re-verify your site with the correct permissions.",
                    "required_scope": "https://www.googleapis.com/auth/analytics.readonly",
                    "current_scopes": project['google_token_scope']
                }), 400

            # Call the function to get property ID
            property_id = get_ga4_property_id(project['google_access_token'], data['gtag'])
            
            if not property_id:
                return jsonify({
                    "message": f"G-ID '{data['gtag']}' not found in your GA4 properties. Please verify the G-ID is correct.",
                    "error": "invalid_gid"
                }), 400
                
            print(f"\n🎯 Success! Found property ID: {property_id} for G-ID: {data['gtag']}")
            
            # Store both G-ID and property information
            update_fields['gtag'] = data['gtag']
            update_fields['propertyId'] = property_id
            
        except Exception as e:
            print(f"Error processing G-ID: {str(e)}")
            return jsonify({
                "message": "Error processing G-ID",
                "details": str(e)
            }), 500
    
    projects.update_one(
        {"_id": ObjectId(id)},
        {"$set": update_fields}
    )
    return jsonify({"message": "Project updated!"})


# 🔹 Delete a project
@app.route('/api/projects/<id>', methods=['DELETE'])
def delete_project(id):
    user = get_user_from_request()
    if not user:
        return jsonify({"message": "User not authenticated!"}), 401
    
    # Check if project belongs to user
    project = projects.find_one({"_id": ObjectId(id), "userId": str(user["_id"])})
    if not project:
        return jsonify({"message": "Project not found or access denied!"}), 404
    
    projects.delete_one({"_id": ObjectId(id)})
    return jsonify({"message": "Project deleted!"})


@app.route('/api/auth/google/callback', methods=['POST'])
def google_oauth_callback():
    user = get_user_from_request()
    print("User:", user)
    if not user:
        return jsonify({"message": "User not authenticated!"}), 401
    data = request.json
    code = data.get('code')
    project_url = data.get('projectUrl')
    print("Received code:", code)
    print("Received projectUrl:", project_url)
    if not code or not project_url:
        return jsonify({"message": "Missing code or projectUrl"}), 400

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = "http://localhost:3000/projects"

    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }
    r = requests.post(token_url, data=payload)
    print("Google token response:", r.text)
    if r.status_code != 200:
        return jsonify({"message": "Failed to exchange code", "details": r.text}), 400

    tokens = r.json()
    # Save tokens in the project document
    result = projects.update_one(
        {"userId": str(user["_id"]), "url": project_url},
        {"$set": {
            "google_access_token": tokens.get('access_token'),
            "google_refresh_token": tokens.get('refresh_token'),
            "google_token_expiry": tokens.get('expires_in'),
            "google_token_scope": tokens.get('scope'),
            "google_token_type": tokens.get('token_type')
        }}
    )
    print("MongoDB update result:", result.raw_result)
    if result.matched_count == 0:
        return jsonify({"message": "Project not found for this user!"}), 404

    return jsonify({"message": "Tokens saved to project", "tokens": tokens})

def fetch_direct_traffic(property_id: str, access_token: str):
    """Get direct traffic data for the last 7 days."""
    url = f"https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runReport"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    body = {
        "dimensions": [
            {"name": "sessionDefaultChannelGroup"}
        ],
        "metrics": [
            {"name": "sessions"},
            {"name": "totalUsers"},
            {"name": "newUsers"}
        ],
        "dimensionFilter": {
            "filter": {
                "fieldName": "sessionDefaultChannelGroup",
                "stringFilter": {
                    "value": "Direct",
                    "matchType": "EXACT"
                }
            }
        },
        "dateRanges": [
            {
                "startDate": "7daysAgo",
                "endDate": "today"
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=body)
        print(f"GA4 Data API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            try:
                row = data['rows'][0]['metricValues']
                print(f"✅ Direct Traffic (last 7 days):")
                print(f"  - Sessions: {row[0]['value']}")
                print(f"  - Total Users: {row[1]['value']}")
                print(f"  - New Users: {row[2]['value']}")
                
                return {
                    "success": True,
                    "sessions": int(row[0]['value']),
                    "totalUsers": int(row[1]['value']),
                    "newUsers": int(row[2]['value'])
                }
            except (IndexError, KeyError):
                print("⚠️ No direct traffic data found.")
                return {
                    "success": True,
                    "sessions": 0,
                    "totalUsers": 0,
                    "newUsers": 0
                }
        elif response.status_code == 401:
            print("❌ Token expired or invalid")
            return {
                "success": False,
                "error": "token_expired",
                "message": "Access token expired. Please re-verify your site."
            }
        else:
            print("❌ Error fetching data:", response.text)
            return {
                "success": False,
                "error": "api_error",
                "message": f"Failed to fetch traffic data: {response.text}"
            }
    except Exception as e:
        print(f"❌ Exception while fetching traffic data: {str(e)}")
        return {
            "success": False,
            "error": "exception",
            "message": str(e)
        }

def refresh_access_token(refresh_token: str):
    """Refresh Google access token using refresh token."""
    url = "https://oauth2.googleapis.com/token"
    
    data = {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }
    
    try:
        response = requests.post(url, data=data)
        if response.status_code == 200:
            result = response.json()
            return {
                "access_token": result["access_token"],
                "expires_in": result.get("expires_in", 3600)
            }
        else:
            print(f"❌ Token refresh failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception during token refresh: {str(e)}")
        return None

def fetch_direct_traffic_with_refresh(project):
    """Fetch direct traffic with automatic token refresh."""
    access_token = project.get("google_access_token")
    refresh_token = project.get("google_refresh_token")

    # Try original token first
    result = fetch_direct_traffic(project["propertyId"], access_token)
    
    if not result["success"] and result.get("error") == "token_expired":
        print("🔄 Token expired, attempting refresh...")
        refreshed = refresh_access_token(refresh_token)
        if refreshed:
            access_token = refreshed["access_token"]
            # Update MongoDB with new token
            db.projects.update_one(
                {"_id": project["_id"]},
                {"$set": {
                    "google_access_token": access_token,
                    "google_token_expiry": datetime.utcnow() + timedelta(seconds=refreshed["expires_in"])
                }}
            )
            print("✅ Token refreshed successfully")
            # Retry with new token
            result = fetch_direct_traffic(project["propertyId"], access_token)
        else:
            result = {
                "success": False,
                "error": "refresh_failed",
                "message": "Could not refresh access token. Please reconnect your Google account."
            }

    return result

# 🔹 Get direct traffic for a project
@app.route('/api/projects/<id>/direct-traffic', methods=['GET'])
def get_project_direct_traffic(id):
    user = get_user_from_request()
    if not user:
        return jsonify({"message": "User not authenticated!"}), 401
    
    # Check if project belongs to user
    project = projects.find_one({"_id": ObjectId(id), "userId": str(user["_id"])})
    if not project:
        return jsonify({"message": "Project not found or access denied!"}), 404
    
    # Check if project has GA4 configured
    if not project.get('propertyId') or not project.get('google_access_token'):
        return jsonify({
            "message": "Google Analytics not configured for this project.",
            "error": "ga4_not_configured"
        }), 400
    
    # Get direct traffic data with token refresh
    print(f"\nFetching direct traffic for project {id}")
    print(f"Using property ID: {project['propertyId']}")
    print(f"Access token: {project['google_access_token'][:20]}...")
    
    result = fetch_direct_traffic_with_refresh(project)
    
    print(f"\nGot result: {result}")
    
    if not result["success"]:
        if result.get("error") == "token_expired":
            return jsonify({
                "message": "Google Analytics access expired. Please re-verify your site.",
                "error": "token_expired"
            }), 401
        return jsonify({
            "message": "Failed to fetch organic traffic data.",
            "error": result.get("error", "unknown"),
            "details": result.get("message")
        }), 400
    
    return jsonify({
        "organicTraffic": {
            "totalUsers": result["totalUsers"],
            "newUsers": result["newUsers"],
            "sessions": result["sessions"]
        },
        "period": "last_30_days"
    })

def get_unassigned_traffic(property_id: str, access_token: str):
    """Get unassigned traffic data for the last 7 days using Google Analytics Data API v1beta."""
    try:
        from google.analytics.data_v1beta import BetaAnalyticsDataClient
        from google.analytics.data_v1beta.types import (
            DateRange,
            Dimension,
            Metric,
            RunReportRequest
        )
        from google.oauth2.credentials import Credentials
        
        credentials = Credentials(token=access_token)
        client = BetaAnalyticsDataClient(credentials=credentials)

        request = RunReportRequest(
            property=f"properties/{property_id}",
            dimensions=[Dimension(name="firstUserDefaultChannelGroup")],
            metrics=[
                Metric(name="sessions"),
                Metric(name="totalUsers"),
                Metric(name="newUsers")
            ],
            date_ranges=[DateRange(start_date="7daysAgo", end_date="today")]
        )

        response = client.run_report(request)
        
        # Extract unassigned values
        sessions = 0
        total_users = 0
        new_users = 0
        
        for row in response.rows:
            channel = row.dimension_values[0].value
            if channel.lower() == "unassigned":
                sessions = int(row.metric_values[0].value)
                total_users = int(row.metric_values[1].value)
                new_users = int(row.metric_values[2].value)
                break
        
        print(f"✅ Unassigned Traffic (last 7 days):")
        print(f"  - Sessions: {sessions}")
        print(f"  - Total Users: {total_users}")
        print(f"  - New Users: {new_users}")
        
        return {
            "success": True,
            "sessions": sessions,
            "totalUsers": total_users,
            "newUsers": new_users
        }
        
    except ImportError:
        print("❌ Google Analytics Data API library not installed")
        return {
            "success": False,
            "error": "import_error",
            "message": "Google Analytics Data API library not available"
        }
    except Exception as e:
        print(f"❌ Exception while fetching unassigned traffic data: {str(e)}")
        return {
            "success": False,
            "error": "exception",
            "message": str(e)
        }

def fetch_unassigned_traffic_with_refresh(project):
    access_token = project.get("google_access_token")
    refresh_token = project.get("google_refresh_token")
    result = get_unassigned_traffic(project["propertyId"], access_token)
    if not result["success"] and result.get("error") == "token_expired":
        print("🔄 Token expired, attempting refresh for unassigned traffic...")
        refreshed = refresh_access_token(refresh_token)
        if refreshed:
            access_token = refreshed["access_token"]
            db.projects.update_one(
                {"_id": project["_id"]},
                {"$set": {
                    "google_access_token": access_token,
                    "google_token_expiry": datetime.utcnow() + timedelta(seconds=refreshed["expires_in"])
                }}
            )
            print("✅ Token refreshed successfully (unassigned traffic)")
            result = get_unassigned_traffic(project["propertyId"], access_token)
        else:
            result = {
                "success": False,
                "error": "refresh_failed",
                "message": "Could not refresh access token. Please reconnect your Google account."
            }
    return result

def get_active_users_last_30min(property_id: str, access_token: str):
    url = f"https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runRealtimeReport"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "dimensions": [{"name": "unifiedScreenName"}],
        "metrics": [{"name": "activeUsers"}]
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        data = response.json()
        try:
            active_users = int(data['rows'][0]['metricValues'][0]['value'])
        except (KeyError, IndexError):
            active_users = 0
        return {
            "success": True,
            "activeUsers": active_users
        }
    else:
        return {
            "success": False,
            "error": response.status_code,
            "message": response.text
        }

def get_views_last_30min(property_id: str, access_token: str):
    url = f"https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runRealtimeReport"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "dimensions": [{"name": "eventName"}],
        "metrics": [{"name": "eventCount"}],
        "dimensionFilter": {
            "filter": {
                "fieldName": "eventName",
                "stringFilter": {
                    "value": "page_view",
                    "matchType": "EXACT"
                }
            }
        }
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        data = response.json()
        try:
            event_count = int(data['rows'][0]['metricValues'][0]['value'])
        except (KeyError, IndexError):
            event_count = 0
        return {
            "success": True,
            "viewsLast30Min": event_count
        }
    else:
        return {
            "success": False,
            "error": response.status_code,
            "message": response.text
        }

def fetch_top_page_view(property_id: str, access_token: str):
    """Get the top page by page views in the last 30 minutes."""
    url = f"https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runReport"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    body = {
        "dimensions": [{"name": "pagePath"}],
        "metrics": [
            {"name": "screenPageViews"}
        ],
        "dateRanges": [
            {
                "startDate": "today",
                "endDate": "today"
            }
        ],
        "orderBys": [
            {
                "desc": True,
                "metric": {"metricName": "screenPageViews"}
            }
        ],
        "limit": 1
    }
    
    try:
        response = requests.post(url, headers=headers, json=body)
        print(f"Top page API Response Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json().get("rows", [])
            if data:
                top_row = data[0]
                page_path = top_row["dimensionValues"][0]["value"]
                page_views = int(top_row["metricValues"][0]["value"])
                
                print(f"✅ Top Page (today): {page_path} - {page_views} views")
                
                return {
                    "success": True,
                    "pagePath": page_path,
                    "screenPageViews": page_views
                }
            else:
                print("⚠️ No top page data found.")
                return {
                    "success": True,
                    "pagePath": None,
                    "screenPageViews": 0
                }
        elif response.status_code == 401:
            print("❌ Token expired or invalid for top page")
            return {
                "success": False,
                "error": "token_expired",
                "message": "Access token expired. Please re-verify your site."
            }
        else:
            print(f"❌ Error fetching top page data: {response.text}")
            return {
                "success": False,
                "error": response.status_code,
                "message": response.text
            }
    except Exception as e:
        print(f"❌ Exception while fetching top page data: {str(e)}")
        return {
            "success": False,
            "error": "exception",
            "message": str(e)
        }

def get_active_users_by_device(property_id: str, access_token: str):
    url = f"https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runRealtimeReport"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "dimensions": [{"name": "deviceCategory"}],
        "metrics": [{"name": "activeUsers"}]
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        result = response.json()
        devices = {}
        total_users = 0
        for row in result.get("rows", []):
            device = row["dimensionValues"][0]["value"]
            count = int(row["metricValues"][0]["value"])
            devices[device] = count
            total_users += count
        percent_breakdown = {
            device: round((count / total_users) * 100, 1)
            for device, count in devices.items()
        } if total_users > 0 else {}
        return {
            "success": True,
            "devices": devices,
            "percent": percent_breakdown,
            "total": total_users
        }
    else:
        return {
            "success": False,
            "error": response.status_code,
            "message": response.text
        }

def fetch_realtime_metrics_with_refresh(project):
    access_token = project.get("google_access_token")
    refresh_token = project.get("google_refresh_token")
    property_id = project["propertyId"]
    # Try original token first
    active_users_result = get_active_users_last_30min(property_id, access_token)
    views_result = get_views_last_30min(property_id, access_token)
    device_result = get_active_users_by_device(property_id, access_token)
    top_page_result = fetch_top_page_view(property_id, access_token)
    # If any failed due to token, refresh and retry all
    if (
        (not active_users_result["success"] and active_users_result.get("error") == "token_expired") or
        (not views_result["success"] and views_result.get("error") == "token_expired") or
        (not device_result["success"] and device_result.get("error") == "token_expired") or
        (not top_page_result["success"] and top_page_result.get("error") == "token_expired")
    ):
        print("🔄 Token expired, attempting refresh for realtime metrics...")
        refreshed = refresh_access_token(refresh_token)
        if refreshed:
            access_token = refreshed["access_token"]
            db.projects.update_one(
                {"_id": project["_id"]},
                {"$set": {
                    "google_access_token": access_token,
                    "google_token_expiry": datetime.utcnow() + timedelta(seconds=refreshed["expires_in"])
                }}
            )
            print("✅ Token refreshed successfully (realtime metrics)")
            active_users_result = get_active_users_last_30min(property_id, access_token)
            views_result = get_views_last_30min(property_id, access_token)
            device_result = get_active_users_by_device(property_id, access_token)
            top_page_result = fetch_top_page_view(property_id, access_token)
        else:
            return {
                "success": False,
                "error": "refresh_failed",
                "message": "Could not refresh access token. Please reconnect your Google account."
            }
    return {
        "success": True,
        "activeUsers": active_users_result.get("activeUsers", 0),
        "viewsLast30Min": views_result.get("viewsLast30Min", 0),
        "deviceBreakdown": device_result if device_result["success"] else {},
        "topPage": top_page_result
    }

@app.route('/api/projects/<id>/unassigned-traffic', methods=['GET'])
def get_project_unassigned_traffic(id):
    user = get_user_from_request()
    if not user:
        return jsonify({"message": "User not authenticated!"}), 401
    project = projects.find_one({"_id": ObjectId(id), "userId": str(user["_id"])})
    if not project:
        return jsonify({"message": "Project not found or access denied!"}), 404
    if not project.get("google_access_token") or not project.get("propertyId"):
        return jsonify({"message": "GA4 not configured for this project."}), 400
    print(f"\nFetching unassigned traffic for project {id}")
    print(f"Using property ID: {project['propertyId']}")
    print(f"Access token: {project['google_access_token'][:20]}...")
    result = fetch_unassigned_traffic_with_refresh(project)
    print(f"\nGot result: {result}")
    return jsonify({"unassignedTraffic": result})

@app.route('/api/projects/<id>/realtime-metrics', methods=['GET'])
def get_project_realtime_metrics(id):
    user = get_user_from_request()
    if not user:
        return jsonify({"message": "User not authenticated!"}), 401
    project = projects.find_one({"_id": ObjectId(id), "userId": str(user["_id"])})
    if not project:
        return jsonify({"message": "Project not found or access denied!"}), 404
    if not project.get("google_access_token") or not project.get("propertyId"):
        return jsonify({"message": "GA4 not configured for this project."}), 400
    print(f"\nFetching realtime metrics for project {id}")
    print(f"Using property ID: {project['propertyId']}")
    print(f"Access token: {project['google_access_token'][:20]}...")
    result = fetch_realtime_metrics_with_refresh(project)
    print(f"\nGot result: {result}")
    print(f"Top page data: {result.get('topPage', 'Not found')}")
    return jsonify(result)

# 🔍 Google Search Console API Functions
def fetch_search_analytics(site_url: str, access_token: str, start_date: str | None = None, end_date: str | None = None):
    """Fetch search analytics data from Google Search Console API."""
    # Clean and encode the site URL for the API
    import urllib.parse
    # Remove trailing slash if present
    site_url = site_url.rstrip('/')
    # URL encode the site URL
    encoded_site_url = urllib.parse.quote(site_url, safe='')
    url = f"https://searchconsole.googleapis.com/webmasters/v3/sites/{encoded_site_url}/searchAnalytics/query"
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

def fetch_search_analytics_with_refresh(project, start_date: str | None = None, end_date: str | None = None):
    """Fetch search analytics with token refresh capability."""
    access_token = project.get("google_access_token")
    refresh_token = project.get("google_refresh_token")
    site_url = project.get("url")
    
    if not site_url:
        return {
            "success": False,
            "error": "no_site_url",
            "message": "Site URL not configured for this project."
        }
    
    # Try original token first
    result = fetch_search_analytics(site_url, access_token, start_date, end_date)
    
    # If failed due to token, refresh and retry
    if not result["success"] and result.get("error") == "token_expired":
        print("🔄 Token expired, attempting refresh for Search Console...")
        refreshed = refresh_access_token(refresh_token)
        if refreshed:
            access_token = refreshed["access_token"]
            db.projects.update_one(
                {"_id": project["_id"]},
                {"$set": {
                    "google_access_token": access_token,
                    "google_token_expiry": datetime.utcnow() + timedelta(seconds=refreshed["expires_in"])
                }}
            )
            print("✅ Token refreshed successfully (Search Console)")
            result = fetch_search_analytics(site_url, access_token, start_date, end_date)
        else:
            return {
                "success": False,
                "error": "refresh_failed",
                "message": "Could not refresh access token. Please reconnect your Google account."
            }
    
    return result

# 🔍 Search Console API Endpoints
@app.route('/api/projects/<id>/search-analytics', methods=['GET'])
def get_project_search_analytics(id):
    """Get search analytics for a project."""
    user = get_user_from_request()
    if not user:
        return jsonify({"message": "User not authenticated!"}), 401
    
    project = projects.find_one({"_id": ObjectId(id), "userId": str(user["_id"])})
    if not project:
        return jsonify({"message": "Project not found or access denied!"}), 404
    
    if not project.get("google_access_token"):
        return jsonify({"message": "Google account not connected for this project."}), 400
    
    # Get date range from query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    print(f"\nFetching search analytics for project {id}")
    print(f"Site URL: {project.get('url')}")
    print(f"Date range: {start_date} to {end_date}")
    print(f"Access token: {project['google_access_token'][:20]}...")
    
    result = fetch_search_analytics_with_refresh(project, start_date, end_date)
    print(f"\nGot result: {result}")
    
    return jsonify({"searchAnalytics": result})

@app.route('/api/projects/<id>/search-analytics/detailed', methods=['GET'])
def get_detailed_search_analytics(id):
    """Get detailed search analytics with top queries and pages."""
    user = get_user_from_request()
    if not user:
        return jsonify({"message": "User not authenticated!"}), 401
    
    project = projects.find_one({"_id": ObjectId(id), "userId": str(user["_id"])})
    if not project:
        return jsonify({"message": "Project not found or access denied!"}), 404
    
    if not project.get("google_access_token"):
        return jsonify({"message": "Google account not connected for this project."}), 400
    
    # Get date range from query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    print(f"\nFetching detailed search analytics for project {id}")
    print(f"Site URL: {project.get('url')}")
    print(f"Date range: {start_date} to {end_date}")
    
    # Fetch queries data
    # Clean and encode the site URL for the API
    import urllib.parse
    site_url = project.get('url')
    if site_url:
        site_url = site_url.rstrip('/')
        encoded_site_url = urllib.parse.quote(site_url, safe='')
        url = f"https://searchconsole.googleapis.com/webmasters/v3/sites/{encoded_site_url}/searchAnalytics/query"
    else:
        return jsonify({
            "success": False,
            "error": "no_site_url",
            "message": "Site URL not configured for this project."
        })
    headers = {
        "Authorization": f"Bearer {project['google_access_token']}",
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
        
        return jsonify({"detailedSearchAnalytics": result})
        
    except Exception as e:
        print(f"❌ Exception while fetching detailed search analytics: {str(e)}")
        return jsonify({
            "success": False,
            "error": "exception",
            "message": str(e)
        })

def get_country_device_data(property_id: str, access_token: str):
    """Get country and device data from Google Analytics."""
    url = f"https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runReport"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "dimensions": [
            {"name": "country"},
            {"name": "deviceCategory"}
        ],
        "metrics": [
            {"name": "sessions"},
            {"name": "totalUsers"}
        ],
        "dateRanges": [
            {
                "startDate": "30daysAgo",
                "endDate": "today"
            }
        ],
        "orderBys": [
            {
                "desc": True,
                "metric": {"metricName": "sessions"}
            }
        ],
        "limit": 10
    }
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Country/Device API Response Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if "rows" in data and len(data["rows"]) > 0:
                country_device_data = []
                for row in data["rows"]:
                    country = row["dimensionValues"][0]["value"]
                    device = row["dimensionValues"][1]["value"]
                    sessions = int(row["metricValues"][0]["value"])
                    users = int(row["metricValues"][1]["value"])
                    country_device_data.append({
                        "country": country,
                        "device": device,
                        "sessions": sessions,
                        "users": users
                    })
                print(f"✅ Country/Device Data: {len(country_device_data)} entries")
                return {
                    "success": True,
                    "data": country_device_data
                }
            else:
                print("⚠️ No country/device data found.")
                return {
                    "success": True,
                    "data": []
                }
        elif response.status_code == 401:
            print("❌ Token expired or invalid for Country/Device data")
            return {
                "success": False,
                "error": "token_expired",
                "message": "Access token expired. Please re-verify your site."
            }
        else:
            print(f"❌ Error fetching country/device data: {response.text}")
            return {
                "success": False,
                "error": response.status_code,
                "message": response.text
            }
    except Exception as e:
        print(f"❌ Exception while fetching country/device data: {str(e)}")
        return {
            "success": False,
            "error": "exception",
            "message": str(e)
        }

def get_country_device_data_with_refresh(project):
    """Get country and device data with token refresh capability."""
    access_token = project.get("google_access_token")
    refresh_token = project.get("google_refresh_token")
    property_id = project.get("propertyId")
    if not property_id:
        return {
            "success": False,
            "error": "no_property_id",
            "message": "Google Analytics not configured for this project."
        }
    result = get_country_device_data(property_id, access_token)
    if not result["success"] and result.get("error") == "token_expired":
        print("🔄 Token expired, attempting refresh for Country/Device data...")
        refreshed = refresh_access_token(refresh_token)
        if refreshed:
            access_token = refreshed["access_token"]
            db.projects.update_one(
                {"_id": project["_id"]},
                {"$set": {
                    "google_access_token": access_token,
                    "google_token_expiry": datetime.utcnow() + timedelta(seconds=refreshed["expires_in"])
                }}
            )
            print("✅ Token refreshed successfully (Country/Device data)")
            result = get_country_device_data(property_id, access_token)
        else:
            return {
                "success": False,
                "error": "refresh_failed",
                "message": "Could not refresh access token. Please reconnect your Google account."
            }
    return result

@app.route('/api/projects/<id>/country-device-data', methods=['GET'])
def get_project_country_device_data(id):
    """Get country and device data for a project."""
    user = get_user_from_request()
    if not user:
        return jsonify({"message": "User not authenticated!"}), 401
    project = projects.find_one({"_id": ObjectId(id), "userId": str(user["_id"])})
    if not project:
        return jsonify({"message": "Project not found or access denied!"}), 404
    if not project.get("google_access_token"):
        return jsonify({"message": "Google account not connected for this project."}), 400
    print(f"\nFetching country/device data for project {id}")
    print(f"Using property ID: {project.get('propertyId')}")
    print(f"Access token: {project['google_access_token'][:20]}...")
    result = get_country_device_data_with_refresh(project)
    print(f"\nGot result: {result}")
    if not result["success"]:
        if result.get("error") == "token_expired":
            return jsonify({
                "message": "Google Analytics access expired. Please re-verify your site.",
                "error": "token_expired"
            }), 401
        return jsonify({
            "message": "Failed to fetch country/device data.",
            "error": result.get("error", "unknown"),
            "details": result.get("message")
        }), 400
    return jsonify({"countryDeviceData": result})

def fetch_url_inspection(site_url: str, access_token: str, url_to_inspect: str):
    """Fetch URL inspection data from Google Search Console."""
    # Clean and encode the site URL for the API (same as search analytics)
    import urllib.parse
    # Remove trailing slash if present
    site_url = site_url.rstrip('/')
    # URL encode the site URL to handle special characters
    encoded_site_url = urllib.parse.quote(site_url, safe='')
    url = f"https://searchconsole.googleapis.com/v1/sites/{encoded_site_url}/urlInspection/index:inspect"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "inspectionUrl": url_to_inspect,
        "siteUrl": site_url
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"URL Inspection API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            inspection_result = data.get("inspectionResult", {})
            
            # Extract relevant information
            url_inspection_data = {
                "success": True,
                "url": url_to_inspect,
                "indexStatus": inspection_result.get("indexStatusResult", {}).get("verdict", "Unknown"),
                "lastCrawled": inspection_result.get("indexStatusResult", {}).get("lastCrawlTime", ""),
                "coverageIssues": inspection_result.get("indexStatusResult", {}).get("coverageState", "Unknown"),
                "mobileFriendly": inspection_result.get("mobileUsabilityResult", {}).get("verdict", "Unknown"),
                "structuredData": inspection_result.get("richResultsResult", {}).get("verdict", "Unknown"),
                "coreWebVitals": inspection_result.get("ampResult", {}).get("verdict", "Unknown")
            }
            
            print(f"✅ URL Inspection Data: {url_inspection_data}")
            return url_inspection_data
            
        elif response.status_code == 401:
            print("❌ Token expired or invalid for URL inspection")
            return {
                "success": False,
                "error": "token_expired",
                "message": "Access token expired. Please re-verify your site."
            }
        elif response.status_code == 404:
            print("❌ Site not found in Search Console")
            return {
                "success": False,
                "error": "site_not_found",
                "message": "Site not found in Google Search Console. Please verify your site is added to Search Console."
            }
        else:
            print(f"❌ Error fetching URL inspection data: {response.text}")
            return {
                "success": False,
                "error": response.status_code,
                "message": response.text
            }
            
    except Exception as e:
        print(f"❌ Exception while fetching URL inspection data: {str(e)}")
        return {
            "success": False,
            "error": "exception",
            "message": str(e)
        }

def fetch_url_inspection_with_refresh(project, url_to_inspect: str):
    """Fetch URL inspection data with token refresh capability."""
    access_token = project.get("google_access_token")
    refresh_token = project.get("google_refresh_token")
    site_url = project.get("url")
    
    if not site_url:
        return {
            "success": False,
            "error": "no_site_url",
            "message": "Site URL not configured for this project."
        }
    
    result = fetch_url_inspection(site_url, access_token, url_to_inspect)
    
    if not result["success"] and result.get("error") == "token_expired":
        print("🔄 Token expired, attempting refresh for URL inspection...")
        refreshed = refresh_access_token(refresh_token)
        if refreshed:
            access_token = refreshed["access_token"]
            db.projects.update_one(
                {"_id": project["_id"]},
                {"$set": {
                    "google_access_token": access_token,
                    "google_token_expiry": datetime.utcnow() + timedelta(seconds=refreshed["expires_in"])
                }}
            )
            print("✅ Token refreshed successfully (URL inspection)")
            result = fetch_url_inspection(site_url, access_token, url_to_inspect)
        else:
            return {
                "success": False,
                "error": "refresh_failed",
                "message": "Could not refresh access token. Please reconnect your Google account."
            }
    
    return result

@app.route('/api/projects/<id>/url-inspection', methods=['GET'])
def get_project_url_inspection(id):
    """Get URL inspection data for a project."""
    user = get_user_from_request()
    if not user:
        return jsonify({"message": "User not authenticated!"}), 401
    
    project = projects.find_one({"_id": ObjectId(id), "userId": str(user["_id"])})
    if not project:
        return jsonify({"message": "Project not found or access denied!"}), 404
    
    if not project.get("google_access_token"):
        return jsonify({"message": "Google account not connected for this project."}), 400
    
    url_to_inspect = request.args.get('url')
    if not url_to_inspect:
        return jsonify({"message": "URL parameter is required."}), 400
    
    # Validate that the URL to inspect is part of the project's site
    site_url = project.get('url', '').rstrip('/')
    if site_url and not url_to_inspect.startswith(site_url):
        return jsonify({
            "message": f"URL must be part of your site ({site_url}). Please inspect URLs from your own domain.",
            "error": "invalid_url"
        }), 400
    
    print(f"\nFetching URL inspection data for project {id}")
    print(f"URL to inspect: {url_to_inspect}")
    print(f"Site URL: {site_url}")
    print(f"Access token: {project['google_access_token'][:20]}...")
    
    result = fetch_url_inspection_with_refresh(project, url_to_inspect)
    
    print(f"\nGot result: {result}")
    
    if not result["success"]:
        if result.get("error") == "token_expired":
            return jsonify({
                "message": "Google Search Console access expired. Please re-verify your site.",
                "error": "token_expired"
            }), 401
        elif result.get("error") == "site_not_found":
            return jsonify({
                "message": f"Site '{site_url}' not found in Google Search Console. Please verify your site is added to Search Console and the URL format matches exactly.",
                "error": "site_not_found"
            }), 404
        return jsonify({
            "message": "Failed to fetch URL inspection data.",
            "error": result.get("error", "unknown"),
            "details": result.get("message")
        }), 400
    
    return jsonify({"urlInspection": result})

def fetch_site_audit_data(site_url: str, access_token: str):
    """Fetch comprehensive site audit data from Google Search Console and other APIs."""
    import urllib.parse
    
    # Clean and encode the site URL
    site_url = site_url.rstrip('/')
    encoded_site_url = urllib.parse.quote(site_url, safe='')
    
    # 1. Fetch Search Console data
    search_console_url = f"https://searchconsole.googleapis.com/webmasters/v3/sites/{encoded_site_url}/searchAnalytics/query"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Get last 30 days of data
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    search_payload = {
        "startDate": start_date.strftime("%Y-%m-%d"),
        "endDate": end_date.strftime("%Y-%m-%d"),
        "dimensions": ["page"],
        "rowLimit": 100
    }
    
    try:
        # Fetch search analytics data
        search_response = requests.post(search_console_url, headers=headers, json=search_payload)
        print(f"Search Console API Response Status: {search_response.status_code}")
        
        if search_response.status_code == 200:
            search_data = search_response.json()
            
            # 2. Fetch URL inspection for homepage
            inspection_url = f"https://searchconsole.googleapis.com/v1/sites/{encoded_site_url}/urlInspection/index:inspect"
            inspection_payload = {
                "inspectionUrl": site_url,
                "siteUrl": site_url
            }
            
            inspection_response = requests.post(inspection_url, headers=headers, json=inspection_payload)
            print(f"URL Inspection API Response Status: {inspection_response.status_code}")
            
            # 3. Analyze the data and create audit report
            audit_data = analyze_site_data(search_data, inspection_response.json() if inspection_response.status_code == 200 else None, site_url)
            
            print(f"✅ Site Audit Data: {audit_data}")
            return audit_data
            
        elif search_response.status_code == 401:
            print("❌ Token expired or invalid for site audit")
            return {
                "success": False,
                "error": "token_expired",
                "message": "Access token expired. Please re-verify your site."
            }
        elif search_response.status_code == 404:
            print("❌ Site not found in Search Console")
            return {
                "success": False,
                "error": "site_not_found",
                "message": "Site not found in Google Search Console. Please verify your site is added to Search Console."
            }
        else:
            print(f"❌ Error fetching site audit data: {search_response.text}")
            return {
                "success": False,
                "error": search_response.status_code,
                "message": search_response.text
            }
            
    except Exception as e:
        print(f"❌ Exception while fetching site audit data: {str(e)}")
        return {
            "success": False,
            "error": "exception",
            "message": str(e)
        }

def perform_seo_checks(site_url):
    """Perform comprehensive SEO checks on the website."""
    import requests
    from bs4 import BeautifulSoup
    import urllib.parse
    
    seo_checks = []
    
    try:
        # Fetch the homepage
        response = requests.get(site_url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; SEO-Checker/1.0)'
        })
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 1. Meta Title Check
            title_tag = soup.find('title')
            if not title_tag or not title_tag.get_text().strip():
                seo_checks.append({
                    "type": "critical",
                    "title": "Meta Title Missing",
                    "description": "No title tag found on the page",
                    "fix": "Add a descriptive title tag between 50-60 characters",
                    "status": "critical",
                    "recommendation": "Add a compelling meta title to improve click-through rates"
                })
            else:
                title_text = title_tag.get_text().strip()
                if len(title_text) < 30:
                    seo_checks.append({
                        "type": "medium",
                        "title": "Meta Title Too Short",
                        "description": f"Title is only {len(title_text)} characters (recommended: 50-60)",
                        "fix": "Expand title to 50-60 characters for better SEO",
                        "status": "medium",
                        "recommendation": "Optimize meta title length for better search visibility"
                    })
                elif len(title_text) > 60:
                    seo_checks.append({
                        "type": "low",
                        "title": "Meta Title Too Long",
                        "description": f"Title is {len(title_text)} characters (recommended: 50-60)",
                        "fix": "Shorten title to 50-60 characters",
                        "status": "low"
                    })
            
            # 2. Meta Description Check
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if not meta_desc or not meta_desc.get('content', '').strip():
                seo_checks.append({
                    "type": "high",
                    "title": "Meta Description Missing",
                    "description": "No meta description found on the page",
                    "fix": "Add a compelling meta description between 150-160 characters",
                    "status": "high",
                    "recommendation": "Add meta descriptions to improve click-through rates"
                })
            else:
                desc_text = meta_desc.get('content', '').strip()
                if len(desc_text) < 120:
                    seo_checks.append({
                        "type": "medium",
                        "title": "Meta Description Too Short",
                        "description": f"Description is only {len(desc_text)} characters (recommended: 150-160)",
                        "fix": "Expand description to 150-160 characters",
                        "status": "medium"
                    })
                elif len(desc_text) > 160:
                    seo_checks.append({
                        "type": "low",
                        "title": "Meta Description Too Long",
                        "description": f"Description is {len(desc_text)} characters (recommended: 150-160)",
                        "fix": "Shorten description to 150-160 characters",
                        "status": "low"
                    })
            
            # 3. Images Alt Tags Check
            images = soup.find_all('img')
            images_without_alt = [img for img in images if not img.get('alt')]
            if images_without_alt:
                seo_checks.append({
                    "type": "medium",
                    "title": "Missing Image Alt Tags",
                    "description": f"{len(images_without_alt)} images without alt attributes found",
                    "fix": "Add descriptive alt tags to all images for accessibility and SEO",
                    "status": "medium",
                    "recommendation": "Add alt tags to images for better accessibility and SEO"
                })
            
            # 4. Broken Links Check
            links = soup.find_all('a', href=True)
            broken_links = []
            for link in links[:10]:  # Check first 10 links to avoid timeout
                href = link['href']
                if href.startswith('http'):
                    try:
                        link_response = requests.head(href, timeout=5)
                        if link_response.status_code >= 400:
                            broken_links.append(href)
                    except:
                        broken_links.append(href)
            
            if broken_links:
                seo_checks.append({
                    "type": "high",
                    "title": "Broken Links Detected",
                    "description": f"{len(broken_links)} broken links found",
                    "fix": "Fix or remove broken links to improve user experience",
                    "status": "high",
                    "recommendation": "Fix broken links to improve site credibility"
                })
            
            # 5. Robots.txt Check
            robots_url = urllib.parse.urljoin(site_url, '/robots.txt')
            try:
                robots_response = requests.get(robots_url, timeout=5)
                if robots_response.status_code != 200:
                    seo_checks.append({
                        "type": "medium",
                        "title": "Robots.txt Not Accessible",
                        "description": "robots.txt file not found or not accessible",
                        "fix": "Create a robots.txt file in the root directory",
                        "status": "medium",
                        "recommendation": "Add robots.txt file for better crawl control"
                    })
            except:
                seo_checks.append({
                    "type": "medium",
                    "title": "Robots.txt Not Accessible",
                    "description": "robots.txt file not found or not accessible",
                    "fix": "Create a robots.txt file in the root directory",
                    "status": "medium",
                    "recommendation": "Add robots.txt file for better crawl control"
                })
            
            # 6. Sitemap Check
            sitemap_url = urllib.parse.urljoin(site_url, '/sitemap.xml')
            try:
                sitemap_response = requests.get(sitemap_url, timeout=5)
                if sitemap_response.status_code != 200:
                    seo_checks.append({
                        "type": "low",
                        "title": "Sitemap Not Found",
                        "description": "sitemap.xml file not found",
                        "fix": "Create a sitemap.xml file and submit to Google Search Console",
                        "status": "low",
                        "recommendation": "Create and submit sitemap for better indexing"
                    })
            except:
                seo_checks.append({
                    "type": "low",
                    "title": "Sitemap Not Found",
                    "description": "sitemap.xml file not found",
                    "fix": "Create a sitemap.xml file and submit to Google Search Console",
                    "status": "low",
                    "recommendation": "Create and submit sitemap for better indexing"
                })
            
            # 7. H1 Tags Check
            h1_tags = soup.find_all('h1')
            if not h1_tags:
                seo_checks.append({
                    "type": "medium",
                    "title": "Missing H1 Tag",
                    "description": "No H1 tag found on the page",
                    "fix": "Add a descriptive H1 tag to improve SEO",
                    "status": "medium"
                })
            elif len(h1_tags) > 1:
                seo_checks.append({
                    "type": "low",
                    "title": "Multiple H1 Tags",
                    "description": f"{len(h1_tags)} H1 tags found (recommended: 1 per page)",
                    "fix": "Use only one H1 tag per page",
                    "status": "low"
                })
            
            # 8. Internal Links Check
            internal_links = [link for link in links if site_url in link.get('href', '')]
            if len(internal_links) < 3:
                seo_checks.append({
                    "type": "low",
                    "title": "Few Internal Links",
                    "description": f"Only {len(internal_links)} internal links found",
                    "fix": "Add more internal links to improve site structure",
                    "status": "low"
                })
        
        else:
            seo_checks.append({
                "type": "critical",
                "title": "Site Not Accessible",
                "description": f"Site returned status code {response.status_code}",
                "fix": "Check site availability and server configuration",
                "status": "critical"
            })
    
    except Exception as e:
        seo_checks.append({
            "type": "critical",
            "title": "Site Analysis Failed",
            "description": f"Could not analyze site: {str(e)}",
            "fix": "Check site accessibility and try again",
            "status": "critical"
        })
    
    return seo_checks

def analyze_site_data(search_data, inspection_data, site_url):
    """Analyze search console data and create comprehensive audit report."""
    
    # Initialize audit categories
    issues = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0
    }
    
    categories = {
        "performance": {"score": 100, "issues": []},
        "seo": {"score": 100, "issues": []},
        "accessibility": {"score": 100, "issues": []},
        "security": {"score": 100, "issues": []}
    }
    
    recommendations = []
    
    # Perform comprehensive SEO checks
    seo_checks = perform_seo_checks(site_url)
    
    # Integrate SEO check results into categories
    for check in seo_checks:
        if check["status"] == "critical":
            categories["seo"]["score"] = max(categories["seo"]["score"] - 20, 0)
            issues["critical"] += 1
        elif check["status"] == "high":
            categories["seo"]["score"] = max(categories["seo"]["score"] - 15, 0)
            issues["high"] += 1
        elif check["status"] == "medium":
            categories["seo"]["score"] = max(categories["seo"]["score"] - 10, 0)
            issues["medium"] += 1
        elif check["status"] == "low":
            categories["seo"]["score"] = max(categories["seo"]["score"] - 5, 0)
            issues["low"] += 1
        
        categories["seo"]["issues"].append(check)
        if check.get("recommendation"):
            recommendations.append(check["recommendation"])
    
    # Analyze search performance
    if search_data.get("rows"):
        total_clicks = sum(row.get("clicks", 0) for row in search_data["rows"])
        total_impressions = sum(row.get("impressions", 0) for row in search_data["rows"])
        
        # SEO Analysis
        if total_impressions == 0:
            categories["seo"]["score"] = 60
            categories["seo"]["issues"].append({
                "type": "high",
                "title": "No search impressions detected",
                "description": "Your site is not appearing in Google search results",
                "fix": "Improve content quality and ensure proper indexing"
            })
            issues["high"] += 1
        elif total_clicks == 0 and total_impressions > 0:
            categories["seo"]["score"] = 70
            categories["seo"]["issues"].append({
                "type": "medium",
                "title": "Low click-through rate",
                "description": "Site appears in search but gets no clicks",
                "fix": "Improve meta descriptions and page titles"
            })
            issues["medium"] += 1
        else:
            ctr = (total_clicks / total_impressions) * 100 if total_impressions > 0 else 0
            if ctr < 1:
                categories["seo"]["score"] = 75
                categories["seo"]["issues"].append({
                    "type": "medium",
                    "title": "Low click-through rate",
                    "description": f"CTR is {ctr:.1f}% (below 1% threshold)",
                    "fix": "Optimize meta descriptions and improve page titles"
                })
                issues["medium"] += 1
                recommendations.append("Improve meta descriptions to increase click-through rates")
    
    # Analyze URL inspection data
    if inspection_data and inspection_data.get("inspectionResult"):
        inspection_result = inspection_data["inspectionResult"]
        
        # Index status analysis
        index_status = inspection_result.get("indexStatusResult", {}).get("verdict", "Unknown")
        if index_status not in ["PASS", "Indexed"]:
            categories["seo"]["score"] = max(categories["seo"]["score"] - 20, 0)
            categories["seo"]["issues"].append({
                "type": "critical",
                "title": "Indexing issues detected",
                "description": f"Homepage index status: {index_status}",
                "fix": "Check robots.txt and ensure proper crawling"
            })
            issues["critical"] += 1
            recommendations.append("Fix indexing issues to improve search visibility")
        
        # Mobile usability
        mobile_result = inspection_result.get("mobileUsabilityResult", {}).get("verdict", "Unknown")
        if mobile_result not in ["PASS", "Mobile Friendly"]:
            categories["performance"]["score"] = max(categories["performance"]["score"] - 15, 0)
            categories["performance"]["issues"].append({
                "type": "high",
                "title": "Mobile usability issues",
                "description": f"Mobile verdict: {mobile_result}",
                "fix": "Optimize site for mobile devices"
            })
            issues["high"] += 1
            recommendations.append("Optimize site for mobile devices")
        
        # Structured data
        structured_data = inspection_result.get("richResultsResult", {}).get("verdict", "Unknown")
        if structured_data not in ["PASS", "Valid Structured Data"]:
            categories["seo"]["score"] = max(categories["seo"]["score"] - 10, 0)
            categories["seo"]["issues"].append({
                "type": "low",
                "title": "Missing structured data",
                "description": "No structured data markup found",
                "fix": "Implement schema markup for better search visibility"
            })
            issues["low"] += 1
            recommendations.append("Implement schema markup for rich snippets")
    
    # Security analysis (HTTPS check)
    if not site_url.startswith("https://"):
        categories["security"]["score"] = 60
        categories["security"]["issues"].append({
            "type": "critical",
            "title": "Site not using HTTPS",
            "description": "Site is served over HTTP instead of HTTPS",
            "fix": "Enable SSL certificate and redirect HTTP to HTTPS"
        })
        issues["critical"] += 1
        recommendations.append("Enable HTTPS for enhanced security")
    
    # Calculate overall score
    overall_score = sum(cat["score"] for cat in categories.values()) // len(categories)
    
    return {
        "success": True,
        "overallScore": overall_score,
        "lastAudit": datetime.now().isoformat(),
        "issues": issues,
        "categories": categories,
        "recommendations": recommendations,
        "siteUrl": site_url,
        "searchData": {
            "totalClicks": sum(row.get("clicks", 0) for row in search_data.get("rows", [])),
            "totalImpressions": sum(row.get("impressions", 0) for row in search_data.get("rows", [])),
            "pagesAnalyzed": len(search_data.get("rows", []))
        }
    }

def fetch_site_audit_with_refresh(project):
    """Fetch site audit data with token refresh capability."""
    access_token = project.get("google_access_token")
    refresh_token = project.get("google_refresh_token")
    site_url = project.get("url")
    
    if not site_url:
        return {
            "success": False,
            "error": "no_site_url",
            "message": "Site URL not configured for this project."
        }
    
    result = fetch_site_audit_data(site_url, access_token)
    
    if not result["success"] and result.get("error") == "token_expired":
        print("🔄 Token expired, attempting refresh for site audit...")
        refreshed = refresh_access_token(refresh_token)
        if refreshed:
            access_token = refreshed["access_token"]
            db.projects.update_one(
                {"_id": project["_id"]},
                {"$set": {
                    "google_access_token": access_token,
                    "google_token_expiry": datetime.utcnow() + timedelta(seconds=refreshed["expires_in"])
                }}
            )
            print("✅ Token refreshed successfully (site audit)")
            result = fetch_site_audit_data(site_url, access_token)
        else:
            return {
                "success": False,
                "error": "refresh_failed",
                "message": "Could not refresh access token. Please reconnect your Google account."
            }
    
    return result

@app.route('/api/projects/<id>/site-audit', methods=['GET'])
def get_project_site_audit(id):
    """Get comprehensive site audit data for a project."""
    user = get_user_from_request()
    if not user:
        return jsonify({"message": "User not authenticated!"}), 401
    
    project = projects.find_one({"_id": ObjectId(id), "userId": str(user["_id"])})
    if not project:
        return jsonify({"message": "Project not found or access denied!"}), 404
    
    if not project.get("google_access_token"):
        return jsonify({"message": "Google account not connected for this project."}), 400
    
    print(f"\nFetching site audit data for project {id}")
    print(f"Site URL: {project.get('url')}")
    print(f"Access token: {project['google_access_token'][:20]}...")
    
    result = fetch_site_audit_with_refresh(project)
    
    print(f"\nGot result: {result}")
    
    if not result["success"]:
        if result.get("error") == "token_expired":
            return jsonify({
                "message": "Google Search Console access expired. Please re-verify your site.",
                "error": "token_expired"
            }), 401
        elif result.get("error") == "site_not_found":
            return jsonify({
                "message": f"Site '{project.get('url')}' not found in Google Search Console. Please verify your site is added to Search Console.",
                "error": "site_not_found"
            }), 404
        return jsonify({
            "message": "Failed to fetch site audit data.",
            "error": result.get("error", "unknown"),
            "details": result.get("message")
        }), 400
    
    return jsonify({"siteAudit": result})

@app.route('/api/keyword-planner', methods=['POST'])
def keyword_planner():
    data = request.json
    mode = data.get('mode', 'normal')
    user_input = data.get('input', '')
    keywords = []
    suggestions_map = {}
    pytrends = TrendReq(hl='en-US', tz=330)

    results = []
    seen = set()

    if mode == 'normal':
        keywords = [k.strip() for k in user_input.split() if k.strip()]
        for k in keywords:
            if k in seen:
                continue
            seen.add(k)
            # Fetch trend data for k
            try:
                pytrends.build_payload([k], cat=0, timeframe='today 12-m', geo='', gprop='')
                interest_over_time_df = pytrends.interest_over_time()
                if not interest_over_time_df.empty:
                    interest_over_time = interest_over_time_df[k].tolist()
                else:
                    interest_over_time = []
                region_df = pytrends.interest_by_region()
                if not region_df.empty:
                    trending_region = region_df[k].idxmax()
                else:
                    trending_region = None
            except Exception as e:
                interest_over_time = []
                trending_region = None
            if len(interest_over_time) >= 2:
                first = interest_over_time[0]
                last = interest_over_time[-1]
                if last > first * 1.1:
                    trend_type = 'Rising'
                elif last < first * 0.9:
                    trend_type = 'Falling'
                else:
                    trend_type = 'Stable'
            else:
                trend_type = 'Stable'
            if interest_over_time and last == max(interest_over_time):
                top_or_rising = 'Rising'
            else:
                top_or_rising = 'Top'
            popularity_score = last if interest_over_time else 0
            results.append({
                'keyword': k,
                'trend_type': trend_type,
                'top_or_rising': top_or_rising,
                'popularity_score': popularity_score,
                'trending_region': trending_region,
                'parent': None
            })
            time.sleep(2)
    else:
        # Smart or AI mode
        if mode == 'smart':
            raw_keywords = [k.strip() for k in user_input.split() if k.strip()]
        else:
            doc = nlp(user_input)
            noun_chunks = set(chunk.text.lower() for chunk in doc.noun_chunks)
            entities = set(ent.text.lower() for ent in doc.ents)
            words = [token.lemma_.lower() for token in doc if token.is_alpha and not token.is_stop]
            from collections import Counter
            top_words = set([w for w, _ in Counter(words).most_common(15)])
            extracted = list(noun_chunks | entities | top_words)
            raw_keywords = [k for k in extracted if len(k) > 2][:10]
        for k in raw_keywords:
            if k in seen:
                continue
            seen.add(k)
            # Main keyword row
            try:
                pytrends.build_payload([k], cat=0, timeframe='today 12-m', geo='', gprop='')
                interest_over_time_df = pytrends.interest_over_time()
                if not interest_over_time_df.empty:
                    interest_over_time = interest_over_time_df[k].tolist()
                else:
                    interest_over_time = []
                region_df = pytrends.interest_by_region()
                if not region_df.empty:
                    trending_region = region_df[k].idxmax()
                else:
                    trending_region = None
            except Exception as e:
                interest_over_time = []
                trending_region = None
            if len(interest_over_time) >= 2:
                first = interest_over_time[0]
                last = interest_over_time[-1]
                if last > first * 1.1:
                    trend_type = 'Rising'
                elif last < first * 0.9:
                    trend_type = 'Falling'
                else:
                    trend_type = 'Stable'
            else:
                trend_type = 'Stable'
            if interest_over_time and last == max(interest_over_time):
                top_or_rising = 'Rising'
            else:
                top_or_rising = 'Top'
            popularity_score = last if interest_over_time else 0
            results.append({
                'keyword': k,
                'trend_type': trend_type,
                'top_or_rising': top_or_rising,
                'popularity_score': popularity_score,
                'trending_region': trending_region,
                'parent': None
            })
            time.sleep(2)
            # Suggestions
            try:
                suggs = pytrends.suggestions(keyword=k)
                related = [s['title'] for s in suggs if 'title' in s and s['title'].lower() != k.lower()]
            except Exception:
                related = []
            for s in related[:4]:
                if s in seen:
                    continue
                seen.add(s)
                try:
                    pytrends.build_payload([s], cat=0, timeframe='today 12-m', geo='', gprop='')
                    interest_over_time_df = pytrends.interest_over_time()
                    if not interest_over_time_df.empty:
                        interest_over_time = interest_over_time_df[s].tolist()
                    else:
                        interest_over_time = []
                    region_df = pytrends.interest_by_region()
                    if not region_df.empty:
                        trending_region = region_df[s].idxmax()
                    else:
                        trending_region = None
                except Exception as e:
                    interest_over_time = []
                    trending_region = None
                if len(interest_over_time) >= 2:
                    first = interest_over_time[0]
                    last = interest_over_time[-1]
                    if last > first * 1.1:
                        trend_type = 'Rising'
                    elif last < first * 0.9:
                        trend_type = 'Falling'
                    else:
                        trend_type = 'Stable'
                else:
                    trend_type = 'Stable'
                if interest_over_time and last == max(interest_over_time):
                    top_or_rising = 'Rising'
                else:
                    top_or_rising = 'Top'
                popularity_score = last if interest_over_time else 0
                results.append({
                    'keyword': s,
                    'trend_type': trend_type,
                    'top_or_rising': top_or_rising,
                    'popularity_score': popularity_score,
                    'trending_region': trending_region,
                    'parent': k
                })
                time.sleep(2)
    return jsonify({'success': True, 'results': results})

@app.route('/api/content-optimizer', methods=['POST'])
def content_optimizer():
    data = request.json
    html = data.get('html', '')
    keywords = data.get('keyword', '').lower()
    if not html or not keywords:
        return jsonify({'error': 'HTML content and keyword are required'}), 400
    soup = BeautifulSoup(html, 'html.parser')
    text = soup.get_text(separator=' ').lower()
    title = soup.title.string.lower() if soup.title and soup.title.string else ''
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    meta_desc = meta_desc['content'].lower() if meta_desc and meta_desc.has_attr('content') else ''
    headings = ' '.join([tag.get_text() for tag in soup.find_all(['h1','h2','h3','h4','h5','h6'])]).lower()
    first_para = soup.find('p').get_text().lower() if soup.find('p') else ''
    alt_tags = ' '.join([img.get('alt', '') for img in soup.find_all('img')]).lower()
    # Support multiple keywords (comma-separated)
    keyword_list = [k.strip() for k in keywords.split(',') if k.strip()]
    keyword_analysis = {}
    for keyword in keyword_list:
        keyword_data = {
            'in_title': keyword in title,
            'in_description': keyword in meta_desc,
            'in_headings': keyword in headings,
            'in_first_paragraph': keyword in first_para,
            'in_alt_tags': keyword in alt_tags,
            'density': round(text.count(keyword) / max(1, len(text.split())) * 100, 2)
        }
        keyword_analysis[keyword] = keyword_data
    readability = {
        'flesch_score': textstat.flesch_reading_ease(text),
        'word_count': textstat.lexicon_count(text),
        'sentence_count': textstat.sentence_count(text),
        'avg_sentence_length': textstat.avg_sentence_length(text)
    }
    return jsonify({'keyword_analysis': keyword_analysis, 'readability': readability})

LEXICA_API_URL = "https://lexica.qewertyy.dev/models"
GPT_MODEL_ID = 5

SYSTEM_PROMPT = (
    "You are an advanced AI that receives a user input and rewrites it clearly, naturally, and fluently while preserving the original meaning. The rewritten version must aim for a Flesch Reading Ease Score of at least 75. Use short, simple sentences, familiar vocabulary, and a conversational tone. Do not shorten, summarize, analyze, or skip anything. Just rewrite the full input in plain, polished English, keeping all the original details intact. Do not add or remove information. Output only the rewritten version of the user input—nothing else"
)

async def fetch_ai_rewrite(text):
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(LEXICA_API_URL, json={
            "model_id": GPT_MODEL_ID,
            "messages": [
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": text
                }
            ]
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("content", "")
        return "AI rewrite failed."

@app.route('/api/content-rewrite', methods=['POST'])
def content_rewrite():
    data = request.json
    html = data.get('html', '')
    if not html:
        return jsonify({'error': 'HTML content is required'}), 400

    soup = BeautifulSoup(html, 'html.parser')
    original_text = soup.get_text(separator=' ', strip=True)

    if not original_text:
        return jsonify({'error': 'No text content found in HTML'}), 400

    # Run the async AI call inside the sync Flask route
    rewritten_text = asyncio.run(fetch_ai_rewrite(original_text))

    # Replace first meaningful text node in HTML with the rewritten version
    replaced = False
    for elem in soup.find_all(text=True):
        if elem.strip() and not replaced:
            elem.replace_with(rewritten_text)
            replaced = True

    new_html = str(soup)

    return jsonify({
        'rewritten_html': new_html,
        'rewritten_text': rewritten_text
    })

def analyze_text(text, keywords):
    text = text.lower()
    keyword_list = [k.strip() for k in keywords.split(',') if k.strip()]
    keyword_analysis = {}
    for keyword in keyword_list:
        keyword_data = {
            'in_title': False,
            'in_description': False,
            'in_headings': False,
            'in_first_paragraph': False,
            'in_alt_tags': False,
            'density': round(text.count(keyword) / max(1, len(text.split())) * 100, 2)
        }
        keyword_analysis[keyword] = keyword_data
    readability = {
        'flesch_score': textstat.flesch_reading_ease(text),
        'word_count': textstat.lexicon_count(text),
        'sentence_count': textstat.sentence_count(text),
        'avg_sentence_length': textstat.avg_sentence_length(text)
    }
    return {'keyword_analysis': keyword_analysis, 'readability': readability}

@app.route('/api/content-analyze', methods=['POST'])
def content_analyze():
    data = request.json
    text = data.get('text', '')
    keywords = data.get('keyword', '').lower()
    if not text or not keywords:
        return jsonify({'error': 'Text and keyword are required'}), 400
    result = analyze_text(text, keywords)
    return jsonify(result)

@app.route('/api/content-writer', methods=['POST'])
def content_writer():
    data = request.json
    print(data)
    topic = data.get('topic', '').strip()
    tone = data.get('tone', 'Professional')
    length = data.get('length', '50')
    print(topic, length)
    if not topic:
        return jsonify({'error': 'Topic is required'}), 400
    # Mock AI content generation
    
    generated = f"Generated: ({tone}, {length} Words)\n\n {asyncio.run(fetch_ai_content(topic, tone, length))}"
    return jsonify({'content': generated})

SYSTEM_PROMPT_CONTENT = "Write an article in a {tone} tone with only {length} words. Keep it clear, engaging, and relevant to the topic. Do not exceed the length by much. No headings, no notes — only the article."

async def fetch_ai_content(text, tone, length):
    async with httpx.AsyncClient(timeout=30) as client:
        extra = f"\n\na {tone} tone with only {length} words."
        response = await client.post(LEXICA_API_URL, json={
            "model_id": GPT_MODEL_ID,
            "messages": [
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT_CONTENT
                },
                {
                    "role": "user",
                    "content": text + extra
                }
            ]
        })
        print(extra)
        if response.status_code == 200:
            data = response.json()
            return data.get("content", "")
        return "AI rewrite failed."


# ✅ Run the app
if __name__ == '__main__':
    app.run(debug=True, host="localhost", port=5001)

