// Shared immersive voting UI pieces (PublicVotePage + InviteVotePage)
import React, { useState, useEffect } from "react";
import Lottie from "lottie-react";
import AppBrandLogo, { BRAND_NAME } from "../AppBrandLogo";

export { PUBLIC_URL } from "../AppBrandLogo";

/** Lottie: success (CDN); falls back to CSS checkmark if fetch/CORS fails */
export const SUCCESS_LOTTIE_URL =
  "https://assets9.lottiefiles.com/packages/lf20_aEFaHc.json";

export function useRemoteLottie(url) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return data;
}

export function initials(firstName, lastName) {
  const a = (firstName || "?").trim().charAt(0);
  const b = (lastName || "").trim().charAt(0);
  return (a + (b || a)).toUpperCase().slice(0, 2);
}

export function hueFromString(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) {
    h = s.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h) % 360;
}

export function LogoHeader() {
  return (
    <div className="pv-logo-wrap">
      <AppBrandLogo alt={BRAND_NAME} className="pv-logo" />
    </div>
  );
}

export function RemoteSuccessLottie() {
  const animationData = useRemoteLottie(SUCCESS_LOTTIE_URL);
  if (!animationData) {
    return (
      <div className="pv-lottie-fallback" aria-hidden>
        <div className="pv-success-icon">✓</div>
      </div>
    );
  }
  return (
    <div className="pv-success-lottie">
      <Lottie
        animationData={animationData}
        loop={false}
        style={{ width: "100%", maxHeight: 200 }}
      />
    </div>
  );
}
