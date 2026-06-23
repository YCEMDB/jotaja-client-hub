import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  restaurantName?: string
  ownerName?: string
  loginUrl?: string
  email?: string
  temporaryPassword?: string
  isReset?: boolean
}

const RestaurantWelcomeEmail = ({
  restaurantName = 'Seu restaurante',
  ownerName,
  loginUrl = 'https://comandahub.online/auth',
  email = '',
  temporaryPassword = '',
  isReset = false,
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>
      {isReset ? `Sua senha do Comandex foi redefinida` : `Bem-vindo ao Comandex — ${restaurantName}`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>COMANDEX</Text>
        </Section>
        <Heading style={h1}>
          {isReset ? 'Sua senha foi redefinida' : `Bem-vindo, ${ownerName ?? 'parceiro'}!`}
        </Heading>
        <Text style={text}>
          {isReset
            ? `O administrador redefiniu a senha de acesso ao painel de ${restaurantName}. Use as credenciais abaixo para entrar e troque a senha em "Configurações" no primeiro acesso.`
            : `Seu restaurante ${restaurantName} acaba de ser criado no Comandex. Abaixo estão suas credenciais de acesso ao painel. Recomendamos trocar a senha no primeiro login em "Configurações → Perfil".`}
        </Text>

        <Section style={credsBox}>
          <Text style={credLabel}>E-MAIL</Text>
          <Text style={credValue}>{email}</Text>
          <Text style={credLabel}>SENHA TEMPORÁRIA</Text>
          <Text style={credValueMono}>{temporaryPassword}</Text>
        </Section>

        <Button style={button} href={loginUrl}>
          Acessar painel
        </Button>

        <Text style={footer}>
          Precisa de ajuda? Responda este e-mail ou acesse o suporte em{' '}
          <a href="https://comandahub.online/suporte" style={link}>comandahub.online/suporte</a>.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RestaurantWelcomeEmail,
  subject: (d: Record<string, any>) =>
    d?.isReset
      ? 'Sua senha do Comandex foi redefinida'
      : `Bem-vindo ao Comandex — ${d?.restaurantName ?? 'seu restaurante'}`,
  displayName: 'Boas-vindas ao restaurante',
  previewData: {
    restaurantName: 'Sabor da Casa',
    ownerName: 'Maria',
    loginUrl: 'https://comandahub.online/auth',
    email: 'dono@exemplo.com',
    temporaryPassword: 'Aa9XzPq2!9',
    isReset: false,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif', margin: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px' }
const brandBar = { backgroundColor: '#ff6b35', padding: '14px 20px', borderRadius: '6px', marginBottom: '28px' }
const brandText = { color: '#ffffff', fontWeight: 900 as const, fontSize: '18px', letterSpacing: '0.2em', margin: 0 }
const h1 = { fontSize: '28px', fontWeight: 900 as const, color: '#0a0a0a', margin: '0 0 16px', lineHeight: 1.1 }
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: 1.55, margin: '0 0 20px' }
const credsBox = { backgroundColor: '#fff7f1', border: '2px solid #0a0a0a', padding: '18px 20px', borderRadius: '8px', margin: '0 0 24px' }
const credLabel = { fontSize: '11px', color: '#666', letterSpacing: '0.15em', fontWeight: 700 as const, margin: '8px 0 4px' }
const credValue = { fontSize: '16px', color: '#0a0a0a', fontWeight: 700 as const, margin: '0 0 8px' }
const credValueMono = { fontSize: '18px', color: '#e84393', fontWeight: 900 as const, fontFamily: 'monospace', margin: '0 0 8px', letterSpacing: '0.05em' }
const button = { backgroundColor: '#0a0a0a', color: '#ffffff', fontSize: '15px', fontWeight: 700 as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#888', margin: '32px 0 0', lineHeight: 1.5 }
const link = { color: '#ff6b35', textDecoration: 'underline' }
