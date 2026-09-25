# Habits — Expo app

The web habit tracker, ported to React Native with Expo (SDK 57). Same Supabase project,
same account, same RLS: sign in with your web account and you see the same habits.

## Run it on your phone

```bash
cd mobile
cp .env.example .env        # same URL + anon key as the web app's .env
npm install
npx expo start
```

Scan the QR code with **Expo Go** (iOS: the Camera app; Android: the Expo Go app).
Your phone and computer must be on the same Wi-Fi; if they aren't, use
`npx expo start --tunnel`.

## What moved, what changed

| Web | Expo | |
| --- | --- | --- |
| `useHabits` queries + state | `src/hooks/useHabits.ts` | **Same logic**, same Supabase calls |
| `AuthContext` + `onAuthStateChange` | `src/context/AuthContext.tsx` | **Same**, session stored in AsyncStorage |
| `ProtectedRoute` | `Stack.Protected` in `src/app/_layout.tsx` | New primitive, same idea |
| `<ul>` of `HabitItem` | `FlatList` of `HabitRow` | New primitives |
| `<form>` / `<input>` | `TextInput` + `Pressable` on the Add screen | New primitives |
| CSS tokens in `index.css` | NativeWind `className`s, same colours in `tailwind.config.js` | |
| React Router | Expo Router: `index` (List), `add` (Add), `login` | |

## The one platform branch

`src/lib/share.ts` — `Platform.select`: `navigator.share` (clipboard fallback) on web,
React Native `Share.share` on iOS/Android. It's called from exactly one place, the List
screen's Share button. Every `navigator` reference is inside the web function; the
exported iOS and Android bundles contain **zero** `navigator.share`/`navigator.clipboard`.

## Checks

```bash
npx tsc --noEmit     # typecheck
npx expo lint        # ESLint (eslint-config-expo)
npx expo-doctor      # 21/21 checks pass
npx expo export --platform ios --platform android   # both bundle
```
