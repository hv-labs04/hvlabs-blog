import PostCard from '@/components/PostCard'
import { getAllPosts } from '@/lib/posts'

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">All Posts</h1>
        <p className="text-lg text-foreground/70">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'}
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {posts.map((post, index) => (
            <div
              key={post.slug}
              className="animate-fade-in h-full"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <PostCard post={post} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 animate-fade-in">
          <p className="text-lg text-foreground/70">
            No posts yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  )
}
