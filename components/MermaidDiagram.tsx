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
        background: isDark ? '#0d1117' : '#fafbff',
        mainBkg: isDark ? '#1e2a40' : '#fef3c7',
        secondaryBkg: isDark ? '#161b22' : '#f0f4ff',

        // Node border & text
        primaryBorderColor: isDark ? '#f59e0b' : '#d97706',
        primaryTextColor: isDark ? '#e6edf3' : '#0f1629',
        secondaryTextColor: isDark ? '#8b949e' : '#5a6780',
        lineColor: isDark ? '#f59e0b' : '#d97706',

        // Primary nodes (default boxes)
        primaryColor: isDark ? '#1e2a40' : '#fef3c7',

        // Cluster/subgraph
        clusterBkg: isDark ? '#0d1117' : '#f0f4ff',
        clusterBorder: isDark ? '#30363d' : '#dde4f0',

        // Font
        fontFamily: 'Space Grotesk, system-ui, sans-serif',
        fontSize: '14px',

        // Edge labels
        edgeLabelBackground: isDark ? '#0d1117' : '#fafbff',

        // Arrow
        arrowheadColor: isDark ? '#f59e0b' : '#d97706',
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
