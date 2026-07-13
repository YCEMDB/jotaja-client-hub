/**
 * Dados demonstrativos para os mockups Mesivo.
 * NENHUM DADO REAL. Nenhuma prova comercial, nenhum cliente verdadeiro,
 * nenhum número de venda ou avaliação.
 */

export type DemoOrder = {
  id: string;
  code: string;
  customer: string;
  items: string;
  total: string;
  status: "novo" | "produzindo" | "pronto" | "entregue";
};

export const DEMO_ORDERS: DemoOrder[] = [
  {
    id: "d1",
    code: "#241",
    customer: "Cliente Balcão",
    items: "1x Combo Demo",
    total: "R$ 42,90",
    status: "novo",
  },
  {
    id: "d2",
    code: "#242",
    customer: "Cliente Mesa 04",
    items: "2x Pizza Demo",
    total: "R$ 89,80",
    status: "produzindo",
  },
  {
    id: "d3",
    code: "#243",
    customer: "Cliente Delivery",
    items: "1x Burger Demo",
    total: "R$ 34,50",
    status: "pronto",
  },
  {
    id: "d4",
    code: "#244",
    customer: "Cliente Retirada",
    items: "3x Bebida Demo",
    total: "R$ 21,00",
    status: "entregue",
  },
];

export type DemoMenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
};

export const DEMO_MENU: DemoMenuItem[] = [
  {
    id: "m1",
    name: "Prato Demonstração 1",
    description: "Ingredientes demonstrativos, sem preço real.",
    price: "R$ 29,90",
  },
  {
    id: "m2",
    name: "Prato Demonstração 2",
    description: "Somente para visualização de layout.",
    price: "R$ 34,90",
  },
  {
    id: "m3",
    name: "Prato Demonstração 3",
    description: "Conteúdo fictício para prototipagem.",
    price: "R$ 39,90",
  },
];

export type DemoTable = {
  id: string;
  number: number;
  status: "livre" | "ocupada" | "aguardando";
  ticket?: string;
};

export const DEMO_TABLES: DemoTable[] = [
  { id: "t1", number: 1, status: "livre" },
  { id: "t2", number: 2, status: "ocupada", ticket: "R$ 78,50" },
  { id: "t3", number: 3, status: "aguardando", ticket: "R$ 24,00" },
  { id: "t4", number: 4, status: "ocupada", ticket: "R$ 132,00" },
  { id: "t5", number: 5, status: "livre" },
  { id: "t6", number: 6, status: "ocupada", ticket: "R$ 46,00" },
];

export const DEMO_KDS = [
  { id: "k1", ticket: "#241", time: "00:42", items: ["1x Combo Demo", "1x Bebida Demo"] },
  { id: "k2", ticket: "#242", time: "01:15", items: ["2x Pizza Demo"] },
  { id: "k3", ticket: "#243", time: "02:08", items: ["1x Burger Demo", "1x Batata Demo"] },
];

export const DEMO_CASH = {
  aberto: "R$ 350,00 (valor demonstrativo)",
  entradas: [
    { label: "Dinheiro", value: "R$ 240,00" },
    { label: "Pix", value: "R$ 512,30" },
    { label: "Cartão", value: "R$ 189,90" },
  ],
  saidas: [{ label: "Fornecedor demo", value: "R$ 68,00" }],
  saldo: "R$ 1.224,20 (demonstrativo)",
};

export const DEMO_REPORT_ROWS = [
  { label: "Pedidos (demo)", value: "42" },
  { label: "Ticket médio (demo)", value: "R$ 46,80" },
  { label: "Cancelamentos (demo)", value: "1" },
];
