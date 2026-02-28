'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from './ThemeProvider'

interface CodeBlockProps {
  code: string
  language?: string
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()

  const isDark = theme === 'dark'

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group mt-6 mb-8">
      <div className="rounded-xl overflow-hidden border border-border shadow-lg">
        {language && (
          <div className="flex items-center justify-between px-4 py-3 bg-background/50 border-b border-border">
            <span className="text-xs text-foreground/60 uppercase font-mono font-medium">{language}</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 text-xs text-foreground/60 hover:text-accent transition-colors px-3 py-1.5 rounded-md hover:bg-code-bg"
              aria-label="Copy code"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        )}
        <SyntaxHighlighter
          language={language || 'text'}
          style={isDark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            padding: '1.25rem',
            fontSize: '0.875rem',
            lineHeight: '1.7',
            background: isDark ? '#161b22' : '#f0f4ff',
          }}
          codeTagProps={{ style: { fontFamily: 'var(--font-mono)' } }}
          showLineNumbers={false}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
