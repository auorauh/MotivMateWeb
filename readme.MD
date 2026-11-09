# MotivMate
MotivMate is a goal tracking app. It started as an iOS app built with React Native and Expo, and now runs as a React web app.

## Setup
Install dependencies:

```
npm install
```

Copy `.env.example` to `.env` and set your API base URL:

```
VITE_API_URL=https://your-api.example.com
```

Start the app:

```
npm run dev
```

Open the URL Vite prints, usually http://localhost:5173.

## Notes
Saved login email is stored in the browser with `localStorage`. Reminder notifications use the browser Notification API and fire only while this tab stays open.

## Contributors
MotivMate was created by Trenton Teasdale.
