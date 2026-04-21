# Match Setup & Dynamic Teams Integration

This plan outlines the architecture and implementation for introducing a "Match Setup" phase, replacing hardcoded teams with a dynamic database of age groups and teams, and routing this data through the XURA ecosystem (Referee & Live App).

## Proposed Architecture

1. **Database Structure**: A JSON-based configuration object containing predefined `ageGroups` and `teams` (with bilingual names and brand colors).
2. **Match Setup Application (`match-setup.html`)**: A new entry point with a professional UI. It will allow users to select an Age Group, which dynamically filters the available teams for "Team A" and "Team B".
3. **Data Bridging**: The configuration will be saved to `localStorage` under `xura_match`.
4. **Referee System (`xura-referee-v3.html`)**: Will consume `xura_match` on startup. If no match is configured, it will redirect the user to `match-setup.html`. The "New Match" screen will include a button to return to the Match Setup screen.
5. **Live System (`xura-live-v2.html`)**: Will read `xura_match` to dynamically display the correct team names, colors, and age group details in the Match Card and Scoreboard.

## User Review Required

> [!IMPORTANT]
> Since we are switching from static teams to dynamic teams, I will define a standard set of team colors in the database (e.g., `#5eead4` for Zamalek, `#60a5fa` for Al Ahly). Is there a specific list of teams you want me to add to the initial database, or should I just create a sample list (Zamalek, Al Ahly, Smouha, Army, Union, Petro Jet) across different age groups?

## Proposed Changes

### Database Definition
I will create a standard JavaScript object (acting as our database for now) to store:
- `ageGroups`: `['U12', 'U14', 'U16', 'U18', 'Senior']`
- `teams`: Objects containing `id`, `name_ar`, `name_en`, `ageGroup`, and `color`.

---

### [MODIFY] [match-setup.html](file:///c:/Users/Lenovo/Desktop/XURA%20Project/Final%20Project/match-setup.html)
- Upgrade the design to match the "Glass & Gradient" aesthetic of the XURA ecosystem.
- Add JavaScript logic to populate team dropdowns based on the selected Age Group.
- Add validation to prevent selecting the same team twice.
- Implement the `startMatch` function to save the full team objects into `localStorage` and redirect to the referee app.

---

### [MODIFY] [xura-referee-v3.html](file:///c:/Users/Lenovo/Desktop/XURA%20Project/Final%20Project/xura-referee-v3.html)
- Remove the hardcoded `CLUBS` constant.
- Add an initialization block to read `xura_match` from `localStorage`.
- If `xura_match` does not exist, redirect to `match-setup.html`.
- Update the "Match Over" overlay to include a "New Match Setup" button that clears the data and redirects back to `match-setup.html`.

---

### [MODIFY] [xura-live-v2.html](file:///c:/Users/Lenovo/Desktop/XURA%20Project/Final%20Project/xura-live-v2.html)
- Remove the hardcoded `CLUBS` constant.
- Read `xura_match` to determine `home` and `away` teams.
- Dynamically update the UI colors and team names based on the setup data.
- Append the Age Group to the Tournament Name display (e.g., "Live Match — Senior").

## Verification Plan
### Manual Verification
1. Open `match-setup.html` in the browser.
2. Select an Age Group and verify that the team dropdowns are filtered correctly.
3. Select two different teams and click "Start Match".
4. Verify that `xura-referee-v3.html` loads with the correct dynamic team names and colors.
5. Open `xura-live-v2.html` and verify the Live Match card correctly reflects the selected teams and age group.
6. End a match in the referee app and click "New Match Setup" to ensure it redirects successfully.
