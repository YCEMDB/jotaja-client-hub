import { FlowLine } from "./FlowLine";

type FlowLinesProps = {
  count?: number;
  gap?: number;
  className?: string;
};

/** FlowLines — grupo de FlowLine paralelos. */
export function FlowLines({ count = 3, gap = 12, className }: FlowLinesProps) {
  return (
    <div
      className={className}
      style={{ display: "inline-flex", flexDirection: "column", gap }}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <FlowLine key={i} />
      ))}
    </div>
  );
}
