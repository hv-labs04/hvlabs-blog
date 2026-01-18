# Modules/Series Design Plan

## 🎯 Concept
A way to organize related blog posts into learning paths or collections. Think of it as a "series" or "course" but we'll call it a **"Module"**.

## 📋 Use Cases

### 1. Content Organization
- Group related posts together (e.g., "Building a Full-Stack App" module with posts on frontend, backend, deployment)
- Create learning paths (e.g., "React Fundamentals" → "Advanced React" → "React Performance")
- Series of posts (e.g., "30 Days of TypeScript")

### 2. Navigation
- Browse all modules
- View all posts in a module
- Navigate between posts in a module (previous/next)
- See progress through a module

### 3. Discovery
- Find related content easily
- See what other posts are in the same module
- Module landing pages with overview

## 🏗️ Data Structure

### New Folder Structure (Recommended)
```
content/
  modules/
    building-with-nextjs/
      metadata.md          # Module metadata
      post-1-slug.md       # Posts directly in module folder
      post-2-slug.md
      post-3-slug.md
    react-fundamentals/
      metadata.md
      intro.md
      components.md
      hooks.md
```

### Module Metadata File (`metadata.md`)
```yaml
---
title: "Building with Next.js"
description: "Learn to build modern web applications using Next.js"
order: 1  # Display order for module listing
postOrder:  # Order of posts within module
  - "post-1-slug"
  - "post-2-slug"
  - "post-3-slug"
---
```

### Post Frontmatter (Simplified)
```yaml
---
title: "Post Title"
slug: "post-slug"  # Auto-generated from filename if not provided
date: "2024-01-15"
description: "Description"
tags: ["tag1", "tag2"]
# No module field needed - inferred from folder structure
---
```

## 🎨 UI/UX Design

### 1. Module Listing Page (`/modules`)
- Grid/list of all modules
- Each module card shows:
  - Module title
  - Description
  - Number of posts
  - Thumbnail/icon (optional)
  - Progress indicator (if user is reading through it)

### 2. Module Detail Page (`/modules/[slug]`)
- Module header with title and description
- List of all posts in the module (ordered by metadata)
- Each post shows:
  - Title
  - Description
  - Reading time
  - Order number (1, 2, 3...)
  - Status indicator (read/unread - if we add tracking)

### 3. Post Page Enhancements
- Module badge/link at the top
- "Part X of Y" indicator
- Navigation:
  - "Previous in Module" button
  - "Next in Module" button
  - "Back to Module" link
- Module progress bar (optional)

### 4. Blog Listing Page
- Filter by module
- Show module badge on post cards
- Group posts by module (optional view)

### 5. Homepage
- Featured modules section
- "Continue Learning" section (if tracking)

## 📐 Layout Examples

### Module Card Design
```
┌─────────────────────────────┐
│  [Module Icon/Thumbnail]    │
│                             │
│  Module Title               │
│  Brief description...       │
│                             │
│  5 posts · 45 min read      │
│  [View Module →]            │
└─────────────────────────────┘
```

### Module Detail Page
```
┌─────────────────────────────────────┐
│  Building a Full-Stack Application  │
│  Learn to build a complete app...   │
│  ────────────────────────────────   │
│                                     │
│  1. Setting Up the Project         │
│     [5 min read] [→]                │
│                                     │
│  2. Building the Frontend          │
│     [12 min read] [→]               │
│                                     │
│  3. Creating the Backend API        │
│     [15 min read] [→]               │
│                                     │
│  4. Deployment                     │
│     [8 min read] [→]                │
└─────────────────────────────────────┘
```

### Post Page with Module Context
```
┌─────────────────────────────────────┐
│  [← Back to Module]                 │
│                                     │
│  Part 3 of 5                        │
│  Building a Full-Stack Application  │
│                                     │
│  Creating the Backend API           │
│  ────────────────────────────────   │
│                                     │
│  [Post content...]                  │
│                                     │
│  ────────────────────────────────   │
│  [← Previous]  [Next →]            │
└─────────────────────────────────────┘
```

## 🔧 Implementation Plan

### Phase 1: Core Structure
1. Create new folder structure: `content/modules/[slug]/`
2. Move module metadata to `metadata.md` files
3. Move posts into module folders
4. Update utility functions to read from new structure
5. Update post order logic to use module metadata

### Phase 2: Pages
1. `/modules` - Module listing page
2. `/modules/[slug]` - Module detail page
3. Update post pages to show module context
4. Add navigation between posts in module

### Phase 3: Enhancements
1. Module filtering on blog page
2. Module badges on post cards
3. Progress tracking (optional)
4. Featured modules on homepage

## 🎯 Naming Convention

**Options:**
- "Modules" - Simple, clear
- "Series" - Common in blogging
- "Paths" - Learning path concept
- "Collections" - Generic grouping
- "Guides" - Tutorial-like but not tutorial

**Recommendation:** Use **"Modules"** - it's clear, professional, and doesn't imply tutorials.

## 📝 Example Module Structure

### Module: "Building a Full-Stack App"
```
content/
  modules/
    building-fullstack-app/
      metadata.md
      setting-up-project.md
      building-frontend.md
      creating-backend-api.md
      deployment.md
```

## 🚀 Features to Consider

### Basic (MVP)
- ✅ Module listing
- ✅ Module detail page
- ✅ Post-to-module association
- ✅ Navigation between posts

### Advanced (Future)
- Progress tracking
- Module completion badges
- Estimated time for entire module
- Related modules suggestions
- Module search/filtering

## 🎨 Visual Design Notes

- Module cards should be visually distinct from post cards
- Use subtle borders or backgrounds to group module posts
- Progress indicators should be subtle (don't overwhelm)
- Module badges should be small and unobtrusive
- Navigation buttons should be clear but not dominant
