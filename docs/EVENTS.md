# Eventos — Comandex

Arquitetura orientada a eventos usando `pg_notify` (Postgres) + Supabase Realtime + pgmq (filas).

## Eventos Existentes

### ✅ `order_status_changes` (pg_notify)
- **Publicador:** trigger `trg_order_status_history_notify` em `order_status_history`.
- **Payload:** `{order_id, restaurant_id, old_status, new_status, source, changed_by, reason, created_at}`.
- **Consumidores:**
  - Painel admin (via Supabase Realtime subscription filtrada por `restaurant_id`).
  - 🚧 Futuro: worker de notificações (WhatsApp/push).

### ✅ Realtime nativo — `orders`
- Supabase Realtime publica INSERT/UPDATE de `orders` para inscritos com permissão RLS.
- **Consumidor:** dashboard do restaurante (novo pedido → toast + som).

### ✅ Fila `pgmq.q_auth_emails` / `q_transactional_emails`
- **Publicador:** `enqueue_email(queue, payload)` via `SECURITY DEFINER`.
- **Trigger de wake:** `email_queue_wake` — POST para `/lovable/email/queue/process` + agenda cron.
- **Consumidor:** endpoint da plataforma Lovable → provedor SMTP.
- **DLQ:** `move_to_dlq()` após falhas repetidas.

## Eventos Planejados

| Evento | Publicador | Consumidor previsto | Sprint |
|---|---|---|---|
| 🚧 `order_created` | Trigger AFTER INSERT em `orders` | Notificação sonora KDS, impressão automática | 3 |
| 🚧 `payment_confirmed` | Webhook MP | Auto-`confirmed` do pedido, notificação cliente | 3 |
| 🚧 `low_stock` | Trigger em `products` | Alerta no painel | 4 |
| 🚧 `customer_birthday` | Cron diário | Campanha automática CRM | 5 |
| 🚧 `driver_assigned` | RPC `assign_driver` | App entregador, notificação cliente | 6 |
| 🚧 `session_closed` | Trigger em `cash_sessions` | Email do relatório de fechamento | 4 |

## Padrão de Publicação

```sql
-- Sempre em trigger AFTER, wrap em BEGIN/EXCEPTION para nunca quebrar o INSERT
BEGIN
  PERFORM pg_notify('canal', payload::text);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'evento falhou: %', SQLERRM;
END;
```

## Padrão de Consumo (Frontend)

```ts
useEffect(() => {
  const ch = supabase.channel(`orders:${restaurantId}`)
    .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}` },
        () => queryClient.invalidateQueries({ queryKey: ['orders', restaurantId] }))
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}, [restaurantId]);
```

## Regras

- Nenhum evento pode causar rollback da transação origem (`EXCEPTION WHEN OTHERS`).
- Payloads sempre em JSON com chaves em snake_case.
- Canal por domínio (`order_status_changes`, não `orders_v2_new_status`).
- Realtime da tabela para leituras genéricas; `pg_notify` para eventos semânticos.
