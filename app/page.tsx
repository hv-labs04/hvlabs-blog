import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'
import { getAllGroups, getModulesByGroup } from '@/lib/groups'
import { getPostsByModule } from '@/lib/modules'
import { ArrowRight, Clock } from 'lucide-react'
import type { Group } from '@/lib/groups'

function getGroupTag(group: Group) {
  const tagMap: Record<string, string> = {
    'system-design': 'SYS',
    'web-dev': 'WEB',
  }
  return tagMap[group.slug] || 'MOD'
}

export default function Home() {
  const allPosts = getAllPosts()
  const recentPosts = allPosts.slice(0, 4)
  const groups = getAllGroups()

  const groupsWithStats = groups.map((group) => {
    const modules = getModulesByGroup(group.slug)
    const totalPosts = modules.reduce((sum, m) => sum + getPostsByModule(m.slug).length, 0)
    return { group, modules, totalPosts }
  })

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl">

      {/* Hero Section */}
      <section className="mb-20 animate-fade-in">
        {/* Terminal prompt label */}
        <p className="font-mono text-xs text-muted mb-4 tracking-widest uppercase">
          <span className="text-accent">$</span> whoami
        </p>

        <h1
          className="text-7xl md:text-9xl font-normal mb-6 glow-green"
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', lineHeight: 1 }}
        >
          HVLABS
        </h1>

        <p className="font-mono text-base md:text-lg text-foreground/70 mb-3 max-w-2xl leading-relaxed">
          Software engineer · builder · curious mind.
        </p>
        <p className="font-mono text-sm text-muted mb-8 max-w-2xl leading-relaxed">
          Writing about system design, distributed systems, and the craft of building software at scale.
        </p>

        <div className="flex flex-wrap gap-2 mb-10">
          {['system-design', 'distributed-systems', 'backend', 'next.js'].map((tag) => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 mb-16">
          <Link
            href="/blog"
            className="group flex items-center gap-2 px-5 py-2.5 bg-accent text-black font-mono text-sm font-medium hover:bg-accent-hover transition-colors tracking-wide"
          >
            <span>./read-posts</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-2 px-5 py-2.5 border border-border text-foreground/70 font-mono text-sm hover:border-accent hover:text-accent transition-colors tracking-wide"
          >
            ./about-me
          </Link>
        </div>

        {/* Terminal window */}
        <div className="border border-border bg-surface">
          {/* Terminal chrome */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-code-bg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28ca41]" />
            </div>
            <span className="font-mono text-xs text-muted tracking-widest">hvlabs.terminal</span>
            <div className="w-16" />
          </div>

          {/* Terminal body */}
          <div className="p-5 font-mono text-sm space-y-1.5">
            <p><span className="text-accent">~</span> <span className="text-muted">cat welcome.txt</span></p>
            <p className="text-foreground/80 pl-4">Welcome to hvlabs — a place for deep technical writing.</p>
            <p><span className="text-accent">~</span> <span className="text-muted">ls posts/ | head -3</span></p>
            {recentPosts.slice(0, 3).map((post) => (
              <p key={post.slug} className="pl-4 text-foreground/70">
                <Link href={`/blog/${post.slug}`} className="hover:text-accent transition-colors">
                  {post.slug}.md
                </Link>
              </p>
            ))}
            <p><span className="text-accent">~</span> <span className="text-foreground/40">▋</span></p>
          </div>
        </div>
      </section>

      {/* Groups Section */}
      {groupsWithStats.length > 0 && (
        <section className="mb-16 animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-accent font-mono text-sm">//</span>
            <h2
              className="text-4xl font-normal"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}
            >
              LEARNING PATHS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groupsWithStats.map(({ group, modules, totalPosts }) => (
              <Link
                key={group.slug}
                href={`/groups/${group.slug}`}
                className="group block p-6 border border-border bg-surface hover:border-accent transition-all duration-200 hover:bg-accent/[0.03]"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="font-mono text-xs text-accent border border-accent/30 px-2 py-0.5 tracking-widest">
                    {getGroupTag(group)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </div>

                <h3
                  className="text-2xl font-normal mb-2 group-hover:text-accent transition-colors"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.03em' }}
                >
                  {group.title.toUpperCase()}
                </h3>

                {group.description && (
                  <p className="font-mono text-xs text-muted mb-4 leading-relaxed line-clamp-2">
                    {group.description}
                  </p>
                )}

                <p className="font-mono text-xs text-muted/60">
                  {modules.length} modules · {totalPosts} posts
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <section className="mb-16 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="text-accent font-mono text-sm">//</span>
              <h2
                className="text-4xl font-normal"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}
              >
                LATEST POSTS
              </h2>
            </div>
            <Link
              href="/blog"
              className="font-mono text-xs text-muted hover:text-accent transition-colors flex items-center gap-2 group tracking-wide"
            >
              view all
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block p-6 border border-border bg-surface hover:border-accent transition-all duration-200 hover:bg-accent/[0.03]"
              >
                {post.tags && post.tags.length > 0 && (
                  <div className="mb-3">
                    <span className="tag-pill">{post.tags[0]}</span>
                  </div>
                )}
                <h3 className="font-mono text-base font-medium mb-2 group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </h3>
                {post.description && (
                  <p className="font-mono text-xs text-muted mb-4 line-clamp-2 leading-relaxed">
                    {post.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs font-mono text-muted">
                  <div className="flex items-center gap-3">
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                    {post.readingTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.readingTime}m</span>
                      </div>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-accent opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
