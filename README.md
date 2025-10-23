# Loto 6/45 — Node.js + TypeScript + Express + Prisma + Auth0

Web-aplikacija za simulaciju uplata loto listića, izvlačenje brojeva i prikaz rezultata po kolima.

## Tehnologije
- Node.js (Express) + TypeScript
- EJS templating + Bootstrap
- PostgreSQL + Prisma ORM
- Auth0 (OIDC za korisnike, OAuth2 M2M za admin endpoint-e)
- QR kod (PNG) s poveznicom na javnu stranicu listića

## Pokretanje lokalno

1. Kopiraj `.env.example` u `.env` i postavi vrijednosti:
   - `DATABASE_URL` (PostgreSQL)
   - `AUTH0_*` i `SESSION_SECRET`
   - `BASE_URL` (npr. `http://localhost:3000`)

2. Instalacija i Prisma client:
```bash
npm install
npm run prisma:generate
```

3. Kreiraj shemu (inicijalni objekti se stvaraju pozivima):
```bash
npx prisma migrate dev --name init
```

4. Pokreni:
```bash
npm run dev
```

## Endpointi

### Korisnički (OIDC)
- `GET /` — početna, prikaz statusa
- `GET /submit` (zahtijeva login) — forma za uplatu
- `POST /submit` (zahtijeva login) — validacija i spremanje listića; **odgovor: image/png** (QR kod)
- `GET /ticket/:id` — javna stranica listića

### Admin (M2M, Client Credentials)
- `POST /new-round` — aktivira novo kolo (uvek 204; nema efekta ako već postoji OPEN)
- `POST /close` — zatvara trenutno kolo (uvek 204; nema efekta ako nema OPEN)
- `POST /store-results` — prima `{ numbers: number[] }`, sprema rezultate **samo** ako je trenutno kolo CLOSED i nema već spremljenih brojeva; inače 400

> Napomena: za `store-results` se **ne provjerava** raspon brojeva (prema specifikaciji).

## Auth0

### OIDC (web login)
Koristi `express-openid-connect`. U `.env` postavi:
```
AUTH0_ISSUER_BASE_URL=https://<your-domain>/
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
BASE_URL=http://localhost:3000
SESSION_SECRET=some_long_random_string
```

### M2M (admin)
Tokeni izdani za `audience=AUTH0_M2M_AUDIENCE` (ili `AUTH0_AUDIENCE`) s potpisom RS256. Middleware `requireM2M` validira token preko JWKS.

## Deploy na Render

- U `.env` varijable na Renderu postavi sve vrijednosti iz `.env.example`.
- Render će pokrenuti `npm run build` i `npm run start`.
- Prisma koristi `prisma migrate deploy` **ako** dodaš u CI ili ručno izvršiš migracije.

## Napomene
- QR kod sadrži URL: `${BASE_URL}/ticket/<uuid>`
- Uplate su moguće **samo** dok je kolo OPEN.
- Aktivacijom novog kola započinje novo — stari podaci ostaju zbog QR linkova.
- Na početnoj se prikazuje broj uplaćenih listića i izvučeni brojevi za trenutno kolo (ako postoje).

## Testne upute
1. (Admin) `POST /new-round` s Bearer M2M tokenom ➜ 204
2. (User) Login preko `/login`
3. (User) `POST /submit` s validnim podacima ➜ image/png (QR)
4. (Admin) `POST /close` ➜ 204
5. (Admin) `POST /store-results` s `{ "numbers": [ ... ] }` ➜ 204
6. (Public) `GET /ticket/<id>` ➜ vidi svoje brojeve i izvučene

Sretno! 🎉
