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
        className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-accent mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to {moduleData.title} Module
      </Link>
      <div className="mb-6 p-4 rounded-lg border-l-4 border-accent" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--accent) 6%, transparent), color-mix(in srgb, var(--code-bg) 40%, transparent))' }}>
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/modules/${moduleData.slug}`}
              className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
            >
              {moduleData.title}
            </Link>
            {progress && (
              <p className="text-xs text-foreground/60 mt-0.5">
                Part {progress.current} of {progress.total}
              </p>
            )}
          </div>
          {progress && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium border border-accent/20">
              {progress.current}/{progress.total}
            </span>
          )}
        </div>
      </div>
      </>
      )}

      <header className="mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/70 mb-6">
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
                className="group p-6 rounded-xl border border-border hover:border-accent/50 hover:bg-code-bg/30 transition-all"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/50 uppercase tracking-wider mb-2">
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  Previous Post
                </div>
                <p className="font-semibold group-hover:text-accent transition-colors leading-snug">
                  {previousPost.title}
                </p>
              </Link>
            ) : <div />}
            {nextPost && (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="group p-6 rounded-xl border border-border hover:border-accent/50 hover:bg-code-bg/30 transition-all md:text-right"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/50 uppercase tracking-wider mb-2 md:justify-end">
                  Next Post
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="font-semibold group-hover:text-accent transition-colors leading-snug">
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
