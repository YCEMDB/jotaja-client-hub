import { createFileRoute } from "@tanstack/react-router";
import { GeoPage, buildGeoHead } from "@/components/jotaja/GeoPage";
import { GEO_PAGES } from "@/lib/geo-pages";

const data = GEO_PAGES["gestao-de-restaurantes"];
export const Route = createFileRoute("/gestao-de-restaurantes")({
  head: () => buildGeoHead(data),
  component: () => <GeoPage {...data} />,
});
