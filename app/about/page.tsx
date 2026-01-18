export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-3xl">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight animate-fade-in">About</h1>
      
      <div className="prose prose-lg dark:prose-invert max-w-none animate-fade-in">
        <p className="text-lg leading-relaxed">
          I&apos;m a software engineer who loves building things and sharing what I learn along the way.
        </p>
        
        <p className="text-lg leading-relaxed">
          When I&apos;m not coding, you&apos;ll find me exploring new technologies, reading, or working on
          side projects. I believe in continuous learning and sharing knowledge with the community.
        </p>
        
        <p className="text-lg leading-relaxed">
          This blog is where I document my thoughts, experiences, and discoveries. Feel free to
          reach out if you&apos;d like to connect!
        </p>
      </div>
    </div>
  )
}
