import type { ComponentType } from 'react';
import type { GameVariant, GameVariantProps } from '@app/shared/models/game';
import ScratchCard from './ScratchCard';
import FlipCard from './FlipCard';

const VARIANT_MAP: Record<GameVariant, ComponentType<GameVariantProps>> = {
  'scratch-card': ScratchCard,
  'flip-card': FlipCard,
};

interface VariantRendererProps extends GameVariantProps {
  variant: GameVariant;
}

const VariantRenderer = ({ variant, ...props }: VariantRendererProps) => {
  const Variant = VARIANT_MAP[variant];
  return <Variant {...props} />;
};

export default VariantRenderer;
