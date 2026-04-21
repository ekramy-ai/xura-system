# Firestore Database Migration Plan

This plan details the migration of the XURA suite to **Firebase Firestore**, specifically adapting the application to use the relational collection structure you created (`tournaments`, `categories`, `teams`, `matches`, `events`, and `referees`).

## User Review Required

> [!WARNING]
> Moving from a local JSON object to a relational Firestore structure is a significant architectural shift. I will need to write adapters that convert your new Firestore collections into the format the UI expects.
> Also, because we are using Firestore collections for individual points (`events`), we will rely heavily on Firestore's real-time `onSnapshot` listeners.

## Open Questions
1. **Match IDs**: When starting a match, should we create a unique document in the `matches` collection (e.g., `match_12345`) and tie all `events` to that specific match ID? 
2. **Offline Fallback**: Do you still want to keep the `localStorage` fallback? Firestore actually has robust built-in offline caching (`enableIndexedDbPersistence`), which makes manual `localStorage` syncing somewhat redundant. I highly recommend relying on Firestore's native offline capabilities instead of managing `localStorage` manually.

## Proposed Changes

We will replace the Realtime Database SDK with the Firestore SDK across all four files.

### 1. `xura-db-manager.html`
- **Data Loading**: We will use `getDocs` (or `onSnapshot`) to fetch from the `tournaments`, `categories`, and `teams` collections. We'll reconstruct the hierarchical `DB` object in memory so the existing UI rendering works perfectly.
- **Data Saving**: When you add/delete items and click "Save", the app will iterate through the in-memory `DB` and use `setDoc` / `deleteDoc` on the respective Firestore collections:
  - `tournaments` doc: `{ name }`
  - `categories` doc: `{ tournamentId, gender, ageGroup }`
  - `teams` doc: `{ categoryId, name_ar, name_en, color }`

### 2. `match-setup.html`
- **Data Loading**: Similar to the DB Manager, it will listen to the `tournaments`, `categories`, and `teams` collections to populate the dropdowns dynamically.
- **Start Match**: When you start a match, it will create a document in the `matches` collection with the status `live`, and clear any previous `events` for that match.

### 3. `xura-referee-v3.html`
- **Events (Points)**: Instead of saving an array to `localStorage`, every point scored will be pushed as a separate document to the `events` collection: `{ matchId, scoring_side, point_type, home_score_after, away_score_after, set_num, timestamp }`.
- **Heartbeat**: The referee's active status will be updated in the `referees` collection: `{ id: 'main', lastActive: Date.now() }`.
- **Match End**: The document in the `matches` collection will be updated to `status: 'finished'` and the final score will be saved.

### 4. `xura-live-v2.html`
- **Live Match**: It will listen via `onSnapshot` to the `matches` collection for any match with `status: 'live'`.
- **Live Score**: It will listen to the `events` collection (filtered by the active match ID) to build the real-time scoreboard and point log.
- **Connection Status**: It will listen to the `referees` collection to check if the referee is currently connected.
- **Match History**: It will query the `matches` collection for documents where `status == 'finished'`.

## Verification Plan
1. Open `xura-db-manager.html` and add a tournament, category, and team. Verify they appear as separate documents in the Firestore Console under their respective collections.
2. Start a match in `match-setup.html`. Verify a new document appears in the `matches` collection.
3. Score points in `xura-referee-v3.html`. Verify each point appears as a document in the `events` collection.
4. Open `xura-live-v2.html` and ensure the live score updates instantly as points are added to Firestore.
