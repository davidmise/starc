# Stars Corporate API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### 1. Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "bio": null,
    "profile_pic": null,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "jwt_token_here"
}
```

### 2. Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "bio": "Live streaming enthusiast",
    "profile_pic": "https://example.com/avatar.jpg",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "jwt_token_here"
}
```

### 3. Get User Profile
```http
GET /auth/profile
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "bio": "Live streaming enthusiast",
    "profile_pic": "https://example.com/avatar.jpg",
    "created_at": "2024-01-01T00:00:00Z",
    "sessions_created": 5,
    "sessions_booked": 12,
    "total_likes_received": 45,
    "total_comments_received": 23
  }
}
```

### 4. Update User Profile
```http
PUT /auth/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "username": "john_doe_updated",
  "bio": "Updated bio",
  "profile_pic": "https://example.com/new-avatar.jpg"
}
```

---

## 📺 Sessions Endpoints

### 1. Create Live Session
```http
POST /sessions
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

{
  "title": "Evening Guitar Session",
  "caption": "Playing some acoustic covers tonight!",
  "genre": "Music",
  "start_time": "2024-01-15T20:00:00Z",
  "poster": [file],
  "preview_video": [file]
}
```

**Response:**
```json
{
  "message": "Live session created successfully",
  "session": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Evening Guitar Session",
    "caption": "Playing some acoustic covers tonight!",
    "genre": "Music",
    "start_time": "2024-01-15T20:00:00Z",
    "status": "scheduled",
    "poster_url": "/uploads/poster-123.jpg",
    "preview_video_url": "/uploads/video-456.mp4",
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "profile_pic": "https://example.com/avatar.jpg"
    }
  }
}
```

### 2. Get All Sessions (with filters)
```http
GET /sessions?status=live&genre=Music&page=1&limit=10
Authorization: Bearer <jwt_token> (optional)
```

**Query Parameters:**
- `status`: all, scheduled, live, ended, cancelled
- `genre`: all, Music, Gaming, Comedy, etc.
- `page`: page number (default: 1)
- `limit`: items per page (default: 10)
- `user_id`: filter by specific user

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "Evening Guitar Session",
      "caption": "Playing some acoustic covers tonight!",
      "genre": "Music",
      "start_time": "2024-01-15T20:00:00Z",
      "status": "live",
      "viewer_count": 150,
      "like_count": 25,
      "comment_count": 12,
      "user": {
        "id": "uuid",
        "username": "john_doe",
        "profile_pic": "https://example.com/avatar.jpg"
      },
      "likes_count": 25,
      "comments_count": 12,
      "bookings_count": 8,
      "is_liked": true,
      "is_booked": false,
      "has_joined": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

### 3. Get Specific Session
```http
GET /sessions/{session_id}
Authorization: Bearer <jwt_token> (optional)
```

**Response:**
```json
{
  "session": {
    "id": "uuid",
    "title": "Evening Guitar Session",
    "caption": "Playing some acoustic covers tonight!",
    "genre": "Music",
    "start_time": "2024-01-15T20:00:00Z",
    "end_time": "2024-01-15T22:00:00Z",
    "status": "live",
    "viewer_count": 150,
    "like_count": 25,
    "comment_count": 12,
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "profile_pic": "https://example.com/avatar.jpg"
    },
    "comments": [
      {
        "id": "uuid",
        "message": "Great session!",
        "created_at": "2024-01-15T20:30:00Z",
        "user": {
          "id": "uuid",
          "username": "sarah_wilson",
          "profile_pic": "https://example.com/sarah.jpg"
        }
      }
    ],
    "likes_count": 25,
    "comments_count": 12,
    "bookings_count": 8,
    "is_liked": true,
    "is_booked": false,
    "has_joined": true
  }
}
```

### 4. Update Session
```http
PUT /sessions/{session_id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Updated Session Title",
  "caption": "Updated caption",
  "genre": "Comedy",
  "start_time": "2024-01-16T20:00:00Z"
}
```

### 5. Delete Session
```http
DELETE /sessions/{session_id}
Authorization: Bearer <jwt_token>
```

---

## ❤️ Interactions Endpoints

### 1. Like/Unlike Session
```http
POST /interactions/like/{session_id}
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "Session liked successfully",
  "liked": true
}
```

### 2. Comment on Session
```http
POST /interactions/comment/{session_id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "message": "Great session! Love the music!"
}
```

**Response:**
```json
{
  "message": "Comment added successfully",
  "comment": {
    "id": "uuid",
    "message": "Great session! Love the music!",
    "created_at": "2024-01-15T20:30:00Z",
    "user": {
      "id": "uuid",
      "username": "sarah_wilson",
      "profile_pic": "https://example.com/sarah.jpg"
    }
  }
}
```

### 3. Book/Unbook Session
```http
POST /interactions/book/{session_id}
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "Session booked successfully",
  "booked": true
}
```

### 4. Send Gift
```http
POST /interactions/gift/{session_id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "gift_type": "diamond",
  "gift_value": 10,
  "message": "Amazing session!"
}
```

**Response:**
```json
{
  "message": "Gift sent successfully",
  "gift": {
    "id": "uuid",
    "gift_type": "diamond",
    "gift_value": 10,
    "message": "Amazing session!",
    "created_at": "2024-01-15T20:30:00Z"
  }
}
```

### 5. Get Session Comments
```http
GET /interactions/comments/{session_id}?page=1&limit=20
Authorization: Bearer <jwt_token> (optional)
```

**Response:**
```json
{
  "comments": [
    {
      "id": "uuid",
      "message": "Great session!",
      "created_at": "2024-01-15T20:30:00Z",
      "user": {
        "id": "uuid",
        "username": "sarah_wilson",
        "profile_pic": "https://example.com/sarah.jpg"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

## 👥 Users Endpoints

### 1. Get All Users
```http
GET /users?page=1&limit=20&search=john
Authorization: Bearer <jwt_token> (optional)
```

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "john_doe",
      "bio": "Live streaming enthusiast",
      "profile_pic": "https://example.com/avatar.jpg",
      "is_verified": true,
      "created_at": "2024-01-01T00:00:00Z",
      "total_sessions": 5,
      "total_likes": 45,
      "total_comments": 23
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 35,
    "pages": 2
  }
}
```

### 2. Get User Profile
```http
GET /users/{user_id}
Authorization: Bearer <jwt_token> (optional)
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "bio": "Live streaming enthusiast",
    "profile_pic": "https://example.com/avatar.jpg",
    "is_verified": true,
    "created_at": "2024-01-01T00:00:00Z",
    "stats": {
      "total_sessions": 5,
      "total_viewers": 1500,
      "total_likes": 45,
      "total_comments": 23,
      "total_gifts": 120,
      "total_watch_time": 3600
    },
    "recent_sessions": [
      {
        "id": "uuid",
        "title": "Evening Guitar Session",
        "genre": "Music",
        "start_time": "2024-01-15T20:00:00Z",
        "status": "ended",
        "viewer_count": 150,
        "like_count": 25
      }
    ]
  }
}
```

### 3. Get User Sessions
```http
GET /users/{user_id}/sessions?status=all&page=1&limit=10
Authorization: Bearer <jwt_token> (optional)
```

---

## 🔔 Notifications Endpoints

### 1. Get User Notifications
```http
GET /notifications?page=1&limit=20&type=all
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `type`: all, session_start, booking_reminder, like, comment, gift, follow, system
- `page`: page number
- `limit`: items per page

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "like",
      "title": "New Like",
      "message": "Someone liked your session",
      "data": {
        "session_id": "uuid",
        "session_title": "Evening Guitar Session"
      },
      "is_read": false,
      "created_at": "2024-01-15T20:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### 2. Mark Notification as Read
```http
PUT /notifications/{notification_id}/read
Authorization: Bearer <jwt_token>
```

### 3. Mark All Notifications as Read
```http
PUT /notifications/read-all
Authorization: Bearer <jwt_token>
```

---

## 📊 Statistics Endpoints

### 1. Get User Statistics
```http
GET /users/{user_id}/stats
Authorization: Bearer <jwt_token> (optional)
```

**Response:**
```json
{
  "stats": {
    "total_sessions": 5,
    "total_viewers": 1500,
    "total_likes": 45,
    "total_comments": 23,
    "total_gifts": 120,
    "total_watch_time": 3600,
    "followers_count": 150,
    "following_count": 75
  }
}
```

### 2. Get Session Statistics
```http
GET /sessions/{session_id}/stats
Authorization: Bearer <jwt_token> (optional)
```

**Response:**
```json
{
  "stats": {
    "peak_viewers": 200,
    "total_viewers": 150,
    "total_likes": 25,
    "total_comments": 12,
    "total_gifts": 8,
    "total_watch_time": 7200
  }
}
```

---

## 🔍 Search Endpoints

### 1. Search Sessions
```http
GET /search/sessions?q=guitar&genre=Music&status=live&page=1&limit=10
Authorization: Bearer <jwt_token> (optional)
```

### 2. Search Users
```http
GET /search/users?q=john&page=1&limit=10
Authorization: Bearer <jwt_token> (optional)
```

---

## 🎯 Testing Examples

### Test Authentication Flow
```bash
# 1. Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# 2. Login with the user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 3. Use the token for authenticated requests
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Session Creation
```bash
# Create a new session
curl -X POST http://localhost:5000/api/sessions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Test Session" \
  -F "caption=This is a test session" \
  -F "genre=Music" \
  -F "start_time=2024-01-20T20:00:00Z" \
  -F "poster=@/path/to/poster.jpg"
```

### Test Interactions
```bash
# Like a session
curl -X POST http://localhost:5000/api/interactions/like/SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Comment on a session
curl -X POST http://localhost:5000/api/interactions/comment/SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Great session!"}'
```

---

## 📱 Frontend Integration Examples

### React Native Example
```javascript
// API service
const API_BASE = 'http://localhost:5000/api';

class ApiService {
  static async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  }

  static async getSessions(token, filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE}/sessions?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  }

  static async likeSession(token, sessionId) {
    const response = await fetch(`${API_BASE}/interactions/like/${sessionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  }
}

// Usage in component
const HomeScreen = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const data = await ApiService.getSessions(token, {
          status: 'live',
          page: 1,
          limit: 10
        });
        setSessions(data.sessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <View>
      {sessions.map(session => (
        <SessionCard key={session.id} session={session} />
      ))}
    </View>
  );
};
```

---

## 🚨 Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (resource already exists)
- `500`: Internal Server Error 