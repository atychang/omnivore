
export function HighlightImageIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <rect width="16" height="16" rx="1.77778" fill="url(#pattern0)" />
      <defs>
        <pattern
          id="pattern0"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use xlinkHref="#image0_1902_54460" transform="scale(0.00775194)" />
        </pattern>
        <image
          id="image0_1902_54460"
          width="129"
          height="129"
          xlinkHref="data:image/png;base64,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"
        />
      </defs>
    </svg>
  )
}

export default HighlightImageIcon
