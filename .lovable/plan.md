# Plano de Apresentação da Identidade Visual Mesivo (Fase Zero V5)

O objetivo agora é apresentar opções de rebranding profissional, afastando-se da estética "IA" (gradientes vibrantes, mesh blobs, neon) para algo que transmita maturidade e autoridade no setor gastronômico.

## 1. Criação do Laboratório de Marca (Dev-Only)
Criaremos a rota `src/routes/dev.branding-lab.tsx` para apresentar as 3 direções visuais em tempo real, permitindo que você veja e sinta a paleta, tipografia e componentes em cada estilo.

### Direção A: "Alta Gastronomia" (Editorial & Sofisticado)
- **Cores:** Deep Forest Green (#1B3022), Creme de Papel (#F9F7F2), Laranja Queimado Orgânico (#C84C09).
- **Estilo:** Design "plano" e rico, sem gradientes. Tipografia serifada em destaque.
- **Vibe:** Menu de restaurante Michelin, premium, estabelecido.

### Direção B: "Infraestrutura de Operação" (Tecnologia & Precisão)
- **Cores:** Cinza Chumbo (#2F3136), Off-White, Azul Elétrico Industrial (#0066FF).
- **Estilo:** Alto contraste, bordas nítidas, grids matemáticos, iconografia minimalista.
- **Vibe:** O "Sistema Operacional" do restaurante. Eficiência, robustez, estilo Square/Stripe.

### Direção C: "Mesa Artesanal" (Acolhedor & Humano)
- **Cores:** Terracota (#B5651D), Sálvia (#8A9A5B), Carvão (#333333).
- **Estilo:** Bordas levemente arredondadas, texturas granuladas, tons terrosos.
- **Vibe:** Local, artesanal, comunidade, hospitalidade.

## 2. Etapas de Execução
1. **Implementação do Lab:** Criar o ambiente de comparação visual.
2. **Review:** Aguardar sua escolha de qual direção ressoa melhor com a visão da Mesivo.
3. **Padronização:** Após a escolha, atualizar `src/styles.css` e `mem://index.md`.
4. **Aplicação na Landing (Onda B1):** Refatorar os componentes da landing com a paleta vencedora.

## 3. Próxima Ação
- [ ] Criar a rota `dev.branding-lab` com os mockups das 3 direções.
