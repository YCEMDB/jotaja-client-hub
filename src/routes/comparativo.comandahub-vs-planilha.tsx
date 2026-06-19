import { createFileRoute } from "@tanstack/react-router";
import { GeoPage, buildGeoHead } from "@/components/jotaja/GeoPage";
import { COMPARISON_PAGES } from "@/lib/geo-pages";

const data = COMPARISON_PAGES["planilha"];
export const Route = createFileRoute("/comparativo/comandahub-vs-planilha")({
  head: () => buildGeoHead(data),
  component: () => <GeoPage {...data} />,
});
