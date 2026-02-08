
# 🔑 Test Credentials

Use these credentials to test the app functionality.

## Email/Password Authentication

### Test User 1
- **Email:** `test@example.com`
- **Password:** `password123`
- **Name:** `Test User`

### Test User 2
- **Email:** `demo@test.com`
- **Password:** `password123`
- **Name:** `Demo User`

### Test User 3
- **Email:** `alice@example.com`
- **Password:** `password123`
- **Name:** `Alice`

## OAuth Authentication

### Google OAuth
- Use your own Google account
- Available on **web only**
- Opens popup window for authentication

### Apple OAuth
- Use your own Apple ID
- Available on **iOS and web**
- Opens native flow on iOS, popup on web

## Testing Scenarios

### Scenario 1: New User Sign Up
```
1. Open app
2. Tap "Sign Up"
3. Enter: newuser@test.com / password123
4. Enter name: "New User"
5. Tap "Sign Up"
6. Should see success modal
7. Should redirect to home
```

### Scenario 2: Existing User Sign In
```
1. Open app
2. Enter: test@example.com / password123
3. Tap "Sign In"
4. Should redirect to home
5. Should see user data
```

### Scenario 3: OAuth Sign In (Web)
```
1. Open app on web
2. Tap "Continue with Google"
3. Popup opens
4. Complete Google sign in
5. Should redirect to home
```

### Scenario 4: Session Persistence
```
1. Sign in with test@example.com
2. Close app completely
3. Reopen app
4. Should go directly to home (not auth screen)
5. User should still be signed in
```

### Scenario 5: Multiple Users
```
1. Sign in as test@example.com
2. Create a character
3. Sign out
4. Sign in as demo@test.com
5. Should see different profile
6. Should not see first user's characters
```

## Premium Testing

### Free User Limits
- **AI Chats:** 5 per day
- **AI Avatar Generation:** Not available
- **Story Export:** Text format only
- **Private Stories:** Not available

### Premium User Features
- **AI Chats:** Unlimited
- **AI Avatar Generation:** Available
- **Story Export:** PDF format
- **Private Stories:** Available
- **Ad-free:** Yes

To test premium features:
1. Sign in as a test user
2. Try to use premium features
3. Should see appropriate messages
4. (Premium subscription not yet implemented)

## API Testing

### Test Character Creation
```
User: test@example.com
Character Name: "Luna the Mystic"
Description: "A wise sorceress"
Style: "Fantasy"
```

### Test Story Creation
```
User: test@example.com
Story Title: "The Lost Kingdom"
Description: "An epic quest"
Genre: "Fantasy"
```

### Test AI Chat
```
User: test@example.com
Character: Any public character
Message: "Tell me about yourself"
Expected: AI response within 2-3 seconds
```

### Test Community
```
User: test@example.com
Action: Like a post
Expected: Like count increases
Action: Unlike the post
Expected: Like count decreases
```

## Error Testing

### Invalid Credentials
```
Email: invalid@test.com
Password: wrongpassword
Expected: Error modal "Authentication failed"
```

### Empty Fields
```
Email: (empty)
Password: (empty)
Expected: Error modal "Please enter email and password"
```

### Network Error
```
1. Turn off internet
2. Try to sign in
3. Expected: Error modal with network error message
```

### Daily Limit (Free Users)
```
1. Sign in as free user
2. Send 5 AI chat messages
3. Try to send 6th message
4. Expected: Error modal "You have reached your daily limit"
```

## Notes

- All passwords are `password123` for testing
- Use your own OAuth accounts for Google/Apple
- Free users have 5 AI chats per day
- Premium features show appropriate messages
- Session persists across app restarts
- All errors are caught and shown in modals

## Security Notes

⚠️ **Important:**
- These are TEST credentials only
- Do NOT use in production
- Change all passwords before launch
- Implement proper user management
- Add email verification
- Add password reset flow

## Support

If you encounter issues:
1. Check console logs
2. Verify credentials are correct
3. Check internet connection
4. Try signing out and back in
5. Clear app data and try again

---

**Status:** ✅ Ready for testing!
**Backend:** https://uq8tqwhc87z2v6fay4rpyg9qmagwwh3z.app.specular.dev
