type TripNestLogoProps = {
  size?: "compact" | "default";
};

const heights = {
  compact: 48,
  default: 64,
} as const;

export function TripNestLogo({ size = "default" }: TripNestLogoProps) {
  return (
    <img
      src="/branding/tripnest-logo.png"
      alt="TripNest logo"
      width={heights[size] * 2}
      height={heights[size]}
      style={{ height: heights[size], width: "auto" }}
    />
  );
}
