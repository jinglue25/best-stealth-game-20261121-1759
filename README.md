# Nightshade Courier

An original top-down stealth game about a night courier carrying secrets through three guarded compounds. Hand-drawn canvas rooftops, real cover, watchful patrols, and a fully synthesized soundtrack. Everything runs offline with no dependencies or external assets.

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/jinglue25/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/jinglue25/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

## How to play

WASD or arrow keys move. Hold Shift or C to sneak: slower, silent, and harder to notice. Space lifts nearby intel; click on the compound to throw a limited pebble. Enter or Space starts and advances screens. P pauses, R restarts the level, and M toggles sound.

Walls and crates block sight. Bushes provide shadow; lamplight exposes you. Guards gradually notice movement, investigate running footsteps and pebbles, chase on full alert, and search before returning to patrol. Break sight and hide to recover. An alerted guard touching you costs one of three lives.

Take at least 2 / 3 / 3 chips to leave the respective compounds; take all 3 / 4 / 5 for perfect-route bonuses. Each chip scores 500, each full alert costs 150, and fast, unseen deliveries earn bonuses. Missing intel also reduces the clear bonus. Your best score is saved locally when storage is available.

## How to run

Run `node serve.ts` and open http://localhost:8080. The game uses a fixed 1280×720 field scaled to your window. Desktop keyboard and mouse are required. Sound starts on your first key or pointer gesture.

Deterministic screenshot stages: `?shot=start&seed=7`, `?shot=play&seed=7`, and `?shot=end&seed=7`. Each sets `window.__shotReady` after painting.

## Hand in

Run `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`. This copies the game and coordinator-supplied screenshots into `out/` and builds the competition dossier with the supplied limits.
