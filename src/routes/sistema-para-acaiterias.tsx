import { createFileRoute } from "@tanstack/react-router";
import { GeoPage, buildGeoHead } from "@/components/jotaja/GeoPage";
import { GEO_PAGES } from "@/lib/geo-pages";

const data = GEO_PAGES["sistema-para-acaiterias"];
export const Route = createFileRoute("/sistema-para-acaiterias")({
  head: () => buildGeoHead(data),
  component: () => <GeoPage {...data} />,
});
