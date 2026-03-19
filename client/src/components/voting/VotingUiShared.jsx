// Shared immersive voting UI pieces (PublicVotePage + InviteVotePage)
import React, { useState, useEffect } from "react";
import Lottie from "lottie-react";
import AppBrandLogo, { BRAND_NAME, PUBLIC_URL } from "../AppBrandLogo";

export { PUBLIC_URL } from "../AppBrandLogo";

/** Bundled success animation (public folder); avoids CDN dependency */
export const SUCCESS_LOTTIE_LOCAL = `${PUBLIC_URL}/lottie/vote-success.json`;

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

/** Navy / pink-tint avatar backgrounds (brand system, not random hues) */
export function nomineeAvatarClass(index) {
  return index % 2 === 0
    ? "ballot-avatar ballot-avatar--navy"
    : "ballot-avatar ballot-avatar--blush";
}

export function LogoHeader() {
  return (
    <div className="ballot-logo-wrap">
      <AppBrandLogo alt={BRAND_NAME} className="ballot-logo" />
    </div>
  );
}

function SuccessMarkFallback() {
  return (
    <div className="ballot-lottie-fallback" aria-hidden>
      <div className="ballot-success-mark">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M8 12l2.5 2.5L16 9"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

export function RemoteSuccessLottie() {
  const animationData = useRemoteLottie(SUCCESS_LOTTIE_LOCAL);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  if (reduceMotion || !animationData) {
    return <SuccessMarkFallback />;
  }
  return (
    <div className="ballot-lottie">
      <Lottie
        animationData={animationData}
        loop={false}
        style={{ width: "100%", maxHeight: 220 }}
      />
    </div>
  );
}
