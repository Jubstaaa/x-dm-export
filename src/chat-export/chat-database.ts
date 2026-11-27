import type { Database, SqlJsStatic, SqlValue } from 'sql.js'

import { decode } from 'cbor-x'
import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import * as z from 'zod/mini'

import type {
    ChatDatabase,
    ChatMessage,
    ChatReaction,
    ChatSummary,
    ChatUser,
} from './chat.types'

type Row = Record<string, SqlValue>

function queryAll(db: Database, sql: string, params: SqlValue[] = []): Row[] {
    const statement = db.prepare(sql)
    statement.bind(params)
    const rows: Row[] = []
    while (statement.step()) rows.push(statement.getAsObject())
    statement.free()
    return rows
}

const avatarUrl = z.pipe(
    z.url({ hostname: /^pbs\.twimg\.com$/, protocol: /^https$/ }),
    z.transform(url => url.replace('_normal.', '_bigger.'))
)

const profileFields = z.object({
    name: z.catch(z.optional(z.string()), undefined),
    profileImageUrl: z.catch(z.optional(avatarUrl), undefined),
})

const storedProfile = z.union([
    z.pipe(
        z.object({ user: profileFields }),
        z.transform(({ user }) => user)
    ),
    profileFields,
])

type StoredProfile = z.infer<typeof storedProfile>

function loadGroupMembers(db: Database): Map<string, string[]> {
    const members = new Map<string, string[]>()
    const rows = queryAll(
        db,
        'SELECT conversation_id, CAST(user_id AS TEXT) AS user_id FROM dm_group_participant WHERE is_current_member = 1'
    )
    for (const row of rows) {
        const chatId = String(row.conversation_id)
        members.set(chatId, [
            ...(members.get(chatId) ?? []),
            String(row.user_id),
        ])
    }
    return members
}

function loadUsers(db: Database): Map<string, ChatUser> {
    const rows = queryAll(
        db,
        'SELECT CAST(id AS TEXT) AS id, screen_name, nickname, contents FROM dm_user'
    )
    return new Map(
        rows.map(row => {
            const id = String(row.id)
            const profile = readProfile(row.contents ?? null)
            const handle = String(row.screen_name || id)
            return [
                id,
                {
                    avatarUrl: profile.profileImageUrl ?? null,
                    handle,
                    id,
                    name: String(row.nickname || profile.name || handle),
                },
            ]
        })
    )
}

function readProfile(contents: SqlValue): StoredProfile {
    if (!(contents instanceof Uint8Array)) return {}
    try {
        return storedProfile.safeParse(decode(contents)).data ?? {}
    } catch {
        return {}
    }
}

let sqlJs: Promise<SqlJsStatic> | undefined

export async function openChatDatabase(
    bytes: Uint8Array,
    ownerId: string
): Promise<ChatDatabase> {
    sqlJs ??= initSqlJs({ locateFile: () => chrome.runtime.getURL(wasmUrl) })
    const SQL = await sqlJs
    const db = new SQL.Database(bytes)
    const users = loadUsers(db)
    const groupMembers = loadGroupMembers(db)

    const getUser = (id: string): ChatUser =>
        users.get(id) ?? { avatarUrl: null, handle: id, id, name: id }
    const owner = getUser(ownerId)

    const memberIds = (chatId: string) => [
        ...new Set(
            groupMembers.get(chatId) ??
                chatId.split(':').filter(id => /^\d+$/.test(id))
        ),
    ]

    const listChats = (): ChatSummary[] =>
        queryAll(
            db,
            `SELECT e.conversation_id AS id, COUNT(*) AS message_count, MIN(e.timestamp) AS first_at,
                    MAX(e.timestamp) AS last_at, c.custom_title AS title
             FROM dm_entry e LEFT JOIN dm_conversation c ON c.conversation_id = e.conversation_id
             GROUP BY e.conversation_id
             ORDER BY last_at DESC`
        ).map(row => {
            const id = String(row.id)
            const participants = memberIds(id).map(getUser)
            const others = participants.filter(user => user.id !== ownerId)
            return {
                firstAt: Number(row.first_at),
                id,
                isGroup: id.startsWith('g'),
                lastAt: Number(row.last_at),
                messageCount: Number(row.message_count),
                name: String(
                    row.title ||
                        others.map(user => user.name).join(', ') ||
                        `@${owner.handle}`
                ),
                participants,
            }
        })

    const getReactions = (chatId: string): Map<number, ChatReaction[]> => {
        const reactions = new Map<number, ChatReaction[]>()
        const rows = queryAll(
            db,
            `SELECT entry_sequence_number AS seq, emoji, CAST(added_by_user AS TEXT) AS user_id
             FROM dm_reaction WHERE conv_id = ? AND deleted = 0`,
            [chatId]
        )
        for (const row of rows) {
            const seq = Number(row.seq)
            const reaction = {
                by: getUser(String(row.user_id)).name,
                emoji: String(row.emoji),
            }
            reactions.set(seq, [...(reactions.get(seq) ?? []), reaction])
        }
        return reactions
    }

    const getMessages = (chatId: string): ChatMessage[] => {
        const reactions = getReactions(chatId)
        return queryAll(
            db,
            `SELECT entry_id, sequence_number, timestamp, entry_type, CAST(sender_id AS TEXT) AS sender_id,
                    plain_text, has_attachment
             FROM dm_entry WHERE conversation_id = ?
             ORDER BY timestamp, sequence_number`,
            [chatId]
        ).map(row => ({
            hasAttachment: Boolean(row.has_attachment),
            id: String(row.entry_id),
            isOwn: String(row.sender_id) === ownerId,
            reactions: reactions.get(Number(row.sequence_number)) ?? [],
            sender: getUser(String(row.sender_id)),
            sentAt: Number(row.timestamp),
            text: row.plain_text === null ? null : String(row.plain_text),
            type: String(row.entry_type),
        }))
    }

    const hasMessages = (messageIds: string[]): boolean => {
        if (!messageIds.length) return true
        const [row] = queryAll(
            db,
            `SELECT COUNT(*) AS count FROM dm_entry
             WHERE entry_id IN (${messageIds.map(() => '?').join(', ')})`,
            messageIds
        )
        return Number(row?.count) === new Set(messageIds).size
    }

    return {
        close: () => {
            db.close()
        },
        getMessages,
        hasMessages,
        listChats,
        owner,
    }
}
