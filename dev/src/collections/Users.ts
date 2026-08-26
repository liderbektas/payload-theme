import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role'],
    group: 'Admin',
  },
  auth: true,
  fields: [
    // Email added by default
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          "Shown in the theme's sidebar and header user menus (`avatar: { field: 'avatar' }`).",
      },
    },
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
