## Problema

Os avisos publicados em **Super-Admin → Avisos globais** são gravados em `global_announcements`, mas nenhum componente do painel das lojas (`/admin/*`) lê essa tabela. Resultado: o aviso nunca é renderizado para os restaurantes.

A RLS já permite a leitura (`ann_auth_select` libera SELECT para `authenticated`), então é só plugar a UI.

## Mudanças

1. **Novo componente** `src/components/GlobalAnnouncementsBanner.tsx`
   - Busca em `global_announcements` os registros onde `is_active = true` e (`expires_at IS NULL` ou `expires_at > now()`).
   - Ordena por `created_at desc`.
   - Renderiza uma faixa no topo por aviso, com cor conforme `variant` (info/success/warning/danger), ícone `Megaphone` e botão "X" para dispensar localmente (guarda IDs dispensados em `localStorage` — `dismissed_announcements`).
   - Inscreve em realtime (`postgres_changes` em `global_announcements`) para atualizar sem reload quando o admin publica/desativa.

2. **Integrar no layout** `src/routes/_authenticated.tsx`
   - Renderizar `<GlobalAnnouncementsBanner />` no topo do `<main>`, acima do `<Outlet />`.
   - Aparece em todas as páginas do painel da loja.

3. **(Opcional) Também no Super-Admin** — exibir no `_super.tsx` para o próprio admin ver como ficou. Posso incluir se quiser.

## Sem mudanças

- Tabela, RLS e tela de criação já estão prontas.
- Sem migração necessária.

Posso aplicar?