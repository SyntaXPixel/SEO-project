import os
import json
from dotenv import load_dotenv
load_dotenv()

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

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Register GA4 Blueprint
app.register_blueprint(ga4)

# MongoDB connection
client = MongoClient("mongodb+srv://test:test@venkatesh.nvutauw.mongodb.net/?retryWrites=true&w=majority")
db = client['user_db']
users = db['users']
projects = db['projects']

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

# ✅ Run the app
if __name__ == '__main__':
    app.run(debug=True, host="localhost", port=5001)
