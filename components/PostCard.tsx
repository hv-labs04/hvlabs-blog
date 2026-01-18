'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowRight, Clock } from 'lucide-react'
import type { Post } from '@/lib/posts'
import type { Module } from '@/lib/modules'

interface PostCardProps {
  post: Post
  featured?: boolean
  module?: Module | null
}

export default function PostCard({ post, featured = false, module }: PostCardProps) {

  return (
    <Link href={`/blog/${post.slug}`} className="h-full">
      <article
        className={`
          group relative rounded-2xl border border-border bg-background p-6 md:p-8
          hover:border-accent/50 hover:shadow-2xl hover:shadow-foreground/5 transition-all duration-300
          hover:-translate-y-1 overflow-hidden h-full flex flex-col
          ${featured ? 'lg:col-span-2' : ''}
        `}
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/0 via-foreground/0 to-foreground/0 group-hover:from-foreground/3 group-hover:via-foreground/2 group-hover:to-foreground/3 transition-all duration-300 rounded-2xl pointer-events-none" />
        
        <div className="relative flex flex-col h-full">
          <div className="flex flex-wrap gap-2 mb-4">
            {module && (
              <Link
                href={`/modules/${module.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent font-medium border border-accent/20 backdrop-blur-sm hover:bg-accent/20 transition-colors"
              >
                {module.title}
              </Link>
            )}
            {post.tags && post.tags.length > 0 && (
              <>
                {post.tags.slice(0, module ? 2 : 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1.5 rounded-full bg-code-bg text-foreground/70 font-medium border border-border backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </>
            )}
          </div>
          
          <h2
            className={`
              font-bold mb-3 group-hover:text-accent transition-colors tracking-tight
              ${featured ? 'text-2xl lg:text-3xl' : 'text-xl md:text-2xl'}
            `}
          >
            {post.title}
          </h2>
          
          {post.description && (
            <p className="text-foreground/70 mb-6 line-clamp-2 leading-relaxed flex-grow">
              {post.description}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50 group-hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-4 text-sm text-foreground/60">
              <time dateTime={post.date} className="font-medium">
                {format(new Date(post.date), 'MMM d, yyyy')}
              </time>
              {post.readingTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{post.readingTime} min</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm font-medium">Read</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
