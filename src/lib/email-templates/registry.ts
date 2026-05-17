import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as restaurantWelcome } from './restaurant-welcome'
import { template as adminWelcome } from './admin-welcome'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'restaurant-welcome': restaurantWelcome,
  'admin-welcome': adminWelcome,
}
