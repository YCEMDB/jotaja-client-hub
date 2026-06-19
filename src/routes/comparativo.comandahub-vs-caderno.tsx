import { createFileRoute } from "@tanstack/react-router";
import { GeoPage, buildGeoHead } from "@/components/jotaja/GeoPage";
import { COMPARISON_PAGES } from "@/lib/geo-pages";

const data = COMPARISON_PAGES["caderno"];
export const Route = createFileRoute("/comparativo/comandahub-vs-caderno")({
  head: () => buildGeoHead(data),
  component: () => <GeoPage {...data} />,
});
