import { motion } from 'framer-motion'

export default function PageTransition({ children }) {
  return (
    <motion.main
      className="flex flex-1 flex-col items-center justify-center py-12"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.main>
  )
}
