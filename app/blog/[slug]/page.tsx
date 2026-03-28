import { notFound } from 'next/navigation'
import { getPostBySlug, getAllPosts } from '@/lib/posts'
import { getModuleBySlug, getNextPostInModule, getPreviousPostInModule, getModuleProgress } from '@/lib/modules'
import { format } from 'date-fns'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from '@/components/CodeBlock'
import MermaidDiagram from '@/components/MermaidDiagram'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

interface PostPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const post = getPostBySlug(params.slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: post.title,
    description: post.description || post.title,
    openGraph: {
      title: post.title,
      description: post.description || post.title,
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description || post.title,
    },
  }
}

export default function PostPage({ params }: PostPageProps) {
  const post = getPostBySlug(params.slug)


  if (!post) {
    notFound()
  }

  const moduleData = post.module ? getModuleBySlug(post.module) : null
  const progress = getModuleProgress(post)
  const nextPost = getNextPostInModule(post)
  const previousPost = getPreviousPostInModule(post)

  return (
    <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-4xl">


      {/* Module Context */}
      {moduleData && (
      <>
      <Link
        href={`/modules/${moduleData.slug}`}
        className="inline-flex items-center gap-2 font-mono text-xs text-muted hover:text-accent mb-8 transition-colors tracking-wide"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        cd ..
      </Link>
      <div className="mb-8 p-4 border border-border bg-surface border-l-2 border-l-accent">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/modules/${moduleData.slug}`}
              className="font-mono text-xs text-accent hover:text-accent-hover transition-colors tracking-wide"
            >
              {moduleData.title}
            </Link>
            {progress && (
              <p className="font-mono text-xs text-muted mt-0.5">
                part {progress.current} of {progress.total}
              </p>
            )}
          </div>
          {progress && (
            <span className="font-mono text-xs text-accent border border-accent/30 px-2 py-0.5">
              {progress.current}/{progress.total}
            </span>
          )}
        </div>
      </div>
      </>
      )}

      <header className="mb-12 animate-fade-in">
        <h1
          className="mb-6 glow-green"
          style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 400, letterSpacing: '0.04em', lineHeight: 1.05, color: 'var(--accent)' }}
        >
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted mb-6">
          <time dateTime={post.date}>
            {format(new Date(post.date), 'MMMM d, yyyy')}
          </time>
          {post.readingTime && (
            <>
              <span>·</span>
              <span>{post.readingTime} min read</span>
            </>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="prose prose-lg dark:prose-invert max-w-none animate-fade-in prose-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '')
              const codeString = String(children).replace(/\n$/, '')

              if (!inline && match?.[1] === 'mermaid') {
                return <MermaidDiagram chart={codeString} />
              }

              return !inline && match ? (
                <CodeBlock language={match[1]} code={codeString} />
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      {/* Module Navigation */}
      {(previousPost || nextPost) && (
        <div className="mt-16 pt-8 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {previousPost ? (
              <Link
                href={`/blog/${previousPost.slug}`}
                className="group p-5 border border-border bg-surface hover:border-accent transition-all duration-200 hover:bg-accent/[0.03]"
              >
                <div className="flex items-center gap-2 font-mono text-xs text-muted uppercase tracking-widest mb-2">
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                  prev
                </div>
                <p className="font-mono text-sm text-foreground group-hover:text-accent transition-colors leading-snug">
                  {previousPost.title}
                </p>
              </Link>
            ) : <div />}
            {nextPost && (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="group p-5 border border-border bg-surface hover:border-accent transition-all duration-200 hover:bg-accent/[0.03] md:text-right"
              >
                <div className="flex items-center gap-2 font-mono text-xs text-muted uppercase tracking-widest mb-2 md:justify-end">
                  next
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="font-mono text-sm text-foreground group-hover:text-accent transition-colors leading-snug">
                  {nextPost.title}
                </p>
              </Link>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
