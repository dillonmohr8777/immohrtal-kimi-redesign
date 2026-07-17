import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import '../immohrtal-growth.css'
import '../immohrtal-design-upgrade.css'
import { PressPage } from './PressPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PressPage />
  </StrictMode>,
)
