'use client';

import Script from 'next/script';

interface JsonLdProps {
    data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
    return (
        <Script id="json-ld" type="application/ld+json" strategy="afterInteractive">
            {JSON.stringify(data)}
        </Script>
    );
} 