'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowRight, Clock } from 'lucide-react'
import type { Post } from '@/lib/posts'
import type { Module } from '@/lib/modules'

import { tagStyle } from '@/lib/tagColors'

interface PostCardProps {
  post: Post
  featured?: boolean
  module?: Module | null
}

export default function PostCard({ post, featured = false, module }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="h-full">
      <div
        className={`
          group relative border border-border bg-surface p-6
          hover:border-accent transition-all duration-200 hover:bg-accent/[0.03]
          h-full flex flex-col
          ${featured ? 'lg:col-span-2' : ''}
        `}
      >
        {/* Left accent bar on hover */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />

        <div className="relative flex flex-col h-full">
          <div className="flex flex-wrap gap-2 mb-4">
            {module && (
              <Link
                href={`/modules/${module.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="font-mono text-xs px-2 py-0.5 border border-accent/30 text-accent hover:border-accent transition-colors tracking-wide"
              >
                {module.title}
              </Link>
            )}
            {post.tags && post.tags.length > 0 && (
              <>
                {post.tags.slice(0, module ? 2 : 3).map((tag) => (
                  <span key={tag} className="tag-pill" style={tagStyle(tag)}>{tag}</span>
                ))}
              </>
            )}
          </div>

          <h2
            className={`
              font-mono font-medium mb-3 group-hover:text-accent transition-colors leading-snug
              ${featured ? 'text-xl lg:text-2xl' : 'text-base md:text-lg'}
            `}
          >
            {post.title}
          </h2>

          {post.description && (
            <p className="font-mono text-xs text-muted mb-6 line-clamp-2 leading-relaxed flex-grow">
              {post.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-border group-hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-4 font-mono text-xs text-muted">
              <time dateTime={post.date}>
                {format(new Date(post.date), 'MMM d, yyyy')}
              </time>
              {post.readingTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{post.readingTime}m</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity font-mono text-xs">
              <span>read</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
