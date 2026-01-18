import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'
import { ArrowRight, Clock } from 'lucide-react'

export default function Home() {
  const allPosts = getAllPosts()
  const recentPosts = allPosts.slice(0, 3)

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl">
      {/* Hero Section */}
      <section className="mb-20 animate-fade-in">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight text-foreground">
          Hi, I'm Vishnu
        </h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none mb-10">
          <p className="text-xl md:text-2xl text-foreground/80 mb-6 font-light leading-relaxed">
            Software engineer, builder, and curious mind. Welcome to my corner of the internet.
          </p>
          
          <p className="text-lg text-foreground/70 mb-4 leading-relaxed">
            I write about things I'm learning, building, and thinking about. Sometimes it's code,
            sometimes it's ideas, sometimes it's just whatever's on my mind.
          </p>
          
          <p className="text-lg text-foreground/70 mb-8 leading-relaxed">
            This blog is my space to share thoughts, document my journey, and connect with others
            who are curious about technology, software engineering, and life in general.
          </p>
          
          <div className="flex flex-wrap gap-4 mt-10 not-prose">
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
        </div>
      </section>

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
          <div className="space-y-4">
            {recentPosts.map((post, index) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block p-6 md:p-8 rounded-2xl border border-border bg-background hover:bg-code-bg/30 hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:shadow-foreground/5 hover:-translate-y-1 relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-foreground/0 via-foreground/0 to-foreground/0 group-hover:from-foreground/3 group-hover:via-foreground/2 group-hover:to-foreground/3 transition-all duration-300 rounded-2xl pointer-events-none" />
                
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-accent transition-colors tracking-tight">
                      {post.title}
                    </h3>
                    {post.description && (
                      <p className="text-foreground/70 mb-4 line-clamp-2 leading-relaxed">
                        {post.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-foreground/60">
                      <time dateTime={post.date} className="font-medium">
                        {new Date(post.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                      {post.readingTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{post.readingTime} min read</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-accent opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <span className="text-sm font-medium">Read</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
