import type { CollectionConfig } from 'payload'

import { demoSafeWrites } from '../access'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'client', 'stage', 'budget', 'launchDate'],
    description:
      'Client projects — a field-type showcase: tabs, radio, number, email, date, code, JSON, multi-select and relationships in one edit view.',
    group: 'Workspace',
  },
  access: {
    read: () => true,
    ...demoSafeWrites,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'client',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'brief',
              type: 'richText',
              admin: {
                description: 'What the project is and what success looks like.',
              },
            },
            {
              name: 'services',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'Design', value: 'design' },
                { label: 'Development', value: 'development' },
                { label: 'Branding', value: 'branding' },
                { label: 'SEO', value: 'seo' },
                { label: 'Consulting', value: 'consulting' },
              ],
            },
            {
              name: 'cover',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
        {
          label: 'Delivery',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'budget',
                  type: 'number',
                  min: 0,
                  admin: {
                    description: 'Contract value in USD.',
                  },
                },
                {
                  name: 'launchDate',
                  type: 'date',
                  admin: {
                    date: {
                      pickerAppearance: 'dayOnly',
                    },
                  },
                },
              ],
            },
            {
              name: 'repoUrl',
              type: 'text',
              admin: {
                description: 'Git repository for this project.',
              },
            },
            {
              name: 'deployCommand',
              type: 'code',
              admin: {
                language: 'shellscript',
                description: 'The one-liner that ships this project.',
              },
            },
            {
              name: 'integrations',
              type: 'json',
              admin: {
                description: 'Arbitrary JSON — third-party service configuration.',
              },
            },
          ],
        },
        {
          label: 'People',
          fields: [
            {
              name: 'contactEmail',
              type: 'email',
            },
            {
              name: 'team',
              type: 'relationship',
              relationTo: 'users',
              hasMany: true,
            },
            {
              name: 'relatedPosts',
              type: 'relationship',
              relationTo: 'posts',
              hasMany: true,
              admin: {
                description: 'Case studies and announcements about this project.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'stage',
      type: 'radio',
      required: true,
      defaultValue: 'discovery',
      options: [
        { label: 'Discovery', value: 'discovery' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'On Hold', value: 'on-hold' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'retainer',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Ongoing monthly engagement.',
      },
    },
  ],
}
