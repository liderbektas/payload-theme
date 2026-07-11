import 'dotenv/config'

import { getPayload } from 'payload'
import sharp from 'sharp'

import config from './payload.config'
import type { Media, Tag } from './payload-types'

const ADMIN_EMAIL = 'dev@local.test'
const ADMIN_PASSWORD = 'test1234'

const lexical = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr' as const,
      textStyle: '',
      textFormat: 0,
      children: [
        {
          type: 'text',
          text,
          version: 1,
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
        },
      ],
    })),
  },
})

// Solid-color PNG placeholder (1200x630) so Media docs have real, sharp-processed files.
const placeholderPng = (background: string): Promise<Buffer> =>
  sharp({
    create: { width: 1200, height: 630, channels: 3, background },
  })
    .png()
    .toBuffer()

// Spread doc creation over the last 30 days so dashboard sparklines have shape.
const daysAgo = (days: number): string => {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const run = async (): Promise<void> => {
  const payload = await getPayload({ config })

  // 1. Admin user (idempotent — only create if missing so re-runs don't fail).
  payload.logger.info('Seed: ensuring admin user…')
  const existingAdmin = await payload.find({
    collection: 'users',
    where: { email: { equals: ADMIN_EMAIL } },
    limit: 1,
  })
  if (existingAdmin.docs.length === 0) {
    await payload.create({
      collection: 'users',
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' },
    })
    payload.logger.info(`  created ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  } else {
    payload.logger.info(`  ${ADMIN_EMAIL} already exists — skipping`)
  }

  // 2. Reset content collections for a clean, repeatable seed.
  payload.logger.info('Seed: clearing posts / media / tags…')
  for (const collection of ['posts', 'media', 'tags'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } })
  }

  // 3. Tags.
  payload.logger.info('Seed: creating tags…')
  const tagSpecs = [
    { name: 'Design', color: '#6366f1' },
    { name: 'Engineering', color: '#10b981' },
    { name: 'Product', color: '#f59e0b' },
    { name: 'Culture', color: '#ec4899' },
    { name: 'Announcements', color: '#3b82f6' },
  ]
  const tags: Tag[] = []
  for (const spec of tagSpecs) {
    tags.push(await payload.create({ collection: 'tags', data: spec }))
  }

  // 4. Media placeholders.
  payload.logger.info('Seed: creating media placeholders…')
  const mediaSpecs = [
    { color: '#4f46e5', alt: 'Indigo placeholder cover' },
    { color: '#059669', alt: 'Emerald placeholder cover' },
    { color: '#db2777', alt: 'Pink placeholder cover' },
    { color: '#d97706', alt: 'Amber placeholder cover' },
  ]
  const media: Media[] = []
  for (let i = 0; i < mediaSpecs.length; i++) {
    const spec = mediaSpecs[i]
    const data = await placeholderPng(spec.color)
    media.push(
      await payload.create({
        collection: 'media',
        data: { alt: spec.alt },
        file: {
          name: `placeholder-${i + 1}.png`,
          data,
          mimetype: 'image/png',
          size: data.length,
        },
      }),
    )
  }

  const tagId = (i: number) => tags[i % tags.length].id
  const mediaId = (i: number) => media[i % media.length].id

  // 5. Posts — varied statuses, at least one draft, exercising every field type.
  payload.logger.info('Seed: creating posts…')
  const postSpecs = [
    {
      title: 'Welcome to the Theme Playground',
      status: 'published',
      featured: true,
      publishedAt: '2026-01-15T09:00:00.000Z',
      tags: [tagId(0), tagId(1)],
      cover: 0,
      excerpt: 'A tour of the playground and what every screen is meant to exercise.',
      withLayout: true,
    },
    {
      title: 'Designing Admin Themes with Payload',
      status: 'published',
      featured: false,
      publishedAt: '2026-02-02T12:30:00.000Z',
      tags: [tagId(0)],
      cover: 1,
      excerpt: 'How CSS layers and theme tokens flow through the admin UI.',
      withLayout: false,
    },
    {
      title: 'A Draft in Progress',
      status: 'draft',
      featured: false,
      publishedAt: null,
      tags: [tagId(2)],
      cover: 2,
      excerpt: 'This one is still a draft — it should surface in the drafts filter.',
      withLayout: false,
    },
    {
      title: 'Archived Announcement',
      status: 'archived',
      featured: false,
      publishedAt: '2025-11-20T08:00:00.000Z',
      tags: [tagId(4)],
      cover: 3,
      excerpt: 'An older announcement kept for reference.',
      archivedReason: 'Superseded by the 2026 roadmap post.',
      withLayout: false,
    },
    {
      title: 'Field Types Showcase',
      status: 'published',
      featured: true,
      publishedAt: '2026-03-10T15:45:00.000Z',
      tags: [tagId(1), tagId(2), tagId(3)],
      cover: 0,
      excerpt: 'Every field type in one document, for stress-testing the edit view.',
      withLayout: true,
    },
    {
      title: 'Scheduled Thoughts',
      status: 'draft',
      featured: false,
      publishedAt: null,
      tags: [tagId(3)],
      cover: 1,
      excerpt: 'A second draft to give the versions/drafts views more to render.',
      withLayout: false,
    },
    {
      title: 'Shipping the New Editorial Workflow',
      status: 'published',
      featured: true,
      publishedAt: '2026-05-18T10:00:00.000Z',
      tags: [tagId(2), tagId(1)],
      cover: 2,
      excerpt: 'Review states, approvals and how the team moved twice as fast.',
      withLayout: false,
    },
    {
      title: 'Q3 Content Calendar',
      status: 'published',
      featured: false,
      publishedAt: '2026-06-30T08:00:00.000Z',
      tags: [tagId(2)],
      cover: 3,
      excerpt: 'Everything scheduled for the next quarter, in one place.',
      withLayout: false,
    },
    {
      title: 'Interview: Design Systems at Scale',
      status: 'published',
      featured: false,
      publishedAt: '2026-07-05T14:00:00.000Z',
      tags: [tagId(0), tagId(3)],
      cover: 1,
      excerpt: 'A conversation about tokens, theming and keeping UI consistent.',
      withLayout: false,
    },
    {
      title: 'Changelog — July',
      status: 'published',
      featured: false,
      publishedAt: '2026-07-09T09:30:00.000Z',
      tags: [tagId(4)],
      cover: 0,
      excerpt: 'Small fixes, faster uploads and a smarter media library.',
      withLayout: false,
    },
  ] as const

  const createdPosts = []
  for (let i = 0; i < postSpecs.length; i++) {
    const spec = postSpecs[i]
    const isDraft = spec.status === 'draft'
    const doc = await payload.create({
      collection: 'posts',
      draft: isDraft,
      data: {
        // Spread across the last month (newest first) for real sparkline shape.
        createdAt: daysAgo([1, 3, 4, 7, 9, 12, 16, 21, 24, 28][i % 10]),
        title: spec.title,
        // Payload's own draft state (drives the Draft/Published pill + versions UI).
        // Keep the two drafts unpublished; publish everything else.
        _status: isDraft ? 'draft' : 'published',
        status: spec.status,
        featured: spec.featured,
        publishedAt: spec.publishedAt,
        excerpt: spec.excerpt,
        ...('archivedReason' in spec ? { archivedReason: spec.archivedReason } : {}),
        content: lexical([
          `${spec.title} — this body is seeded Lexical rich text so the editor renders with content.`,
          'A second paragraph to give the rich text area some height in the edit view.',
        ]),
        tags: [...spec.tags],
        coverImage: mediaId(spec.cover),
        seo: {
          metaTitle: spec.title,
          metaDescription: spec.excerpt,
        },
        gallery: [
          { image: mediaId(spec.cover), caption: 'First gallery image' },
          { image: mediaId(spec.cover + 1), caption: 'Second gallery image' },
        ],
        layout: spec.withLayout
          ? [
              {
                blockType: 'content',
                richText: lexical(['This content block lives inside the layout blocks field.']),
              },
              {
                blockType: 'cta',
                heading: 'Read the docs',
                label: 'Payload documentation',
                url: 'https://payloadcms.com/docs',
              },
            ]
          : [],
      },
    })
    createdPosts.push(doc)
  }

  // 6. Generate an extra version on a published post so the Versions tab has history.
  if (createdPosts[0]) {
    await payload.update({
      collection: 'posts',
      id: createdPosts[0].id,
      data: {
        excerpt: 'A tour of the playground and what every screen is meant to exercise. (edited)',
      },
    })
  }

  // 7. Settings global.
  payload.logger.info('Seed: updating settings global…')
  await payload.updateGlobal({
    slug: 'settings',
    data: {
      siteName: 'Theme Playground',
      maintenance: false,
      socialLinks: [
        { platform: 'GitHub', url: 'https://github.com/liderbektas' },
        { platform: 'X', url: 'https://x.com' },
        { platform: 'Website', url: 'https://example.com' },
      ],
    },
  })

  payload.logger.info(
    `Seed complete: ${tags.length} tags, ${media.length} media, ${createdPosts.length} posts.`,
  )
  process.exit(0)
}

run().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
