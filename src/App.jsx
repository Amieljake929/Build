import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import Header from './components/Header'
import Footer from './components/Footer'
import Index from './pages/Index'
import Overview from './pages/Overview'
import Builds from './pages/Builds'
import Blog from './pages/Blog'
import Reach from './pages/Reach'

export default function App() {
  const location = useLocation()

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col px-[clamp(1.25rem,6vw,5.5rem)] pt-[clamp(1.25rem,4vw,3.5rem)] pb-[calc(clamp(1.25rem,4vw,3.5rem)_+_env(safe-area-inset-bottom,0px))]">
        <Header />

        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Index />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/builds" element={<Builds />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/reach" element={<Reach />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>

        <Footer />
      </div>
    </MotionConfig>
  )
}