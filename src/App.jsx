import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import Header from './components/Header'
import TypingTest from './components/TypingTest'
import Index from './pages/Index'
import Builds from './pages/Builds'
import Notes from './pages/Notes'
import Blog from './pages/Blog'
import Resources from './pages/Resources'
import Reach from './pages/Reach'

export default function App() {
  const location = useLocation()

  return (
    <MotionConfig reducedMotion="user">
      {/* px-(--page-x) / pt-(--pad-top): page margins, defined in index.css */}
      <div className="flex min-h-dvh flex-col px-(--page-x) pt-(--pad-top) pb-[calc(var(--pad-top)_+_env(safe-area-inset-bottom,0px))]">
        <Header />

        {/* No initial={false} here, so pages also animate in on the very first load */}
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Index />} />
            <Route path="/builds" element={<Builds />} />
            <Route path="/notes/:slug?" element={<Notes />} />
            <Route path="/blog/:slug?" element={<Blog />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/reach" element={<Reach />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>

      {/* Floating typing-test button (bottom right) and its modal */}
      <TypingTest />
    </MotionConfig>
  )
}