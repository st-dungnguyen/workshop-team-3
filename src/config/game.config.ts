import type { GameConfig, GameVariant } from '@app/shared/models/game';

const KNOWN_VARIANTS: GameVariant[] = ['scratch-card', 'flip-card'];

const rawVariant = import.meta.env.VITE_GAME_VARIANT ?? 'scratch-card';

if (!KNOWN_VARIANTS.includes(rawVariant as GameVariant)) {
  throw new Error(
    `[game.config] Unknown game variant: "${rawVariant}". ` +
      `Valid options: ${KNOWN_VARIANTS.join(', ')}`,
  );
}

export const GAME_CONFIG: GameConfig = {
  activeVariant: rawVariant as GameVariant,
  campaignId: import.meta.env.VITE_CAMPAIGN_ID ?? '',
};
