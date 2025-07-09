from flask import Blueprint, request, jsonify
import requests

ga4 = Blueprint("ga4", __name__)

@ga4.route("/api/ga4/properties", methods=["GET"])
def get_ga4_properties():
    access_token = request.headers.get("Authorization", "").replace("Bearer ", "")
    
    if not access_token:
        return jsonify({"error": "Missing access token"}), 400

    try:
        res = requests.get(
            "https://analyticsadmin.googleapis.com/v1/accountSummaries",
            headers={
                "Authorization": f"Bearer {access_token}"
            }
        )

        if res.status_code != 200:
            return jsonify({"error": "Failed to fetch GA4 properties", "details": res.json()}), res.status_code

        properties = []
        for account in res.json().get("accountSummaries", []):
            for prop in account.get("propertySummaries", []):
                if prop.get("propertyType") == "PROPERTY_TYPE_GA4":
                    property_id = prop["property"].split("/")[1]
                    properties.append({
                        "id": property_id,
                        "name": prop["displayName"],
                        "measurementId": prop.get("measurementId")
                    })

        return jsonify(properties)

    except Exception as e:
        return jsonify({"error": str(e)}), 500 