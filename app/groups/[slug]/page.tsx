import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getGroupBySlug, getAllGroups, getModulesByGroup } from '@/lib/groups'
import { getPostsByModule } from '@/lib/modules'
import { ArrowLeft, ArrowRight } from 'lucide-react'

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

export async function generateStaticParams() {
  const groups = getAllGroups()
  return groups.map((g) => ({ slug: g.slug }))
}

export default function GroupPage({ params }: { params: { slug: string } }) {
  const group = getGroupBySlug(params.slug)
  if (!group) notFound()

  const modules = getModulesByGroup(params.slug)

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl">

      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-mono text-xs text-muted hover:text-accent transition-colors mb-10 tracking-wide"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        cd ..
      </Link>

      {/* Header */}
      <div className="mb-12 animate-fade-in">
        <p className="font-mono text-xs text-muted mb-3 tracking-widest uppercase">
          <span className="text-accent">$</span> ls {params.slug}/
        </p>
        <h1
          className="text-6xl md:text-7xl font-normal mb-4 glow-green"
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.05em', lineHeight: 1.05 }}
        >
          {group.title.toUpperCase()}
        </h1>
        {group.description && (
          <p className="font-mono text-sm text-muted max-w-2xl leading-relaxed mt-4">
            {group.description}
          </p>
        )}
        <p className="font-mono text-xs text-muted/50 mt-3">
          {modules.length} {modules.length === 1 ? 'module' : 'modules'}
        </p>
      </div>

      {modules.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {modules.map((module, index) => {
            const posts = getPostsByModule(module.slug)
            const totalReadingTime = posts.reduce((sum, post) => sum + (post.readingTime || 0), 0)

            return (
              <Link
                key={module.slug}
                href={`/modules/${module.slug}`}
                className="group block p-6 border border-border bg-surface hover:border-accent transition-all duration-200 hover:bg-accent/[0.03] animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-xs text-muted/50">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <DifficultyBadge difficulty={module.difficulty} />
                    </div>

                    <h2
                      className="text-2xl font-normal mb-2 group-hover:text-accent transition-colors"
                      style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.03em' }}
                    >
                      {module.title.toUpperCase()}
                    </h2>

                    {module.description && (
                      <p className="font-mono text-xs text-muted leading-relaxed line-clamp-2">
                        {module.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    <div className="font-mono text-xs text-muted/60 text-right">
                      <p>{posts.length} posts</p>
                      {totalReadingTime > 0 && <p>~{totalReadingTime} min</p>}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="font-mono text-sm text-muted">No modules yet.</p>
      )}
    </div>
  )
}
