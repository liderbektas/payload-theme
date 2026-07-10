import type { Block } from 'payload'

export const CallToActionBlock: Block = {
  slug: 'cta',
  interfaceName: 'CallToActionBlock',
  labels: {
    singular: 'Call to Action',
    plural: 'Calls to Action',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'label',
      type: 'text',
    },
    {
      name: 'url',
      type: 'text',
    },
  ],
}
