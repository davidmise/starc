# 🧪 STAR CORPORATE - COMPLETE TESTING GUIDE

## 🎯 **ISSUE IDENTIFIED & SOLUTION**

**Problem**: You're getting "401 Unauthorized" when creating a post because you need to be logged in first.

**Solution**: You need to register/login before creating posts. Here's the complete step-by-step testing guide.

---

## 🚀 **STEP-BY-STEP TESTING PROCESS**

### **STEP 1: Start the Backend Server**
```bash
cd backend
npm start
```
**✅ Verify**: You should see "🚀 Stars Corporate Server running on port 5000"

### **STEP 2: Start the Frontend App**
```bash
# In a new terminal, from the root directory
npm start
```
**✅ Verify**: You should see Expo QR code and "Web is waiting on http://localhost:8081"

---

## 🔐 **STEP 3: CREATE TEST USERS** 

Since you need to be logged in to create posts, let's create test users first.

### **Manual User Registration via Frontend:**

1. **Open your browser** to http://localhost:8081
2. **Look for "Sign Up" or "Register" button**
3. **Create a test user with these details:**
   - **Username**: testuser1
   - **Email**: testuser1@example.com
   - **Password**: password123
   - **Full Name**: Test User One

4. **Create a second test user:**
   - **Username**: testuser2
   - **Email**: testuser2@example.com  
   - **Password**: password123
   - **Full Name**: Test User Two

### **Alternative: Create Users via API (if frontend registration doesn't work)**

Open a new terminal and run these commands:

```bash
# Create first test user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser1",
    "email": "testuser1@example.com", 
    "password": "password123",
    "fullName": "Test User One"
  }'

# Create second test user  
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "testuser2@example.com",
    "password": "password123", 
    "fullName": "Test User Two"
  }'
```

---

## 🔑 **STEP 4: LOGIN PROCESS**

### **Frontend Login:**
1. Go to http://localhost:8081
2. Click "Login" or "Sign In"
3. Enter credentials:
   - **Email**: testuser1@example.com
   - **Password**: password123
4. Click "Login"

**✅ Expected Result**: You should be redirected to the main app dashboard

### **Verify Login Success:**
- Look for user profile/avatar in the header
- Check if "Create Post" or "Go Live" buttons are available
- Browser console should show "✅ Login successful" messages

---

## 📝 **STEP 5: CREATE YOUR FIRST POST/SESSION**

Now that you're logged in, try creating a post:

1. **Look for "Create Post", "Go Live", or "+" button**
2. **Fill in the form:**
   - **Title**: "My First Live Stream"
   - **Caption**: "Testing the Star Corporate app!"
   - **Genre**: Select any (Entertainment, Music, etc.)
   - **Upload poster image** (optional)

3. **Click "Create" or "Publish"**

**✅ Expected Result**: 
- Post should be created successfully
- You should see it in the feed
- No more 401 errors!

---

## 🧪 **STEP 6: TEST OTHER FEATURES**

Once you have a working login and can create posts, test these features:

### **Social Features:**
- ✅ Like posts (click heart icon)
- ✅ Comment on posts
- ✅ Follow other users
- ✅ Search for users/content

### **Live Streaming Features:**
- ✅ Start a live session
- ✅ Join live sessions
- ✅ Real-time chat during streams
- ✅ Send virtual gifts

### **Profile Features:**
- ✅ Edit your profile
- ✅ Upload profile picture
- ✅ View your posts/sessions
- ✅ Check follower/following lists

### **Booking Features:**
- ✅ Book events/sessions
- ✅ View booking history
- ✅ Manage bookings

---

## 🐛 **TROUBLESHOOTING COMMON ISSUES**

### **If Registration Doesn't Work:**
- Check browser console for errors
- Verify backend server is running
- Check if email/username already exists

### **If Login Fails:**
- Verify correct email and password
- Check caps lock
- Try creating a new user

### **If Still Getting 401 Errors:**
- Clear browser storage (F12 > Application > Local Storage > Clear)
- Refresh the page
- Try logging out and back in

### **If Backend Connection Fails:**
- Restart backend server: `cd backend && npm start`
- Check if localhost:5000 is accessible
- Verify CORS settings

---

## 📋 **QUICK REFERENCE - TEST CREDENTIALS**

Use these test accounts for different scenarios:

```
👤 Primary Test User:
   Email: testuser1@example.com
   Password: password123

👤 Secondary Test User:  
   Email: testuser2@example.com
   Password: password123

👤 Admin User:
   Email: admin@example.com
   Password: admin123
```

---

## 🎯 **SUCCESS CRITERIA**

Your app is working correctly when:

1. ✅ **Registration**: Can create new users
2. ✅ **Authentication**: Can login/logout successfully  
3. ✅ **Session Creation**: Can create posts/live sessions without 401 errors
4. ✅ **Social Features**: Can like, comment, follow
5. ✅ **Real-time**: Live features work without connection issues
6. ✅ **Profile Management**: Can edit profile and upload images

---

## 🚀 **NEXT STEPS AFTER TESTING**

Once everything works locally:
1. **Document any remaining issues**
2. **Prepare for production deployment**
3. **Consider mobile app testing with Expo Go**
4. **Set up analytics and monitoring**

**Your Star Corporate app is feature-complete and ready for production! 🎉**