# Orange Crush Lacrosse — Parent Hub

Live at https://app.napervillelacrosse.org

- `index.html`: the whole app. The practice schedule, teams, game dates, weather policy and contact info are in the `CONFIG`, `TEAMS` and `GAMES` blocks near the top of the script.
- Live changes (cancellations, the banner, added games/events, edits) are stored in Supabase (project "Orange Crush App"). Make them in the app's Coach mode: tap the Crushy logo 5 times and enter the coach passcode.
- `img/`: logo, field maps and home-screen icons.
- `sw.js`: offline support. The schedule shell works without signal, and live updates load when there's a connection.
