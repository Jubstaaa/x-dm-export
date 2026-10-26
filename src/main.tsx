import { createRoot } from 'react-dom/client'

import { Popup } from '@/popup/popup'

import '@/index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
document.documentElement.classList.toggle('dark', darkQuery.matches)

createRoot(root).render(<Popup />)
