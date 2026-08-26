import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { de } from '@payloadcms/translations/languages/de'
import { en } from '@payloadcms/translations/languages/en'
import { fr } from '@payloadcms/translations/languages/fr'
import { tr } from '@payloadcms/translations/languages/tr'
import path from 'path'
import { buildConfig } from 'payload'
import { payloadTheme } from 'payload-theme'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
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
  // localization: {
  //   defaultLocale: 'en',
  //   locales: [
  //     { code: 'en', label: 'English' },
  //     { code: 'tr', label: 'Türkçe' },
  //   ],
  // },
  // Payload's panel is English-only until a project opts into more languages.
  // Four here so the Account page's language switcher is real — and so the
  // theme's own chrome can be checked in a non-English panel.
  i18n: {
    supportedLanguages: { de, en, fr, tr },
  },
  collections: [Posts, Pages, Projects, Tags, Media, Users],
  globals: [Settings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
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
      accent: '#0d9488',
      // Exercises the user-field avatar source: the seeded admin gets one of
      // the placeholder images, everyone else falls back to initials.
      avatar: { field: 'avatar' },
      nav: {
        icons: {
          media: 'image',
          pages: 'file-text',
          posts: 'newspaper',
          projects: 'briefcase',
          settings: 'settings',
          tags: 'tag',
          users: 'users',
        },
      },
      // dashboard: {
      //   widgets: [
      //     '/components/widgets/ContentSummaryWidget#ContentSummaryWidget',
      //     { component: '/components/widgets/LocalTimeWidget#LocalTimeWidget', width: 'half' },
      //   ],
      // },
    }),
  ],
})
