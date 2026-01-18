# hvlabs.blog

A modern, fast, and SEO-friendly blog built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- ✨ Modern design with dark mode support
- 🚀 Built with Next.js 14 App Router
- 📝 Markdown-based content management
- 🎨 Tailwind CSS for styling
- 🔍 SEO optimized
- 📱 Fully responsive
- ⚡ Fast performance with static generation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Creating Blog Posts

Create markdown files in the `content/posts/` directory with the following frontmatter:

```markdown
---
title: "Your Post Title"
slug: "your-post-slug"
date: "2024-01-15"
description: "Brief description for SEO"
tags: ["tag1", "tag2"]
featured: true
draft: false
---

Your content here...
```

## Project Structure

```
├── app/                 # Next.js app directory
│   ├── blog/           # Blog pages
│   ├── about/          # About page
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Homepage
├── components/         # React components
├── content/            # Blog posts (markdown files)
│   └── posts/
├── lib/                # Utility functions
└── public/             # Static assets
```

## Building for Production

```bash
npm run build
npm start
```

## Customization

- **Colors**: Edit `app/globals.css` to change the color scheme
- **Fonts**: Update fonts in `app/layout.tsx`
- **Layout**: Modify components in the `components/` directory
- **Styling**: Customize Tailwind config in `tailwind.config.ts`

## License

MIT
