import type { Metadata } from "next";
import React from "react";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const isIdeal = slug.toLowerCase().includes("ideal");

  if (isIdeal) {
    const title = "New Ideal Public School Mathura | Best CBSE School in Mathura | Official Website";
    const description =
      "New Ideal Public School (न्यू आइडियल पब्लिक स्कूल) is a premier CBSE affiliated institution (Affiliation No. CBSE-AFF-2130894) in Mathura, UP located at Shankar Gali Dauli Pyau. Admissions Open 2026-27 for Nursery to Class 12. Smart digital classrooms, STEM robotics lab, safe bus transport & parent mobile app.";
    const keywords = [
      "New Ideal Public School Mathura",
      "न्यू आइडियल पब्लिक स्कूल मथुरा",
      "Best school in Mathura",
      "Top school in Mathura",
      "CBSE schools in Mathura",
      "Best CBSE school in Mathura",
      "Top 10 schools in Mathura",
      "School in Dauli Pyau Mathura",
      "New Ideal School Mathura Admission 2026-27",
      "English medium school Mathura",
      "Hindi medium CBSE school Mathura",
      "School with mobile app Mathura",
      "Shankar Gali Dauli Pyau school",
    ];

    return {
      title,
      description,
      keywords,
      authors: [{ name: "New Ideal Public School" }],
      creator: "Dakshora School Platform",
      publisher: "Dakshora Technologies",
      metadataBase: new URL("https://www.dakshora.co.in"),
      alternates: {
        canonical: `/school/${slug}`,
      },
      openGraph: {
        title,
        description,
        url: `https://www.dakshora.co.in/school/${slug}`,
        siteName: "New Ideal Public School Mathura",
        locale: "hi_IN",
        type: "website",
        images: [
          {
            url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&h=630&fit=crop",
            width: 1200,
            height: 630,
            alt: "New Ideal Public School Mathura Smart Campus",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&h=630&fit=crop"],
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
  }

  const formattedName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${formattedName} | Official Smart School Website & ERP Portal`,
    description: `Official campus portal and CBSE academic management website for ${formattedName}. Online admissions, circulars, parent mobile app, and institutional ERP login.`,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function SchoolLayout({ children, params }: Props) {
  const { slug } = await params;
  const isIdeal = slug.toLowerCase().includes("ideal");

  const jsonLd = isIdeal
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": ["School", "EducationalOrganization", "LocalBusiness"],
            "@id": "https://www.dakshora.co.in/school/new-ideal-public-school#school",
            name: "New Ideal Public School",
            alternateName: [
              "New Ideal Public School Mathura",
              "न्यू आइडियल पब्लिक स्कूल",
              "न्यू आइडियल पब्लिक स्कूल मथुरा",
              "NIPS Mathura",
            ],
            url: "https://www.dakshora.co.in/school/new-ideal-public-school",
            logo: "https://www.dakshora.co.in/logo.svg",
            image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200",
            description:
              "New Ideal Public School is a premier CBSE affiliated institution in Mathura, Uttar Pradesh, offering smart classrooms, STEM robotics labs, sports excellence, and holistic bilingual education from Nursery to Class 12.",
            telephone: "+91-8529575588",
            email: "contact@newidealpublicschool.edu.in",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Shankar Gali Dauli Pyau",
              addressLocality: "Mathura",
              addressRegion: "Uttar Pradesh",
              postalCode: "281001",
              addressCountry: "IN",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: 27.4924,
              longitude: 77.6737,
            },
            areaServed: [
              {
                "@type": "AdministrativeArea",
                name: "Mathura",
              },
              {
                "@type": "AdministrativeArea",
                name: "Uttar Pradesh",
              },
            ],
            hasCredential: {
              "@type": "EducationalOccupationalCredential",
              name: "CBSE Affiliation",
              credentialCategory: "CBSE Board Affiliation Number: CBSE-AFF-2130894",
              recognizedBy: {
                "@type": "EducationalOrganization",
                name: "Central Board of Secondary Education (CBSE)",
              },
            },
            priceRange: "₹₹",
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                opens: "07:30",
                closes: "14:30",
              },
            ],
            sameAs: [
              "https://www.dakshora.co.in/new-ideal-public-school",
              "https://www.dakshora.co.in/portal?school=new-ideal-public-school",
            ],
          },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
