import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'
import { getAllModules, getPostsByModule } from '@/lib/modules'
import { ArrowRight, Clock, BookOpen, Code2, BookMarked, Database, Zap, Network, Layers } from 'lucide-react'
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

export default function Home() {
  const allPosts = getAllPosts()
  const recentPosts = allPosts.slice(0, 4)
  const modules = getAllModules()

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl">
      {/* Hero Section */}
      <section className="mb-20 animate-fade-in rounded-3xl p-8 md:p-12 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight text-foreground">
          Hi, I&apos;m Vishnu
        </h1>

        <p className="text-xl md:text-2xl text-foreground/80 mb-6 font-light leading-relaxed max-w-2xl">
          Software engineer, builder, and curious mind. Welcome to my corner of the internet.
        </p>

        <p className="text-lg text-foreground/70 mb-8 leading-relaxed max-w-2xl">
          I write about system design, distributed systems, and the craft of building software at scale.
        </p>

        <div className="flex flex-wrap gap-2 mb-10">
          {['System Design', 'Distributed Systems', 'Backend', 'Next.js'].map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/blog"
            className="group px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all duration-200 font-medium shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 flex items-center gap-2"
          >
            Read my posts
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/about"
            className="px-6 py-3 border-2 border-border rounded-lg hover:bg-code-bg hover:border-accent/50 transition-all duration-200 font-medium"
          >
            More about me
          </Link>
        </div>
      </section>

      {/* Modules Section */}
      {modules.length > 0 && (
        <section className="mb-16 animate-fade-in">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Modules</h2>
            <Link
              href="/modules"
              className="text-accent hover:text-accent-hover font-medium flex items-center gap-2 group"
            >
              View all
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4">
            <div className="flex gap-6 min-w-max">
              {modules.map((module, index) => {
                const modulePosts = getPostsByModule(module.slug)
                return (
                  <Link
                    key={module.slug}
                    href={`/modules/${module.slug}`}
                    className="group block w-96 flex-shrink-0 p-6 md:p-8 rounded-2xl border border-border bg-surface hover:border-accent/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(124,58,237,0.2),_0_8px_32px_rgba(124,58,237,0.08)] dark:hover:shadow-[0_0_0_1px_rgba(139,92,246,0.25),_0_8px_32px_rgba(139,92,246,0.10),_0_2px_8px_rgba(0,0,0,0.4)] relative overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/0 group-hover:from-accent/[0.06] group-hover:to-accent/[0.12] transition-all duration-300 rounded-2xl pointer-events-none" />

                    <div className="relative flex flex-col h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent group-hover:bg-accent/25 transition-colors">
                          {getModuleIcon(module)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl md:text-2xl font-bold mb-1 group-hover:text-accent transition-colors tracking-tight">
                            {module.title}
                          </h3>
                          <DifficultyBadge difficulty={module.difficulty} />
                        </div>
                      </div>
                      {module.description && (
                        <p className="text-foreground/70 mb-4 line-clamp-3 leading-relaxed">
                          {module.description}
                        </p>
                      )}
                      <div className="mt-auto pt-4 border-t border-border/50 group-hover:border-accent/30 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-foreground/60">
                          <span>{modulePosts.length} {modulePosts.length === 1 ? 'post' : 'posts'}</span>
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
          </div>
        </section>
      )}

      {/* Recent Posts Preview */}
      {recentPosts.length > 0 && (
        <section className="mb-16 animate-fade-in">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Latest Posts</h2>
            <Link
              href="/blog"
              className="text-accent hover:text-accent-hover font-medium flex items-center gap-2 group"
            >
              View all
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentPosts.map((post, index) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block p-6 rounded-2xl border border-border bg-surface hover:border-accent/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(124,58,237,0.2),_0_8px_32px_rgba(124,58,237,0.08)] dark:hover:shadow-[0_0_0_1px_rgba(139,92,246,0.25),_0_8px_32px_rgba(139,92,246,0.10),_0_2px_8px_rgba(0,0,0,0.4)] relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/0 group-hover:from-accent/[0.06] group-hover:to-accent/[0.12] transition-all duration-300 rounded-2xl pointer-events-none" />

                <div className="relative">
                  {post.tags && post.tags.length > 0 && (
                    <div className="mb-3">
                      <span className="tag-pill">{post.tags[0]}</span>
                    </div>
                  )}
                  <h3 className="text-lg md:text-xl font-bold mb-2 group-hover:text-accent transition-colors tracking-tight line-clamp-2">
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="text-foreground/70 mb-4 line-clamp-2 leading-relaxed text-sm">
                      {post.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-foreground/60">
                    <div className="flex items-center gap-3">
                      <time dateTime={post.date} className="font-medium">
                        {new Date(post.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                      {post.readingTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{post.readingTime} min</span>
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
