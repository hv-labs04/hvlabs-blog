# Blog Design Plan - hvlabs.blog

## 🎯 Vision
A modern, clean, and performant personal blog for a software engineer to share thoughts, experiences, and various content.

## 🛠 Tech Stack Recommendation

### Frontend Framework
- **Next.js 14+** (App Router) - Server-side rendering, great SEO, excellent performance
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS for rapid styling
- **MDX** - Markdown with React components for rich blog posts

### Content Management
- **Markdown files** - Simple, version-controlled content
- **Frontmatter** (YAML) - Metadata for posts (title, date, tags, etc.)
- **File-based routing** - Easy to organize and maintain

### Styling & UI
- **Tailwind CSS** - Modern utility-first CSS
- **Custom design system** - Consistent colors, typography, spacing
- **Dark mode support** - Essential for developer audience
- **Responsive design** - Mobile-first approach

### Additional Features
- **Syntax highlighting** - For code blocks (using Prism.js or Shiki)
- **Reading time** - Calculate and display reading time
- **Tag/Category system** - Organize posts
- **Search functionality** - Find posts easily
- **RSS feed** - For subscribers
- **SEO optimization** - Meta tags, Open Graph, structured data

## 🎨 Design Principles

### Visual Identity
- **Clean & Minimal** - Focus on content, not distractions
- **Modern Typography** - Readable fonts (Inter, JetBrains Mono for code)
- **Subtle Animations** - Smooth transitions and micro-interactions
- **Professional Color Palette** - Developer-friendly (dark mode optimized)

### Color Scheme
```
Light Mode:
- Background: #FFFFFF / #FAFAFA
- Text: #1A1A1A / #2D2D2D
- Accent: #3B82F6 (Blue) or #8B5CF6 (Purple)
- Code Background: #F5F5F5
- Border: #E5E5E5

Dark Mode:
- Background: #0A0A0A / #111111
- Text: #E5E5E5 / #D4D4D4
- Accent: #60A5FA (Light Blue) or #A78BFA (Light Purple)
- Code Background: #1E1E1E
- Border: #2A2A2A
```

### Typography
- **Headings**: Bold, clear hierarchy (H1: 2.5rem, H2: 2rem, H3: 1.5rem)
- **Body**: 16px base, 1.6 line height for readability
- **Code**: Monospace font (JetBrains Mono, Fira Code)
- **Fonts**: Inter (body), JetBrains Mono (code)

## 📐 Layout Structure

### Homepage
```
┌─────────────────────────────────────┐
│  Header (Logo, Nav, Theme Toggle)  │
├─────────────────────────────────────┤
│                                     │
│      Hero Section                   │
│      (Name, Tagline, Brief Bio)    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│      Featured Posts (3-4)          │
│      [Card] [Card] [Card]          │
│                                     │
├─────────────────────────────────────┤
│                                     │
│      Recent Posts Grid              │
│      [Post] [Post] [Post]          │
│      [Post] [Post] [Post]          │
│                                     │
├─────────────────────────────────────┤
│                                     │
│      Categories/Tags Cloud          │
│                                     │
├─────────────────────────────────────┤
│         Footer                      │
│  (Social Links, Copyright)          │
└─────────────────────────────────────┘
```

### Blog Post Page
```
┌─────────────────────────────────────┐
│  Header (with back button)          │
├─────────────────────────────────────┤
│                                     │
│      Post Title                     │
│      Meta (Date, Reading Time, Tags)│
│      ────────────────────────────   │
│                                     │
│      Post Content (MDX)             │
│      - Headings                     │
│      - Paragraphs                   │
│      - Code blocks                  │
│      - Images                       │
│      - Lists                        │
│                                     │
├─────────────────────────────────────┤
│      Table of Contents (Sticky)     │
│      (on scroll, desktop only)      │
├─────────────────────────────────────┤
│                                     │
│      Related Posts                  │
│      [Card] [Card] [Card]           │
│                                     │
├─────────────────────────────────────┤
│         Footer                      │
└─────────────────────────────────────┘
```

### Blog List Page
```
┌─────────────────────────────────────┐
│  Header                             │
├─────────────────────────────────────┤
│                                     │
│      Page Title + Filter/Search     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│      Post Cards Grid/List           │
│      [Post Card]                    │
│        - Thumbnail                  │
│        - Title                      │
│        - Excerpt                    │
│        - Meta (Date, Tags)          │
│      [Post Card]                    │
│      ...                            │
│                                     │
├─────────────────────────────────────┤
│      Pagination                     │
├─────────────────────────────────────┤
│         Footer                      │
└─────────────────────────────────────┘
```

## 🧩 Key Components

### 1. Header/Navigation
- Logo/Brand name
- Navigation links (Home, Blog, About, Contact)
- Theme toggle (Light/Dark)
- Mobile hamburger menu

### 2. Post Card
- Featured image/thumbnail
- Title
- Excerpt/preview
- Date published
- Reading time
- Tags/categories
- Hover effects

### 3. Code Block
- Syntax highlighting
- Copy button
- Language label
- Line numbers (optional)

### 4. Table of Contents
- Auto-generated from headings
- Sticky on scroll
- Smooth scroll to sections
- Active section highlighting

### 5. Tag/Category Badge
- Color-coded
- Clickable to filter posts
- Small, pill-shaped

### 6. Search Bar
- Full-text search
- Instant results
- Keyboard shortcuts (Cmd/Ctrl + K)

### 7. Footer
- Social media links
- Copyright
- RSS feed link
- Sitemap link

## 📝 Content Structure

### Post Frontmatter Schema
```yaml
---
title: "Post Title"
slug: "post-slug"
date: "2024-01-15"
description: "Brief description for SEO"
tags: ["react", "nextjs"]
featured: true
draft: false
readingTime: 5
---
```

### File Organization
```
/content
  /posts
    /2024
      /01
        my-first-post.md
        another-post.md
  /pages
    about.md
    contact.md
```

## 🚀 Features to Implement

### Phase 1 (MVP)
- [x] Basic Next.js setup
- [x] Homepage with post listing
- [x] Individual post pages
- [x] Markdown/MDX support
- [x] Dark mode toggle
- [x] Responsive design
- [x] Basic styling

### Phase 2 (Enhanced)
- [ ] Tag/Category filtering
- [ ] Search functionality
- [ ] Table of contents
- [ ] Syntax highlighting
- [ ] Reading time calculation
- [ ] RSS feed
- [ ] SEO optimization

### Phase 3 (Advanced)
- [ ] Comments system (optional)
- [ ] Newsletter signup
- [ ] Analytics integration
- [ ] Related posts algorithm
- [ ] Reading progress indicator
- [ ] Share buttons

## 📱 Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🎯 Performance Goals
- Lighthouse Score: 90+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- SEO Score: 95+

## 🔍 SEO Considerations
- Semantic HTML
- Meta tags (title, description, OG tags)
- Structured data (Article schema)
- Sitemap.xml
- robots.txt
- Canonical URLs

---

## Next Steps
1. Review and approve design plan
2. Set up Next.js project with TypeScript
3. Configure Tailwind CSS
4. Create base layout components
5. Implement MDX support
6. Build homepage and post pages
7. Add dark mode
8. Style and polish
