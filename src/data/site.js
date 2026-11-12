// Edit your content here. Everything marked TODO is placeholder.

export const NAME = 'Amiel Jake'
export const NAME_KO = '애밀 제이크' // used by the old glitch Index page (currently unused)
// Shown under your username on the landing page
export const ROLES = ['Web Designer', 'Full Stack Developer']
export const LOCATION = 'Quezon City, PH'
export const EMAIL = 'amieljakebaril@gmail.com'

// File lives in /public, so it is served from the site root.
// Must match the real filename in public/ exactly. Avoid spaces in the name.
export const RESUME_URL = '/Amiel-Jake-Baril.pdf'

export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Builds', to: '/builds' },
  { label: 'Notes', to: '/notes' },
  { label: 'Blog', to: '/blog' },
  { label: 'Reach', to: '/reach' },
]

// Used on the Reach page (and by Footer if you bring it back).
export const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/Amieljake929' }, // TODO
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/amiel-jake-baril-316366412/' }, // TODO
  { label: 'Instagram', href: 'https://www.instagram.com/amieljake/' }, // TODO
  { label: 'Facebook', href: 'https://www.facebook.com/amieljakee/' }, // TODO
  { label: 'Email', href: `mailto:${EMAIL}`, external: false },
]

/* ---------- Landing page (Index.jsx) ---------- */
export const USERNAME = '@amieljake'
// The @amieljake heading on the landing page links here
export const X_URL = 'https://x.com/amieljakee'

// Each string is one paragraph in the Bio
export const BIO = [
  "Hello! My name is Amiel Jake and I enjoy creating things that live on the internet. I'm a web designer and full stack developer based in Quezon City, Philippines.",
  'I focus on building clean, accessible and responsive websites, from the first sketch in Figma to the final deploy on Vercel.',
  "When I'm not designing or coding, I'm usually exploring new tools, refining my portfolio, or listening to music.",
]

// Small facts shown under the bio on the landing page (Email is added after these)
// Note: Index.jsx hides the Status row, but it is kept here in case other pages use it.
export const FACTS = [
  { label: 'Based in', value: LOCATION },
  { label: 'Status', value: 'Open to freelance and internships' },
]

/* ---------- Notes (Index.jsx list + Notes.jsx pages) ----------
   `slug` is the URL: /notes/<slug>. `summary` shows on the Notes list page.
   Each note has `sections`: a heading and a list of bullet `points`. */
export const NOTES = [
  {
    slug: 'things-i-believe',
    title: 'Things I believe',
    summary: 'The small principles I try to build and work by.',
    sections: [
      {
        heading: 'Shipping beats perfecting',
        points: [
          'A live page teaches me more than a folder of drafts',
          'Small projects that get finished beat big projects that get abandoned',
          'Make it work, make it clean, then make it fast, in that order',
          'Feedback from real people is worth more than another hour of tweaking',
          'A deadline, even one I set myself, is a design tool',
        ],
      },
      {
        heading: 'Consistency over talent',
        points: [
          'Thirty minutes every day beats one heroic weekend',
          'Skill is mostly hours spent paying attention',
          'Being a beginner for a long time is normal, not a sign I am bad at this',
          'Small improvements compound quietly',
          'Compare myself to who I was last month, not to someone with ten years of practice',
        ],
      },
      {
        heading: 'Be kind and be useful',
        points: [
          'Helping other people is one of the fastest ways to learn',
          'Credit the people whose work I learned from',
          'Be honest about what I do not know yet',
          'Say thank you often and mean it',
          'Good work is easier to do with good people around',
        ],
      },
    ],
  },
  {
    slug: 'understanding-ai',
    title: 'Understanding AI',
    summary: 'How I think about AI tools as a developer.',
    sections: [
      {
        heading: 'How I use it',
        points: [
          'First drafts, boilerplate, regex and explaining confusing error messages',
          'A rubber duck that answers back when I am stuck',
          'Comparing a few approaches before I commit to one',
          'Summarising documentation I would otherwise skim',
        ],
      },
      {
        heading: 'Where it falls short',
        points: [
          'It can be confidently wrong, including inventing functions and packages that do not exist',
          'It does not know my project unless I tell it',
          'Taste and judgment are still my job',
          'It can make me lazy if I let it do the thinking',
        ],
      },
      {
        heading: 'Rules I follow',
        points: [
          'Understand first, then generate',
          'Only keep code I can explain line by line',
          'Check the official docs, run the code, read the diff',
          'Keep passwords, keys and private data out of prompts',
          'Use AI to learn faster, not to skip learning',
        ],
      },
    ],
  },
  {
    slug: 'web-design',
    title: 'Web design',
    summary: 'What I look at first when designing a page.',
    sections: [
      {
        heading: 'Start with the content',
        points: [
          'Write the real text before choosing fonts and colors',
          'Decide the one thing a visitor should see first',
          'Headlines should say what the page is, not try to be clever',
          'Cut every line that does not earn its place',
        ],
      },
      {
        heading: 'Layout and type',
        points: [
          'Spacing does most of the design work',
          'One or two typefaces with clear size steps are enough',
          'Keep lines of text around 60 to 70 characters wide',
          'Align things to a grid, even a simple one',
          'Whitespace is not wasted space',
        ],
      },
      {
        heading: 'Color and motion',
        points: [
          'A neutral base with one accent color',
          'Motion should explain a change, not decorate it',
          'Respect the reduced motion setting',
          'Always check text contrast',
        ],
      },
    ],
  },
  {
    slug: 'frontend-development',
    title: 'Frontend development',
    summary: 'My everyday stack and habits on the frontend.',
    sections: [
      {
        heading: 'My stack',
        points: [
          'React with Vite for fast feedback',
          'Tailwind CSS with a few design tokens',
          'Framer Motion for page transitions',
          'React Router for pages',
          'Git and GitHub, deployed on Vercel',
        ],
      },
      {
        heading: 'How I structure code',
        points: [
          'Small components that each do one job',
          'Content lives in a data file, not inside the JSX',
          'Mobile layout first, then scale up',
          'Name things for what they are',
          'Delete code I no longer use',
        ],
      },
      {
        heading: 'Habits',
        points: [
          'Test on a real phone, not just a resized window',
          'Read the whole error message before searching it',
          'Check the console and network tab first',
          'Make sure everything works with a keyboard',
          'Learn HTML, CSS and JavaScript properly before leaning on a framework',
        ],
      },
    ],
  },
  {
    slug: 'ui-ux',
    title: 'UI / UX',
    summary: 'Notes on making interfaces feel easy.',
    sections: [
      {
        heading: 'Reduce friction',
        points: [
          'Fewer clicks and clearer labels',
          'Make the next step obvious',
          'Give feedback after every action',
          'Do not make people hunt for where things are',
        ],
      },
      {
        heading: 'Design for real people',
        points: [
          'Most visitors are on a phone, often with one hand',
          'Tap targets should be big enough to hit',
          'Error messages should say what happened and how to fix it',
          'Accessibility by default: contrast, labels and focus states',
        ],
      },
      {
        heading: 'My process',
        points: [
          'Sketch the flow in Figma before writing code',
          'Show it to someone and watch quietly',
          'Fix the thing they get stuck on',
          'Write down what I changed and why',
        ],
      },
    ],
  },
  {
    slug: 'personal-projects',
    title: 'Personal projects',
    summary: 'Why I keep building things nobody asked for.',
    sections: [
      {
        heading: 'Why I build them',
        points: [
          'It is the fastest way I learn',
          'Real problems keep me interested longer than exercises',
          'They are proof of what I can do',
          'They are fun',
        ],
      },
      {
        heading: 'What I have made',
        points: [
          'A resume builder with templates and print-ready output',
          'A community chat with a small village mini game',
          'This portfolio, rebuilt from scratch',
        ],
      },
      {
        heading: 'How I pick and finish them',
        points: [
          'One new thing to learn per project',
          'Define a small version one and ship it',
          'Write ideas down instead of starting five at once',
          'Know when to stop and move on',
        ],
      },
    ],
  },
  {
    slug: 'documentation',
    title: 'Documentation',
    summary: 'Why I write things down, even for solo projects.',
    sections: [
      {
        heading: 'Why I write things down',
        points: [
          'Future me is basically a stranger',
          'Explaining something forces me to understand it',
          'A good README is the front door of a project',
        ],
      },
      {
        heading: 'What I document',
        points: [
          'How to install and run the project',
          'Decisions I made and why',
          'Where the editable content lives',
          'Known issues and what is next',
        ],
      },
      {
        heading: 'Keep it light',
        points: [
          'Short and current beats complete and outdated',
          'Comments should explain why, not what',
          'Update the docs in the same commit as the code',
        ],
      },
    ],
  },
  {
    slug: 'learning-in-public',
    title: 'Learning in public',
    summary: 'Sharing the process, not just the result.',
    sections: [
      {
        heading: 'Why share',
        points: [
          'Writing about something forces me to understand it',
          'It leaves a trail other people can learn from',
          'It is a good way to meet people with the same interests',
        ],
      },
      {
        heading: 'What it takes',
        points: [
          'Being okay with being wrong in front of people',
          'Posting unfinished work with a bit of context',
          'Sharing what I learned, not only what I made',
          'Not waiting until I feel like an expert',
        ],
      },
      {
        heading: 'Dealing with cringe',
        points: [
          'Old posts will look cringe later, and that means I improved',
          'Nobody is paying as much attention as I fear',
          'Keep going anyway',
        ],
      },
    ],
  },
]

/* ---------- Builds (Builds.jsx) ----------
   `category` is the small label above the description.
   `href`: external link, or an internal path like '/'. Use '#' if there is no link yet
   (the row then shows no arrow and is not clickable). */
export const BUILDS = [
  {
    title: 'ResuMate',
    category: 'Web app',
    description: 'A resume builder with ready-made templates and print-ready PDF output.',
    href: 'https://resumate-six-wheat.vercel.app/',
  },
  {
    title: 'NOIR',
    category: 'E-commerce',
    description: 'A menswear and womenswear fashion website.',
    href: '#', // TODO
  },
  {
    title: 'Manhattan',
    category: 'Real estate',
    description: 'A website for a real estate business.',
    href: '#', // TODO
  },
  {
    title: 'Kodet',
    category: 'Productivity',
    description:
      'One place for the notes and snippets scattered across editors, chats and browser tabs.',
    href: '#', // TODO
  },
  {
    title: 'My Portfolio',
    category: 'Website',
    description: 'The site you are on: my current personal portfolio.',
    href: '/',
  },
  {
    title: 'SMS3',
    category: 'System',
    description: 'A school management system.',
    href: '#', // TODO
  },
  {
    title: 'Barangay Management System',
    category: 'System',
    description: 'A management system for a barangay.',
    href: '#', // TODO
  },
]

/* ---------- Blog (Index.jsx snippets + Blog.jsx pages) ----------
   `meta` is the date. `excerpt` is the short text in lists.
   `body` is a list: a string = one paragraph, { heading: '...' } = a section heading.
   Newest first. The landing page shows the first 3 posts, the Blog page shows all. */
export const POSTS = [
  {
    slug: 'proof-of-progress',
    title: 'Proof of Progress',
    meta: 'Nov 2026',
    readTime: '4 min read',
    excerpt:
      'Feeling like I am improving is not enough. Here is how I collect real proof that I am getting better.',
    body: [
      'Some days I feel like I am getting better. Other days I feel exactly the same as last month. The problem is that feelings are unreliable, so I stopped trusting them and started collecting proof.',
      { heading: 'Why I need proof' },
      'Doubt is loud when you are learning. It is easy to look at other developers and decide you are behind. Proof is the quiet answer to that voice: something real I can point to and say, I could not do this before.',
      { heading: 'What counts as proof' },
      'A finished project counts, even a small one. A commit history that shows steady work counts. A bug I could not solve in March and fixed in ten minutes in October counts. So does a note I wrote to explain something I used to be confused about.',
      'It does not have to be impressive. It just has to be real and it has to be mine.',
      { heading: 'How I collect it' },
      'I ship things and put them online, because a live page is harder to argue with than an idea. I keep my Git history clean enough to read later. I write notes and blog posts so my thinking leaves a trail. And once in a while I open an old project and compare it with what I would build today.',
      { heading: 'Proof is for me first' },
      'I am not collecting proof to show off. I am collecting it so that on the days I feel stuck, I have something solid to read. The goal is not to prove anything to other people. It is to prove to myself that the work is working.',
      'If you are in the middle of learning something, start keeping receipts. Future you will be glad you did.',
    ],
  },
  {
    slug: 'number-1-in-your-own-lane',
    title: 'Number 1: Being number 1 in your own lane',
    meta: 'Nov 2026',
    readTime: '4 min read',
    excerpt:
      'You do not have to beat everyone. You just have to be the best version of yourself in the lane you chose.',
    body: [
      'Everyone wants to be number one. But number one at what, and compared to whom? In tech, the answer is usually everyone, which is a race nobody can win.',
      { heading: 'What a lane is' },
      'A lane is the mix of things that are specific to you: your skills, your interests, your pace, your situation and the kind of work you want to do. Nobody else has exactly the same one, which is the whole point.',
      { heading: 'Why comparing does not work' },
      'When I compare myself to a developer with ten years of experience, I am comparing my first chapter to their tenth. When I compare myself to someone my age with a different background, I am ignoring everything that is different about our starting points.',
      'Scrolling through other people\'s highlights also makes my own messy middle look worse than it is.',
      { heading: 'Being number 1 in my own lane' },
      'For me it means beating the version of me from last month. Did I learn something new? Did I finish what I started? Did I build something cleaner than the last time? If yes, I am winning my lane.',
      'My lane is clean, accessible and responsive websites, from the first sketch in Figma to the final deploy. I do not need to be the best at everything. I need to keep getting better at that.',
      { heading: 'Keep your eyes on your own road' },
      'Other people are not the enemy. I like seeing other developers do well, and I learn a lot from them. I just try not to measure my worth by where they are.',
      'Pick your lane, stay in it, and keep showing up. That is how you become number one at something that actually matters to you.',
    ],
  },
  {
    slug: 'being-cringe',
    title: 'Being cringe is the price of getting better',
    meta: 'Oct 2026',
    readTime: '4 min read',
    excerpt:
      'Everything you will be proud of in a year starts as something that feels a bit embarrassing today.',
    body: [
      'Cringe is the feeling of second-hand embarrassment, and the scariest version is when it is about something you made. I have a lot of those: old projects, old posts, old designs that I would do very differently now.',
      { heading: 'Everyone starts out cringe' },
      'Every developer, designer and writer I admire had a version of their work that was awkward. The difference is that they kept going while it was awkward. You do not get to skip the stage where your work is not good yet.',
      { heading: 'Why we are afraid of it' },
      'We imagine an audience that is paying close attention and judging. In reality, most people are busy with their own stuff. The people who do notice are often the ones who recognise themselves in what you made.',
      'The fear is also a little bit of ego. Wanting to appear polished from the start means not being willing to be seen learning.',
      { heading: 'Looking back at old work' },
      'Opening my early projects is uncomfortable. I can see the messy code, the strange spacing, the choices I would never make now. But that discomfort is evidence. If my old work did not look cringe, it would mean I had not improved.',
      { heading: 'What I do about it' },
      'I post things anyway, with context. I try to laugh at my older work instead of hiding it. I keep a record of what I made so I can see how far things have come, and I remind myself that being cringe means I tried something.',
      'Embarrassment fades quickly. Not having made the thing at all stays much longer.',
    ],
  },
  {
    slug: 'building-this-portfolio',
    title: 'Building this portfolio with React, Vite and Tailwind',
    meta: 'Nov 2026',
    readTime: '5 min read',
    excerpt:
      'Why I rebuilt my portfolio from scratch, and the small decisions that made it easier to maintain.',
    body: [
      'My old portfolio looked busy and was hard to edit. Changing a sentence meant digging through components. This time I started with a rule: all content lives in one data file, and the components only decide how it looks.',
      { heading: 'The stack' },
      'I used Vite for fast refreshes, Tailwind CSS v4 for styling with a few design tokens (background, text, muted, line and one red accent), Framer Motion for gentle page transitions, and React Router for the pages.',
      { heading: 'Decisions that helped' },
      'Restraint was the biggest one. A dark background, one accent color and a lot of space let the content carry the page. I only added motion where it helps the reader follow what changed.',
      'Keeping content in `site.js` meant I could write the notes and blog posts without touching layout code. Adding a new post is just adding an object to a list.',
      { heading: 'A bug worth remembering' },
      'When the side menu opened, the page behind it shifted sideways. The cause was that I locked scrolling, which removed the scrollbar and made the page a bit wider. Reserving the scrollbar space with `scrollbar-gutter: stable` fixed it. It is a tiny line of CSS, but it took me a while to understand why it happened.',
      { heading: 'What I learned' },
      'A portfolio is never really finished. Starting small, shipping, and improving it a bit at a time works better than waiting for it to be perfect.',
    ],
  },
]