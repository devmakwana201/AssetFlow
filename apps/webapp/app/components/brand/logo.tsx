import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  /** Color of the typography */
  typeColor?: string;
  /** Background color of the icon */
  iconBgColor?: string;
  /** Icon foreground color */
  iconFgColor?: string;
};

const ShelfLogo = ({
  typeColor = "#111827",
  iconBgColor = "#ff7809",
  iconFgColor = "#ffffff",
  ...rest
}: Props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={rest.width || 220}
    height={rest.height || 56}
    viewBox="0 0 220 56"
    preserveAspectRatio="xMidYMid meet"
    aria-label="AssetFlow logo"
    {...rest}
  >
    {/* ── Icon: rounded square with flow arrows ── */}
    <rect x="0" y="0" width="56" height="56" rx="12" fill={iconBgColor} />

    {/* A stylised "AF" flow mark — three stacked bars that taper (asset in → out) */}
    {/* Top bar */}
    <rect x="10" y="12" width="24" height="6" rx="3" fill={iconFgColor} />
    {/* Middle bar — wider, with arrow tip */}
    <rect x="10" y="25" width="32" height="6" rx="3" fill={iconFgColor} />
    {/* Arrow head on middle bar */}
    <polygon points="44,28 38,22 38,34" fill={iconFgColor} />
    {/* Bottom bar */}
    <rect x="10" y="38" width="20" height="6" rx="3" fill={iconFgColor} />

    {/* ── Wordmark: AssetFlow ── */}
    <text
      x="68"
      y="37"
      fontFamily="'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
      fontWeight="700"
      fontSize="24"
      letterSpacing="-0.5"
      fill={typeColor}
    >
      <tspan fill={iconBgColor}>Asset</tspan>
      <tspan fill={typeColor}>Flow</tspan>
    </text>
  </svg>
);

export default ShelfLogo;
