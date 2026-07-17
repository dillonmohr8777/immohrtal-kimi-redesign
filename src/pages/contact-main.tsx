import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import '../immohrtal-growth.css'
import '../immohrtal-design-upgrade.css'
import { ContactPage } from './ContactPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ContactPage />
  </StrictMode>,
)
