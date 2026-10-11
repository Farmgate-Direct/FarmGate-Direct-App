# Barangay-Level Delivery Fee (Bulacan-Only)

Upgrades the delivery fee from municipality-level to **barangay-centroid distance**,
computed as `haversine × ROAD_DISTANCE_FACTOR`, rounded to 0.1 km, mapped to an
inclusive-upper-bound fee table. No GPS. No municipality-center fallback for new
orders. Client preview is never trusted — the server recomputes in
`/delivery/quote`, `/accept` (COD), and `/create-payment` (GCash).

> **Status: NOT RELEASED.** Unit tests (15/15) and `tsc` pass, but this must still
> be tested on real Firebase + Xendit test orders before release.

## Fee table (backend `deliveryFee.js` ↔ frontend `utils/deliveryFee.ts`, must match)

| Road distance (km) | Fee (₱) | Tier label |
|---|---|---|
| 0 – 3.0 | 25 | 0–3 km |
| 3.1 – 6.0 | 35 | 3.1–6 km |
| 6.1 – 10.0 | 50 | 6.1–10 km |
| 10.1 – 15.0 | 65 | 10.1–15 km |
| 15.1 – 20.0 | 80 | 15.1–20 km |
| 20.1+ | 100 | 20.1 km+ |

Same barangay (exact normalized city + barangay match) = 0 km, ₱25.
`FARMGATE_ROAD_DISTANCE_FACTOR` default 1.3, accepted range 1–2 (out-of-range →
default). Error codes: `INVALID_PROVINCE`, `UNKNOWN_CITY`, `UNKNOWN_BARANGAY`,
`BARANGAY_NOT_SERVICEABLE`, `FARM_MISSING_BARANGAY`.

---

## Added files

### Backend (`farmgate-backend/`)

| File | Why |
|---|---|
| `deliveryFee.js` | Core logic: `quoteDeliveryFee(farm, buyer)` → `{distanceKm, fee, tier}`; `DeliveryFeeError`; `computeDeliveryForOrder` (pickup→0, legacy no-barangay→keep stored fee, else throw); Firestore-shape helpers `farmLocationFromProfile` / `buyerLocationFromAddress`. |
| `data/bulacan_barangays.csv` | Source data: 569 barangays (`city,barangay,lat,lng`), names from PSGC. **Required at runtime** — backend crashes on boot without it. |
| `data/bulacanBarangays.js` | Generated JS module (`BARANGAY_COORDS`, `CITIES`, `BARANGAYS_BY_CITY`). Do not edit by hand. |
| `data/build_barangay_data.js` | CSV → JS module. Enforces unique normalized `(city, barangay)` key (exit 1 on duplicates); reports MISSING / SUSPICIOUS coords without guessing. `npm run build:barangays` / `check:barangays` (`--check-only`). |
| `data/fetch_psgc_names.js` | One-off used to build the CSV skeleton from PSGC (handles `municipalityCode \|\| cityCode`). |
| `__tests__/deliveryFee.test.js` | 9 unit tests: same barangay, adjacent barangays, 3.0-vs-3.1 boundary, non-Bulacan, typo, same-name-different-city, unknown city, road-factor clamping. `node --test __tests__/`. |
| `__tests__/backend.test.js` | 6 fake-Firestore tests: GCash total = subtotal + fee (client fee ignored), pickup = 0, out-of-Bulacan blocked, legacy keeps stored fee, deliver idempotent, COD no wallet credit. |
| `scripts/list-farms-missing-barangay.js` | Migration helper: lists farmers missing City/Barangay. `npm run list:farms-missing-barangay`. |

### Frontend (`client/mobile/`)

| File | Why |
|---|---|
| `constants/bulacanBarangays.ts` | Generated: `BULACAN_PROVINCE`, `BULACAN_CITIES` (24), `BARANGAYS_BY_CITY`, `barangaysForCity()`. Dropdown source; names match backend exactly. |
| `utils/deliveryFee.ts` | Preview-only helpers: tier mirror, `deliveryErrorMessage`, `formatKm`/`formatPeso`. |

## Modified files

### Backend

| File | Change |
|---|---|
| `index.js` | New `POST /delivery/quote` (reads farm from `users/{farmerId}`, buyer from address); `validateOrderForPayment` recomputes barangay fee/distance/tier instead of flat ₱35; writes `distanceKm`/`deliveryTier`; post-pay immutability kept (paid → reject; webhook checks stored total). |
| `walletRoutes.js` | `priceOrderOnServer` reads farmer profile in-transaction, recomputes barangay fee (ignores client values); `/accept` validates delivery for COD **and** GCash (provisional quote), writes `distanceKm`/`deliveryTier`, returns 400+code and keeps order pending on `DeliveryFeeError`; new `POST /wallet/delivery/quote`; test-only `_test` exports. **`/deliver` settlement untouched.** |
| `package.json` | Added `test`, `build:barangays`, `check:barangays`, `list:farms-missing-barangay` scripts. |
| `.env` | **Not changed** (reverted to avoid touching secrets). Set `FARMGATE_ROAD_DISTANCE_FACTOR=1.3` in the Render dashboard instead (optional; default is 1.3). |

### Frontend

| File | Change |
|---|---|
| `src/services/orderService.ts` | New `quoteDelivery()` → `/delivery/quote`; `requestBackend` preserves server error `code`. |
| `src/types/order.ts` | Added `distanceKm`, `deliveryTier`. |
| `app/buyer/profile/new-address.tsx` | PSGC fetches → local dataset; province locked to Bulacan; City → dependent Barangay dropdown. |
| `app/auth/register-farmer.tsx` | Same conversion (also fixes `Baliuag`→`Baliwag`, `Doña`→`Dona` mismatches). |
| `app/farmer/profile/edit-profile-farm.tsx` | City → dependent Barangay dropdowns, locked province display, save validation, missing-barangay banner; writes `municipality` + `city` + `Bulacan`. |
| `app/buyer/checkout/index.tsx` | Per-farm server quotes with fee + km cards, summed total, Place Order disabled while calculating/undeliverable, Try again (summary + under button), server error messages. |
| `app/farmer/orders/[id].tsx` | Breakdown (subtotal, fee with km, total) + "delivery fee is yours" box (GCash vs COD). |
| `app/farmer/(tabs)/order.tsx` | List cards show subtotal + fee (km) + total. |
| `app/buyer/profile/order-details.tsx` | Buyer breakdown with km. |

---

## Barangay coordinates: missing / suspicious

`node data/build_barangay_data.js --check-only` →
**569 rows, 569 routable (564 verified/OSM + 5 approximate fallback), 0 missing, 0 suspicious, 0 duplicate keys.**

- **With coords (serviceable):** `Baliwag|Poblacion`, `Calumpit|Poblacion`,
  `Guiguinto|Poblacion`, `Hagonoy|Iba` (OSM place node, field-verify before
  production reliance), `Hagonoy|San Agustin`, `Hagonoy|Santo Niño (Pob.)`,
  `Malolos|Anilao` (OSM place node, field-verify before production reliance),
  `Malolos|Bulihan`, `Malolos|San Vicente (Pob.)`, `Malolos|Santo Niño (Pob.)`,
  `Meycauayan|Poblacion`, `Meycauayan|Ubihan` (OSM boundary, field-verify before
  production reliance), `San Jose del Monte|Poblacion`.
- **Missing (556 — delivery BLOCKED until field-verified, never guessed):** all of
  Angat (16), Balagtas (9), Bocaue (19), Bulakan (14), Bustos (14), Marilao (16),
  Norzagaray (13), Obando (11), Pandi (22), Paombong (14), Plaridel (19), Pulilan
  (19), San Ildefonso (36), San Miguel (49), San Rafael (34), Santa Maria (24),
  Dona Remedios Trinidad (8), plus the remaining barangays in the 10
  partially-covered cities. Full list via the check command (prints first 50).
- **Suspicious: none.** To add coords: fill `lat,lng` in the CSV → rerun
  `npm run build:barangays` → regenerate `constants/bulacanBarangays.ts`.

---

## Migration steps for existing farms

1. Deploy backend (push `index.js`, `walletRoutes.js`, `deliveryFee.js`, `data/`,
   `package.json`; `__tests__/` optional; `node_modules/` is gitignored and must
   NOT be pushed — Render runs its own `npm install`).
2. Set `FARMGATE_ROAD_DISTANCE_FACTOR=1.3` in the Render env dashboard (optional).
3. Run `npm run list:farms-missing-barangay` to list farmers without City/Barangay.
4. Each farmer opens **Farm Profile** → picks **City** then **Barangay** (province
   locked) → Saves. The amber banner shows until saved; delivery stays blocked
   for that farm until then.
5. Old orders are untouched (no-barangay → keep written fee, `tier='legacy'`).
6. Buyers with old free-text addresses that don't exactly match must re-pick from
   the dropdowns (exact match only, no fuzzy).
7. Test on real Firebase + Xendit sandbox: GCash accept→pay→deliver, COD
   accept→deliver, pickup, out-of-Bulacan reject. Do not release until green.
