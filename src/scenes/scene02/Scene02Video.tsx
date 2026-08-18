import React from 'react';
import { IntroductionVideo } from '../../components/story/IntroductionVideo';

interface Scene02VideoProps {
  videoSrc: string;
  onComplete: () => void;
  isDevMode?: boolean;
}

export const Scene02Video: React.FC<Scene02VideoProps> = ({
  videoSrc,
  onComplete,
  isDevMode = false,
}) => {
  return (
    <IntroductionVideo
      videoSrc={videoSrc}
      onVideoComplete={onComplete}
      isDevMode={isDevMode}
    />
  );
};
