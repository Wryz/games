const BackgroundPattern = () => {
  return (
    <div 
      className="absolute inset-0 opacity-5 dark:opacity-20 transition-opacity duration-300 pointer-events-none"
      style={{
        backgroundImage: "url('/background/topography.svg')",
        backgroundRepeat: 'repeat',
        backgroundSize: '600px 600px'
      }}
    />
  )
}

export default BackgroundPattern
