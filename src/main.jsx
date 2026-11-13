import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Landing from './Landing.jsx'
import About from './About.jsx'
import F1Predictor from './F1Predictor.jsx'
import Work from './Work.jsx'
import { pages } from './seo.js'

// Keep the tab title and description in sync on client-side navigation.
function Seo() {
  const { pathname } = useLocation()
  React.useEffect(() => {
    const p = pages[pathname.replace(/\/$/, '') || '/']
    if (!p) return
    document.title = p.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', p.description)
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Seo />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/f1predictor" element={<F1Predictor />} />
        <Route path="/fintech" element={<Work slug="fintech" />} />
        <Route path="/creative" element={<Work slug="creative" />} />
        <Route path="/edtech" element={<Work slug="edtech" />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  </React.StrictMode>,
)
