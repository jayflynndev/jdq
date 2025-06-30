"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdBanner() {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Only push adsbygoogle if the current ad hasn't already loaded
    if (adRef.current && adRef.current.innerHTML.trim().length === 0) {
      try {
        // Push a new ad into this container
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("Adsense error:", e);
      }
    }
  }, []);

  return (
    <>
      <Script
        id="adsense-script"
        strategy="afterInteractive"
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
        crossOrigin="anonymous"
      />
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center", margin: "20px 0" }}
        data-ad-client="ca-pub-1521571031670829"
        data-ad-slot="8714079408"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </>
  );
}
