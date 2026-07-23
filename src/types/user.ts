/** A points/miles balance the user holds in a specific loyalty program. */
export type WalletKind = "credit-card" | "airline" | "hotel";

export type WalletEntry = {
  id: string;
  /** Loyalty program / currency, e.g. "Chase Ultimate Rewards", "United MileagePlus". */
  program: string;
  /** Current balance in points/miles. */
  balance: number;
  kind: WalletKind;
};

export type User = {
  id: string;
  email: string;
  password: string;
  username: string;
  avatarUrl: string;
  /** Amex Membership Rewards balance (first-class field, kept for back-compat). */
  amexPoints: number;
  /** Air Canada Aeroplan balance (first-class field, kept for back-compat). */
  aeroplanPoints: number;
  /** Additional loyalty balances the user has added (cards, airlines, hotels). */
  wallet?: WalletEntry[];
  /** Home / preferred departure airport(s), e.g. "YYZ, JFK". */
  homeAirports?: string;
  /** Free-text travel preferences: cabin class, favourite airlines, flexibility. */
  travelPreferences?: string;
  updatedAt: string; // ISO 8601 string
};
