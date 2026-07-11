import type { CollectionConfig } from 'payload'

import { CallToActionBlock } from '../blocks/CallToActionBlock'
import { ContentBlock } from '../blocks/ContentBlock'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'featured', 'publishedAt', 'updatedAt'],
    description: 'Blog posts — exercises every major Payload field type so each admin view can be themed.',
    // Exercises the preview (external-link) button in the doc toolbar.
    preview: () => 'http://localhost:3000',
  },
  access: {
    read: () => true,
  },
  // Drafts + versions: both the version history and the Draft/Publish flow are theming targets.
  versions: {
    drafts: {
      autosave: false,
    },
    maxPerDoc: 25,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      admin: {
        description: 'Main body content rendered with the Lexical rich text editor.',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: 'Short summary shown in listings and meta previews.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'archivedReason',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'Shown only when status is Archived — demonstrates admin.condition.',
        condition: (data) => data?.status === 'archived',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
        },
        {
          name: 'metaDescription',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'gallery',
      type: 'array',
      labels: {
        singular: 'Image',
        plural: 'Images',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
        },
      ],
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [ContentBlock, CallToActionBlock],
    },
  ],
}
