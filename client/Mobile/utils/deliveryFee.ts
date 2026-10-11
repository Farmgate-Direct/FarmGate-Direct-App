// Client-side delivery fee helpers (preview only — NEVER trusted).
// The server recomputes the authoritative fee in /delivery/quote, /accept (COD)
// and /create-payment (GCash). Tier table MUST match farmgate-backend/deliveryFee.js.
export const FEE_TIERS: { maxKm: number; fee: number; label: string }[] = [
  { maxKm: 3.0, fee: 25, label: "0–3 km" },
  { maxKm: 6.0, fee: 35, label: "3.1–6 km" },
  { maxKm: 10.0, fee: 50, label: "6.1–10 km" },
  { maxKm: 15.0, fee: 65, label: "10.1–15 km" },
  { maxKm: 20.0, fee: 80, label: "15.1–20 km" },
  { maxKm: Infinity, fee: 100, label: "20.1 km+" },
];

export const feeForDistance = (distanceKm: number): { fee: number; tier: string } => {
  for (const t of FEE_TIERS) {
    if (distanceKm <= t.maxKm) return { fee: t.fee, tier: t.label };
  }
  const last = FEE_TIERS[FEE_TIERS.length - 1];
  return { fee: last.fee, tier: last.label };
};

export type DeliveryQuote = {
  deliveryFee: number;
  distanceKm: number | null;
  tier: string | null;
};

export type DeliveryQuoteError = {
  code?: string;
  message: string;
};

export const deliveryErrorMessage = (code?: string, fallback?: string): string => {
  let base: string;
  switch (code) {
    case "INVALID_PROVINCE":
      base = "Delivery is Bulacan-only. Pick a Bulacan address.";
      break;
    case "UNKNOWN_CITY":
      base = "Unknown city. Pick a Bulacan city from the list.";
      break;
    case "UNKNOWN_BARANGAY":
      base = "Unknown barangay in this city. Check the spelling and pick from the list.";
      break;
    case "BARANGAY_NOT_SERVICEABLE":
      base = "This barangay has no verified location yet, so delivery is blocked. Try another address.";
      break;
    case "FARM_MISSING_BARANGAY":
      base = "This farm has no barangay set yet, so delivery is blocked until the farmer updates their Farm Profile.";
      break;
    default:
      base = fallback || "Delivery is not available for this address.";
      break;
  }
  // The server message names the exact city/barangay and side (farm vs buyer).
  // Append it when it carries more detail than the generic line.
  if (fallback && fallback !== base && !base.includes(fallback)) {
    return `${base} (${fallback})`;
  }
  return base;
};

export const formatKm = (km: number | null | undefined): string =>
  km === null || km === undefined ? "—" : `${Number(km).toFixed(1)} km`;

export const formatPeso = (n: number | null | undefined): string =>
  `₱${Number(n || 0).toFixed(2)}`;
