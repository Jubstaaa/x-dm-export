import type { ItemResource, PublishResponse } from 'chrome-webstore-upload'
import * as z from 'zod/mini'

export interface PublishEnv {
    accessToken: string
    extensionId: string
    publisherId: string
    zipPath: string
}

const requiredString = z.string().check(z.minLength(1))

const publishEnvSchema = z.object({
    ACCESS_TOKEN: requiredString,
    EXTENSION_ID: requiredString,
    PUBLISHER_ID: requiredString,
    ZIP_PATH: requiredString,
})

// A review-pending or published item is a successful submission; anything else needs a human.
const ACCEPTED_PUBLISH_STATES = new Set([
    'PENDING_REVIEW',
    'PUBLISHED',
    'PUBLISHED_TO_TESTERS',
    'STAGED',
])

export function readPublishEnv(
    env: Record<string, string | undefined>
): PublishEnv {
    const result = publishEnvSchema.safeParse(env)
    if (!result.success) {
        const missing = result.error.issues.map(issue => issue.path.join('.'))
        throw new Error(`Missing environment variables: ${missing.join(', ')}`)
    }
    const { ACCESS_TOKEN, EXTENSION_ID, PUBLISHER_ID, ZIP_PATH } = result.data
    return {
        accessToken: ACCESS_TOKEN,
        extensionId: EXTENSION_ID,
        publisherId: PUBLISHER_ID,
        zipPath: ZIP_PATH,
    }
}

export function assertUploadSucceeded(item: ItemResource): void {
    if (item.uploadState !== 'SUCCEEDED') {
        throw new Error(
            `Chrome Web Store upload of ${item.name} ended in state ${item.uploadState}`
        )
    }
}

export function assertPublishAccepted(response: PublishResponse): void {
    if (!ACCEPTED_PUBLISH_STATES.has(response.state)) {
        throw new Error(
            `Chrome Web Store publish of ${response.name} ended in state ${response.state}`
        )
    }
}
