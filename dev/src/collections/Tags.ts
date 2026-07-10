import type { CollectionConfig } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'color'],
    description: 'Reusable labels attached to posts via a hasMany relationship.',
  },
  access: {
    read: () => true,
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
