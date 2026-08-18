import React, { useState, useEffect } from 'react';
import { Scene02Props, Scene02Phase } from './types';
import { scene02Config } from './scene02.config';
import { Scene02Video } from './Scene02Video';
import { Scene02Interaction } from './Scene02Interaction';

export const Scene02: React.FC<Scene02Props> = ({
  onComplete,
  isDevMode = false,
  phase: propPhase,
  onPhaseChange,
}) => {
  const [internalPhase, setInternalPhase] = useState<Scene02Phase>(propPhase || 'video');

  useEffect(() => {
    if (propPhase) {
      setInternalPhase(propPhase);
    }
  }, [propPhase]);

  const handleVideoComplete = () => {
    setInternalPhase('conversation');
    if (onPhaseChange) {
      onPhaseChange('conversation');
    }
  };

  const handleInteractionPhaseChange = (newPhase: Scene02Phase) => {
    setInternalPhase(newPhase);
    if (onPhaseChange) {
      onPhaseChange(newPhase);
    }
  };

  const currentPhase = internalPhase;

  return (
    <div className="w-full h-full flex-1 flex flex-col relative overflow-hidden">
      {currentPhase === 'video' ? (
        <Scene02Video
          videoSrc={scene02Config.video}
          onComplete={handleVideoComplete}
          isDevMode={isDevMode}
        />
      ) : (
        <Scene02Interaction
          onComplete={onComplete}
          isDevMode={isDevMode}
          phase={currentPhase}
          onPhaseChange={handleInteractionPhaseChange}
        />
      )}
    </div>
  );
};
