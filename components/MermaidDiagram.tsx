'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { useTheme } from './ThemeProvider'

let idCounter = 0

export default function MermaidDiagram({ chart }: { chart: string }) {
  const { theme } = useTheme()
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const id = useRef(`mermaid-${++idCounter}`)

  useEffect(() => {
    const isDark = theme === 'dark'

    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        // Background & canvas
        background: isDark ? '#0a0a0a' : '#fafafa',
        mainBkg: isDark ? '#1f1108' : '#fff7ed',
        secondaryBkg: isDark ? '#111111' : '#f4f4f5',

        // Node border & text
        primaryBorderColor: isDark ? '#f97316' : '#ea580c',
        primaryTextColor: isDark ? '#f5f5f5' : '#09090b',
        secondaryTextColor: isDark ? '#a1a1aa' : '#71717a',
        lineColor: isDark ? '#f97316' : '#ea580c',

        // Primary nodes (default boxes)
        primaryColor: isDark ? '#1f1108' : '#fff7ed',

        // Cluster/subgraph
        clusterBkg: isDark ? '#0a0a0a' : '#f4f4f5',
        clusterBorder: isDark ? '#1e1e1e' : '#e4e4e7',

        // Font
        fontFamily: 'Space Grotesk, system-ui, sans-serif',
        fontSize: '14px',

        // Edge labels
        edgeLabelBackground: isDark ? '#0a0a0a' : '#fafafa',

        // Arrow
        arrowheadColor: isDark ? '#f97316' : '#ea580c',
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        padding: 20,
      },
      securityLevel: 'loose',
    })

    const render = async () => {
      try {
        // Unique id required each re-render when theme changes
        const renderId = `${id.current}-${theme}`
        const { svg: rendered } = await mermaid.render(renderId, chart)
        setSvg(rendered)
        setError('')
      } catch (e: any) {
        setError(e.message || 'Diagram render error')
      }
    }

    render()
  }, [chart, theme])

  if (error) {
    return (
      <pre className="my-6 p-4 rounded-xl border border-border bg-code-bg text-foreground/70 text-sm overflow-x-auto">
        {chart}
      </pre>
    )
  }

  if (!svg) return null

  return (
    <div
      className="my-8 p-4 rounded-xl border border-border bg-code-bg overflow-x-auto flex justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
