import React from "react";

export interface TwinOrbitProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number;
  duration?: string;
  color?: string;
  secondaryColor?: string;
}

export function TwinOrbit({
  size = 15,
  duration = "1.1s",
  color = "#453F8C",
  secondaryColor = "#746FB9",
  className = "",
  style,
  ...props
}: TwinOrbitProps) {
  const numericSize = typeof size === "number" ? size : 15;

  return (
    <>
      <style>{`
        @keyframes loading-ui-twin-orbit-rotate {
          0% {
            transform: rotate(0deg) translate(155%);
          }
          100% {
            transform: rotate(360deg) translate(155%);
          }
        }
      `}</style>
      <span
        role="status"
        aria-label="Loading"
        className={className}
        style={{
          position: "relative",
          display: "inline-block",
          width: `${numericSize}px`,
          height: `${numericSize}px`,
          borderRadius: "50%",
          backgroundColor: color,
          verticalAlign: "middle",
          boxShadow: "0 0 10px rgba(69, 63, 140, 0.4)",
          ...style,
        }}
        {...props}
      >
        {/* Orbit Marker 1 */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: color,
            transform: "rotate(0deg) translate(155%)",
            transformOrigin: "center center",
            animation: `loading-ui-twin-orbit-rotate ${duration} ease infinite`,
            boxShadow: "0 0 8px rgba(69, 63, 140, 0.3)",
          }}
        />

        {/* Orbit Marker 2 (Half-cycle offset) */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: secondaryColor || color,
            transform: "rotate(0deg) translate(155%)",
            transformOrigin: "center center",
            animation: `loading-ui-twin-orbit-rotate ${duration} ease infinite`,
            animationDelay: `calc(${duration} / 2)`,
            boxShadow: "0 0 8px rgba(116, 111, 185, 0.3)",
          }}
        />

        {/* Hidden screen-reader text */}
        <span
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: 0,
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          Loading
        </span>
      </span>
    </>
  );
}

export default TwinOrbit;
