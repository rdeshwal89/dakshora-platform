import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DakshOra | From Skills to Opportunities",
  description:
    "DakshOra is an AI-powered human potential platform helping people discover, learn, build, prove, solve and earn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (!('serviceWorker' in navigator) || !window.location.protocol.startsWith('http')) return;
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    setInterval(function() { registration.update().catch(function() {}); }, 45 * 1000);
                    document.addEventListener('visibilitychange', function() {
                      if (document.visibilityState === 'visible') registration.update().catch(function() {});
                    });
                    window.addEventListener('focus', function() { registration.update().catch(function() {}); });
                    registration.addEventListener('updatefound', function() {
                      var newWorker = registration.installing;
                      if (!newWorker) return;
                      newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                      });
                    });
                  }).catch(function() {});
                  var refreshing = false;
                  navigator.serviceWorker.addEventListener('controllerchange', function() {
                    if (!refreshing) {
                      refreshing = true;
                      window.location.reload();
                    }
                  });
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}