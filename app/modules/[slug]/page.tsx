import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllModules, getModuleBySlug, getPostsByModule } from '@/lib/modules'
import { format } from 'date-fns'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import type { Metadata } from 'next'

interface ModulePageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const modules = getAllModules()
  return modules.map((moduleItem) => ({
    slug: moduleItem.slug,
  }))
}

export async function generateMetadata({ params }: ModulePageProps): Promise<Metadata> {
  const moduleData = getModuleBySlug(params.slug)
  if (!moduleData) return { title: 'Module Not Found' }
  return {
    title: moduleData.title,
    description: moduleData.description || moduleData.title,
  }
}

function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return null
  const cls =
    difficulty === 'Beginner'
      ? 'difficulty-beginner'
      : difficulty === 'Advanced'
      ? 'difficulty-advanced'
      : 'difficulty-intermediate'
  return <span className={cls}>{difficulty.toUpperCase()}</span>
}

export default function ModulePage({ params }: ModulePageProps) {
  const moduleData = getModuleBySlug(params.slug)
  if (!moduleData) notFound()

  const posts = getPostsByModule(params.slug)
  const totalReadingTime = posts.reduce((sum, post) => sum + (post.readingTime || 0), 0)

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl">

      {/* Back link */}
      <Link
        href={moduleData.group ? `/groups/${moduleData.group}` : '/'}
        className="inline-flex items-center gap-2 font-mono text-xs text-muted hover:text-accent transition-colors mb-10 tracking-wide"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        cd ..
      </Link>

      {/* Header */}
      <header className="mb-12 animate-fade-in">
        <p className="font-mono text-xs text-muted mb-3 tracking-widest uppercase">
          <span className="text-accent">$</span> ls {params.slug}/
        </p>
        <div className="flex items-start gap-4 flex-wrap mb-4">
          <h1
            className="text-6xl md:text-7xl font-normal glow-green"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.05em', lineHeight: 1.05 }}
          >
            {moduleData.title.toUpperCase()}
          </h1>
        </div>
        <DifficultyBadge difficulty={moduleData.difficulty} />
        {moduleData.description && (
          <p className="font-mono text-sm text-muted max-w-2xl leading-relaxed mt-4">
            {moduleData.description}
          </p>
        )}
        <p className="font-mono text-xs text-muted/50 mt-3">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          {totalReadingTime > 0 && ` · ~${totalReadingTime} min`}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {posts.map((post, index) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block p-6 border border-border bg-surface hover:border-accent transition-all duration-200 hover:bg-accent/[0.03]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-xs text-muted/50">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {post.tags && post.tags.length > 0 && (
                    <span className="tag-pill">{post.tags[0]}</span>
                  )}
                </div>

                <h2
                  className="text-2xl font-normal mb-2 group-hover:text-accent transition-colors"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.03em' }}
                >
                  {post.title.toUpperCase()}
                </h2>

                {post.description && (
                  <p className="font-mono text-xs text-muted leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
                <div className="font-mono text-xs text-muted/60 text-right">
                  <p>{format(new Date(post.date), 'MMM d, yyyy')}</p>
                  {post.readingTime && (
                    <div className="flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      <span>{post.readingTime}m</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
