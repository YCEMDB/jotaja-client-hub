# Plano de Identidade Visual Mesivo (Diretor Criativo)

Este plano detalha a implementação da nova identidade visual "The Conductor + The Ledger", focada na Mesivo como a infraestrutura invisível que organiza o caos operacional de restaurantes premium.

## 1. Fundamentos da Marca (Sincronia & Ordem)
- **Conceito Central:** O restaurante é o palco, a Mesivo são os bastidores.
- **Visual:** Limpo, profissional, "folha sobre mesa", microinterações orgânicas.
- **Logo:** Símbolo de "Fluxo de Sincronia" (três traços assimétricos mas equilibrados).

## 2. Paleta de Cores (Gastronomia Profissional)
- **Background:** `#F8F6F3` (Papel/Creme quente)
- **Surface:** `#FFFFFF` (Branco puro)
- **Primary:** `#2B2B2B` (Carvão/Grafite profundo)
- **Accent:** `#E36D42` (Laranja Queimado/Terracota)
- **Secondary Accent:** `#3F7D58` (Verde Floresta/Sálvia)
- **Warning:** `#D4A73F` (Âmbar/Madeira)
- **Danger:** `#C84B4B` (Cereja profundo)

## 3. Tipografia (Aprovada)
- **Marketing:** *Instrument Serif* (Acentos) + *Manrope* (Base).
- **Sistema:** *Manrope* (Exclusivo).
- **Números:** *Manrope* (Tabular em dados operacionais).

## 4. Etapas de Implementação (Sem Alteração de Código Ainda)
1. **Refatoração do SVG do Logo:** Atualizar `MesivoMark.tsx` para refletir o símbolo de "Fluxo de Sincronia".
2. **Atualização de Design Tokens:** Migrar as variáveis do `src/styles.css` para a nova paleta e escalas de radius (10px, 12px, 16px).
3. **Refinamento de Componentes de Shell:** Ajustar `PublicHeader.tsx` e `PublicFooter.tsx` com a nova tipografia e logo em caixa baixa (`mesivo`).
4. **Protótipo de Dashboard Operacional:** Criar uma rota dev-only demonstrando o conceito "vivo" (sem cards genéricos).

## 5. Próxima Ação
- [ ] Implementar a nova logo no componente `src/components/mesivo-graphics/MesivoMark.tsx`.
