# Firestore Migration Walkthrough

We have successfully migrated the entire XURA application suite to **Firebase Firestore**. The architecture has shifted from a single large JSON document to a modern, scalable relational collection structure, exactly as you configured in your console.

## Structural Changes

### 1. Database Manager (`xura-db-manager.html`)
- **Native Collections:** All operations now directly read and write to the `tournaments`, `categories`, and `teams` collections in Firestore.
- **Real-time Sync:** The UI is driven purely by Firestore's `onSnapshot`. We eliminated the need for a manual "Save" button; as soon as you add or delete a team/category, it instantly updates the database and reflects across all connected devices.
- **Offline Persistence:** Firestore's native offline cache is enabled, replacing the old `localStorage` logic entirely.

### 2. Match Setup (`match-setup.html`)
- **Dynamic Fetching:** The dropdowns are populated in real-time from the Firestore collections.
- **Match ID Generation:** When you start a match, it now generates a unique Match ID (e.g., `match_1745123...`) and creates a dedicated document for it in the `matches` collection.
- **URL Redirection:** It redirects the browser to `xura-referee-v3.html?matchId=xxxxx` to strongly couple the referee session with the cloud document.

### 3. Referee App (`xura-referee-v3.html`)
- **URL Parameter Binding:** The application strictly requires `?matchId=xxxx` in the URL. It uses this ID to fetch the correct teams, colors, and match details.
- **Event-Driven Points:** Every time a point is scored, it is pushed as an independent document to the `events` collection, tied via the `matchId` property. This creates an immutable history of points.
- **Status Updates:** When a set or match concludes, the main `matches` document is updated with the final score and `status: 'finished'`.
- **LocalStorage Removed:** The application is now fully stateless in `localStorage`.

### 4. Live Dashboard (`xura-live-v2.html`)
- **Live Stream Tracking:** To watch a live match, the dashboard requires the specific ID in the URL: `xura-live-v2.html?matchId=xxxx`. It uses `onSnapshot` to listen to the `events` collection for that match, rendering points instantly.
- **Global History:** Regardless of the URL, the dashboard always pulls a global history of completed matches by querying the `matches` collection where `status == 'finished'`.
- **Heartbeat Monitoring:** The connection status ("Referee Connected") is monitored by watching the `referees` document corresponding to the `matchId`.

> [!TIP]
> **Testing the Flow:**
> 1. Create a tournament in `xura-db-manager.html`.
> 2. Open `match-setup.html`, select teams, and click "Start Match".
> 3. You will be redirected to `xura-referee-v3.html?matchId=...`. Copy this entire URL.
> 4. To see the live dashboard for this match, open `xura-live-v2.html` and append the same `?matchId=...` to its URL!
