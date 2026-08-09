# FASE 19 — ONDA 2 — MERCADO PAGO CARTÃO — FORENSIC E2E AUDIT

## 1. Framework de Pagamento
- **Status**: 🟢 PASS
- **Evidência**: `src/lib/payments/mercadopago-api.server.ts` implementa `createCardCharge` utilizando o SDK oficial do Mercado Pago com timeout de 15s.
- **Observação**: Credenciais são estritamente server-side.

## 2. Server Function
- **Status**: 🟢 PASS
- **Evidência**: `mercadopagoCreateRealCard` em `src/lib/payments/mercadopago.functions.ts` valida `orderId` e busca o valor real do banco de dados (Supabase Admin), impedindo manipulação de valor pelo frontend.
- **Multi-tenant**: Isolamento garantido via RPC `admin_get_restaurant_mp_token`.

## 3. Tokenização
- **Status**: 🟢 PASS
- **Evidência**: O Mesivo não possui inputs de cartão em seu domínio de banco de dados. O frontend (vias SDK MP) gera o `card_token` e envia apenas este token para a Server Function.
- **Segurança**: Nenhum PAN, CVV ou dado sensível é persistido ou logado.

## 4. Idempotência
- **Status**: 🟢 PASS
- **Evidência**: Idempotência garantida na criação via `idempotencyKey` (`prod-mp-card-${order.id}`) enviada ao Mercado Pago e persistência canônica via `payment_create_pending`.

## 5. Webhook & Normalização
- **Status**: 🟢 PASS (Após correção técnica)
- **Evidência**: Webhook em `src/routes/api/public/mercadopago-webhook.ts` detecta dinamicamente se o pagamento foi Pix ou Cartão para backfill canônico correto.
- **Estados**: Mapeamento de APPROVED, REJECTED, CANCELLED e REFUNDED implementado.

## 6. Regressão PIX
- **Status**: 🟢 PASS
- **Evidência**: O código de Pix permanece isolado em `mercadopagoCreateRealPix`. O webhook foi expandido sem quebrar a compatibilidade com o fluxo Pix existente.

## RESULTADO FINAL
O Mercado Pago Cartão está tecnicamente pronto para ativação controlada.

**Classificação**: 🟡 SANDBOX VERIFIED / PRODUCTION PENDING
(Aguardando validação real com adquirente em produção)
