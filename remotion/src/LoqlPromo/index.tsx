import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';

import { IntroScene } from './scenes/IntroScene';
import { ProblemScene } from './scenes/ProblemScene';
import { HowItWorksScene } from './scenes/HowItWorksScene';
import { HomeFeedScene } from './scenes/HomeFeedScene';
import { ItemDetailScene } from './scenes/ItemDetailScene';
import { ChatScene } from './scenes/ChatScene';
import { RentalsScene } from './scenes/RentalsScene';
import { WalletScene } from './scenes/WalletScene';
import { OutroScene } from './scenes/OutroScene';

const FPS = 30;
const TRANSITION_FRAMES = 15;

const scenes = [
  { component: IntroScene, duration: 3.5 * FPS },
  { component: ProblemScene, duration: 5.5 * FPS },
  { component: HowItWorksScene, duration: 4.5 * FPS },
  { component: HomeFeedScene, duration: 5 * FPS },
  { component: ItemDetailScene, duration: 4.5 * FPS },
  { component: RentalsScene, duration: 4 * FPS },
  { component: ChatScene, duration: 4 * FPS },
  { component: WalletScene, duration: 4.5 * FPS },
  { component: OutroScene, duration: 4.5 * FPS },
];

const transitions: Array<{
  type: 'fade' | 'slide-left' | 'slide-right' | 'slide-up';
}> = [
  { type: 'fade' },
  { type: 'fade' },
  { type: 'slide-left' },
  { type: 'slide-up' },
  { type: 'slide-left' },
  { type: 'slide-left' },
  { type: 'fade' },
  { type: 'fade' },
];

function getPresentation(type: string) {
  switch (type) {
    case 'slide-left':
      return slide({ direction: 'from-right' });
    case 'slide-right':
      return slide({ direction: 'from-left' });
    case 'slide-up':
      return slide({ direction: 'from-bottom' });
    default:
      return fade();
  }
}

export const LoqlPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#FAFAFA' }}>
      <TransitionSeries>
        {scenes.map((scene, i) => {
          const SceneComponent = scene.component;
          const elements = [];

          elements.push(
            <TransitionSeries.Sequence
              key={`scene-${i}`}
              durationInFrames={Math.round(scene.duration)}
            >
              <SceneComponent />
            </TransitionSeries.Sequence>
          );

          if (i < scenes.length - 1 && transitions[i]) {
            elements.push(
              <TransitionSeries.Transition
                key={`trans-${i}`}
                presentation={getPresentation(transitions[i].type)}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />
            );
          }

          return elements;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
