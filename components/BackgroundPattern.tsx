const BackgroundPattern = () => {
  return (
    <div 
      className="absolute inset-0 opacity-50"
      style={{
        backgroundImage: "url('/background/topography.svg')",
        backgroundRepeat: 'repeat',
        backgroundSize: '600px 600px'
      }}
    />
  )
}

export default BackgroundPattern
