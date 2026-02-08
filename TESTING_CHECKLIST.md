
# 🧪 Testing Checklist

Use this checklist to verify all backend integrations are working correctly.

## Prerequisites
- [ ] Backend is running at: https://uq8tqwhc87z2v6fay4rpyg9qmagwwh3z.app.specular.dev
- [ ] App is running (`npm run dev` or `npm run ios/android/web`)
- [ ] Console is open to view logs

## 1. Authentication Flow

### Sign Up
- [ ] Open app (should show auth screen)
- [ ] Switch to "Sign Up" mode
- [ ] Enter email: `test@example.com`
- [ ] Enter password: `password123`
- [ ] Enter name: `Test User`
- [ ] Tap "Sign Up"
- [ ] Should see success modal
- [ ] Should redirect to home screen
- [ ] Check console for `[API] Success` logs

### Sign In
- [ ] Sign out from profile
- [ ] Enter same credentials
- [ ] Tap "Sign In"
- [ ] Should redirect to home screen
- [ ] User data should persist

### Google OAuth (Web Only)
- [ ] Tap "Continue with Google"
- [ ] Popup should open
- [ ] Complete Google sign in
- [ ] Should redirect to home
- [ ] Check console for auth logs

### Apple OAuth (iOS + Web)
- [ ] Tap "Continue with Apple"
- [ ] Complete Apple sign in
- [ ] Should redirect to home

### Session Persistence
- [ ] Sign in
- [ ] Close app completely
- [ ] Reopen app
- [ ] Should go directly to home (not auth screen)
- [ ] Check console for session refresh logs

## 2. Profile Screen

### Load Profile
- [ ] Go to Profile tab
- [ ] Should see user name and email
- [ ] Should see stats (followers, following, characters, stories)
- [ ] Check console for `[Profile] User profile loaded`

### Premium Status
- [ ] Should see "Upgrade to Premium" button (if not premium)
- [ ] Premium badge should show correct status

### Sign Out
- [ ] Tap sign out icon
- [ ] Should see confirmation modal
- [ ] Tap "Sign Out"
- [ ] Should redirect to auth screen
- [ ] Check console for sign out logs

## 3. Home Screen

### Load Data
- [ ] Go to Home tab
- [ ] Should see featured characters
- [ ] Should see popular stories
- [ ] Check console for `[Home] Featured characters loaded`
- [ ] Check console for `[Home] Featured stories loaded`

### Recent Conversations
- [ ] If you have conversations, they should appear
- [ ] Tap on a conversation
- [ ] Should navigate to chat screen

### Start New Adventure
- [ ] Tap "Start New Adventure" button
- [ ] Should navigate to character create screen

## 4. Discover Screen

### Characters Tab
- [ ] Go to Discover tab
- [ ] Should see "Characters" tab active
- [ ] Should see list of characters
- [ ] Check console for `[Discover] Characters loaded`

### Search Characters
- [ ] Type in search box: "Luna"
- [ ] Should filter characters
- [ ] Check console for API call with search param

### Filter by Style
- [ ] Tap "Anime" filter
- [ ] Should show only anime characters
- [ ] Tap "Fantasy" filter
- [ ] Should show only fantasy characters
- [ ] Check console for API calls with style param

### Stories Tab
- [ ] Switch to "Stories" tab
- [ ] Should see list of stories
- [ ] Check console for `[Discover] Stories loaded`

### Filter by Genre
- [ ] Tap "Sci-Fi" filter
- [ ] Should show only sci-fi stories
- [ ] Check console for API call with genre param

## 5. Character Creation

### Create Character
- [ ] Go to Profile → Create Character
- [ ] Enter name: "Test Character"
- [ ] Enter description: "A brave warrior"
- [ ] Enter personality: "Bold and fearless"
- [ ] Enter backstory: "Born in the mountains"
- [ ] Select style: "Fantasy"
- [ ] Toggle "Make Public" on
- [ ] Tap "Create Character"
- [ ] Should see success modal
- [ ] Should navigate back
- [ ] Check console for `[Character Create] Character created`

### Generate AI Avatar (Premium)
- [ ] Fill in description
- [ ] Tap "Generate AI Avatar"
- [ ] Should see loading indicator
- [ ] Should see result (or premium message)
- [ ] Check console for API call

### Validation
- [ ] Try to save without name
- [ ] Should see error modal
- [ ] Try to save without description
- [ ] Should see error modal

## 6. Character Detail

### View Character
- [ ] Go to Discover → Characters
- [ ] Tap on a character
- [ ] Should see character details
- [ ] Should see name, description, personality, backstory
- [ ] Check console for `[Character Detail] Character loaded`

### Start Conversation
- [ ] Tap "Start Conversation" button
- [ ] Should create conversation
- [ ] Should navigate to chat screen
- [ ] Check console for `[Character Detail] Conversation created`

## 7. Chat Screen

### Load Conversation
- [ ] Open a conversation
- [ ] Should see message history
- [ ] Check console for `[Chat] Conversation loaded`

### Send Message
- [ ] Type message: "Hello, tell me about yourself"
- [ ] Tap send button
- [ ] Should see user message appear
- [ ] Should see loading indicator
- [ ] Should see AI response
- [ ] Check console for `[Chat] AI response received`

### Daily Limit (Free Users)
- [ ] Send 5 messages
- [ ] On 6th message, should see limit error
- [ ] Error modal should mention daily limit

### Delete Conversation
- [ ] Tap trash icon in header
- [ ] Should see confirmation modal
- [ ] Tap "Delete"
- [ ] Should navigate back
- [ ] Check console for `[Chat] Conversation deleted`

## 8. Story Creation

### Generate Story with AI
- [ ] Go to Profile → Create Story
- [ ] Enter prompt: "A wizard's quest to save the kingdom"
- [ ] Select genre: "Fantasy"
- [ ] Tap "Generate with AI"
- [ ] Should see loading indicator
- [ ] Should see generated title and description
- [ ] Check console for `[Story Create] Story generated`

### Create Story Manually
- [ ] Enter title: "Test Story"
- [ ] Enter description: "An epic adventure"
- [ ] Select genre: "Adventure"
- [ ] Toggle "Make Public" on
- [ ] Tap "Create Story"
- [ ] Should see success modal
- [ ] Should navigate back
- [ ] Check console for `[Story Create] Story created`

### Validation
- [ ] Try to save without title
- [ ] Should see error modal
- [ ] Try to generate without prompt
- [ ] Should see error modal

## 9. Story Detail

### View Story
- [ ] Go to Discover → Stories
- [ ] Tap on a story
- [ ] Should see story details
- [ ] Check console for `[Story Detail] Story loaded`

### Start Adventure
- [ ] Tap "Start Adventure" button
- [ ] Should create conversation
- [ ] Should navigate to chat screen
- [ ] Check console for `[Story Detail] Conversation created`

### Export Story
- [ ] Tap export icon in header
- [ ] Should see loading indicator
- [ ] Should see success modal
- [ ] Free users: text format
- [ ] Premium users: PDF download
- [ ] Check console for `[Story Detail] Story exported`

## 10. Community Feed

### Load Feed
- [ ] Go to Community tab
- [ ] Should see posts from users
- [ ] Check console for `[Community] Feed loaded`

### Like Post
- [ ] Tap heart icon on a post
- [ ] Should toggle like state
- [ ] Like count should update
- [ ] Check console for `[Community] Like toggled`

### Unlike Post
- [ ] Tap heart icon again
- [ ] Should toggle back
- [ ] Like count should decrease

### Error Handling
- [ ] Turn off internet
- [ ] Try to like a post
- [ ] Should see error modal
- [ ] Like should revert

## 11. Error Handling

### Network Error
- [ ] Turn off internet
- [ ] Try to load any screen
- [ ] Should see error modal
- [ ] Error message should be user-friendly

### Authentication Error
- [ ] Sign out
- [ ] Try to access protected route
- [ ] Should redirect to auth screen

### Validation Errors
- [ ] Try to create character without name
- [ ] Should see validation error modal
- [ ] Try to send empty message
- [ ] Should not send

## 12. Loading States

### All Screens
- [ ] Each screen should show loading spinner while fetching data
- [ ] Loading should be smooth (no flashing)
- [ ] Loading should complete within reasonable time

## 13. Console Logs

### Check for Errors
- [ ] No red errors in console
- [ ] All API calls should log success
- [ ] All errors should be caught and logged

### Log Prefixes
- [ ] `[API]` - API layer logs
- [ ] `[Home]` - Home screen logs
- [ ] `[Profile]` - Profile screen logs
- [ ] `[Community]` - Community logs
- [ ] `[Discover]` - Discover logs
- [ ] `[Character Create]` - Character creation logs
- [ ] `[Character Detail]` - Character detail logs
- [ ] `[Story Create]` - Story creation logs
- [ ] `[Story Detail]` - Story detail logs
- [ ] `[Chat]` - Chat logs

## 14. Cross-Platform

### iOS
- [ ] All features work on iOS
- [ ] Apple OAuth works
- [ ] SecureStore persists session

### Android
- [ ] All features work on Android
- [ ] SecureStore persists session

### Web
- [ ] All features work on web
- [ ] Google OAuth popup works
- [ ] Apple OAuth popup works
- [ ] localStorage persists session

## Summary

Total Tests: ~80+
- [ ] All authentication flows work
- [ ] All CRUD operations work
- [ ] All AI features work
- [ ] All error handling works
- [ ] All loading states work
- [ ] Session persistence works
- [ ] Cross-platform compatibility works

## Notes

- If any test fails, check console logs
- All errors should show user-friendly modals
- All API calls should be logged
- Session should persist across app restarts
- Free users have 5 AI chats/day limit
- Premium features show appropriate messages

## Test Credentials

**Email/Password:**
- Email: `test@example.com`
- Password: `password123`

**OAuth:**
- Use your own Google/Apple account

## Success Criteria

✅ All checkboxes checked
✅ No console errors
✅ All API calls successful
✅ User experience is smooth
✅ Error handling is graceful
✅ Loading states are clear
✅ Session persists correctly

---

**Status:** Ready for testing! 🚀
