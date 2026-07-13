import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  adminName?: string
  loginUrl?: string
  email?: string
  temporaryPassword?: string
}

const AdminWelcomeEmail = ({
  adminName = 'parceiro',
  loginUrl = 'https://comandahub.online/auth',
  email = '',
  temporaryPassword = '',
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi adicionado como Super-Admin do Mesivo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}><Text style={brandText}>MESIVO · ADMIN</Text></Section>
        <Heading style={h1}>Olá, {adminName}</Heading>
        <Text style={text}>
          Você foi adicionado como <strong>Super-Admin</strong> da plataforma Mesivo.
          Use as credenciais abaixo para acessar o painel administrativo. Troque a senha no primeiro acesso.
        </Text>

        <Section style={credsBox}>
          <Text style={credLabel}>E-MAIL</Text>
          <Text style={credValue}>{email}</Text>
          <Text style={credLabel}>SENHA TEMPORÁRIA</Text>
          <Text style={credValueMono}>{temporaryPassword}</Text>
        </Section>

        <Button style={button} href={loginUrl}>Acessar painel admin</Button>

        <Text style={footer}>
          Como Super-Admin você gerencia lojas, planos, leads e outros admins. Tenha cautela com as ações que executa.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdminWelcomeEmail,
  subject: 'Você foi adicionado como Super-Admin do Mesivo',
  displayName: 'Boas-vindas Super-Admin',
  previewData: {
    adminName: 'João',
    loginUrl: 'https://comandahub.online/auth',
    email: 'admin@exemplo.com',
    temporaryPassword: 'Aa9XzPq2!9',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif', margin: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px' }
const brandBar = { backgroundColor: '#7c5cff', padding: '14px 20px', borderRadius: '6px', marginBottom: '28px' }
const brandText = { color: '#ffffff', fontWeight: 900 as const, fontSize: '18px', letterSpacing: '0.2em', margin: 0 }
const h1 = { fontSize: '28px', fontWeight: 900 as const, color: '#0a0a0a', margin: '0 0 16px', lineHeight: 1.1 }
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: 1.55, margin: '0 0 20px' }
const credsBox = { backgroundColor: '#f4f0ff', border: '2px solid #0a0a0a', padding: '18px 20px', borderRadius: '8px', margin: '0 0 24px' }
const credLabel = { fontSize: '11px', color: '#666', letterSpacing: '0.15em', fontWeight: 700 as const, margin: '8px 0 4px' }
const credValue = { fontSize: '16px', color: '#0a0a0a', fontWeight: 700 as const, margin: '0 0 8px' }
const credValueMono = { fontSize: '18px', color: '#7c5cff', fontWeight: 900 as const, fontFamily: 'monospace', margin: '0 0 8px', letterSpacing: '0.05em' }
const button = { backgroundColor: '#0a0a0a', color: '#ffffff', fontSize: '15px', fontWeight: 700 as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#888', margin: '32px 0 0', lineHeight: 1.5 }
