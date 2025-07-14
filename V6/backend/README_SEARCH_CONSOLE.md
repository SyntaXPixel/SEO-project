# Google Search Console API Integration

This document describes the Google Search Console API functionality that has been integrated into the backend.

## Overview

The backend now includes comprehensive Google Search Console API integration that allows you to fetch search analytics data for your websites. This includes:

- **Search Analytics**: Clicks, impressions, CTR, and average position
- **Detailed Analytics**: Top queries and top pages
- **Date Range Support**: Customizable date ranges for analytics
- **Token Refresh**: Automatic token refresh when access tokens expire

## API Endpoints

### 1. Basic Search Analytics
```
GET /api/projects/<id>/search-analytics
```

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format

**Response:**
```json
{
  "searchAnalytics": {
    "success": true,
    "clicks": 1250,
    "impressions": 15000,
    "ctr": 8.33,
    "position": 12.5,
    "rows": [...]
  }
}
```

### 2. Detailed Search Analytics
```
GET /api/projects/<id>/search-analytics/detailed
```

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format

**Response:**
```json
{
  "detailedSearchAnalytics": {
    "success": true,
    "topQueries": [
      {
        "keys": ["example query"],
        "clicks": 150,
        "impressions": 2000,
        "ctr": 0.075,
        "position": 8.5
      }
    ],
    "topPages": [
      {
        "keys": ["https://example.com/page"],
        "clicks": 200,
        "impressions": 2500,
        "ctr": 0.08,
        "position": 7.2
      }
    ]
  }
}
```

## Setup Requirements

### 1. Google Search Console Setup
1. Add your website to Google Search Console
2. Verify ownership of your website
3. Ensure you have the necessary permissions

### 2. OAuth2 Authentication
The backend uses the same Google OAuth2 flow as Google Analytics 4. You need:
- Google OAuth2 access token with Search Console API scope
- Refresh token for automatic token renewal

### 3. Required Scopes
Add these scopes to your Google OAuth2 configuration:
```
https://www.googleapis.com/auth/webmasters.readonly
```

## Functions Added

### Core Functions

#### `fetch_search_analytics(site_url, access_token, start_date=None, end_date=None)`
Fetches basic search analytics data from Google Search Console API.

**Parameters:**
- `site_url`: Your verified site URL in Search Console
- `access_token`: Google OAuth2 access token
- `start_date`: Start date (optional, defaults to 30 days ago)
- `end_date`: End date (optional, defaults to today)

**Returns:**
- Success: Dictionary with clicks, impressions, CTR, position, and raw data
- Error: Dictionary with error details

#### `fetch_search_analytics_with_refresh(project, start_date=None, end_date=None)`
Enhanced version that handles token refresh automatically.

**Parameters:**
- `project`: Project object from database
- `start_date`: Start date (optional)
- `end_date`: End date (optional)

**Features:**
- Automatic token refresh when expired
- Database updates with new tokens
- Error handling for various scenarios

## Error Handling

The API handles various error scenarios:

1. **Token Expired**: Automatically refreshes the access token
2. **Invalid Site URL**: Returns error if site URL is not configured
3. **API Errors**: Handles HTTP errors from Google Search Console API
4. **Network Errors**: Catches and reports connection issues

## Example Usage

### Frontend JavaScript
```javascript
// Fetch basic search analytics
const response = await fetch(`/api/projects/${projectId}/search-analytics?start_date=2024-01-01&end_date=2024-01-31`);
const data = await response.json();

if (data.searchAnalytics.success) {
  console.log(`Clicks: ${data.searchAnalytics.clicks}`);
  console.log(`Impressions: ${data.searchAnalytics.impressions}`);
  console.log(`CTR: ${data.searchAnalytics.ctr}%`);
  console.log(`Position: ${data.searchAnalytics.position}`);
}

// Fetch detailed analytics
const detailedResponse = await fetch(`/api/projects/${projectId}/search-analytics/detailed`);
const detailedData = await detailedResponse.json();

if (detailedData.detailedSearchAnalytics.success) {
  console.log('Top Queries:', detailedData.detailedSearchAnalytics.topQueries);
  console.log('Top Pages:', detailedData.detailedSearchAnalytics.topPages);
}
```

### Python Example
```python
import requests

# Basic analytics
response = requests.get(f"http://localhost:5001/api/projects/{project_id}/search-analytics")
data = response.json()

if data["searchAnalytics"]["success"]:
    clicks = data["searchAnalytics"]["clicks"]
    impressions = data["searchAnalytics"]["impressions"]
    print(f"Clicks: {clicks}, Impressions: {impressions}")
```

## Integration with Existing Code

The Search Console functionality integrates seamlessly with your existing:

1. **Project Management**: Uses the same project structure as GA4
2. **Authentication**: Uses the same Google OAuth2 tokens
3. **Error Handling**: Follows the same patterns as other API endpoints
4. **Database**: Stores tokens and project data in the same MongoDB collections

## Testing

You can test the functionality using the provided example script:

```bash
cd backend
python search_console_example.py
```

Make sure to update the `SITE_URL` and `ACCESS_TOKEN` variables in the script with your actual values.

## Troubleshooting

### Common Issues

1. **"Site URL not configured"**: Ensure the project has a valid URL field
2. **"Google account not connected"**: Verify the project has valid Google tokens
3. **"Token expired"**: The system should automatically refresh tokens
4. **"No search analytics data found"**: The site might not have search data for the specified date range

### Debug Information

The backend provides detailed logging for debugging:
- API response status codes
- Token refresh attempts
- Data processing results
- Error messages and stack traces

## Security Considerations

1. **Token Storage**: Access tokens are stored securely in the database
2. **Scope Limitation**: Only read-only access to Search Console data
3. **User Authentication**: All endpoints require valid user authentication
4. **Project Ownership**: Users can only access their own project data

## Future Enhancements

Potential improvements for the Search Console integration:

1. **Caching**: Implement caching for frequently requested data
2. **Historical Data**: Add support for longer date ranges
3. **Export Features**: Add CSV/JSON export functionality
4. **Real-time Updates**: Implement WebSocket updates for real-time data
5. **Advanced Filtering**: Add support for country, device, and search type filters 