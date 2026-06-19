import { createFileRoute } from "@tanstack/react-router";
import { GeoPage, buildGeoHead } from "@/components/jotaja/GeoPage";
import { GEO_PAGES } from "@/lib/geo-pages";

const data = GEO_PAGES["controle-de-mesas"];
export const Route = createFileRoute("/controle-de-mesas")({
  head: () => buildGeoHead(data),
  component: () => <GeoPage {...data} />,
});
