import './chrome-stub'

import { createRoot } from 'react-dom/client'

import './screens.css'

import {
    ChatScene,
    ExportScene,
    HeroScene,
    PopupScene,
    TileScene,
} from './scenes'

const SCENES = {
    chat: ChatScene,
    export: ExportScene,
    hero: HeroScene,
    popup: PopupScene,
    tile: TileScene,
}

const name = new URLSearchParams(location.search).get(
    'scene'
) as keyof typeof SCENES
const Scene = SCENES[name] ?? HeroScene

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')
createRoot(root).render(<Scene />)
