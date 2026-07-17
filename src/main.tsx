import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './immohrtal-growth.css'
import './immohrtal-design-upgrade.css'
import './immohrtal-home-fixes.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
