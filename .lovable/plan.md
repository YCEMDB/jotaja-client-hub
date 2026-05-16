## Objetivo
Permitir que cada restaurante conecte seu **próprio domínio** (ex: `pedido.europizza.com.br`) e que, ao acessar esse domínio, o cliente caia direto no cardápio da loja correspondente — sem precisar digitar o slug.

## Como vai funcionar (visão do usuário)

1. Dono da loja vai em **Configurações → Domínio próprio**.
2. Digita o domínio (ex: `pedido.europizza.com.br`) e salva.
3. Sistema mostra instruções de DNS:
   - Tipo: **CNAME** · Nome: `pedido` · Valor: `comandahub.online`
   - (ou A record `185.158.133.1` se for domínio raiz)
4. Cliente final acessa `https://pedido.europizza.com.br` e cai direto no cardápio da Euro Pizza.
5. Link público mostrado em Configurações passa a ser o domínio próprio (com fallback pra `comandahub.online/slug`).

## Mudanças técnicas

### 1. Banco
Migration adicionando à tabela `restaurants`:
- `custom_domain text unique` — domínio normalizado (lowercase, sem `https://`, sem barra)
- `custom_domain_verified boolean default false` — só serve o domínio quando verificado
- índice único parcial em `lower(custom_domain)`

### 2. Resolução do domínio (root route)
Em `src/routes/index.tsx`, no `loader` (ou `beforeLoad`):
- Ler o `Host` header via `getRequestHost()` do `@tanstack/react-start/server` dentro de um `createServerFn`.
- Se o host **não for** `comandahub.online`, `*.lovable.app`, `localhost`, nem o preview:
  - Buscar `restaurants` por `custom_domain = host AND custom_domain_verified = true AND is_active = true`.
  - Se achar → redirect interno para `/$slug` (mantendo `host` original na barra de endereços via rewrite client-side com `useNavigate({ replace: true })` ou simplesmente renderizar a página da loja diretamente).
- Implementação preferida: server fn `resolveHostToSlug(host)` chamada no loader; se retornar slug, o componente renderiza o mesmo conteúdo de `/$slug` passando o slug resolvido (sem mudar URL).

### 3. UI em Configurações
Nova aba/seção "Domínio próprio" em `src/routes/_authenticated/admin.configuracoes.tsx`:
- Input do domínio + botão Salvar (normaliza e grava `custom_domain`, reseta `custom_domain_verified=false`).
- Botão "Verificar DNS" → server fn que faz `fetch(https://<dominio>/__lovable_health)` ou compara via DNS lookup (no Worker: tenta `fetch` HEAD e checa se responde com um header próprio). Se ok, marca `custom_domain_verified=true`.
- Bloco de instruções de DNS com os valores prontos pra copiar.
- Status visual: "Aguardando DNS" / "Verificado ✓".

### 4. Link público
Em `StoreLinkCard`, se `r.custom_domain && r.custom_domain_verified`, usar `https://<custom_domain>` como URL principal; manter `comandahub.online/<slug>` como fallback secundário.

### 5. RLS
- `custom_domain` legível publicamente (já cai na policy `restaurants_public_select` filtrada por `is_active`).
- Update só pelo dono (já coberto por `restaurants_update_own`).

## Limitações importantes (avisar o usuário no UI)

- **SSL automático**: o domínio só vai funcionar via HTTPS se o domínio raiz `comandahub.online` na Lovable estiver com **wildcard SSL** OU se cada cliente apontar via Cloudflare proxy (que faz SSL). Lovable Hosting hoje **não emite SSL automático para domínios de terceiros apontando via CNAME** — o cliente precisa:
  - **Opção A** (mais simples): usar Cloudflare grátis no domínio dele, com SSL Flexible, e apontar CNAME pra cá.
  - **Opção B**: o dono Lovable do projeto (você) adiciona o domínio dele em **Project Settings → Domains** da Lovable manualmente (suporta múltiplos).
- Vou deixar isso claro no painel: "Após configurar o DNS, avise o suporte para ativar o SSL — ou use Cloudflare proxy no seu domínio."

## Arquivos a criar/editar

```
supabase/migrations/<ts>_restaurant_custom_domain.sql   (novo)
src/lib/custom-domain.functions.ts                      (novo — resolveHost, verifyDomain)
src/routes/index.tsx                                    (loader resolve host)
src/routes/_authenticated/admin.configuracoes.tsx       (nova aba Domínio)
```

## Fora do escopo (não vou fazer agora)
- Emissão automática de certificado SSL (depende de infra Lovable).
- Painel pra super_admin aprovar/revogar domínios.
- Suporte a múltiplos domínios por loja.

Confirma que posso seguir?