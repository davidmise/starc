# 🌟 Star Corporate - Complete System Testing Guide

## 🚀 Quick Start Overview

Star Corporate is a TikTok-like social media platform with live streaming capabilities. Here's everything you need to know to run and test the system.

## 📋 System Requirements

- **Node.js** (v16+)
- **PostgreSQL** (v12+)
- **Expo CLI** (for mobile testing)

## 🔧 Initial Setup (One-time)

### 1. Database Setup
```bash
# PostgreSQL should be running on port 5433
# Database: stars_corporate
# Password: Qwerty@2024#
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Frontend Setup  
```bash
cd .. # back to root
npm install
```

## ▶️ How to Run the System

### Step 1: Start Backend Server
```bash
cd backend
npm start
```
**Expected output:** Server running on http://localhost:5000

### Step 2: Start Frontend (Web)
```bash
# In a new terminal, from project root
npx expo start --web
```
**Expected output:** Web app running on http://localhost:8081

### Step 3: Start Frontend (Mobile) - Optional
```bash
# In a new terminal, from project root  
npx expo start
```
**Expected output:** QR code for mobile testing

## 🧪 Complete Testing Workflow

### Phase 1: Test User Registration & Login

#### 1.1 Test Registration
1. Open browser to `http://localhost:8081`
2. Click "Don't have an account? Sign up"
3. Fill form:
   - **Username:** newuser123
   - **Email:** newuser123@test.com  
   - **Password:** password123
   - **Confirm Password:** password123
4. Click "Sign Up"
5. **Expected:** Success message + redirect to login

#### 1.2 Test Login with Test Account
1. Go back to login screen
2. Enter credentials:
   - **Email:** alice@test.com
   - **Password:** password123
3. Click "Login"
4. **Expected:** Redirect to main app dashboard

### Phase 2: Test Core Features

#### 2.1 Browse Content (Home Page)
1. **Expected to see:**
   - List of live sessions/posts
   - "Gaming Session Live" (currently live)
   - "Morning Tech Talk" (scheduled)
   - "Music and Chill" (ended)
2. **Test interactions:**
   - Scroll through content
   - Click on session cards
   - Check loading states

#### 2.2 Test Creating New Session
1. Navigate to "Go Live" or "+" button
2. Fill form:
   - **Title:** My Test Stream
   - **Caption:** Testing the creation feature  
   - **Genre:** Entertainment
   - **Start Time:** Select future time
3. Add poster image (optional)
4. Click "Create Session"
5. **Expected:** Session created successfully + redirect

#### 2.3 Test Profile Features
1. Navigate to Profile tab
2. **Expected to see:**
   - User information (alice)
   - Profile picture
   - User's sessions/posts
   - Edit profile option
3. Test editing profile:
   - Change bio
   - Update profile picture
   - Save changes

### Phase 3: Test Social Features

#### 3.1 Test Interactions
1. Like a session
2. Comment on a session  
3. Follow another user
4. **Expected:** Real-time updates via Socket.IO

#### 3.2 Test Real-time Features
1. Open app in two browser windows
2. Login as different users:
   - Window 1: alice@test.com
   - Window 2: bob@test.com
3. Have one user comment on a session
4. **Expected:** Other window shows comment in real-time

### Phase 4: Test Advanced Features

#### 4.1 Test Search & Discovery
1. Use search functionality
2. Search for users, genres, keywords
3. Filter by session type/status

#### 4.2 Test Notifications
1. Perform actions that trigger notifications
2. Check notification badge/list
3. Test real-time notification updates

## 🔐 Test User Accounts

| Username | Email | Password | Role |
|----------|-------|----------|------|
| alice | alice@test.com | password123 | Tech Streamer |
| bob | bob@test.com | password123 | Gamer |
| carol | carol@test.com | password123 | DJ |
| testuser | test@example.com | password123 | General User |

## 🌐 API Testing (Optional)

### Test Authentication Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@test.com", "password": "password123"}'
```

### Test Sessions Endpoint
```bash
curl -X GET http://localhost:5000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📱 Platform-Specific Testing

### Web Browser Testing
- **URL:** http://localhost:8081  
- **Test:** Full desktop experience
- **Storage:** localStorage for tokens

### Mobile App Testing  
1. Install Expo Go app
2. Scan QR code from `npx expo start`
3. **Test:** Native mobile experience
4. **Storage:** Expo SecureStore for tokens

## 🔍 Common Issues & Solutions

### Issue: 401 Unauthorized when creating posts
**Solution:** Make sure you're logged in. The session creation requires authentication.

### Issue: Can't see real-time updates
**Solution:** Check Socket.IO connection. Look for connection messages in browser console.

### Issue: Images not loading
**Solution:** Check file upload configuration and ensure uploads/ directory exists.

### Issue: Database connection failed
**Solution:** Verify PostgreSQL is running on port 5433 with correct credentials.

## 📊 Expected System Behavior

### Authentication Flow
1. **Registration** → Hash password → Store user → Send success
2. **Login** → Verify credentials → Generate JWT → Return token  
3. **Protected Routes** → Verify JWT → Allow access

### Session Flow
1. **Create** → Validate user → Store session → Notify followers
2. **Start** → Update status to 'live' → Broadcast via Socket.IO
3. **End** → Update status to 'ended' → Calculate stats

### Real-time Flow
1. **User Action** → Emit to Socket.IO → Broadcast to relevant users
2. **Notifications** → Store in DB → Send via Socket.IO → Update UI

## 🎯 Testing Checklist

- [ ] Backend server starts successfully
- [ ] Frontend loads without errors  
- [ ] User registration works
- [ ] User login works
- [ ] Session creation works (authenticated)
- [ ] Real-time features work
- [ ] Mobile app connects properly
- [ ] Database queries execute correctly
- [ ] File uploads work
- [ ] Socket.IO connections established

## 📝 Notes

- **Default Passwords:** All test accounts use `password123`
- **Network Access:** Backend accessible on local network at `192.168.1.197:5000`
- **Development Mode:** CORS enabled for localhost and network IP
- **File Uploads:** Stored in `backend/uploads/` directory

## 🆘 Getting Help

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check backend terminal for server errors  
3. Verify PostgreSQL is running
4. Ensure all npm packages are installed
5. Check network connectivity for mobile testing

---

**🎉 You now have a fully functional social media platform with live streaming capabilities!**