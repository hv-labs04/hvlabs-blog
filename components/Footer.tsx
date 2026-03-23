export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <span
            className="text-xl text-accent tracking-widest"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            HVLABS
          </span>
          <p className="font-mono text-xs text-muted">
            © {currentYear} hvlabs.blog
          </p>
        </div>
      </div>
    </footer>
  )
}
