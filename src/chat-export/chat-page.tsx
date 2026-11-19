import CHAT_HTML_STYLE from './chat-html.css?raw'
import type { ChatMediaRef, ChatMessage, ChatSummary } from './chat.types'

type MediaByMessage = Map<string, ChatMediaRef>

const MISSING_MEDIA_LABEL = 'Media not available on this device'

const formatDateTime = (timestamp: number) =>
    new Date(timestamp).toLocaleString()

const formatDay = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

function MediaView({ media }: { media: ChatMediaRef }) {
    if (media.mime.startsWith('video/'))
        return <video controls src={media.path} />
    return <img alt="" loading="lazy" src={media.path} />
}

function MessageView({
    media,
    message,
}: {
    media: ChatMediaRef | undefined
    message: ChatMessage
}) {
    if (message.type !== 'message') {
        return <div className="info">{message.text ?? message.type}</div>
    }
    return (
        <div className={`msg ${message.isOwn ? 'own' : 'other'}`}>
            <div className="bubble">
                {media ? (
                    <MediaView media={media} />
                ) : (
                    message.hasAttachment && (
                        <div className="missing">{MISSING_MEDIA_LABEL}</div>
                    )
                )}
                {message.text && <div>{message.text}</div>}
                {message.reactions.length > 0 && (
                    <div className="reactions">
                        {message.reactions.map(r => r.emoji).join(' ')}
                    </div>
                )}
            </div>
            <div className="meta">
                {message.sender.name} · {formatDateTime(message.sentAt)}
            </div>
        </div>
    )
}

function groupByDay(messages: ChatMessage[]) {
    const days: { day: string; messages: ChatMessage[] }[] = []
    for (const message of messages) {
        const day = formatDay(message.sentAt)
        const current = days.at(-1)
        if (current?.day === day) current.messages.push(message)
        else days.push({ day, messages: [message] })
    }
    return days
}

export function ChatPage({
    chat,
    exportedAt,
    media,
    messages,
}: {
    chat: ChatSummary
    exportedAt: number
    media: MediaByMessage
    messages: ChatMessage[]
}) {
    const avatar = chat.isGroup
        ? null
        : messages.find(message => !message.isOwn)?.sender.avatarUrl
    const first = messages.at(0)
    const last = messages.at(-1)
    const range =
        first && last
            ? `${formatDateTime(first.sentAt)} – ${formatDateTime(last.sentAt)}`
            : ''

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    content="width=device-width,initial-scale=1"
                    name="viewport"
                />
                <title>{chat.name}</title>
                {/* Static stylesheet bundled with the extension, no user data. */}
                <style dangerouslySetInnerHTML={{ __html: CHAT_HTML_STYLE }} />
            </head>
            <body>
                <header>
                    {avatar && <img alt="" src={avatar} />}
                    <div>
                        <h1>{chat.name}</h1>
                        <p>
                            {messages.length} messages · {range}
                        </p>
                    </div>
                </header>
                <main>
                    {groupByDay(messages).map(
                        ({ day, messages: dayMessages }) => (
                            <section key={day}>
                                <div className="day">{day}</div>
                                {dayMessages.map(message => (
                                    <MessageView
                                        key={message.id}
                                        media={media.get(message.id)}
                                        message={message}
                                    />
                                ))}
                            </section>
                        )
                    )}
                </main>
                <footer>
                    Exported {formatDateTime(exportedAt)} with DM Export for X
                </footer>
            </body>
        </html>
    )
}
