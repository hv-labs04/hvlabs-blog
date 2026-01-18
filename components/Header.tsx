'use client'

import Link from 'next/link'
import { useTheme } from './ThemeProvider'
import { Moon, Sun } from 'lucide-react'

export default function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link 
            href="/" 
            className="text-xl font-bold text-foreground hover:text-accent transition-colors tracking-tight"
          >
            hvlabs
          </Link>
          
          <div className="flex items-center gap-6">
            <Link 
              href="/blog" 
              className="text-sm font-medium text-foreground/70 hover:text-accent transition-colors"
            >
              Blog
            </Link>
            <Link 
              href="/modules" 
              className="text-sm font-medium text-foreground/70 hover:text-accent transition-colors"
            >
              Modules
            </Link>
            <Link 
              href="/about" 
              className="text-sm font-medium text-foreground/70 hover:text-accent transition-colors"
            >
              About
            </Link>
            
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg hover:bg-code-bg transition-colors border border-transparent hover:border-border"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-foreground/70" />
              ) : (
                <Sun className="w-5 h-5 text-foreground/70" />
              )}
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}
