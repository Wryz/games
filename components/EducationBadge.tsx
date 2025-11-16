import { EDUCATION_LEVELS } from '@/lib/levels'

interface EducationBadgeProps {
  level: number
  categoryColor: string // Hex color value
  size?: number
}
      
// Individual badge renderers for each education level
const getLevel1Badge = (color: string, size: number) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
    <path fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10a6 6 0 0 0-6-6H3v2a6 6 0 0 0 6 6h3m0 2a6 6 0 0 1 6-6h3v1a6 6 0 0 1-6 6h-3m0 5V10"/>
  </svg>
)

const getLevel2Badge = (color: string, size: number) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
    <path fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 15h10v4a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-4zm5-6a6 6 0 0 0-6-6H3v2a6 6 0 0 0 6 6h3m0 0a6 6 0 0 1 6-6h3v1a6 6 0 0 1-6 6h-3m0 3V9"/>
  </svg>
)

const getLevel3Badge = (color: string, size: number) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M14.5 10.5S12 12.5 12 15m-6 0h12M7 15l.51 3.566c.233 1.637.35 2.456.914 2.945S9.815 22 11.47 22h1.062c1.654 0 2.48 0 3.045-.49c.564-.488.68-1.307.915-2.944L17 15m-6.937-6.937a3.2 3.2 0 0 0 0-4.524C8.178 1.654 4.031 2.03 4.031 2.03s-.377 4.147 1.508 6.032a3.2 3.2 0 0 0 4.524 0m4.74 2.135a2.74 2.74 0 0 0 3.878 0c1.616-1.616 1.293-5.17 1.293-5.17s-3.555-.324-5.17 1.292a2.74 2.74 0 0 0 0 3.878"/>
      <path d="M10 8.5s2 2.5 2 6.5"/>
    </g>
  </svg>
)

const getLevel4Badge = (color: string, size: number) => (
  <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
    <path fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" d="M10.1 12.61a1 1 0 0 1-1 .89H4.9a1 1 0 0 1-1-.89L3.5 9h7ZM4.5 9V5a2.5 2.5 0 0 1 5 0v4M7 2.5v-2M4.5 6h-2m1-3.5l1.31 1.31M9.5 6h2m-1-3.5L9.19 3.81"/>
  </svg>
)

const getLevel5Badge = (color: string, size: number) => (
  <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">
    <path fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" d="M9 13.5H5l-1-4h6l-1 4zm1.31-10.61A1.34 1.34 0 0 0 8.63 2a1.2 1.2 0 0 0-.34.17a1.5 1.5 0 0 0 .05-.37a1.34 1.34 0 0 0-2.68 0a1.5 1.5 0 0 0 0 .37A1.2 1.2 0 0 0 5.37 2a1.34 1.34 0 0 0-1.68.86a1.32 1.32 0 0 0 .86 1.67a1.15 1.15 0 0 0 .37.06A1.34 1.34 0 0 0 5 6.75a1.34 1.34 0 0 0 1.87-.3A1.06 1.06 0 0 0 7 6.12a1.06 1.06 0 0 0 .18.33a1.34 1.34 0 0 0 1.87.3a1.34 1.34 0 0 0 0-2.13a1.15 1.15 0 0 0 .37-.06a1.32 1.32 0 0 0 .89-1.67ZM7 6.12V9.5"/>
  </svg>
)

const getLevel6Badge = (color: string, size: number) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 14 14" fill={color}>
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <path d="m11.5 7.5l-.86 5.16a1 1 0 0 1-1 .84H4.35a1 1 0 0 1-1-.84L2.5 7.5ZM4 .69a3.84 3.84 0 0 0-1.5 3.06A3.63 3.63 0 0 0 6 7.5a3.24 3.24 0 0 0 .94-.14Zm6 0a3.84 3.84 0 0 1 1.5 3.06A3.63 3.63 0 0 1 8 7.5a3.24 3.24 0 0 1-.94-.14Z"/>
      <path d="M5 3L7 .5L9 3"/>
    </g>
  </svg>
)

const getLevel7Badge = (color: string, size: number) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16">
    <path fill={color} d="M8.416.223a.5.5 0 0 0-.832 0l-3 4.5A.5.5 0 0 0 5 5.5h.098L3.076 8.735A.5.5 0 0 0 3.5 9.5h.191l-1.638 3.276a.5.5 0 0 0 .447.724H7V16h2v-2.5h4.5a.5.5 0 0 0 .447-.724L12.31 9.5h.191a.5.5 0 0 0 .424-.765L10.902 5.5H11a.5.5 0 0 0 .416-.777l-3-4.5zM6.437 4.758A.5.5 0 0 0 6 4.5h-.066L8 1.401L10.066 4.5H10a.5.5 0 0 0-.424.765L11.598 8.5H11.5a.5.5 0 0 0-.447.724L12.69 12.5H3.309l1.638-3.276A.5.5 0 0 0 4.5 8.5h-.098l2.022-3.235a.5.5 0 0 0 .013-.507z"/>
  </svg>
)

const getLevel8Badge = (color: string, size: number) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
    <path fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 22V9m3 8h1a5 5 0 0 0 .999-9.9C16.999 4.338 15 2 12 2S7.001 4.338 7.001 7.1A5.002 5.002 0 0 0 8 17h1m3-2l2.5-2.5M12 13l-2.5-2.5M10 22h4"/>
  </svg>
)

const getLevel9Badge = (color: string, size: number) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1l1 1h4m3-.86A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1l-1 1h-3"/>
      <path d="M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25l.7-.7l.71-.71l2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35"/>
      <path d="M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14"/>
    </g>
  </svg>
)

const getLevel10Badge = (color: string, size: number) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 48 48" fill={color}>
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
      <path d="M15 45h18m-12.38 0s.729-3.273.86-10.813a212 212 0 0 1-3.111-3.055a207 207 0 0 1-3.158-3.218c-.723-.756-.92-1.844-.205-2.607a8 8 0 0 1 .367-.366c.762-.716 1.85-.518 2.606.205a207 207 0 0 1 3.543 3.482c.07-5.059.292-8.04.407-9.284c.042-.456.194-.915.614-1.098c.304-.133.766-.246 1.457-.246s1.154.113 1.457.246c.42.183.572.642.614 1.098c.061.655.152 1.792.234 3.46l.498-.5a208 208 0 0 1 3.218-3.158c.756-.723 1.844-.921 2.607-.205a8 8 0 0 1 .366.366c.716.763.518 1.851-.205 2.607c-.696.727-1.73 1.79-3.157 3.218a210 210 0 0 1-3.159 3.1q.026 1.644.027 3.597c0 9.22.881 13.171.881 13.171"/>
      <path d="M21.353 37.961a101 101 0 0 1-7.832-.538c-4.47-.48-7.814-4.247-7.303-8.714C7.801 14.874 15.543 2 24 2s16.199 12.874 17.782 26.71c.51 4.466-2.833 8.232-7.303 8.713a101 101 0 0 1-7.832.538"/>
    </g>
  </svg>
)

const getLevel11Badge = (color: string, size: number) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}><g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M20 3v10a8 8 0 1 1-16 0V3l3.432 3.432A7.963 7.963 0 0 1 12 5c1.769 0 3.403.574 4.728 1.546L20 3z"/><path d="M2 16h5l-4 4m19-4h-5l4 4m-10-4a1 1 0 1 0 2 0a1 1 0 1 0-2 0m-2-5v.01m6-.01v.01"/></g></svg>        
)

const getLevel12Badge = (color: string, size: number) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}><g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M11 5h2m6 7c-.667 5.333-2.333 8-5 8h-4c-2.667 0-4.333-2.667-5-8"/><path d="M11 16c0 .667.333 1 1 1s1-.333 1-1h-2zm1 2v2m-2-9v.01m4-.01v.01M5 4l6 .97l-6.238 6.688a1.021 1.021 0 0 1-1.41.111a.953.953 0 0 1-.327-.954L5 4zm14 0l-6 .97l6.238 6.688c.358.408.989.458 1.41.111a.953.953 0 0 0 .327-.954L19 4z"/></g></svg>     
)

const getLevel13Badge = (color: string, size: number) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}><g fill="none" stroke={color} strokeLinecap="round" strokeWidth="1.5"><path strokeLinejoin="round" d="m19.5 4.5l2.5 4c-.274.548-.887 1-1.5 1L19 8c-.896 0-1.717-.65-2-1.5M18.5 2l-1 1c-2 .5-3.312 1.936-3.834 3.502L13 8.5c-2.152 1.537-3.682 1.184-5.311.684c-1.034-.317-2.216-.157-2.98.607A2.42 2.42 0 0 0 4 11.503V21m.5-11.5l-.744-.372A1.213 1.213 0 0 0 2 10.213V14m15.5-6.5l-.097.146a3.1 3.1 0 0 0-.299 2.865a3.6 3.6 0 0 1 .187 2.034c-.186.931-1 1.928-1.791 2.455v6"/><path d="M13 21v-6.5"/><path strokeLinejoin="round" d="M8 16s2.308 1.125 5 0"/><path strokeLinejoin="round" d="M8.5 14.5c-.5 2-2 2.5-2 2.5v4"/></g></svg>     
)

const getLevel14Badge = (color: string, size: number) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}><g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M14.5 12H14c-2.8 0-5-2.2-5-5V5a2 2 0 0 1 2-2h2c1.5 0 2.8.8 3.4 2H19c1.7 0 3 1.3 3 3v10m-4-8h.01"/><path d="M14 10a4 4 0 0 0 4 4a4 4 0 0 1 4 4a2 2 0 0 1-4 0m-8-2v5"/><path d="M18 14a4 4 0 0 0-4 4v3H6v-2.6c0-1.1-.8-2.3-1.7-3C2.9 14.3 2 12.8 2 11c0-3.3 3.1-6 7-6m-7 6v7"/></g></svg>
  
)

const getLevel15Badge = (color: string, size: number) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 512 472"><path fill={color} d="M493 99q-20-14-41-2q-40 17-66 59q-28-54-87-77V45q0-17-15-34q-16-11-37-8q-56 12-74 66q-72 15-122.5 60T0 235q0 72 70 121.5T224 406q56 0 98.5-24t63.5-66q26 42 66 60q14 4 17 4q13 0 24-6q19-13 19-36V133q0-25-19-34zM224 65q5-12 32-20v20h-32zM43 235q0-30 21.5-57t57.5-45q27 33 27 102t-27 103q-36-18-57.5-45.5T43 235zm181 128q-24 0-62-8q30-51 30-120q0-68-30-119q24-9 62-9q62 0 100.5 35t38.5 93t-38.5 93T224 363zm245-19q-64-42-64-105q0-33 19.5-63.5T469 135v209zM128 214q0 9-6.5 15t-14.5 6q-9 0-15.5-6T85 214t6.5-15t15.5-6q8 0 14.5 6t6.5 15z"/></svg>
     
)

const getLevel16Badge = (color: string, size: number) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 48 48"><g fill="none"><path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M24 7C14.23 1.613 9.686 8.632 8 11c-5.664 1.218-2.854 3.324-1 4c1.214.406 4.146 1.323 6 2c.405 3.248 1.663 6.154 2 7c0-.812 1.326-3.647 2-5c8.092 3.248 13.797 11.602 17 16c-1.214 2.436-2.494 6.308-3 8l6-3l7 2c0-3.248-4.145-6.647-6-8c.81-12.992-5.29-20.8-9-23c.405-1.624 1.157-4.323 2-5c-3.237-1.624-5.82.154-7 1Z"/><circle cx="16" cy="11" r="2" fill={color}/></g></svg>    

)

const getLevel17Badge = (color: string, size: number) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32"><path fill={color} d="M27 3a2.001 2.001 0 0 0-2.174-1.996h-.008c-2.039.189-4.085.852-5.774 1.851a12.8 12.8 0 0 0-.624-.015h-1.61c-5.832 0-11.716 2.74-15.248 7.438a2.782 2.782 0 0 0-.157 3.12C3.065 16.155 6.285 18 9.51 18h-.74c-1.114 0-1.798 1.276-1.098 2.202l.002.003l5.12 6.823l-1.24 1.857l-.011.02c-.533.887.075 2.095 1.177 2.095h1.62a4.129 4.129 0 0 0 3.43-1.833l.002-.002l.786-1.165c.1 0 .216-.003.337-.011C25.622 27.739 31 22.215 31 15.42a12.55 12.55 0 0 0-4-9.203V3Zm-7.17 1.72c1.462-.921 3.318-1.551 5.166-1.724H25V7.12l.345.298A10.551 10.551 0 0 1 29 15.42c0 1.524-.322 2.972-.9 4.28c.254-.644.4-1.34.4-2.088c0-2.243-.74-3.838-1.767-4.934c-1.019-1.085-2.291-1.648-3.325-1.893a.74.74 0 0 0-.908.726v2.247a.432.432 0 0 1-.133.321a.169.169 0 0 1-.079.042a.137.137 0 0 1-.083-.015c-.53-.24-.947-.696-1.247-1.248a4.298 4.298 0 0 1-.5-1.647a.766.766 0 0 0-.758-.711H18v-.51c0-.28-.22-.5-.5-.5s-.5.22-.5.5v.51h-1v-.51c0-.27-.22-.5-.5-.5s-.5.22-.5.5v.51h-2.332c-.26 0-.516.01-.768.028a1.443 1.443 0 0 0-2.784.582c-2.047.708-3.668 1.897-4.697 2.836a7.176 7.176 0 0 1-1.302-1.581l-.004-.007a.782.782 0 0 1 .044-.873l.002-.004c3.129-4.162 8.404-6.64 13.651-6.64h1.61c.27 0 .538.01.802.029l.329.025l.279-.176ZM5.207 14.58c.974-.866 2.454-1.92 4.29-2.543a1.443 1.443 0 0 0 2.423-.507c.245-.02.494-.03.747-.03H15v.5c0 .28.22.5.5.5c.27 0 .5-.22.5-.5v-.5h1v.5c0 .28.22.5.5.5c.27 0 .5-.22.5-.5v-.5h1.483c.074.574.268 1.231.596 1.835c.37.68.928 1.327 1.715 1.682a1.13 1.13 0 0 0 1.224-.18c.303-.259.482-.66.482-1.08v-1.912c.82.244 1.75.715 2.503 1.518c.844.899 1.496 2.245 1.496 4.25c0 2.155-1.485 3.894-3.506 5.195c-1.78 1.145-3.884 1.886-5.454 2.22v-.406c.198-.051.394-.106.586-.163l.012-.004a12.545 12.545 0 0 0 4.913-2.891l.008-.008c.62-.606.976-1.462.962-2.372v-.008C24.976 17.377 23.467 16 21.72 16H9.51c-1.508 0-3.038-.53-4.302-1.42Zm12.33 10.254v.796a.5.5 0 0 0 .325.468a1.795 1.795 0 0 0-.9.689l-.002.004l-.85 1.26l-.003.005c-.394.59-1.06.944-1.768.944h-.458l.67-1.005c.41-.615.398-1.43-.053-2.027l-.003-.003L10.02 20c1.591 0 3.096.728 4.11 1.986l.001.001l1.758 2.198l.007.008c.393.48 1.018.731 1.643.64Zm1.28 1.156c1.667-.363 3.85-1.14 5.716-2.342c1.19-.765 2.289-1.729 3.026-2.894a10.572 10.572 0 0 1-8.742 5.236ZM25 2.997ZM20.5 18h1.22c.712 0 1.282.56 1.3 1.22a1.24 1.24 0 0 1-.355.901a10.547 10.547 0 0 1-4.116 2.423c-.405.12-.793.22-1.18.29l-1.678-2.099l-.002-.002A7.278 7.278 0 0 0 10.02 18h6.666a3.957 3.957 0 0 0 1.969 2.322l.09.05l.008.003A1.2 1.2 0 0 0 20.5 19.3V18Zm-1 0v1.3a.2.2 0 0 1-.287.188l-.088-.05l-.008-.003A2.956 2.956 0 0 1 17.755 18H19.5Z"/></svg>
   
)

const getLevel18Badge = (color: string, size: number) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32" fill={color}><g fill={color}><path d="M15.517 14.791a.864.864 0 0 1-.858-.857v-1.076c0-.469.389-.858.858-.858s.858.39.858.858v1.075a.857.857 0 0 1-.858.858Z"/><path d="M24.157 1.088c.505.099.82.411 1.023.655c.278.332.405.761.47 1.105c.07.375.091.796.068 1.222c-.036.667-.187 1.438-.517 2.128C28.37 8.715 29.959 12.106 30 16.46v.01c0 3.705-.63 6.758-2.148 9.116c-.732 1.355-1.982 2.496-3.246 3.322c-1.152.751-2.42 1.31-3.492 1.519a1.793 1.793 0 0 1-.253.229c-.602.448-1.318.417-1.994.116c-.873.147-1.8.253-2.782.321a12.472 12.472 0 0 1-6.834-1.457a3.799 3.799 0 0 1-1.127 1.026c-.198.114-.529.276-.905.276c-1.114 0-2.434-.41-3.314-1.753c-.827-1.263-1.147-3.18-.795-5.93c-1.171-2.228-1.864-4.724-1.978-7.209h.004l-.047-.95v-.025c0-1.751 1.098-3.277 2.357-4.31C4.71 9.722 6.363 8.99 7.834 8.99h6.55c.703 0 1.383.1 2.027.287a1.575 1.575 0 0 1-.083-.511c0-.215.062-.387.1-.48a2.04 2.04 0 0 1 .14-.274c.092-.15.208-.308.323-.457c.13-.168.3-.376.481-.599c.129-.158.263-.323.393-.486c.777-.972 1.698-1.374 2.535-1.454a3.24 3.24 0 0 1 .032-.499c.077-.521.286-.977.608-1.428c.268-.375.575-.766.887-1.089c.155-.161.326-.32.505-.454c.17-.127.399-.272.672-.349c.31-.086.728-.192 1.153-.109ZM5.001 26.105c.083.956.315 1.582.577 1.983c.397.605.952.824 1.535.848l.01-.007a1.914 1.914 0 0 0 .434-.375a14.876 14.876 0 0 1-2.556-2.45Zm11.814 2.92c-.554-.796-.876-1.705-1.058-2.616c-.302-1.508-.246-3.14-.2-4.46l.006-.201c.052-1.561-.649-2.717-1.735-3.52c-1.116-.823-2.635-1.26-4.078-1.26H3.212c.764 6.645 5.968 12.598 12.735 12.13c.296-.021.585-.045.868-.073ZM3.092 14.969H9.75c1.802 0 3.754.535 5.265 1.65c1.541 1.138 2.624 2.888 2.547 5.196l-.004.125c-.047 1.38-.095 2.803.16 4.076c.256 1.28.79 2.268 1.84 2.865c.049.028.092.05.128.066l.004-.016l.108-5.08l.01-.065c.02-.127.022-.563-.195-1.09a1 1 0 1 1 1.85-.761c.331.806.394 1.573.332 2.08l-.089 4.155a9.934 9.934 0 0 0 1.806-.938c1.111-.726 2.08-1.654 2.595-2.624l.02-.04l.024-.037c1.24-1.907 1.849-4.53 1.849-8.057c-.038-3.963-1.505-6.856-4.433-9.007l-.072-.053l-.062-.065l-.01-.011a1.492 1.492 0 0 1-.398-.692c-.106-.47.089-.844.225-1.05c.272-.41.438-1.024.471-1.633a3.247 3.247 0 0 0-.038-.748c-.01-.05-.019-.09-.027-.122a4.034 4.034 0 0 0-.077.02a.71.71 0 0 0-.048.033a2.34 2.34 0 0 0-.264.243a7.94 7.94 0 0 0-.7.863c-.18.253-.235.415-.256.555c-.023.155-.015.362.052.73c.012.042.027.1.038.167c.012.073.03.21.008.372a1.081 1.081 0 0 1-.983.942c-.111.01-.222.003-.261 0h-.008l-.028-.002A6.762 6.762 0 0 0 20.625 7c-.338 0-.816.116-1.297.718a66.4 66.4 0 0 1-.433.536l-.279.343c.521.096.882.106 1.185.047c.36-.071.75-.266 1.289-.804c.206-.206.513-.386.909-.386c.348 0 .623.14.793.249l.113.071l.09.1c2.237 2.455 2.998 6.201 2.465 9.334c-.153.896-.599 1.6-1.276 2.012c-.658.4-1.418.453-2.086.292c-1.305-.315-2.548-1.532-2.444-3.282a5.274 5.274 0 0 0-5.27-5.24h-6.55c-.88 0-2.098.478-3.12 1.316c-.987.81-1.58 1.78-1.622 2.663Zm15.934-4.302a7.257 7.257 0 0 1 2.628 5.593v.035l-.003.035c-.045.641.39 1.11.916 1.237c.252.061.451.02.578-.056c.107-.065.272-.221.343-.639c.412-2.423-.12-5.201-1.536-7.12c-.547.437-1.117.726-1.764.854a4.355 4.355 0 0 1-1.162.06Z"/></g></svg>

)

const getLevel19Badge = (color: string, size: number) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"><path fill={color} d="M3 20h18v2H3zm18-1H3L2.147 7.81A2 2 0 1 1 5 6a1.914 1.914 0 0 1-.024.3l2.737 2.189l2.562-4.486A1.948 1.948 0 0 1 10 3a2 2 0 0 1 4 0a1.946 1.946 0 0 1-.276 1.004l2.558 4.485l2.741-2.19A1.906 1.906 0 0 1 19 6a2 2 0 1 1 2.853 1.81ZM4.92 17h14.16l.73-8.77l-4.106 3.281L12 5.017l-3.71 6.494l-4.1-3.28Z"/></svg>
        
)

const getLevel20Badge = (color: string, size: number) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 256 256"><path fill={color} d="m251.76 88.94l-120-64a8 8 0 0 0-7.52 0l-120 64a8 8 0 0 0 0 14.12L32 117.87v48.42a15.91 15.91 0 0 0 4.06 10.65C49.16 191.53 78.51 216 128 216a130 130 0 0 0 48-8.76V240a8 8 0 0 0 16 0v-40.49a115.63 115.63 0 0 0 27.94-22.57a15.91 15.91 0 0 0 4.06-10.65v-48.42l27.76-14.81a8 8 0 0 0 0-14.12ZM128 200c-43.27 0-68.72-21.14-80-33.71V126.4l76.24 40.66a8 8 0 0 0 7.52 0L176 143.47v46.34c-12.6 5.88-28.48 10.19-48 10.19Zm80-33.75a97.83 97.83 0 0 1-16 14.25v-45.57l16-8.53Zm-20-47.31l-.22-.13l-56-29.87a8 8 0 0 0-7.52 14.12L171 128l-43 22.93L25 96l103-54.93L231 96Z"/></svg>
       
)

const getLevel21Badge = (color: string, size: number) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 18L16 13L24 18V20H8V18Z" fill={color} />
    <path d="M5 18L16 11L27 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M16 18V24M16 24L13 27M16 24L19 27" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="24" cy="7" r="5" fill={color} />
    <text x="24" y="10.5" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">M</text>
  </svg>
)

const getLevel22Badge = (color: string, size: number) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 18L16 12L24 18V20H8V18Z" fill={color} />
    <path d="M4 18L16 10L28 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M16 18V26M16 26L12 29M16 26L20 29" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="24" cy="6" r="5.5" fill={color} />
    <text x="24" y="9.5" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">PhD</text>
    <path d="M6 8L6.5 9.5L8 10L6.5 10.5L6 12L5.5 10.5L4 10L5.5 9.5L6 8Z" fill={color} />
  </svg>
)

// Map of level to badge renderer
const badgeRenderers: Record<number, (color: string, size: number) => JSX.Element> = {
  1: getLevel1Badge,
  2: getLevel2Badge,
  3: getLevel3Badge,
  4: getLevel4Badge,
  5: getLevel5Badge,
  6: getLevel6Badge,
  7: getLevel7Badge,
  8: getLevel8Badge,
  9: getLevel9Badge,
  10: getLevel10Badge,
  11: getLevel11Badge,
  12: getLevel12Badge,
  13: getLevel13Badge,
  14: getLevel14Badge,
  15: getLevel15Badge,
  16: getLevel16Badge,
  17: getLevel17Badge,
  18: getLevel18Badge,
  19: getLevel19Badge,
  20: getLevel20Badge,
  21: getLevel21Badge,
  22: getLevel22Badge,
}

export default function EducationBadge({ level, categoryColor, size = 32 }: EducationBadgeProps) {
  const educationLevel = EDUCATION_LEVELS[level] || 'Unknown'
  const renderBadge = badgeRenderers[level]

  if (!renderBadge) {
    return null
  }

  return (
    <div className="flex-shrink-0" title={educationLevel}>
      {renderBadge(categoryColor, size)}
    </div>
  )
}

