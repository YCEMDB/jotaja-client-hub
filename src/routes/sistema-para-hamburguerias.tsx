import { createFileRoute } from "@tanstack/react-router";
import { GeoPage, buildGeoHead } from "@/components/jotaja/GeoPage";
import { GEO_PAGES } from "@/lib/geo-pages";

const data = GEO_PAGES["sistema-para-hamburguerias"];
export const Route = createFileRoute("/sistema-para-hamburguerias")({
  head: () => buildGeoHead(data),
  component: () => <GeoPage {...data} />,
});
