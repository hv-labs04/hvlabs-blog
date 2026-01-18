export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t footer-border bg-background mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center">
          <p className="text-sm text-foreground/60">
            © {currentYear} hvlabs.blog. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
