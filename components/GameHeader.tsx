const GameHeader = () => {
  return (
    <div className="text-center mb-8 sm:mb-12 relative z-10 px-2">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
        <span className="text-gray-100">GAMES</span>
        <span className="ml-2 sm:ml-4 text-cyan-400 block sm:inline" style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}>COLLECTION</span>
      </h1>
      <div className="w-24 sm:w-32 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto"></div>
    </div>
  )
}

export default GameHeader
