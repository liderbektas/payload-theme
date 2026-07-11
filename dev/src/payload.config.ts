import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { payloadTheme } from 'payload-theme'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { Settings } from './globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // Exercises the live-preview toggle in the doc toolbar (a theming target).
    livePreview: {
      collections: ['posts'],
      url: 'http://localhost:3000',
    },
  },
  // Exercises the app-header locale switcher (a theming target).
  localization: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', label: 'English' },
      { code: 'tr', label: 'Türkçe' },
    ],
  },
  collections: [Posts, Tags, Media, Users],
  globals: [Settings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || '',
    },
  }),
  plugins: [
    payloadTheme({
      accent: '#4f4ece',
      logo: { dark: '/logo-dark.svg', light: '/logo-light.svg' },
      logoHeight: 28,
      radius: 'full',
      nav: {
        icons: {
          media: 'image',
          posts: 'newspaper',
          settings: 'settings',
          tags: 'tag',
          users: 'users',
        },
      },
    }),
  ],
})
