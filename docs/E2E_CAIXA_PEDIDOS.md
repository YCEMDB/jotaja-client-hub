# Bateria E2E — Pedidos + Caixa (Onda 2.a.3)

> Este arquivo consolida os cenários exigidos para validar as RPCs
> `update_order_status`, `assign_driver`, `unassign_driver`,
> `cash_session_open`, `cash_session_close` e `cash_session_add_movement`.
>
> Os testes precisam ser executados com **clientes Supabase autenticados
> com JWT real** para cada papel abaixo. A execução é feita fora do dev
> server, contra dados isolados de teste, com limpeza garantida no `after`.

## Papéis a instanciar

| Papel                                   | Como obter                                                                 |
|-----------------------------------------|----------------------------------------------------------------------------|
| Owner do restaurante A                  | `supabase.auth.signInWithPassword({ email: owner_a })`                     |
| Manager de A                            | idem                                                                        |
| Employee de A                           | idem                                                                        |
| Driver de A                             | idem                                                                        |
| Super admin **sem** sessão de suporte   | login como super sem chamar `start_support_session`                        |
| Super admin com `view_only`             | `start_support_session(A, 'view_only', motivo)`                            |
| Super admin com `operational`           | `start_support_session(A, 'operational', motivo)`                          |
| Super admin com `administrative`        | `start_support_session(A, 'administrative', motivo)`                       |
| Owner do restaurante **B** (isolamento) | login como owner B para tentar interferir em dados de A                    |

## Fixtures

Cada execução deve:

1. Criar dois restaurantes A e B com dados mínimos (owner + membro + um driver de cada lado).
2. Criar 4 pedidos representativos em A (delivery pending / preparing / cancelled / entregue).
3. Registrar limpeza no `after`: revert de `cash_sessions`, `cash_movements`, `orders`, `order_status_history`, `audit_logs` criados.

## Pedidos — 18 cenários

| # | Cenário                                                            | Ator                     | Resultado esperado                                      |
|---|--------------------------------------------------------------------|--------------------------|---------------------------------------------------------|
| 1 | Owner de A altera status válido `pending → preparing`              | Owner A                  | `{from,to}` retornado, `order_status_history` incrementa |
| 2 | Manager de A altera status                                          | Manager A                | Sucesso                                                  |
| 3 | Employee de A altera status                                         | Employee A               | Sucesso                                                  |
| 4 | Transição inválida `pending → delivered`                            | Owner A                  | Erro `invalid_transition` (`check_violation`)            |
| 5 | Cancelamento sem motivo em suporte administrativo                   | Super `administrative` A | Erro `reason_required_for_support_cancel`                |
| 6 | Cancelamento com motivo válido em suporte administrativo            | Super `administrative` A | Sucesso + `audit_logs.order.status_change`               |
| 7 | Owner de B tenta alterar pedido de A                                | Owner B                  | Erro `forbidden`                                         |
| 8 | Super admin sem sessão                                              | Super sem sessão         | Erro `forbidden`                                         |
| 9 | Super `view_only`                                                   | Super `view_only`        | Erro `support_access_denied`                             |
| 10| Super `operational` altera status válido com `p_reason=NULL`        | Super `operational`      | Sucesso (motivo só obrigatório em cancelamento)          |
| 11| Assign driver do próprio tenant (nativo owner)                      | Owner A                  | Sucesso, `order.driver_assigned` só na trilha suporte    |
| 12| Assign driver por manager (nativo, não owner)                       | Manager A                | Erro `driver_assign_owner_only`                          |
| 13| Assign driver de outro tenant                                       | Owner A + driver B       | Erro `driver_not_in_restaurant`                          |
| 14| Assign driver em suporte `operational` (owner-only cai)             | Super `operational`      | Sucesso + auditoria                                       |
| 15| Unassign sem driver anterior                                        | Owner A                  | No-op silencioso, sem auditoria duplicada                |
| 16| Unassign em suporte sem motivo                                      | Super `operational`      | Erro `reason_required_for_support_unassign`              |
| 17| Sessão expirada tenta alterar status                                | Super com sessão vencida | Erro `support_access_denied`                             |
| 18| DML direto em `orders` por qualquer papel não-service_role          | Owner A                  | Erro RLS / policy                                        |

## Caixa — 20 cenários

| #  | Cenário                                                              | Ator                     | Resultado esperado                                                     |
|----|----------------------------------------------------------------------|--------------------------|------------------------------------------------------------------------|
| 1  | Owner abre caixa manual                                              | Owner A                  | Sucesso, retorna `via_support=false`                                   |
| 2  | Employee abre caixa manual                                           | Employee A               | Sucesso                                                                |
| 3  | Segunda abertura enquanto há sessão aberta                            | Owner A                  | Erro `cash_already_open` (`23505`)                                     |
| 4  | Duas aberturas simultâneas (`Promise.all`)                            | Owner A                  | Uma sucede; outra recebe `cash_already_open` da captura de `unique_violation` |
| 5  | Abertura em suporte `view_only`                                       | Super `view_only`        | Erro `support_access_denied`                                           |
| 6  | Abertura em suporte `operational`                                     | Super `operational`      | Erro `support_access_denied`                                           |
| 7  | Abertura em suporte `administrative` sem motivo                       | Super `administrative`   | Erro `reason_required_for_support_open`                                |
| 8  | Abertura em suporte `administrative` com motivo válido                | Super `administrative`   | Sucesso + `audit_logs.cash_session.open` + notes `[SUPORTE] ...`       |
| 9  | Abertura com valor negativo                                           | Owner A                  | Erro `invalid_amount`                                                  |
| 10 | Abertura com valor `NaN`                                              | Owner A                  | Erro `invalid_amount`                                                  |
| 11 | Abertura com valor > R$ 1.000.000                                     | Owner A                  | Erro `amount_out_of_range`                                             |
| 12 | Sangria `withdrawal` positiva nativa                                  | Owner A                  | Sucesso, saldo esperado decresce                                       |
| 13 | Movimentação `sale` explícita                                         | Owner A                  | Erro `invalid_movement_type`                                           |
| 14 | Movimentação de tipo inexistente / vazio                              | Owner A                  | Erro `invalid_movement_type`                                           |
| 15 | Movimentação com `amount = 0`                                         | Owner A                  | Erro `invalid_amount`                                                  |
| 16 | Movimentação em sessão de outro tenant                                | Owner B                  | Erro genérico `forbidden` (sem revelar existência)                     |
| 17 | Fechamento em suporte `administrative` com motivo                     | Super `administrative`   | Sucesso, `difference` calculado com 2 casas                            |
| 18 | Fechamento duplo (`Promise.all`)                                      | Owner A                  | Um sucesso; outro `cash_session_close_race` (`40001`)                  |
| 19 | Abertura automática do trigger operacional preservada                 | pedido do público        | Nova sessão `origin='automatic'`, sem passar por RPC                   |
| 20 | DML direto em `cash_sessions` / `cash_movements` por não-service_role | Owner A                  | Erro RLS                                                               |

## Rollback de auditoria (teste controlado)

1. Criar um trigger `BEFORE INSERT` em `audit_logs` que rejeite entradas
   cujo `metadata->>'test'::text = 'force_fail'`.
2. Executar `cash_session_open` em suporte administrativo passando um
   marcador injetado (via `set_config`) que force o trigger a falhar.
3. Verificar que:
   - a chamada retornou erro para o cliente;
   - `cash_sessions` **não** contém a nova linha;
   - `audit_logs` **não** contém a linha rejeitada.
4. Remover o trigger na finalização.

Não alterar permissões globais nem `search_path` do ambiente.

## Relatório

O executor deve produzir uma tabela com:

`| Cenário | Usuário | Nível | Operação | Esperado | Obtido | ERRCODE | Auditoria esperada | Auditoria observada | Resultado |`

Um cenário só é aprovado quando o resultado obtido bate com o esperado E
o registro em `audit_logs` (ou a ausência dele) confere.

## Bloqueios de release

Onda 2.a encerrada. Bloqueios remanescentes para release completo:

1. **Bloqueio herdado**: telas administrativas do `/super` continuam sem
   RPCs seguras (Onda 2.c pendente). Impede publicar as migrations de
   hardening em produção enquanto os fluxos globais não forem migrados.

R2 (rollback ao vivo com falha real em `private.record_audit`) foi
classificado como **DEFERRED — environment limitation** (ver seção "R2 —
Rollback ao vivo" abaixo) e **não bloqueia a Onda 2.b**.

## Correções aplicadas após revisão da 2.a.4 (reteste focado)

A revisão apontou três defeitos de instrumentação/identidade no relatório
original. Todos foram reexecutados com asserção estrita (linhas afetadas +
valor real no banco) e identidade correta. Relatórios em
`/mnt/documents/e2e_onda_2a4_retest.md` e `.json`.

### P10 — DML direto em `orders` sob suporte `administrative`

O relatório anterior marcava `obtained=updated` e classificava como PASS —
rótulo enganoso: o Postgres retorna `success` com 0 linhas quando a RLS
filtra a linha alvo, e o script não afirmava o efeito real. Reinstrumentado:

| Cenário | Identidade | rows afetadas | valor antes | valor depois | Status |
|---|---|---|---|---|---|
| P10.1 UPDATE `orders.status` | super_administrative (sem vínculo nativo) | 0 | pending | pending | PASS |
| P10.2 UPDATE `orders.notes` (coluna não-status) | super_administrative | 0 | "nota inicial" | "nota inicial" | PASS |
| P10.3 DELETE `orders` | super_administrative | 0 | linha existe | linha existe | PASS |

Identidade do super_administrative validada no próprio script:
`auth.uid()=20ece082-…` retornado pelo JWT (cliente com **publishable
key**, não service_role), `user_roles=[{role:'super_admin',
restaurant_id:null}]`, `owned_restaurants=0`, sessão de suporte ativa
`administrative` com `expires_at` no futuro e `ended_at=null`. O JSON
completo de identidades está no relatório.

### C11 — DML direto em `cash_sessions`/`cash_movements` sob suporte

O relatório anterior rodou como `owner_A`, o que não valida o cenário
exigido. Reexecutado como `super_administrative` isolado:

| Cenário | rows afetadas | mensagem | Status |
|---|---|---|---|
| C11.1 INSERT direto em `cash_sessions` | 0 | `new row violates row-level security policy` | PASS |
| C11.2 UPDATE direto em `cash_sessions` (sessão legítima do owner) | 0 | sem erro, `opening_amount` inalterado | PASS |
| C11.3 INSERT direto em `cash_movements` | 0 | `new row violates row-level security policy` | PASS |
| C11.4 DELETE direto em `cash_movements` | 0 | sem erro, contagem inalterada | PASS |

### R2 — Rollback ao vivo

Continua **PENDING** (ver bloqueios acima). Não pode ser marcado como PASS
enquanto uma execução transacional real não for feita em staging.

## Matriz consolidada (após reteste)

| Bloco | PASS | FAIL | PENDING |
|---|---|---|---|
| Pedidos (P1–P12, com P10 revisado em 3 sub-cenários) | 14 | 0 | 0 |
| Caixa (C1–C14, com C11 revisado em 4 sub-cenários) | 22 | 0 | 0 |
| Rollback (R1 estrutural / R2 ao vivo) | 1 | 0 | 1 |
| Identidade (dump completo por persona) | 1 | 0 | 0 |
| **Total** | **38** | **0** | **1** |

## Status atual

- Ajustes de código 2.a completos; UI de caixa 100% em RPCs; `EntryDialog`
  / `PayEntryDialog` bloqueando escrita durante suporte.
- Bateria E2E principal executada (`/mnt/documents/e2e_onda_2a4_report.md`
  / `.json`) e reteste focado publicado
  (`/mnt/documents/e2e_onda_2a4_retest.md` / `.json`).
- Script do reteste em `/tmp/e2e2/retest.ts` (autentica com JWT real via
  publishable key; nunca usa service_role no ponto de ataque).
- **Onda 2.b permanece bloqueada** até R2 ser executado em staging com
  resultado PASS.

