# Refresh Token Implementation Guide

## 🔍 **Root Causes of Token Expiration Issues**

### Identified Problems:
1. **Weak JWT Secret**: Your JWT_SECRET was `"secretkey"` (insecure)
2. **No Token Refresh**: Tokens expire after 90 days but no automatic refresh
3. **No Proper Token Management**: Single token system without refresh capability
4. **Server Restarts**: Backend restarts invalidate all tokens
5. **Environment Issues**: Missing JWT_SECRET causes token validation failures

## 🚀 **Complete Solution Implemented**

### **1. Backend Changes**

#### **Enhanced Environment Variables** (`.env`)
```env
# JWT Configuration
JWT_SECRET=your-very-strong-secret-key-change-this-in-production-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m                    # Short-lived access token
JWT_REFRESH_SECRET=your-very-strong-refresh-secret-key-different-from-access-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d                    # Long-lived refresh token

# Legacy JWT (for backward compatibility)
JWT_EXPIRES_IN=90d
```

#### **New Auth Controller Functions**
- `signAccessToken()` - Creates short-lived access tokens (15 minutes)
- `signRefreshToken()` - Creates long-lived refresh tokens (7 days)
- `refreshToken()` - Endpoint to refresh access tokens
- `logout()` - Invalidates refresh tokens

#### **Updated User Model**
```javascript
// New fields added to userModel.js
refreshTokenHash: {
  type: String,
  select: false
},
lastLogin: {
  type: Date
},
lastActivity: {
  type: Date
}
```

#### **New API Endpoints**
- `POST /auth/refresh-token` - Refresh access token using refresh token
- `POST /auth/logout` - Invalidate refresh token and logout

### **2. Frontend Changes**

#### **New API Client** (`src/lib/apiClient.js`)
- **Automatic Token Refresh**: Intercepts 401 responses and refreshes tokens automatically
- **Request Queuing**: Queues failed requests during token refresh
- **Error Handling**: Proper handling of authentication failures
- **Backward Compatibility**: Works with both new and legacy token systems

#### **Enhanced AuthContext** (`src/contexts/AuthContext.jsx`)
- **Token Management**: Stores both access and refresh tokens
- **Auto-refresh Integration**: Uses API client for automatic token refresh
- **Improved authFetch**: Now uses API client with automatic refresh
- **Event Handling**: Listens for authentication failures

## 📋 **How It Works**

### **Login Flow**
1. User logs in with email/password
2. Backend generates both access token (15min) and refresh token (7d)
3. Refresh token hash is stored in database
4. Both tokens are sent to frontend and stored in localStorage

### **API Request Flow**
1. API client adds access token to all requests
2. If access token expires (401 response), API client automatically:
   - Uses refresh token to get new access token
   - Updates stored tokens
   - Retries the original request
   - Queues other pending requests until refresh is complete

### **Token Refresh Flow**
1. Frontend sends refresh token to `/auth/refresh-token`
2. Backend verifies refresh token against stored hash
3. New access and refresh tokens are generated
4. Old refresh token is invalidated
5. New tokens are returned and stored

### **Logout Flow**
1. Frontend calls logout endpoint
2. Backend removes refresh token hash from database
3. Frontend clears all stored tokens

## 🛠️ **Usage Examples**

### **Using authFetch (Recommended for existing code)**
```javascript
const { authFetch } = useAuth();

// This automatically handles token refresh
const response = await authFetch('/users/me');
```

### **Using API Client Directly**
```javascript
import apiClient from '@/lib/apiClient';

// This also automatically handles token refresh
const response = await apiClient.get('/users/me');
```

### **Manual Token Refresh**
```javascript
import apiClient from '@/lib/apiClient';

try {
  const newToken = await apiClient.refreshAccessToken();
  console.log('Token refreshed successfully');
} catch (error) {
  console.log('Refresh failed, user needs to login');
}
```

## 🔧 **Testing the Implementation**

### **1. Test Component**
Add the `RefreshTokenExample` component to test all functionality:

```jsx
import RefreshTokenExample from '@/components/RefreshTokenExample';

// Add to any page
<RefreshTokenExample />
```

### **2. Manual Testing Steps**

1. **Login Test**:
   ```javascript
   // Check browser localStorage
   console.log('Access Token:', localStorage.getItem('gymflow_access_token'));
   console.log('Refresh Token:', localStorage.getItem('gymflow_refresh_token'));
   ```

2. **Token Expiration Test**:
   - Change `JWT_ACCESS_EXPIRES_IN` to `1m` (1 minute)
   - Login and wait 2 minutes
   - Make an API call - should automatically refresh

3. **Network Tab Verification**:
   - Open browser dev tools → Network tab
   - Make API calls and watch for automatic refresh requests to `/auth/refresh-token`

### **3. Server-side Verification**
```javascript
// Check refresh token in database
db.users.findOne({email: "your-email"}, {refreshTokenHash: 1})
```

## 🔒 **Security Improvements**

1. **Strong JWT Secrets**: Minimum 32 characters, different for access and refresh tokens
2. **Token Rotation**: New refresh token issued with each refresh
3. **Hash Storage**: Only hashed refresh tokens stored in database
4. **Automatic Cleanup**: Expired refresh tokens are invalidated
5. **Request Timeout**: 30-second timeout on all API requests

## 🚨 **Important Notes**

### **Environment Variables**
⚠️ **CRITICAL**: Update your production environment variables:

```bash
# Generate strong secrets (32+ characters each)
JWT_SECRET="$(openssl rand -base64 32)"
JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### **Backward Compatibility**
- Existing code using `token` still works
- `authFetch` function maintains same interface
- Legacy tokens are supported during transition

### **Performance Considerations**
- Tokens are refreshed automatically in background
- Failed requests are queued and retried after refresh
- No user experience interruption during token refresh

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **"Authentication required" error**:
   - Check if JWT secrets are set correctly
   - Verify tokens exist in localStorage
   - Check browser console for token validation errors

2. **"Token refresh failed"**:
   - Refresh token may have expired (7 days)
   - User needs to login again
   - Check if JWT_REFRESH_SECRET is set

3. **Infinite refresh loops**:
   - Check if refresh token endpoint is accessible
   - Verify refresh token is valid in database
   - Check server logs for refresh endpoint errors

### **Debug Commands:**
```javascript
// Check current token status
apiClient.getAccessToken();
apiClient.getRefreshToken();

// Debug localStorage
const { token, accessToken, refreshToken, user } = debugLocalStorage();
console.log({ token, accessToken, refreshToken, user });

// Test token refresh manually
await apiClient.refreshAccessToken();
```

## 🎯 **Benefits Achieved**

1. **Seamless User Experience**: No more sudden logouts
2. **Enhanced Security**: Short-lived access tokens + secure refresh mechanism
3. **Automatic Recovery**: Failed requests retry automatically after token refresh
4. **Better Error Handling**: Clear error messages and proper fallbacks
5. **Production Ready**: Strong security practices and comprehensive error handling

## 📊 **Testing Results**

After implementing this solution, you should see:
- ✅ No more "Authentication expired" errors during normal usage
- ✅ Automatic token refresh every 15 minutes
- ✅ Seamless API calls without user intervention
- ✅ Proper logout functionality that invalidates all tokens
- ✅ Better error handling and user feedback

The refresh token system ensures users stay logged in for up to 7 days of inactivity, while maintaining security with short-lived access tokens that refresh automatically.