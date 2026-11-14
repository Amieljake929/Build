import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import PageTitle from '../components/PageTitle'

const ease = [0.22, 1, 0.36, 1]

// Edit this list to add, remove or reorder anything on the page.
const SECTIONS = [
  {
    title: 'Stacks & Tools',
    items: [
      {
        name: 'Introduction to MERN Stack',
        desc: 'A free, beginner-friendly course on building full-stack apps with MongoDB, Express, React, and Node.js.',
        url: 'https://simpli-web.app.link/e/s6L2LISsrVb',
      },
    ],
  },
  {
    title: 'Assessments',
    items: [
      {
        name: 'CodeCred',
        desc: 'A platform for taking coding assessments and earning verified credentials to showcase your skills.',
        url: 'https://www.codecred.dev/login',
      },
      {
        name: 'freeCodeCamp',
        desc: 'A platform for learning web development and earning certificates.',
        url: 'https://www.freecodecamp.org/',
      },
    ],
  },
  {
    title: 'Templates & UI Kits',
    items: [
      {
        name: 'Framer',
        desc: 'A design tool for building interactive prototypes and websites with React.',
        url: 'https://www.framer.com/',
      },
      {
        name: 'Figma',
        desc: 'A collaborative interface design tool for creating UI/UX designs, prototypes, and graphics.',
        url: 'https://www.figma.com/community/website-templates?resource_type=files',
      },
    ],
  },
  {
    title: 'Learn AI & ML',
    items: [
      {
        name: 'Generative AI',
        desc: 'A comprehensive guide to understanding and using generative AI tools.',
        url: 'https://simpli-web.app.link/e/S6pUXy2brVb',
      },
      {
        name: 'Hugging Face LLM Course',
        desc: 'A free course on large language models, transformers, and natural language processing.',
        url: 'https://huggingface.co/learn/llm-course/chapter1/1',
      },
    ],
  },
]

function ResourceLink({ item }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block py-3"
    >
      <span className="flex items-center gap-2 text-base text-fg">
        <span className="transition-colors duration-300 group-hover:text-accent">{item.name}</span>
        <ArrowUpRight
          className="size-3.5 text-muted transition-[translate,color] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
          aria-hidden="true"
        />
      </span>
      <span className="mt-1 block text-sm leading-relaxed text-muted">{item.desc}</span>
    </a>
  )
}

export default function Resources() {
  return (
    <PageTransition>
      <section className="w-[min(100%,52rem)]">
        <PageTitle>Resources</PageTitle>

        <div className="flex flex-col gap-14">
          {SECTIONS.map((section, si) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease, delay: 0.15 + si * 0.08 },
              }}
            >
              <h2 className="ui-label text-[0.7rem] tracking-[0.18em] text-muted uppercase">
                {section.title}
              </h2>

              <div className="mt-5 grid gap-x-16 sm:grid-cols-2">
                {section.items.map((item) => (
                  <ResourceLink key={item.url} item={item} />
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      </section>
    </PageTransition>
  )
}