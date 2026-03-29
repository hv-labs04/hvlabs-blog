const TAG_COLOR = '#818cf8'

export function tagStyle(_tag: string): React.CSSProperties {
  return {
    borderColor: TAG_COLOR,
    color: TAG_COLOR,
    background: `color-mix(in srgb, ${TAG_COLOR} 10%, transparent)`,
  }
}
