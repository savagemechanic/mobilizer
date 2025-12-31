# Test Login Instructions

## Backend URL
The app is configured to connect to: `https://mobilizer-backend-dyw1.onrender.com/graphql`

## To test login:

1. **Check the Metro bundler logs** in your terminal for these messages:
   - `🌐 GraphQL URL:` - Should show the Render backend URL
   - `🔄 Restoring session...` - Shows app is checking for existing login
   - `ℹ️ No tokens found, user not logged in` - Expected on first run

2. **Try to login** and watch for:
   - `🔐 Starting login...` - Login button was pressed
   - `📡 Login response:` - Shows the response from backend
   - `✅ Login successful` or `❌ Login error` - Shows result

3. **If you see errors:**
   - Check if the backend URL is correct in the logs
   - Check if you have a valid user account on the backend
   - Look for GraphQL or network errors in the logs

## Create a test account:

You can either:
- Use the Register screen in the app
- Or create one directly via the backend GraphQL playground at:
  https://mobilizer-backend-dyw1.onrender.com/graphql

## Common issues:

- **Loading forever**: Check Metro logs for errors
- **No response**: Backend might be sleeping (Render free tier), wait 30 seconds and try again
- **Network error**: Check your internet connection
