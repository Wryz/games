'use client'

import { useEffect, useState } from 'react'

const AnimatedBrain = () => {
  const [pulseNodes, setPulseNodes] = useState<number[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly activate nodes for pulsing effect
      const randomNodes = Array.from({ length: 3 }, () => Math.floor(Math.random() * 8))
      setPulseNodes(randomNodes)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-48 h-48 mx-auto animate-float">
      {/* Animated gradient glow background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-30 blur-3xl rounded-full animate-pulse-glow" />
      
      {/* Brain SVG */}
      <svg
        viewBox="-50 -50 1380 1190"
        className="relative z-10 w-full h-full drop-shadow-2xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="50%" stopColor="#764ba2" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <g transform="translate(0,1090) scale(0.1,-0.1)" fill="none" stroke="url(#brainGradient)" strokeWidth="300" filter="url(#glow)">
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
          <path d="M8389 9090 c-49 -52 -100 -116 -119 -151 -32 -61 -33 -62 -25 -153
15 -168 11 -265 -14 -336 -60 -172 -192 -410 -240 -434 -14 -7 -83 -30 -153
-51 -137 -41 -141 -45 -116 -100 6 -14 17 -24 24 -21 7 3 32 10 56 16 271 71
340 110 563 322 169 159 215 182 412 199 175 16 320 1 405 -42 87 -43 236
-196 302 -307 124 -213 216 -549 216 -790 0 -88 20 -121 95 -157 41 -19 75
-27 119 -28 l61 -2 3 41 3 41 -53 7 c-29 4 -72 16 -95 26 -39 17 -43 22 -43
54 0 26 6 38 22 47 12 6 59 40 105 75 99 76 118 86 206 109 63 17 68 20 65 44
-3 24 -6 26 -50 24 -77 -2 -143 -31 -244 -105 -52 -39 -97 -68 -99 -66 -3 2
-14 58 -25 124 -60 351 -172 602 -358 795 -86 91 -160 143 -252 178 -62 24
-74 25 -275 25 -199 -1 -214 -2 -290 -27 -109 -36 -158 -69 -297 -203 -66 -64
-121 -114 -123 -112 -2 2 16 44 40 93 88 180 120 301 111 413 -3 43 -8 111
-12 152 -7 95 7 123 128 254 83 89 86 94 72 115 -8 11 -20 21 -27 21 -6 0 -50
-41 -98 -90z"/>
          <path d="M5241 5270 l-32 -30 47 -56 c63 -74 74 -79 107 -48 31 29 31 30 -39
107 l-50 57 -33 -30z"/>
          <path d="M6645 4739 c-4 -6 -10 -62 -13 -124 -4 -90 -1 -122 13 -166 18 -56
97 -178 140 -219 24 -23 25 -23 45 -5 11 10 20 21 20 25 0 3 -27 42 -60 86
-89 117 -94 140 -86 369 1 36 -1 40 -26 43 -14 2 -29 -2 -33 -9z"/>
          <path d="M3083 3685 c-3 -9 -4 -17 -2 -19 2 -1 65 -45 139 -96 74 -52 182
-129 239 -172 57 -44 109 -77 115 -75 29 10 8 38 -79 107 -106 83 -379 270
-395 270 -6 0 -13 -7 -17 -15z"/>
          <path d="M7007 2113 c-3 -5 -2 -58 2 -118 6 -95 12 -119 40 -175 62 -126 91
-124 33 2 -34 73 -40 98 -46 184 -7 92 -16 128 -29 107z"/>
          <path d="M8416 2113 c-13 -14 -1 -23 112 -81 254 -130 344 -151 722 -162 654
-21 778 -29 890 -54 58 -13 123 -31 144 -40 45 -19 66 -20 66 -5 0 15 -57 36
-184 70 -120 31 -116 31 -936 58 -244 9 -286 13 -370 35 -122 33 -175 53 -319
126 -65 32 -121 56 -125 53z"/>
          <path d="M8230 2072 c0 -4 125 -70 278 -145 253 -125 285 -138 372 -154 111
-19 438 -23 878 -9 231 8 272 11 272 24 0 13 -32 14 -262 6 -383 -13 -784 -9
-888 10 -73 13 -121 33 -350 146 -246 121 -300 143 -300 122z"/>
          <path d="M7110 1968 c1 -158 53 -264 211 -428 67 -70 78 -49 12 26 -141 162
-181 234 -189 341 -7 99 -14 133 -24 133 -6 0 -10 -33 -10 -72z"/>
        </g>

        {/* Neural nodes (animated dots) */}
        {[
          { cx: 320, cy: 200, id: 0 },
          { cx: 450, cy: 350, id: 1 },
          { cx: 640, cy: 300, id: 2 },
          { cx: 800, cy: 450, id: 3 },
          { cx: 500, cy: 150, id: 4 },
          { cx: 350, cy: 600, id: 5 },
          { cx: 700, cy: 700, id: 6 },
          { cx: 900, cy: 350, id: 7 },
        ].map((node) => (
          <circle
            key={node.id}
            cx={node.cx}
            cy={node.cy}
            r={pulseNodes.includes(node.id) ? "15" : "10"}
            fill={pulseNodes.includes(node.id) ? "#06b6d4" : "#667eea"}
            filter="url(#glow)"
            className="transition-all duration-500"
            style={{
              opacity: pulseNodes.includes(node.id) ? 1 : 0.7,
            }}
          />
        ))}
      </svg>

      {/* Orbiting particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-60 blur-sm"
            style={{
              top: '50%',
              left: '50%',
              animation: `orbit-${i % 3 + 1} ${4 + i}s linear infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes orbit-1 {
          from {
            transform: rotate(0deg) translateX(80px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(80px) rotate(-360deg);
          }
        }
        @keyframes orbit-2 {
          from {
            transform: rotate(120deg) translateX(90px) rotate(-120deg);
          }
          to {
            transform: rotate(480deg) translateX(90px) rotate(-480deg);
          }
        }
        @keyframes orbit-3 {
          from {
            transform: rotate(240deg) translateX(70px) rotate(-240deg);
          }
          to {
            transform: rotate(600deg) translateX(70px) rotate(-600deg);
          }
        }
      `}</style>
    </div>
  )
}

export default AnimatedBrain

