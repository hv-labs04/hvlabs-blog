import Link from 'next/link'
import { getAllGroups, getModulesByGroup } from '@/lib/groups'
import { getPostsByModule } from '@/lib/modules'
import { ArrowRight } from 'lucide-react'
import type { Group } from '@/lib/groups'

function getGroupTag(group: Group) {
  const tagMap: Record<string, string> = {
    'system-design': 'SYS',
    'web-dev': 'WEB',
  }
  return tagMap[group.slug] || 'MOD'
}

export default function Home() {
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
            href="/about"
            className="group flex items-center gap-2 px-5 py-2.5 bg-accent text-black font-mono text-sm font-medium hover:bg-accent-hover transition-colors tracking-wide"
          >
            <span>./about-me</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Terminal window */}
        <div className="border border-border bg-surface">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-code-bg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28ca41]" />
            </div>
            <span className="font-mono text-xs text-muted tracking-widest">hvlabs.terminal</span>
            <div className="w-16" />
          </div>

          <div className="p-5 font-mono text-sm space-y-1.5">
            <p><span className="text-accent">~</span> <span className="text-muted">cat welcome.txt</span></p>
            <p className="text-foreground/80 pl-4">Welcome to hvlabs — a place for deep technical writing.</p>
            <p><span className="text-accent">~</span> <span className="text-foreground/40">▋</span></p>
          </div>
        </div>
      </section>

      {/* Groups Section */}
      {groupsWithStats.length > 0 && (
        <section className="mb-16 animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-accent font-mono text-sm">{'// '}</span>
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
    </div>
  )
}
