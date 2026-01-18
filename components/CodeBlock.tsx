'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language?: string
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-6">
      <div className="rounded-xl overflow-hidden bg-code-bg border border-border shadow-lg">
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
        <pre className="p-5 overflow-x-auto">
          <code className="font-mono text-sm leading-relaxed whitespace-pre">{code}</code>
        </pre>
      </div>
    </div>
  )
}
