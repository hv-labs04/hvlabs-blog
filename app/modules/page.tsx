import Link from 'next/link'
import { getAllModules, getPostsByModule } from '@/lib/modules'
import { BookOpen, ArrowRight } from 'lucide-react'

export default function ModulesPage() {
  const modules = getAllModules()

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Modules</h1>
        <p className="text-lg text-foreground/70">
          Organized learning paths and collections of related posts
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
                className="group block h-full p-6 md:p-8 rounded-2xl border border-border bg-background hover:bg-code-bg/30 hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:shadow-foreground/5 hover:-translate-y-1 relative overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-foreground/0 via-foreground/0 to-foreground/0 group-hover:from-foreground/3 group-hover:via-foreground/2 group-hover:to-foreground/3 transition-all duration-300 rounded-2xl pointer-events-none" />
                
                <div className="relative flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 p-3 rounded-lg bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-colors">
                      <BookOpen className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-accent transition-colors tracking-tight">
                        {module.title}
                      </h2>
                    </div>
                  </div>
                  
                  {module.description && (
                    <p className="text-foreground/70 mb-6 line-clamp-3 leading-relaxed flex-grow">
                      {module.description}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-border/50 group-hover:border-accent/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-foreground/60">
                      <span>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
                      {totalReadingTime > 0 && (
                        <>
                          <span>·</span>
                          <span>{totalReadingTime} min read</span>
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
