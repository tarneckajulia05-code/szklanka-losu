# SZKLANKA LOSU – multiplayer online
## Uruchomienie (krok po kroku)
1. Załóż darmowy projekt na https://supabase.com → New project.
2. W projekcie: SQL Editor → wklej zawartość `supabase/schema.sql` → Run.
3. Settings → API: skopiuj **Project URL** i **anon public key**.
4. `cp .env.example .env` i wklej oba wpisy.
5. `npm install` → `npm run dev` (otwórz na kilku urządzeniach/kartach).
6. Wdrożenie: Vercel/Netlify (dodaj te same zmienne środowiskowe VITE_*).
Uwaga: baza ma otwarty dostęp (gra imprezowa bez logowania) – nie wpisuj tam danych wrażliwych.
