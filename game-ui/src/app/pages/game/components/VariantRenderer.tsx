import type { ComponentType } from 'react';
import { GAME_CONFIG } from '@config/game.config';
import type { GameVariant, GameVariantProps } from '@app/shared/models/game';
import ScratchCard from './ScratchCard';
import FlipCard from './FlipCard';

const VARIANT_MAP: Record<GameVariant, ComponentType<GameVariantProps>> = {
  'scratch-card': ScratchCard,
  'flip-card': FlipCard,
};

const VariantRenderer = (props: GameVariantProps) => {
  const Variant = VARIANT_MAP[GAME_CONFIG.activeVariant];
  return <Variant {...props} />;
};

export default VariantRenderer;
