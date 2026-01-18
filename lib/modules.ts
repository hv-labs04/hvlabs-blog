import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import type { Post } from './posts'

const modulesDirectory = path.join(process.cwd(), 'content/modules')

export interface Module {
  slug: string
  title: string
  description?: string
  order?: number
  postOrder?: string[] // Order of posts within module
}

export function getAllModules(): Module[] {
  if (!fs.existsSync(modulesDirectory)) {
    return []
  }

  const moduleDirs = fs.readdirSync(modulesDirectory, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  const allModules = moduleDirs
    .map((dirName) => {
      const metadataPath = path.join(modulesDirectory, dirName, 'metadata.md')
      
      if (!fs.existsSync(metadataPath)) {
        return null
      }

      const fileContents = fs.readFileSync(metadataPath, 'utf8')
      const { data } = matter(fileContents)
      
      return {
        slug: dirName,
        title: data.title || '',
        description: data.description,
        order: data.order || 999,
        postOrder: data.postOrder || [],
      } as Module
    })
    .filter((module): module is Module => module !== null)
    .sort((a, b) => (a.order || 999) - (b.order || 999))

  return allModules
}

export function getModuleBySlug(slug: string): Module | null {
  const metadataPath = path.join(modulesDirectory, slug, 'metadata.md')
  
  if (!fs.existsSync(metadataPath)) {
    return null
  }

  const fileContents = fs.readFileSync(metadataPath, 'utf8')
  const { data } = matter(fileContents)

  return {
    slug,
    title: data.title || '',
    description: data.description,
    order: data.order || 999,
    postOrder: data.postOrder || [],
  }
}

export function getPostsByModule(moduleSlug: string): Post[] {
  const module = getModuleBySlug(moduleSlug)
  if (!module) return []

  const moduleDir = path.join(modulesDirectory, moduleSlug)
  const files = fs.readdirSync(moduleDir)
    .filter((fileName) => 
      (fileName.endsWith('.md') || fileName.endsWith('.mdx')) && 
      fileName !== 'metadata.md'
    )

  const posts = files.map((fileName) => {
    const slug = fileName.replace(/\.(md|mdx)$/, '')
    const fullPath = path.join(moduleDir, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    const readingTimeResult = readingTime(content)

    return {
      slug,
      title: data.title || '',
      date: data.date || '',
      description: data.description,
      tags: data.tags || [],
      category: data.category,
      featured: data.featured || false,
      draft: data.draft || false,
      readingTime: Math.ceil(readingTimeResult.minutes),
      module: moduleSlug,
      content,
    }
  }).filter((post) => !post.draft)

  // Sort by postOrder if defined, otherwise by date
  if (module.postOrder && module.postOrder.length > 0) {
    posts.sort((a, b) => {
      const indexA = module.postOrder!.indexOf(a.slug)
      const indexB = module.postOrder!.indexOf(b.slug)
      
      // If both in order array, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }
      // If only one in order array, prioritize it
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      // If neither in order array, sort by date
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
  } else {
    posts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  return posts
}

export function getAllPostsFromModules(): Post[] {
  const modules = getAllModules()
  const allPosts: Post[] = []

  modules.forEach((module) => {
    const posts = getPostsByModule(module.slug)
    allPosts.push(...posts)
  })

  return allPosts
}

export function getPostBySlug(slug: string): Post | null {
  const modules = getAllModules()
  
  for (const module of modules) {
    const moduleDir = path.join(modulesDirectory, module.slug)
    const possiblePaths = [
      path.join(moduleDir, `${slug}.md`),
      path.join(moduleDir, `${slug}.mdx`),
    ]

    for (const fullPath of possiblePaths) {
      if (fs.existsSync(fullPath)) {
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data, content } = matter(fileContents)
        const readingTimeResult = readingTime(content)

        return {
          slug,
          title: data.title || '',
          date: data.date || '',
          description: data.description,
          tags: data.tags || [],
          category: data.category,
          featured: data.featured || false,
          draft: data.draft || false,
          readingTime: Math.ceil(readingTimeResult.minutes),
          module: module.slug,
          content,
        }
      }
    }
  }

  return null
}

export function getNextPostInModule(currentPost: Post): Post | null {
  if (!currentPost.module) return null
  
  const modulePosts = getPostsByModule(currentPost.module)
  const currentIndex = modulePosts.findIndex((p) => p.slug === currentPost.slug)
  
  if (currentIndex === -1 || currentIndex === modulePosts.length - 1) {
    return null
  }
  
  return modulePosts[currentIndex + 1]
}

export function getPreviousPostInModule(currentPost: Post): Post | null {
  if (!currentPost.module) return null
  
  const modulePosts = getPostsByModule(currentPost.module)
  const currentIndex = modulePosts.findIndex((p) => p.slug === currentPost.slug)
  
  if (currentIndex <= 0) {
    return null
  }
  
  return modulePosts[currentIndex - 1]
}

export function getModuleProgress(currentPost: Post): { current: number; total: number } | null {
  if (!currentPost.module) return null
  
  const modulePosts = getPostsByModule(currentPost.module)
  const currentIndex = modulePosts.findIndex((p) => p.slug === currentPost.slug)
  
  if (currentIndex === -1) return null
  
  return {
    current: currentIndex + 1,
    total: modulePosts.length,
  }
}
