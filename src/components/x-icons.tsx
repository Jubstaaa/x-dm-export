import type { ComponentProps } from 'react'

type IconProps = ComponentProps<'svg'>

function XIcon({ children, ...props }: IconProps) {
    return (
        <svg
            aria-hidden="true"
            display="flex"
            fill="currentColor"
            height="1em"
            viewBox="0 0 24 24"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
            {...props}>
            {children}
        </svg>
    )
}

export function DownloadIcon(props: IconProps) {
    return (
        <XIcon {...props}>
            <path d="M11 3h2v10.586l3.793-3.793 1.414 1.414L12 17.414l-6.207-6.207 1.414-1.414L11 13.586V3zM3 15h2v3.5c0 .276.224.5.5.5h13a.5.5 0 0 0 .5-.5V15h2v3.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5V15z" />
        </XIcon>
    )
}

export function SpinnerIcon(props: IconProps) {
    return (
        <XIcon {...props}>
            <path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2z">
                <animateTransform
                    attributeName="transform"
                    dur="0.8s"
                    from="0 12 12"
                    repeatCount="indefinite"
                    to="360 12 12"
                    type="rotate"
                />
            </path>
        </XIcon>
    )
}

export function CheckIcon(props: IconProps) {
    return (
        <XIcon {...props}>
            <path d="M9.5 16.086 4.707 11.293l-1.414 1.414L9.5 18.914 20.707 7.707l-1.414-1.414z" />
        </XIcon>
    )
}

export function AlertIcon(props: IconProps) {
    return (
        <XIcon {...props}>
            <path d="M12 2 1 21h22L12 2zm0 4.2L19.53 19H4.47L12 6.2zM11 10v5h2v-5h-2zm0 6v2h2v-2h-2z" />
        </XIcon>
    )
}

export function MediaIcon(props: IconProps) {
    return (
        <XIcon {...props}>
            <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13zM5.5 5a.5.5 0 0 0-.5.5v9.086l3-3 3 3 5-5 3 3V5.5a.5.5 0 0 0-.5-.5h-13zM19 17.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13a.5.5 0 0 0 .5-.5v-1.086zM8.5 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
        </XIcon>
    )
}

export function TextIcon(props: IconProps) {
    return (
        <XIcon {...props}>
            <path d="M6.5 3A2.5 2.5 0 0 0 4 5.5v13A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V9.586L13.414 3H6.5zM6 5.5a.5.5 0 0 1 .5-.5H12v6h6v7.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-13zM14 6.414 16.586 9H14V6.414zM8 13h8v2H8v-2zm0 3h5v2H8v-2z" />
        </XIcon>
    )
}
