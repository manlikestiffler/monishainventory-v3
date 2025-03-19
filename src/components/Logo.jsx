const Logo = () => (
  <div className="flex items-center space-x-3">
    <div className="relative">
      <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-lg flex items-center justify-center transform rotate-12">
        <svg 
          className="w-6 h-6 text-white transform -rotate-12" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 7V5c0-1.1.9-2 2-2h4a2 2 0 012 2v2" 
          />
        </svg>
      </div>
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-400 rounded-full animate-pulse">
        <div className="absolute inset-0 bg-brand-400 rounded-full animate-ping opacity-75"></div>
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700 bg-clip-text text-transparent">
        MonishaIMS
      </span>
      <span className="text-xs font-medium text-gray-500 tracking-wider">
        INVENTORY SYSTEM
      </span>
    </div>
  </div>
);

export default Logo; 