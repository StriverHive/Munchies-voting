/**
 * Official app branding — use everywhere the Munchies logo should appear.
 * Respects CRA `PUBLIC_URL` for subpath deploys.
 */
import React from "react";

export const PUBLIC_URL = process.env.PUBLIC_URL || "";

/** Absolute URL/path to the official logo in `public/` */
export const BRAND_LOGO_SRC = `${PUBLIC_URL}/munchies-logo.png`;

export const BRAND_NAME = "Munchies Voting";

/**
 * @param {object} props
 * @param {string} [props.alt]
 * @param {React.CSSProperties} [props.style]
 * @param {string} [props.className]
 */
export default function AppBrandLogo({
  alt = BRAND_NAME,
  className,
  style,
  ...rest
}) {
  return (
    <img
      src={BRAND_LOGO_SRC}
      alt={alt}
      className={className}
      style={{
        objectFit: "contain",
        display: "block",
        ...style,
      }}
      {...rest}
    />
  );
}
