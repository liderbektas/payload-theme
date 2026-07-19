import type { GlobalConfig } from 'payload'

import { canWrite } from '../access'

export const Settings: GlobalConfig = {
  slug: 'settings',
  admin: {
    description: 'Global, site-wide settings edited from a single screen.',
    group: 'Admin',
  },
  access: {
    read: () => true,
    update: canWrite,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'Theme Playground',
    },
    {
      name: 'maintenance',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'When enabled, the front-end shows a maintenance banner.',
      },
    },
    {
      name: 'socialLinks',
      type: 'array',
      labels: {
        singular: 'Social Link',
        plural: 'Social Links',
      },
      fields: [
        {
          name: 'platform',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
