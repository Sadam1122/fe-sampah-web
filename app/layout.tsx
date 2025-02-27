import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Konfigurasi metadata SEO untuk SobatSampah
export const metadata = {
  title: "SobatSampah - Solusi Pengelolaan Sampah Terbaik",
  description:
    "SobatSampah menyediakan solusi pengelolaan sampah yang inovatif dan profesional untuk perusahaan besar, dengan pendekatan ramah lingkungan dan teknologi canggih.",
  keywords: [
    "pengelolaan sampah",
    "waste management",
    "solusi sampah",
    "inovatif",
    "profesional",
    "ramah lingkungan",
    "SobatSampah",
  ],
  openGraph: {
    title: "SobatSampah - Solusi Pengelolaan Sampah Terbaik",
    description:
      "SobatSampah adalah perusahaan pengelolaan sampah terdepan yang menyediakan solusi inovatif dan profesional untuk pengelolaan sampah perusahaan besar.",
    url: "https://sobatsampah.id",
    siteName: "SobatSampah",
    images: [
      {
        url: "https://sobatsampah.id/favicon.png",
        width: 1200,
        height: 630,
        alt: "SobatSampah - Solusi Pengelolaan Sampah",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@sobatsampah",
    title: "SobatSampah - Solusi Pengelolaan Sampah Terbaik",
    description:
      "SobatSampah adalah perusahaan pengelolaan sampah terdepan dengan solusi inovatif, profesional, dan ramah lingkungan.",
    images: ["https://sobatsampah.id/favicon.png"],
  },
  alternates: {
    canonical: "https://sobatsampah.id",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="https://sobatsampah.id/favicon.png"
          type="image/png"
        />
        <link
          rel="apple-touch-icon"
          href="https://sobatsampah.id/favicon.png"
        />
        {/* Structured Data untuk Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "SobatSampah",
              url: "https://sobatsampah.id",
              logo: "https://sobatsampah.id/logo.png",
              description:
                "SobatSampah adalah perusahaan pengelolaan sampah terdepan yang menyediakan solusi inovatif, profesional, dan ramah lingkungan.",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+62-XXX-XXX-XXX",
                contactType: "customer service",
                areaServed: "ID",
                availableLanguage: ["Indonesian", "English"],
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
