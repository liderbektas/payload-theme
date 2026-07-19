import type { CollectionConfig } from 'payload'

import { demoSafeWrites } from '../access'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'color'],
    description: 'Reusable labels attached to posts via a hasMany relationship.',
    group: 'Workspace',
  },
  access: {
    read: () => true,
    ...demoSafeWrites,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Hex or CSS color used to tint this tag, e.g. #6366f1.',
      },
    },
  ],
}
