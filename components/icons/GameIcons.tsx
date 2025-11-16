interface IconProps {
  className?: string
  size?: number
}

export const HomeIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

export const AimTrainerIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  </svg>
)

export const TypingTestIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="4" y="8" width="2" height="2" fill="currentColor"/>
    <rect x="7" y="8" width="2" height="2" fill="currentColor"/>
    <rect x="10" y="8" width="2" height="2" fill="currentColor"/>
    <rect x="13" y="8" width="2" height="2" fill="currentColor"/>
    <rect x="16" y="8" width="2" height="2" fill="currentColor"/>
    <rect x="19" y="8" width="1" height="2" fill="currentColor"/>
    <rect x="4" y="11" width="2" height="2" fill="currentColor"/>
    <rect x="7" y="11" width="8" height="2" fill="currentColor"/>
    <rect x="16" y="11" width="2" height="2" fill="currentColor"/>
    <rect x="19" y="11" width="1" height="2" fill="currentColor"/>
    <rect x="4" y="14" width="2" height="2" fill="currentColor"/>
    <rect x="7" y="14" width="2" height="2" fill="currentColor"/>
    <rect x="10" y="14" width="2" height="2" fill="currentColor"/>
    <rect x="13" y="14" width="2" height="2" fill="currentColor"/>
    <rect x="16" y="14" width="2" height="2" fill="currentColor"/>
    <rect x="19" y="14" width="1" height="2" fill="currentColor"/>
  </svg>
)

export const MemoryIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="-150 -150 1580 1390"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g transform="translate(0,1090) scale(0.1,-0.1)" stroke="currentColor" strokeWidth="1000" fill="none">
      <path d="M6335 10893 c-81 -7 -252 -35 -323 -53 -69 -17 -78 -17 -165 -2 -71
13 -155 17 -362 17 -235 -1 -286 -4 -395 -23 -156 -28 -297 -63 -425 -107 -95
-32 -104 -33 -180 -25 -131 15 -442 12 -572 -5 -488 -64 -911 -248 -1278 -556
l-81 -67 -80 5 c-103 7 -196 -9 -300 -52 -243 -101 -521 -321 -834 -660 -164
-177 -431 -429 -523 -492 -133 -92 -241 -207 -345 -368 -56 -86 -160 -302
-197 -410 -16 -44 -61 -141 -102 -216 -41 -75 -90 -181 -110 -235 -32 -88 -36
-112 -41 -220 -5 -137 6 -185 59 -269 l31 -48 -41 -87 c-77 -162 -89 -326 -38
-510 62 -220 159 -387 386 -661 29 -36 41 -62 50 -110 27 -139 98 -306 182
-430 255 -375 763 -656 1423 -784 72 -14 134 -29 137 -33 3 -4 14 -27 23 -51
22 -58 65 -118 136 -194 54 -59 58 -66 69 -134 6 -39 15 -83 21 -98 5 -14 10
-70 10 -123 0 -90 3 -103 34 -169 60 -126 176 -233 401 -373 55 -34 159 -106
230 -160 305 -230 613 -381 940 -461 219 -53 296 -60 726 -62 387 -2 397 -1
574 26 99 15 248 41 330 57 83 17 159 30 171 30 15 0 26 -13 43 -54 34 -82
139 -262 203 -346 80 -106 218 -249 322 -333 79 -64 97 -85 159 -187 225 -369
592 -1044 681 -1255 94 -220 144 -303 250 -413 77 -81 167 -139 263 -171 75
-25 120 -26 235 -5 135 25 170 64 169 188 0 91 -23 173 -122 454 -118 331
-136 402 -106 402 6 0 50 -9 97 -21 237 -56 327 -69 496 -69 91 0 229 -7 307
-16 228 -26 425 -15 662 34 351 74 507 119 693 201 380 168 677 466 732 736
10 47 22 70 56 108 59 66 90 135 110 247 18 97 16 124 -23 288 -5 21 -3 22 73
22 399 2 698 89 945 274 418 315 656 917 676 1711 6 239 -16 729 -43 965 -54
470 -161 811 -322 1026 -49 65 -66 99 -97 194 -103 316 -287 601 -462 716 -45
30 -87 63 -93 74 -5 10 -10 45 -10 77 0 187 -97 466 -228 654 -120 172 -320
367 -485 474 -40 26 -94 61 -121 78 -42 28 -52 41 -71 94 -34 94 -80 164 -190
287 -56 61 -133 154 -171 206 -89 120 -136 174 -248 279 -322 303 -824 550
-1401 691 -102 24 -230 65 -320 100 -328 129 -587 180 -925 185 l-205 3 -95
45 c-179 86 -391 145 -601 167 -89 9 -285 11 -374 3z"/>
    </g>
  </svg>
)

export const PatternRecognitionIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="6" cy="6" r="2" fill="currentColor"/>
    <circle cx="12" cy="6" r="2" fill="currentColor"/>
    <circle cx="18" cy="6" r="2" fill="currentColor"/>
    <circle cx="6" cy="12" r="2" fill="currentColor"/>
    <rect x="10" y="10" width="4" height="4" fill="currentColor"/>
    <circle cx="18" cy="12" r="2" fill="currentColor"/>
    <circle cx="6" cy="18" r="2" fill="currentColor"/>
    <circle cx="12" cy="18" r="2" fill="currentColor"/>
    <rect x="16" y="16" width="4" height="4" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
)

export const ReactionTimeIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M7 2V4H17V2H19V4H20C21.1 4 22 4.9 22 6V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V6C2 4.9 2.9 4 4 4H5V2H7ZM4 8V20H20V8H4ZM12 9L16.25 13L12 17L7.75 13L12 9Z"
      fill="currentColor"
    />
  </svg>
)

export const NumberMemoryIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M8 8V16M8 8L10 10M8 8L6 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8H16V10H14V12H16V14H12V16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const VisualMemoryIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5S21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12S9.24 7 12 7S17 9.24 17 12S14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12S10.34 15 12 15S15 13.66 15 12S13.66 9 12 9Z"
      fill="currentColor"
    />
  </svg>
)

export const StroopTestIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="8" cy="8" r="4" fill="#ef4444"/>
    <circle cx="16" cy="8" r="4" fill="#22c55e"/>
    <circle cx="8" cy="16" r="4" fill="#3b82f6"/>
    <circle cx="16" cy="16" r="4" fill="#f59e0b"/>
  </svg>
)

export const SequenceMemoryIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
      fill="currentColor"
    />
  </svg>
)

export const ChimpTestIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="9" cy="7" r="1" fill="currentColor"/>
    <circle cx="15" cy="7" r="1" fill="currentColor"/>
    <path d="M9 10C9 10 10.5 11 12 11C13.5 11 15 10 15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="8" cy="6" rx="2" ry="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <ellipse cx="16" cy="6" rx="2" ry="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 14V20M9 17H15M7 20H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const BrainIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M21.33 12.91C21.42 14.46 20.71 15.95 19.44 16.86L19.21 17.05C18.46 17.66 17.46 17.88 16.5 17.61C15.54 17.34 14.73 16.63 14.26 15.7L14.17 15.52C13.96 15.11 13.58 14.8 13.11 14.68C12.64 14.56 12.14 14.65 11.73 14.93L11.59 15.04C11.11 15.38 10.53 15.55 9.95 15.52C9.37 15.49 8.81 15.26 8.37 14.87L8.27 14.78C7.86 14.42 7.33 14.22 6.78 14.22C6.23 14.22 5.7 14.42 5.29 14.78L5.19 14.87C4.75 15.26 4.19 15.49 3.61 15.52C3.03 15.55 2.45 15.38 1.97 15.04L1.83 14.93C1.42 14.65 0.92 14.56 0.45 14.68C-0.02 14.8 -0.4 15.11 -0.61 15.52L-0.7 15.7C-1.17 16.63 -1.98 17.34 -2.94 17.61C-3.9 17.88 -4.9 17.66 -5.65 17.05L-5.88 16.86C-7.15 15.95 -7.86 14.46 -7.77 12.91C-7.68 11.36 -6.81 9.95 -5.44 9.14L-5.21 9.05C-4.46 8.66 -3.46 8.88 -2.5 9.61C-1.54 10.34 -0.73 11.63 -0.26 12.7L-0.17 12.52C0.04 12.11 0.42 11.8 0.89 11.68C1.36 11.56 1.86 11.65 2.27 11.93L2.41 12.04C2.89 12.38 3.47 12.55 4.05 12.52C4.63 12.49 5.19 12.26 5.63 11.87L5.73 11.78C6.14 11.42 6.67 11.22 7.22 11.22C7.77 11.22 8.3 11.42 8.71 11.78L8.81 11.87C9.25 12.26 9.81 12.49 10.39 12.52C10.97 12.55 11.55 12.38 12.03 12.04L12.17 11.93C12.58 11.65 13.08 11.56 13.55 11.68C14.02 11.8 14.4 12.11 14.61 12.52L14.7 12.7C15.17 11.63 15.98 10.34 16.94 9.61C17.9 8.88 18.9 8.66 19.65 9.05L19.88 9.14C21.25 9.95 22.12 11.36 22.21 12.91H21.33Z"
      fill="currentColor"
    />
  </svg>
)
