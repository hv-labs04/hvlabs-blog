import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getAllModules } from './modules'
import type { Module } from './modules'

const groupsDirectory = path.join(process.cwd(), 'content/groups')

export interface Group {
  slug: string
  title: string
  description?: string
  order?: number
  icon?: string
  color?: string
}

export function getAllGroups(): Group[] {
  if (!fs.existsSync(groupsDirectory)) {
    return []
  }

  const files = fs.readdirSync(groupsDirectory)
    .filter((f) => f.endsWith('.md'))

  const groups = files.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '')
    const filePath = path.join(groupsDirectory, fileName)
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const { data } = matter(fileContents)

    return {
      slug,
      title: data.title || '',
      description: data.description,
      order: data.order ?? 999,
      icon: data.icon,
      color: data.color,
    } as Group
  })

  return groups.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

export function getGroupBySlug(slug: string): Group | null {
  const filePath = path.join(groupsDirectory, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data } = matter(fileContents)

  return {
    slug,
    title: data.title || '',
    description: data.description,
    order: data.order ?? 999,
    icon: data.icon,
    color: data.color,
  }
}

export function getModulesByGroup(groupSlug: string): Module[] {
  return getAllModules().filter((m) => m.group === groupSlug)
}
