import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="font-heading text-2xl text-accent hover:text-accent-hover transition-colors tracking-widest glow-green"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            hvlabs
          </Link>

          <div className="flex items-center gap-8">
            <Link
              href="/blog"
              className="text-xs font-mono text-muted hover:text-accent transition-colors tracking-widest uppercase"
            >
              Blog
            </Link>
            <Link
              href="/"
              className="text-xs font-mono text-muted hover:text-accent transition-colors tracking-widest uppercase"
            >
              Groups
            </Link>
            <Link
              href="/about"
              className="text-xs font-mono text-muted hover:text-accent transition-colors tracking-widest uppercase"
            >
              About
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
