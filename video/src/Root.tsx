import React from "react";
import { Composition } from "remotion";
import { Demo } from "./Demo";

export const Root: React.FC = () => {
  return (
    <Composition
      id="Demo"
      component={Demo}
      durationInFrames={2400} // 80 seconds at 30 fps
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
