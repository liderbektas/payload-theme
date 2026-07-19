import type { CollectionConfig } from 'payload'

import { demoSafeWrites } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role'],
    group: 'Admin',
  },
  auth: true,
  access: {
    ...demoSafeWrites,
  },
  fields: [
    // Email added by default
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      admin: {
        description: 'Controls the access level of this user in the admin panel.',
      },
    },
  ],
}
