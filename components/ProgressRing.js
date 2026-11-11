import React from 'react';
import { Svg, Circle } from '../platform/svg';

export default function ProgressRing( props ) {
  const size = props.size || 64;
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2 - 1;

  // Calculate the circumference of the circle
  const circumference = radius * 2 * Math.PI;

  // Calculate the progress in degrees
  const progressDegrees = (props.progress/100) * 360;

  // Calculate the dash offset to create a progress ring
  const dashOffset = circumference - (progressDegrees / 360) * circumference;

  return (
    <Svg width={size} height={size} style={{ transform: 'scaleX(-1) rotate(-90deg)' }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        stroke="#808080" // color of the progress ring
        fill="transparent"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        stroke={props.theme.primary} // color of the progress
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        fill="transparent"
      />
    </Svg>
  );
};
