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
    customer: "Mesa 08",
    items: "2x Burger Artesanal",
    total: "R$ 78,00",
    status: "novo",
  },
  {
    id: "d2",
    code: "#242",
    customer: "Delivery",
    items: "1x Pizza Grande",
    total: "R$ 65,90",
    status: "produzindo",
  },
  {
    id: "d3",
    code: "#243",
    customer: "Balcão",
    items: "3x Soda Italiana",
    total: "R$ 45,00",
    status: "pronto",
  },
  {
    id: "d4",
    code: "#244",
    customer: "Retirada",
    items: "1x Combo Casal",
    total: "R$ 112,00",
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
    name: "Burger Mesivo",
    description: "Blend 180g, queijo cheddar, bacon caramelizado.",
    price: "R$ 38,00",
  },
  {
    id: "m2",
    name: "Pizza de Fermentação Natural",
    description: "Molho de tomate italiano, mozzarella fresca.",
    price: "R$ 62,00",
  },
  {
    id: "m3",
    name: "Poke Especial do Chef",
    description: "Salmão fresco, avocado, sunomono e arroz gohan.",
    price: "R$ 54,00",
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
