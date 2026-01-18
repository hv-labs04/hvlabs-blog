---
title: "Building a Modern Blog with Next.js and Markdown"
slug: "building-a-modern-blog"
date: "2024-01-05"
description: "How I built this blog using Next.js, Markdown, and modern web technologies"
tags: ["nextjs", "blog", "markdown"]
featured: false
draft: false
---

I've been wanting to start a blog for a while, and finally decided to build it myself. Here's how I put together a fast, SEO-friendly blog using Next.js and Markdown.

## Why Next.js for Blogging?

Next.js offers several advantages for blogs:

- **Static Site Generation** - Pre-render pages at build time for optimal performance
- **SEO Friendly** - Server-side rendering ensures search engines can index your content
- **Great Developer Experience** - Hot reloading, TypeScript support, and excellent tooling
- **File-based Routing** - Simple and intuitive routing system

## Architecture Overview

Our blog will use:

1. **Next.js 14** with App Router
2. **Markdown files** for content (stored in `/content/posts`)
3. **gray-matter** for parsing frontmatter
4. **react-markdown** for rendering Markdown
5. **Tailwind CSS** for styling

## Setting Up Content Structure

Organize your posts in a `content/posts` directory:

```
content/
  posts/
    my-first-post.md
    another-post.md
```

Each post includes frontmatter:

```markdown
---
title: "My First Post"
date: "2024-01-15"
tags: ["blog", "nextjs"]
---

Your content here...
```

## Reading Posts

Create a utility to read and parse posts:

```typescript
import fs from 'fs'
import matter from 'gray-matter'

export function getAllPosts() {
  const files = fs.readdirSync('content/posts')
  return files.map((file) => {
    const content = fs.readFileSync(`content/posts/${file}`, 'utf-8')
    const { data, content: body } = matter(content)
    return { ...data, content: body }
  })
}
```

## Rendering Posts

Use `react-markdown` to render Markdown content:

```typescript
import ReactMarkdown from 'react-markdown'

export default function PostPage({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <ReactMarkdown>{post.content}</ReactMarkdown>
    </article>
  )
}
```

## Adding Syntax Highlighting

For code blocks, use a syntax highlighter:

```typescript
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

<ReactMarkdown
  components={{
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <SyntaxHighlighter language={match[1]}>
          {String(children)}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
  }}
>
  {content}
</ReactMarkdown>
```

## SEO Optimization

Add metadata to each post:

```typescript
export async function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug)
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
    },
  }
}
```

## Performance Tips

1. **Use Static Generation** - Pre-render pages at build time
2. **Optimize Images** - Use Next.js Image component
3. **Code Splitting** - Next.js does this automatically
4. **Minimize JavaScript** - Only load what you need

## Conclusion

Building this blog with Next.js has been a great experience. It's straightforward and gives me full control over the content and design. The combination of static generation, Markdown, and modern tooling creates a fast, maintainable platform.

I'm looking forward to writing more and seeing where this blog takes me!
