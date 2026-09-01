import React from "react";
import { Scene05Game } from "./Scene05Game";

interface Scene05Props {
  onComplete?: () => void;
  isDevMode?: boolean;
}

export const Scene05: React.FC<Scene05Props> = () => {
  return (
    <div
      className="
      w-full
      h-full
      relative
      overflow-hidden
      "
    >
      <Scene05Game />
    </div>
  );
};