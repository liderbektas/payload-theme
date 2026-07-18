import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const GET = async (_request: Request) => {
  const payload = await getPayload({
    config: configPromise,
  })

  return Response.json({
    message: 'This is an example of a custom route.',
    // the local API is available here — e.g. count the visible users
    users: (await payload.count({ collection: 'users' })).totalDocs,
  })
}
