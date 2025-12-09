
import React from 'react';
import { Student, PresentationMode } from '../../types';
import { SimpleVisualizer, SlotVisualizer, BoxVisualizer, SpotlightVisualizer } from './StandardModes';
import { WheelVisualizer, RaceVisualizer, GalaxyVisualizer, ClawMachineVisualizer } from './PhysicsModes';
import { GridEliminationVisualizer, FlipVisualizer, LuckyCardsVisualizer } from './GridModes';
import { DiceVisualizer, EggHatchVisualizer } from './InteractiveModes';

interface VisualizerProps {
  candidates: Student[];
  winner: Student;
  mode: PresentationMode;
  duration: number; // seconds
  onComplete: () => void;
}

export const VisualizationContainer: React.FC<VisualizerProps> = (props) => {
  switch (props.mode) {
    case PresentationMode.RACE: return <RaceVisualizer {...props} />;
    case PresentationMode.WHEEL: return <WheelVisualizer {...props} />;
    case PresentationMode.SLOT: return <SlotVisualizer {...props} />;
    case PresentationMode.BOX: return <BoxVisualizer {...props} />;
    case PresentationMode.SPOTLIGHT: return <SpotlightVisualizer {...props} />;
    case PresentationMode.GRID_ELIMINATION: return <GridEliminationVisualizer {...props} />;
    case PresentationMode.FLIP: return <FlipVisualizer {...props} />;
    case PresentationMode.GALAXY: return <GalaxyVisualizer {...props} />;
    case PresentationMode.CLAW_MACHINE: return <ClawMachineVisualizer {...props} />;
    case PresentationMode.LUCKY_CARDS: return <LuckyCardsVisualizer {...props} />;
    case PresentationMode.DICE: return <DiceVisualizer {...props} />;
    case PresentationMode.EGG_HATCH: return <EggHatchVisualizer {...props} />;
    case PresentationMode.SIMPLE:
    default: return <SimpleVisualizer {...props} />;
  }
};
