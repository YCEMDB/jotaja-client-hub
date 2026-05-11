# URL limpa por restaurante (path-based, multi-tenant)

Trocar `meudominio.com/loja/luca-pizza` por `meudominio.com/lucapizza`. Funciona automaticamente para todos os clientes que você vender — cada novo restaurante cadastrado já ganha sua URL própria, sem nenhuma configuração manual.

## Como vai funcionar para você vender

```
meudominio.com/                  → sua landing de vendas
meudominio.com/lucapizza         → loja da amiga (Luca Pizza)
meudominio.com/burgerking        → loja do próximo cliente
meudominio.com/sushiplace        → loja do próximo cliente
meudominio.com/admin             → área de gestão (cada dono vê só o dele)
meudominio.com/admin/super       → seu painel master
```

**Cada cliente que você vender:**
1. Cria conta → escolhe slug (ex: `lucapizza`) no onboarding.
2. Você (super-admin) ativa a assinatura → `is_active = true`.
3. Loja vai ao ar imediatamente em `meudominio.com/{slug}`.
4. RLS garante isolamento total: dono de uma loja nunca vê dados de outra.

## Implementação

1. **Nova rota dinâmica raiz** `src/routes/$slug.tsx`
   - Captura qualquer `/{algumacoisa}` e renderiza a tela da loja.
   - Reaproveita 100% do código atual de `loja.$slug.tsx` (busca por slug, cardápio, carrinho, checkout).

2. **Lista de slugs reservados**
   - Caminhos do sistema que NÃO podem virar nome de restaurante: `admin`, `auth`, `api`, `pedido`, `loja`, `login`, `signup`, `dashboard`, `_authenticated`, `assets`, `favicon.ico`.
   - Se o slug bater com um reservado → mostra "loja não encontrada".
   - Validar no onboarding (`admin.onboarding.tsx`) ao escolher o slug, com mensagem clara: "esse nome é reservado, escolha outro".
   - Validar também na edição em `admin.configuracoes.tsx`.

3. **Redirect dos links antigos**
   - Manter `src/routes/loja.$slug.tsx` apenas como redirect: `/loja/lucapizza` → `/lucapizza`.
   - Garante que nenhum link/QR Code já impresso por clientes pare de funcionar.

4. **Atualizar geradores de URL**
   - `admin.configuracoes.tsx` (linha 401): `${origin}/${slug}` em vez de `${origin}/loja/${slug}`.
   - `admin.onboarding.tsx` (linha 82): label visual `seudominio.com/` em vez de `comanda.app/loja/`.
   - `pedido.$id.tsx` (linha 154): `<Link to="/$slug">` em vez de `<Link to="/loja/$slug">`.
   - QR Code de compartilhamento: aponta pra URL nova.

## O que NÃO muda (já está pronto pra multi-tenant)

- ✅ Banco já tem `restaurants` com `slug` único e `owner_id`.
- ✅ RLS já isola 100% dos dados entre restaurantes.
- ✅ Tela de bloqueio (`BlockedStoreScreen`) já some a loja se `is_active = false` ou trial vencido.
- ✅ Super-admin já tem painel pra ativar/desativar clientes.
- ✅ Sistema de planos (`trial`, `starter`, `pro`, `business`) já existe na tabela.

## Próximos passos sugeridos (depois deste plano, em outra conversa)

1. **Conectar domínio próprio** (ex: `comanda.com.br`) em Project Settings → Domains.
2. **Ativar pagamentos de assinatura** (Stripe nativo da Lovable) — quando o cliente paga o plano, libera `is_active = true` automaticamente sem você mexer.
3. **Email transacional** (boas-vindas, confirmação de pedido para clientes finais).

## Riscos / observações

- Slugs já cadastrados no banco que colidam com reservados precisarão ser renomeados (vou checar antes de aplicar e te avisar se houver algum).
- Se um dia quiser criar páginas institucionais novas (`/sobre`, `/precos`), precisa adicionar à lista de reservados ANTES de criar a rota.
- Migração futura para subdomínio (`lucapizza.comanda.com.br`) continua possível sem refazer essa parte.
