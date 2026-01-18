---
title: "Building a Modern Blog with Next.js and Markdown"
slug: "building-a-modern-blog"
date: "2024-01-05"
description: "How I built this blog using Next.js, Markdown, and modern web technologies"
tags: ["nextjs", "blog", "markdown", "typescript"]
featured: false
draft: false
---

I&apos;ve been wanting to start a personal blog for a while, and finally decided to build it myself instead of using a platform. Here&apos;s how I put together a fast, SEO-friendly blog using Next.js, Markdown, and some modern web technologies.

## Why Build Your Own?

There are plenty of blogging platforms out there, but building my own gives me:

- **Full control** over design and functionality
- **No vendor lock-in** - it&apos;s just files and code
- **Performance** - static generation means lightning-fast pages
- **Learning opportunity** - I get to experiment and try new things
- **Cost-effective** - can host on Vercel for free

## Tech Stack

Here&apos;s what powers this blog:

1. **Next.js 14** with App Router - for the framework and routing
2. **TypeScript** - for type safety and better developer experience
3. **Markdown/MDX** - for writing content (stored in `/content`)
4. **Tailwind CSS** - for styling
5. **gray-matter** - for parsing frontmatter from Markdown files
6. **react-markdown** - for rendering Markdown content
7. **date-fns** - for date formatting
8. **reading-time** - to calculate reading time

## Content Structure

I organized content into modules and posts:

```
content/
  modules/
    building-with-nextjs/
      metadata.md
      building-a-modern-blog.md
      next-post.md
  posts/
    standalone-post.md
```

Each module has a `metadata.md` file that defines the module&apos;s title, description, order, and the order of posts within it. Posts can live in module folders or standalone in the `posts` directory.

## Key Features

### Dark Mode

I implemented a theme system using CSS variables and React context. The theme persists across page reloads using localStorage.

### Module System

One of the things I wanted was a way to organize related posts into collections. The module system lets me group posts together and define their order, making it easy to create series or tutorials.

### Syntax Highlighting

Code blocks are highlighted using a custom `CodeBlock` component that includes a copy button and language label.

### Reading Time

Each post calculates reading time automatically based on word count, giving readers an idea of how long a post will take to read.

## Challenges and Solutions

### CSS Variables with Tailwind

One challenge was using CSS variables with Tailwind&apos;s opacity modifiers. Tailwind doesn&apos;t support opacity modifiers directly with CSS variables, so I used `color-mix()` for transparency effects.

### Server vs Client Components

Next.js 14&apos;s App Router uses Server Components by default, but some components need interactivity. I had to carefully decide which components should be Client Components (using `&apos;use client&apos;`) and which could stay as Server Components.

### Module Organization

Figuring out how to organize modules and posts took some iteration. I settled on a structure where posts live in module folders, and module metadata defines the order. This keeps related content together and makes it easy to manage.

## What&apos;s Next?

I&apos;m planning to add:

- RSS feed generation
- Search functionality
- More customization options
- Analytics integration
- Comments system (maybe)

Building this blog has been a great learning experience. It&apos;s fast, simple to maintain, and gives me complete control over every aspect. Plus, it&apos;s been fun to build something I actually use!

If you&apos;re thinking about building your own blog, I&apos;d definitely recommend giving Next.js a try. The developer experience is excellent, and the performance is hard to beat.
