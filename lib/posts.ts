import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'

const postsDirectory = path.join(process.cwd(), 'content/posts')

export interface Post {
  slug: string
  title: string
  date: string
  description?: string
  tags?: string[]
  category?: string
  featured?: boolean
  draft?: boolean
  readingTime?: number
  content: string
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(postsDirectory)
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.md') || fileName.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.(md|mdx)$/, '')
      const fullPath = path.join(postsDirectory, fileName)
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
        content,
      }
    })
    .filter((post) => !post.draft)
    .sort((a, b) => {
      if (a.date < b.date) {
        return 1
      } else {
        return -1
      }
    })

  return allPostsData
}

export function getPostBySlug(slug: string): Post | null {
  const postsDirectory = path.join(process.cwd(), 'content/posts')
  
  // Try both .md and .mdx extensions
  const possiblePaths = [
    path.join(postsDirectory, `${slug}.md`),
    path.join(postsDirectory, `${slug}.mdx`),
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
        content,
      }
    }
  }

  return null
}

export function getFeaturedPosts(): Post[] {
  return getAllPosts().filter((post) => post.featured).slice(0, 3)
}

export function getAllTags(): string[] {
  const posts = getAllPosts()
  const tagsSet = new Set<string>()
  
  posts.forEach((post) => {
    post.tags?.forEach((tag) => tagsSet.add(tag))
  })
  
  return Array.from(tagsSet).sort()
}
