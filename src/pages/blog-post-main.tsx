import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import '../immohrtal-growth.css'
import '../immohrtal-design-upgrade.css'
import { BlogPostPage } from './BlogPostPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BlogPostPage />
  </StrictMode>,
)
