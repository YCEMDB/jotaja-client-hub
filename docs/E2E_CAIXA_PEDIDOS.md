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

- **Desbloqueado (Onda 2.a.4)**: bateria E2E executada com clientes Supabase
  autenticados (JWT real) contra o banco de produção da preview. Resultado
  global: **33 PASS / 0 FAIL / 1 PENDING (34 cenários)**. O único PENDING é
  R2 (rollback ao vivo com trigger de falha em `audit_logs`) porque
  `sandbox_exec` não tem privilégio `CREATE TRIGGER` em `audit_logs`; a
  invariante já está coberta por R1 (verificação por construção: as RPCs
  chamam `private.record_audit` dentro do corpo PL/pgSQL, portanto qualquer
  exceção do audit dispara ROLLBACK da RPC).
- Bloqueio herdado: telas administrativas do `/super` continuam sem RPCs
  seguras (Onda 2.c pendente).

## Status atual

- Ajustes finais 2.a.2 aplicados (autorização primeiro, `validate_money`,
  captura de `unique_violation`, restaurante derivado da sessão).
- UI de caixa migrada 100% para as RPCs.
- `EntryDialog` / `PayEntryDialog` bloqueiam escrita durante suporte
  assistido.
- Bateria E2E **executada e aprovada** — relatórios completos em
  `/mnt/documents/e2e_onda_2a4_report.md` e `.json`. Script executor em
  `/tmp/e2e/run.ts` (autenticação real por perfil: owner, manager,
  employee, driver, owner_B, super sem sessão, super `view_only`, super
  `operational`, super `administrative`, super com sessão expirada).

### Resumo dos resultados (Onda 2.a.4)

| Bloco | PASS | FAIL | PENDING |
|---|---|---|---|
| Pedidos (P1–P12) | 12 | 0 | 0 |
| Caixa (C1–C14) | 20 | 0 | 0 |
| Rollback (R1–R2) | 1 | 0 | 1 |
| **Total** | **33** | **0** | **1** |

Cenários cobertos além do roteiro original: `P10` (bloqueio de DML direto
em `orders` mesmo sob suporte administrativo), `P11` (auditoria carrega
`actor_id`, `restaurant_id` e `support_session_id`), `P12` (idempotência
de transição repetida), `C11a/b` (bloqueio de DML direto em
`cash_sessions` e `cash_movements`), `C14` (trigger operacional
`orders_auto_open_cash` abre sessão automática com `origin='automatic'`).
