import { createFileRoute } from "@tanstack/react-router";
import { GeoPage, buildGeoHead } from "@/components/jotaja/GeoPage";
import { GEO_PAGES } from "@/lib/geo-pages";

const data = GEO_PAGES["sistema-de-comandas-digitais"];
export const Route = createFileRoute("/sistema-de-comandas-digitais")({
  head: () => buildGeoHead(data),
  component: () => <GeoPage {...data} />,
});
