import type { CollectionConfig } from 'payload'

import { CallToActionBlock } from '../blocks/CallToActionBlock'
import { ContentBlock } from '../blocks/ContentBlock'
import { GalleryBlock } from '../blocks/GalleryBlock'
import { HeroBlock } from '../blocks/HeroBlock'
import { QuoteBlock } from '../blocks/QuoteBlock'
import { StatsBlock } from '../blocks/StatsBlock'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    description:
      'Block-built pages — the layout field showcases the themed blocks list with per-type icons.',
    group: 'Content',
  },
  access: {
    read: () => true,
  },
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
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'URL path for this page, e.g. /about.',
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
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        description: 'One-line description used in listings and search results.',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [HeroBlock, ContentBlock, StatsBlock, GalleryBlock, QuoteBlock, CallToActionBlock],
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
  ],
}
