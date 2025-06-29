from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from otp import otp_service

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

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
    return jsonify({"message": "Registration successful!"})

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
    project = {
        "name": data.get('name'),
        "url": data.get('url'),
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
    projects.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "name": data.get('name'),
            "url": data.get('url')
        }}
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


# ✅ Run the app
if __name__ == '__main__':
    app.run(debug=True, host="localhost", port=5001)
