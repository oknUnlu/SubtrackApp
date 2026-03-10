import React from "react";
import Svg, { Rect, Path, G, Text as SvgText } from "react-native-svg";

type AppLogoProps = {
  size?: number;
  showText?: boolean;
  colors?: {
    primary?: string;
    text?: string;
  };
};

/**
 * SubTrack App Logo
 * Green rounded-square background + white stylized "S" arrow mark
 * Same design is replicated in scripts/generate-icons.js for PNG asset generation
 */
export default function AppLogo({
  size = 48,
  showText = false,
  colors,
}: AppLogoProps) {
  const primary = colors?.primary ?? "#22c55e";
  const textColor = colors?.text ?? "#222";

  const viewBoxWidth = showText ? 290 : 100;
  const width = showText ? (size * viewBoxWidth) / 100 : size;

  return (
    <Svg
      width={width}
      height={size}
      viewBox={`0 0 ${viewBoxWidth} 100`}
    >
      {/* Green rounded-square background */}
      <Rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill={primary} />

      {/* White stylized "S" arrow — representing subscription tracking */}
      <G>
        {/* Top arrow curve (right-pointing) */}
        <Path
          d="M 35 25 C 50 25, 68 28, 68 42 C 68 52, 55 55, 45 55"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Top arrowhead */}
        <Path
          d="M 50 48 L 43 55 L 50 62"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Bottom arrow curve (left-pointing) */}
        <Path
          d="M 65 75 C 50 75, 32 72, 32 58 C 32 48, 45 45, 55 45"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Bottom arrowhead */}
        <Path
          d="M 50 38 L 57 45 L 50 52"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>

      {/* Optional "SubTrack" text */}
      {showText && (
        <SvgText
          x="115"
          y="64"
          fontSize="34"
          fontWeight="800"
          fill={textColor}
        >
          SubTrack
        </SvgText>
      )}
    </Svg>
  );
}

/**
 * Standalone SVG XML string for PNG generation (used by scripts/generate-icons.js)
 * Must stay visually in sync with the React component above.
 */
export const LOGO_SVG_MARK = `
  <rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill="#22c55e" />
  <g>
    <path d="M 35 25 C 50 25, 68 28, 68 42 C 68 52, 55 55, 45 55" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" />
    <path d="M 50 48 L 43 55 L 50 62" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 65 75 C 50 75, 32 72, 32 58 C 32 48, 45 45, 55 45" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" />
    <path d="M 50 38 L 57 45 L 50 52" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
  </g>
`;
