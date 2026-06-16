# CartMate

CartMate is a shared shopping-list app built with Expo, React Native, and Firebase. It lets people create grocery lists, invite others with a code, add and check off items together, and keep using the app when the connection is shaky.

## Features

- Email/password sign in with Firebase Authentication
- Create shared shopping lists
- Join a list with an 8-character invite code
- Add, edit, check, undo, and delete shopping items
- Recently bought section for checked items
- Owner-only list deletion
- Offline-friendly writes that queue locally and sync later
- Local notifications when another member adds items
- App themes: Neon Night, Forest, and Sunrise
- Firebase security rules for list membership and invite codes

## Tech Stack

- Expo SDK 56
- React Native
- TypeScript
- Firebase Authentication
- Cloud Firestore
- Zustand
- React Navigation
- AsyncStorage
- Expo Notifications

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root. You can copy `.env.example` and fill in your Firebase web app values:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Start the app:

```bash
npm start
```

Run on Android:

```bash
npm run android
```

## Firebase Setup

Create a Firebase project and enable:

- Authentication with Email/Password provider
- Cloud Firestore

Then deploy the included Firestore rules and indexes:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

The app expects these collections:

- `users`
- `lists`
- `lists/{listId}/items`
- `inviteCodes`

## Testing Firestore Locally

There is a two-account smoke test for the Firebase emulators:

```bash
npm run test:firestore
```

This checks the main shared-list flow with local Auth and Firestore emulators.

## Building an APK

Install and log in to EAS:

```bash
npm install --global eas-cli
eas login
```

The `preview` profile in `eas.json` is configured to build an installable APK:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

Before building in the cloud, add the Firebase values from `.env` to EAS:

```bash
eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-value"
eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-value"
eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-value"
eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your-value"
eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "your-value"
eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "your-value"
```

Build the APK:

```bash
eas build -p android --profile preview
```

When the build finishes, EAS will provide a download link for the `.apk`.

Local `.env` files are not automatically available in remote EAS builds. If these values are missing, the installed app will show a setup warning instead of starting CartMate.

## Notifications Note

Android push notifications from `expo-notifications` are not supported inside Expo Go for newer Expo SDK versions. Use a development build or production APK to test notifications properly.

## Useful Commands

```bash
npm start
npm run android
npm run ios
npm run web
npm run test:firestore
npx tsc --noEmit
```

## Project Structure

```text
src/
  components/     Reusable modals and UI pieces
  lib/            Firebase initialization
  navigation/     App navigation stack
  screens/        Auth, list, invite, and settings screens
  services/       Firebase and notification logic
  store/          Zustand auth and theme stores
  theme/          App theme definitions
  types/          Shared TypeScript types
```

## Status

CartMate is ready for private testing with trusted users. Before a wider public release, double-check Firebase rules in production, build a real APK/AAB with EAS, and test the full invite/offline/delete flow on multiple devices.
