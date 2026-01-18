import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-foreground/70 mb-8">
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity"
      >
        Go back home
      </Link>
    </div>
  )
}
