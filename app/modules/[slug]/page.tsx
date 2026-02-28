import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllModules, getModuleBySlug, getPostsByModule } from '@/lib/modules'
import { format } from 'date-fns'
import { ArrowLeft, Clock, ArrowRight } from 'lucide-react'
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

  if (!moduleData) {
    return {
      title: 'Module Not Found',
    }
  }

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
  return <span className={cls}>{difficulty}</span>
}

export default function ModulePage({ params }: ModulePageProps) {
  const moduleData = getModuleBySlug(params.slug)

  if (!moduleData) {
    notFound()
  }

  const posts = getPostsByModule(params.slug)
  const totalReadingTime = posts.reduce((sum, post) => sum + (post.readingTime || 0), 0)

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-4xl">
      <Link
        href="/modules"
        className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-accent mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to modules
      </Link>

      <header className="mb-12 animate-fade-in">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{moduleData.title}</h1>
          <DifficultyBadge difficulty={moduleData.difficulty} />
        </div>
        {moduleData.description && (
          <p className="text-lg text-foreground/70 leading-relaxed">
            {moduleData.description}
          </p>
        )}
        <div className="flex items-center gap-4 mt-6 text-sm text-foreground/60">
          <span className="font-medium">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
          {totalReadingTime > 0 && (
            <>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>~{totalReadingTime} min total</span>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="space-y-4">
        {posts.map((post, index) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block p-6 md:p-8 rounded-xl border border-border bg-background/50 hover:bg-code-bg/30 hover:border-accent/50 transition-all duration-300 hover:shadow-lg relative overflow-hidden"
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-sm font-bold text-accent group-hover:bg-accent/20 transition-colors">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-accent transition-colors tracking-tight leading-[1.2]">
                  {post.title}
                </h2>
                {post.description && (
                  <p className="text-foreground/70 mb-3 line-clamp-2 leading-relaxed">
                    {post.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-foreground/60 flex-wrap">
                  <time dateTime={post.date}>
                    {format(new Date(post.date), 'MMM d, yyyy')}
                  </time>
                  {post.readingTime && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.readingTime} min read</span>
                    </div>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag-pill">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0 self-center" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
