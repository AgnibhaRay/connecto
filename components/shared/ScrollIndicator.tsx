export default function ScrollIndicator({
  light = false,
}: {
  light?: boolean;
}) {
  const color = light ? "#ffffff" : "#000000";

  return (
    <div className={`scroll-badge ${light ? "scroll-badge-light" : ""}`} aria-hidden>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="0.6" />
        <g className="scroll-badge-rotate origin-center">
          <path id="scroll-circle" d="M50,50 m-32,0 a32,32 0 1,1 64,0 a32,32 0 1,1 -64,0" fill="none" />
          <text fill={color} fontSize="8.5" letterSpacing="2.4" fontFamily="inherit">
            <textPath href="#scroll-circle">SCROLL DOWN · SCROLL DOWN ·</textPath>
          </text>
        </g>
      </svg>
    </div>
  );
}
