import { encode } from 'cbor-x'
import initSqlJs from 'sql.js'

const SCHEMA = `
CREATE TABLE dm_user (id INTEGER, screen_name TEXT, nickname TEXT, contents BLOB);
CREATE TABLE dm_group_participant (conversation_id TEXT, user_id INTEGER, is_current_member INTEGER);
CREATE TABLE dm_conversation (conversation_id TEXT, custom_title TEXT);
CREATE TABLE dm_entry (entry_id TEXT, conversation_id TEXT, sequence_number INTEGER, timestamp INTEGER,
    entry_type TEXT, sender_id INTEGER, plain_text TEXT, has_attachment INTEGER);
CREATE TABLE dm_reaction (conv_id TEXT, entry_sequence_number INTEGER, emoji TEXT, added_by_user INTEGER, deleted INTEGER);
`

export interface FixtureData {
    entries: FixtureEntry[]
    members?: { chatId: string; current?: boolean; userId: string }[]
    reactions?: {
        by: string
        chatId: string
        deleted?: boolean
        emoji: string
        seq: number
    }[]
    titles?: { chatId: string; title: null | string }[]
    users: FixtureUser[]
}

export interface FixtureEntry {
    attachment?: boolean
    chatId: string
    id: string
    sender: string
    seq: number
    text?: null | string
    timestamp: number
    type?: string
}

export interface FixtureUser {
    contents?: unknown
    id: string
    nickname?: null | string
    screenName?: null | string
}

export async function buildChatDatabaseBytes(
    data: FixtureData
): Promise<Uint8Array> {
    const SQL = await initSqlJs({ locateFile: () => chrome.runtime.getURL('') })
    const db = new SQL.Database()
    db.exec(SCHEMA)
    for (const user of data.users) {
        db.run('INSERT INTO dm_user VALUES (?, ?, ?, ?)', [
            user.id,
            user.screenName ?? null,
            user.nickname ?? null,
            user.contents === undefined
                ? null
                : user.contents instanceof Uint8Array
                  ? user.contents
                  : encode(user.contents),
        ])
    }
    for (const member of data.members ?? []) {
        db.run('INSERT INTO dm_group_participant VALUES (?, ?, ?)', [
            member.chatId,
            member.userId,
            member.current === false ? 0 : 1,
        ])
    }
    for (const title of data.titles ?? []) {
        db.run('INSERT INTO dm_conversation VALUES (?, ?)', [
            title.chatId,
            title.title,
        ])
    }
    for (const entry of data.entries) {
        db.run('INSERT INTO dm_entry VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
            entry.id,
            entry.chatId,
            entry.seq,
            entry.timestamp,
            entry.type ?? 'message',
            entry.sender,
            entry.text === undefined ? `text ${entry.id}` : entry.text,
            entry.attachment ? 1 : 0,
        ])
    }
    for (const reaction of data.reactions ?? []) {
        db.run('INSERT INTO dm_reaction VALUES (?, ?, ?, ?, ?)', [
            reaction.chatId,
            reaction.seq,
            reaction.emoji,
            reaction.by,
            reaction.deleted ? 1 : 0,
        ])
    }
    const bytes = db.export()
    db.close()
    return bytes
}
