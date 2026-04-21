# XURA Match Setup Integration Walkthrough

I have successfully designed and integrated the new Match Setup architecture into the XURA platform. This upgrade transitions the system from hardcoded, static teams to a fully dynamic, database-driven setup flow.

## 1. The Match Setup Screen
`match-setup.html` has been completely redesigned.

*   **Database Integrated**: A static JavaScript database (`DB`) has been added containing standard Age Groups (`Senior`, `U18`, `U16`, `U14`, `U12`) and 6 standard teams (Zamalek, Al Ahly, Smouha, Army, Union, Petro Jet) along with their official hex colors.
*   **Professional UI**: The setup screen now uses the XURA "Glass & Gradient" aesthetic, providing a sleek, modern starting point for the referee.
*   **Smart Filtering**:
    *   Selecting an Age Group dynamically updates the match configuration.
    *   The UI includes built-in validation: it actively prevents the referee from selecting the exact same team for both Home and Away, disabling the "Start Match" button until a valid matchup is selected.

## 2. Global State & Data Bridging
*   When "Start Match" is clicked, the system bundles the selected Age Group, along with the full team objects (names in AR/EN and colors), into a JSON object.
*   This object is saved to `localStorage` under the key `xura_match`.
*   The system then automatically redirects the user to the Referee application.

## 3. Referee Application Updates (`xura-referee-v3.html`)
*   **Dynamic Initialization**: On startup, the referee app reads `xura_match` from `localStorage`.
*   **Color Matching**: The app dynamically injects the chosen teams' colors into the CSS variables (`--teal`, `--blue`, etc.), so the entire referee UI (buttons, scores, highlights) automatically adopts the identity of the playing teams.
*   **Safety Net**: If a user attempts to open the referee app directly without setting up a match first, they are instantly redirected back to `match-setup.html`.
*   **Match Reset**: When a match concludes and the referee clicks "New Match", the system wipes the current match data and redirects them to `match-setup.html` to configure the next game.

## 4. Live Broadcast Dashboard Updates (`xura-live-v2.html`)
*   **Dynamic UI**: The live dashboard also consumes `xura_match`. The Match Card and Scoreboard now reflect the exact teams, names (in AR/EN), and colors chosen by the referee in the setup phase.
*   **Tournament Labels**: The selected Age Group is now appended directly to the broadcast title (e.g., "Live Match — U18").
*   **Fallback Logic**: Included a fallback safety mechanism so the Live Dashboard doesn't crash if it's opened before the referee initiates the setup.

> [!TIP]
> **Next Steps / Scaling**: The current database inside `match-setup.html` is a static JavaScript object. Because the architecture is decoupled through `localStorage`, transitioning this to a real backend (like Firebase, Supabase, or a custom API) in the future will be seamless. You would only need to update `match-setup.html` to fetch the teams from the API, and the rest of the XURA ecosystem will continue to function perfectly.
