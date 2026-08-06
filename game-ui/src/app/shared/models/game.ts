export type GameVariant = 'scratch-card' | 'flip-card';

export type SessionState =
  | 'pending'
  | 'initiated'
  | 'resolving'
  | 'revealing'
  | 'completed';

export type GameOutcome = 'win' | 'lose';

export interface CouponInfo {
  id: string;
  title: string;
  discount: string; // display value e.g. "500円OFF"
  endDate: string; // ISO8601 UTC
}

export interface GameVariantProps {
  outcome: GameOutcome | null;
  coupon: CouponInfo | null;
  sessionState: SessionState;
  onPlayInitiated: () => void;
  onAnimationComplete: () => void;
}

export interface PlayResult {
  outcome: GameOutcome;
  coupon?: CouponInfo; // present when outcome === 'win'
}

export interface EligibilityResult {
  eligible: boolean;
  nextPlayAt: string | null;
}

export interface GameConfig {
  activeVariant: GameVariant;
  campaignId: string;
}
