# Water Sort

Expo (React Native) + TypeScript water-sort puzzle. No ads, no purchases.

## Run

```
npm install
npx expo start
```

Scan the QR code with Expo Go (Android), or press `a` for an emulator.

## Where things are

- `src/game/` - rules, solver, themes, `levelData.ts` (300 levels, all verified solvable)
- `src/art/` - code-drawn bottles, liquid physics, backdrops, logo, icons
- `src/ui/` - board + pour animation, game screen, home screens
- `src/config.ts` - game title, hint cost, daily rewards
- `scripts/generateLevels.ts` - regenerate levels: `npx tsx scripts/generateLevels.ts`

Before publishing change `android.package` in `app.json` (currently `com.watersort.puzzle`).
