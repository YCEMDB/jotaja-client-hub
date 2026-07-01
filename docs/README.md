# Documentação Oficial — Comandex

Base técnica oficial do sistema Comandex (marca comercial do projeto `comandahub`).
Toda documentação nesta pasta é **fonte da verdade** para o desenvolvimento.
Antes de implementar qualquer nova funcionalidade, leia:

1. [ARCHITECTURE.md](./ARCHITECTURE.md) — Visão geral do sistema
2. [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) — Regras obrigatórias
3. [DATABASE.md](./DATABASE.md) — Modelo de dados
4. [RLS.md](./RLS.md) — Segurança em linha
5. [RPCS.md](./RPCS.md) — Contratos servidor↔cliente
6. [FEATURE_GATES.md](./FEATURE_GATES.md) — Planos e limites
7. [ORDER_STATE_MACHINE.md](./ORDER_STATE_MACHINE.md) — Máquina de estados
8. [EVENTS.md](./EVENTS.md) — Eventos internos
9. [CUSTOMERS.md](./CUSTOMERS.md) — Estrutura de clientes / CRM
10. [SECURITY.md](./SECURITY.md) — Postura de segurança
11. [ROADMAP.md](./ROADMAP.md) — Próximas sprints
12. [CHANGELOG.md](./CHANGELOG.md) — Histórico de entregas
13. [TODO.md](./TODO.md) — Pendências técnicas
14. [FUTURE_APIS.md](./FUTURE_APIS.md) — APIs planejadas

## Legenda de Status
- ✅ Implementado e em produção
- 🚧 Planejado / parcial
- ❌ Não implementado

## Convenções
- **Backend-first**: toda lógica crítica reside em RPCs `SECURITY DEFINER`.
- **Fonte única de verdade**: um domínio, uma tabela, um caminho.
- **RLS obrigatório** em toda tabela do schema `public`.
- **Nunca** duplicar regras de negócio no frontend.
