import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { LoqlPromo } from './LoqlPromo';

const FPS = 30;
const TRANSITION_FRAMES = 15;

const sceneDurations = [3.5, 5.5, 4.5, 5, 4.5, 4, 4, 4.5, 4.5];
const totalSceneFrames = sceneDurations.reduce((sum, d) => sum + d * FPS, 0);
const totalTransitionOverlap = (sceneDurations.length - 1) * TRANSITION_FRAMES;
const totalDuration = Math.round(totalSceneFrames - totalTransitionOverlap);

const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="LoqlPromo"
      component={LoqlPromo}
      durationInFrames={totalDuration}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};

registerRoot(RemotionRoot);
