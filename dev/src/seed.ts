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

// Gradient PNG placeholder (1200x630) so Media docs have real, sharp-processed
// files that also make the media grid and upload cards look good in shots.
const placeholderPng = (from: string, to: string): Promise<Buffer> =>
  sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">` +
        `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
        `</linearGradient></defs>` +
        `<rect width="1200" height="630" fill="url(#g)"/></svg>`,
    ),
  )
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

  // 1b. A second editor so the Users list has more than one row.
  const companionUsers = [
    { email: 'editor@local.test', password: 'test1234', role: 'editor' as const },
  ]
  for (const spec of companionUsers) {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: spec.email } },
      limit: 1,
    })
    if (existing.docs.length === 0) {
      await payload.create({ collection: 'users', data: spec })
      payload.logger.info(`  created ${spec.email} / ${spec.password}`)
    }
  }

  // 2. Reset content collections for a clean, repeatable seed.
  payload.logger.info('Seed: clearing projects / pages / posts / media / tags…')
  for (const collection of ['projects', 'pages', 'posts', 'media', 'tags'] as const) {
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
    { from: '#4f46e5', to: '#7c3aed', alt: 'Indigo-violet gradient cover' },
    { from: '#059669', to: '#0891b2', alt: 'Emerald-cyan gradient cover' },
    { from: '#db2777', to: '#e11d48', alt: 'Pink-rose gradient cover' },
    { from: '#d97706', to: '#dc2626', alt: 'Amber-red gradient cover' },
    { from: '#0ea5e9', to: '#6366f1', alt: 'Sky-indigo gradient cover' },
    { from: '#8b5cf6', to: '#d946ef', alt: 'Violet-fuchsia gradient cover' },
    { from: '#14b8a6', to: '#84cc16', alt: 'Teal-lime gradient cover' },
    { from: '#f59e0b', to: '#f43f5e', alt: 'Amber-rose gradient cover' },
  ]
  const media: Media[] = []
  for (let i = 0; i < mediaSpecs.length; i++) {
    const spec = mediaSpecs[i]
    const data = await placeholderPng(spec.from, spec.to)
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

  // 6b. Pages — block-built documents that show off the themed blocks list
  // (per-type icons, unified row list) and the Add Layout drawer.
  payload.logger.info('Seed: creating pages…')
  const heroBlock = (heading: string, tagline: string, cover: number) => ({
    blockType: 'hero' as const,
    heading,
    tagline,
    ctaLabel: 'Get started',
    ctaUrl: '/contact',
    image: mediaId(cover),
  })
  const contentBlock = (paragraphs: string[]) => ({
    blockType: 'content' as const,
    richText: lexical(paragraphs),
  })
  const statsBlock = () => ({
    blockType: 'stats' as const,
    items: [
      { label: 'Projects shipped', value: '120+' },
      { label: 'Avg. NPS', value: '68' },
      { label: 'Team members', value: '14' },
      { label: 'Years running', value: '9' },
    ],
  })
  const galleryBlock = (start: number) => ({
    blockType: 'gallery' as const,
    items: [
      { image: mediaId(start), caption: 'Launch day' },
      { image: mediaId(start + 1), caption: 'Design review' },
      { image: mediaId(start + 2), caption: 'The team' },
    ],
  })
  const quoteBlock = (quote: string, author: string, authorRole: string) => ({
    blockType: 'quote' as const,
    quote,
    author,
    authorRole,
  })
  const ctaBlock = (heading: string) => ({
    blockType: 'cta' as const,
    heading,
    label: 'Talk to us',
    url: '/contact',
  })

  const pageSpecs = [
    {
      title: 'Home',
      slug: 'home',
      status: 'published' as const,
      summary: 'The agency front page — hero, numbers, work and a closing call to action.',
      layout: [
        heroBlock('We design admin panels people enjoy', 'A studio for CMS-driven products.', 0),
        statsBlock(),
        contentBlock([
          'We build editorial tools, dashboards and design systems for content teams.',
        ]),
        galleryBlock(4),
        quoteBlock(
          'The panel stopped feeling like a database UI and started feeling like our product.',
          'Maya Chen',
          'Head of Content, Northwind',
        ),
        ctaBlock('Ready to reskin your admin?'),
      ],
    },
    {
      title: 'About',
      slug: 'about',
      status: 'published' as const,
      summary: 'Who we are and how we work.',
      layout: [
        heroBlock('A small team with strong opinions', 'Nine years of CMS craft.', 5),
        contentBlock([
          'We believe the admin panel is a product surface, not an afterthought.',
          'Every engagement starts with the people who write, edit and publish.',
        ]),
        quoteBlock('Editors first, pixels second.', 'Studio motto', ''),
      ],
    },
    {
      title: 'Services',
      slug: 'services',
      status: 'published' as const,
      summary: 'What we do, from audits to full builds.',
      layout: [
        heroBlock('Services', 'Audits, theming, custom fields and full builds.', 6),
        statsBlock(),
        ctaBlock('Get a quote this week'),
      ],
    },
    {
      title: 'Contact',
      slug: 'contact',
      status: 'draft' as const,
      summary: 'How to reach the studio.',
      layout: [
        heroBlock('Say hello', 'We reply within one business day.', 7),
        contentBlock(['Email hello@example.com or use the form below.']),
      ],
    },
  ]
  const createdPages = []
  for (let i = 0; i < pageSpecs.length; i++) {
    const spec = pageSpecs[i]
    const isDraft = spec.status === 'draft'
    createdPages.push(
      await payload.create({
        collection: 'pages',
        draft: isDraft,
        data: {
          createdAt: daysAgo([2, 6, 13, 19][i % 4]),
          _status: isDraft ? 'draft' : 'published',
          ...spec,
        },
      }),
    )
  }

  // 6c. Projects — the field-type showcase collection (tabs, radio, number,
  // email, date, code, JSON, multi-select, relationships).
  payload.logger.info('Seed: creating projects…')
  const projectSpecs = [
    {
      name: 'Northwind Editorial Platform',
      client: 'Northwind Media',
      stage: 'delivered' as const,
      budget: 84000,
      launchDate: '2026-04-14',
      services: ['design', 'development'] as const,
      retainer: true,
      cover: 0,
      contactEmail: 'maya@northwind.example',
      repoUrl: 'https://github.com/northwind/editorial',
      deployCommand: 'pnpm build && railway up --service editorial',
      integrations: { analytics: 'plausible', search: 'typesense', cdn: 'cloudflare' },
    },
    {
      name: 'Atlas Commerce Admin',
      client: 'Atlas Goods',
      stage: 'in-progress' as const,
      budget: 126000,
      launchDate: '2026-09-01',
      services: ['development', 'consulting'] as const,
      retainer: false,
      cover: 4,
      contactEmail: 'ops@atlasgoods.example',
      repoUrl: 'https://github.com/atlas/commerce-admin',
      deployCommand: 'vercel deploy --prod',
      integrations: { payments: 'stripe', shipping: 'shippo' },
    },
    {
      name: 'Lighthouse Docs Redesign',
      client: 'Lighthouse Labs',
      stage: 'discovery' as const,
      budget: 32000,
      launchDate: null,
      services: ['design', 'branding'] as const,
      retainer: false,
      cover: 5,
      contactEmail: 'team@lighthouse.example',
      repoUrl: '',
      deployCommand: '',
      integrations: null,
    },
    {
      name: 'Fieldnotes Mobile CMS',
      client: 'Fieldnotes',
      stage: 'in-progress' as const,
      budget: 58000,
      launchDate: '2026-08-10',
      services: ['development'] as const,
      retainer: true,
      cover: 6,
      contactEmail: 'dev@fieldnotes.example',
      repoUrl: 'https://github.com/fieldnotes/cms',
      deployCommand: 'fly deploy',
      integrations: { push: 'onesignal' },
    },
    {
      name: 'Harbor Brand System',
      client: 'Harbor Hotels',
      stage: 'on-hold' as const,
      budget: 45000,
      launchDate: null,
      services: ['branding', 'seo'] as const,
      retainer: false,
      cover: 7,
      contactEmail: 'marketing@harbor.example',
      repoUrl: '',
      deployCommand: '',
      integrations: null,
    },
    {
      name: 'Quartz Analytics Portal',
      client: 'Quartz BI',
      stage: 'delivered' as const,
      budget: 97000,
      launchDate: '2026-02-27',
      services: ['design', 'development', 'consulting'] as const,
      retainer: true,
      cover: 1,
      contactEmail: 'hello@quartz.example',
      repoUrl: 'https://github.com/quartz/portal',
      deployCommand: 'pnpm build && pnpm deploy:portal',
      integrations: { warehouse: 'bigquery', charts: 'custom' },
    },
  ]
  const createdProjects = []
  for (let i = 0; i < projectSpecs.length; i++) {
    const spec = projectSpecs[i]
    createdProjects.push(
      await payload.create({
        collection: 'projects',
        data: {
          createdAt: daysAgo([1, 5, 8, 14, 22, 27][i % 6]),
          ...spec,
          cover: mediaId(spec.cover),
          services: [...spec.services],
          brief: lexical([
            `${spec.name} for ${spec.client} — scope, constraints and the definition of done.`,
          ]),
          relatedPosts: createdPosts[i % createdPosts.length]
            ? [createdPosts[i % createdPosts.length].id]
            : [],
        },
      }),
    )
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
    `Seed complete: ${tags.length} tags, ${media.length} media, ${createdPosts.length} posts, ` +
      `${createdPages.length} pages, ${createdProjects.length} projects.`,
  )
  process.exit(0)
}

run().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
