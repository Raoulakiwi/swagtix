# SwagTix Scanner (Expo)

Mobile ticket-scanner for event staff.  
Scans QR codes, verifies against Firestore, and performs an atomic check-in through a Firebase Cloud Function.

## Prerequisites
• Node 18+  
• Expo CLI (`npm i -g expo`) – optional but convenient  
• Firebase project with Email/Password Auth enabled and a `tickets` collection

## Local Setup
1. `cp .env.example .env` and add your Firebase config + optional brand colours.  
2. Install dependencies:

   ```
   npm install
   ```

3. Start the app (choose platform in the Expo menu):

   ```
   npx expo start
   ```

## Cloud Functions
```
cd functions
npm install
npm run build          # transpile TypeScript → lib/
firebase deploy --only functions
```
Callable function deployed: **`checkInTicket`**

## Usage Notes
* First successful scan locks the session to that `eventId`; clear it from **Settings → Clear Event Lock**.  
* Haptic feedback is on by default. Enable beep audio by adding `assets/beep.mp3`.  
* If a ticket has `seatIdentifier` or `seatID`, it’s displayed; otherwise the ticket is considered “Standing”.  
* Torch can be toggled in Settings.

Happy scanning! 🚀
