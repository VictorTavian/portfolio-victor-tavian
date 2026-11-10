'use client';

import Script from 'next/script';

// site.js carrega o three.js (cdnjs) e depois a galeria, nessa ordem.
export default function SiteScripts() {
  return <Script src="/js/site.js" strategy="afterInteractive" />;
}
