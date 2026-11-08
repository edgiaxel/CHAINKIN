import React from "react";
import { Composition } from "remotion";
import { Demo } from "./Demo";

export const Root: React.FC = () => {
  return (
    <Composition
      id="Demo"
      component={Demo}
      durationInFrames={2700} // 90.0 seconds at 30 fps (matches 88.5s voiceover + outro)
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
