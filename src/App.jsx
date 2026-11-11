import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import Header from './components/Header'
import Index from './pages/Index'
import Builds from './pages/Builds'
import Notes from './pages/Notes'
import Blog from './pages/Blog'
import Reach from './pages/Reach'

export default function App() {
  const location = useLocation()

  return (
    <MotionConfig reducedMotion="user">
      {/* px-(--page-x): left/right page margin, defined in index.css */}
      <div className="flex min-h-dvh flex-col px-(--page-x) pt-[clamp(1.25rem,4vw,3.5rem)] pb-[calc(clamp(1.25rem,4vw,3.5rem)_+_env(safe-area-inset-bottom,0px))]">
        <Header />

        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Index />} />
            <Route path="/builds" element={<Builds />} />
            <Route path="/notes/:slug?" element={<Notes />} />
            <Route path="/blog/:slug?" element={<Blog />} />
            <Route path="/reach" element={<Reach />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}