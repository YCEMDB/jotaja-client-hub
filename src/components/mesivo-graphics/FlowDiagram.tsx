import { ConnectionNode } from "./ConnectionNode";
import { FlowLine } from "./FlowLine";

/**
 * FlowDiagram — diagrama compacto do fluxo operacional Mesivo.
 * Pedido → Cozinha → Retirada/Entrega → Concluído.
 * Layout responsivo (empilha em telas estreitas).
 */
export function FlowDiagram({ className }: { className?: string }) {
  return (
    <div
      className={className}
      role="img"
      aria-label="Fluxo: pedido, cozinha, entrega e concluído"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
      }}
    >
      <ConnectionNode label="Pedido" tone="orange" />
      <FlowLine length={40} />
      <ConnectionNode label="Cozinha" tone="mango" />
      <FlowLine length={40} />
      <ConnectionNode label="Entrega" tone="leaf" />
      <FlowLine length={40} />
      <ConnectionNode label="Concluído" tone="coffee" />
    </div>
  );
}
