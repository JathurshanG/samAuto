import type { Metadata } from "next";
import { Header, Footer } from "@/components/shell";
import { siteUrl } from "@/config/site";
import "./globals.css";
import { Consent } from "@/features/analytics/tracking";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SamAuto | Véhicules d’occasion & atelier",
    template: "%s | SamAuto",
  },
  description:
    "Consultez les véhicules disponibles, demandez une reprise ou contactez l’atelier.",
  robots: { index: true, follow: true },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <main id="contenu">{children}</main>
        <Consent />
        <Footer />
      </body>
    </html>
  );
}
