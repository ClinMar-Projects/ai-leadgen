import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";

/**
 * Define basic metadata for the application.  The site name can be
 * overridden via environment variables.  This allows the same code
 * base to be deployed under multiple brands.
 */
export const metadata: Metadata = {
  title: process.env.SITE_NAME || "Olivia — PT Advisor",
  description: "Ask questions and get instant answers",
};

/**
 * The root layout wraps all pages.  It sets up global styling and
 * provides a container for the main content.  Child components are
 * rendered within the main element.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Google Tag Manager / Google Ads tracking */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-11236557184"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-11236557184');
          `}
        </Script>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}