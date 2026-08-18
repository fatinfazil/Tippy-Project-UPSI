import React from 'react';

interface InteractionLayerProps {
  isInteractive: boolean;
  children?: React.ReactNode;
}

export const InteractionLayer: React.FC<InteractionLayerProps> = ({
  isInteractive,
  children,
}) => {
  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center transition-all ${
        isInteractive ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {children}
    </div>
  );
};
