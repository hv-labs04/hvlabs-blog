import Link from 'next/link'
import { getAllModules, getPostsByModule } from '@/lib/modules'
import { BookOpen, ArrowRight, Cpu, Database, Zap, Network, BookMarked, Code2, Layers } from 'lucide-react'
import type { Module } from '@/lib/modules'

function getModuleIcon(module: Module) {
  const iconMap: Record<string, React.ReactNode> = {
    'building-with-nextjs': <Code2 className="w-6 h-6" />,
    'system-design-fundamentals': <BookMarked className="w-6 h-6" />,
    'storage-databases': <Database className="w-6 h-6" />,
    'caching-messaging': <Zap className="w-6 h-6" />,
    'distributed-systems': <Network className="w-6 h-6" />,
    'system-design-case-studies': <Layers className="w-6 h-6" />,
  }
  return iconMap[module.slug] || <BookOpen className="w-6 h-6" />
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

export default function ModulesPage() {
  const modules = getAllModules()

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Learning Modules</h1>
        <p className="text-lg text-foreground/70">
          Structured learning paths from fundamentals to production-ready system design
        </p>
      </div>

      {modules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {modules.map((module, index) => {
            const posts = getPostsByModule(module.slug)
            const totalReadingTime = posts.reduce((sum, post) => sum + (post.readingTime || 0), 0)

            return (
              <Link
                key={module.slug}
                href={`/modules/${module.slug}`}
                className="group block h-full p-6 md:p-8 rounded-2xl border border-border bg-surface hover:border-accent/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(245,158,11,0.2),_0_8px_32px_rgba(245,158,11,0.08)] dark:hover:shadow-[0_0_0_1px_rgba(245,158,11,0.25),_0_8px_32px_rgba(245,158,11,0.10),_0_2px_8px_rgba(0,0,0,0.4)] relative overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/0 group-hover:from-accent/[0.06] group-hover:to-accent/[0.12] transition-all duration-300 rounded-2xl pointer-events-none" />

                <div className="relative flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 p-3 rounded-lg bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-colors">
                      <span className="text-accent">{getModuleIcon(module)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-xl md:text-2xl font-bold group-hover:text-accent transition-colors tracking-tight">
                          {module.title}
                        </h2>
                      </div>
                      <DifficultyBadge difficulty={module.difficulty} />
                    </div>
                  </div>

                  {module.description && (
                    <p className="text-foreground/70 mb-6 line-clamp-3 leading-relaxed flex-grow">
                      {module.description}
                    </p>
                  )}

                  <div className="mt-auto pt-4 border-t border-border/50 group-hover:border-accent/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-foreground/60">
                      <span>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
                      {totalReadingTime > 0 && (
                        <>
                          <span>·</span>
                          <span>~{totalReadingTime} min</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium">Explore</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 animate-fade-in">
          <p className="text-lg text-foreground/70">
            No modules yet. Create module files in <code className="bg-code-bg px-2 py-1 rounded">content/modules/</code>
          </p>
        </div>
      )}
    </div>
  )
}
