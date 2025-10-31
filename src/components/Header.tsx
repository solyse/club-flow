import { Search, ShoppingCart } from 'lucide-react';

export function Header() {
  return (
    <>
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left Navigation */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <a href="#" className="text-sm text-gray-700 hover:text-[#C8A654] transition-colors">
                Home
              </a>
              <a href="#" className="text-sm text-gray-700 hover:text-[#C8A654] transition-colors">
                BagCaddie Club
              </a>
              <a href="#" className="text-sm text-gray-700 hover:text-[#C8A654] transition-colors border-b-2 border-black pb-1">
                Start Your Journey
              </a>
            </div>

            {/* Center Logo */}
            <div className="flex-1 md:flex-initial flex justify-center md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
              <div className="text-center">
                <div className="border-2 border-black px-3 py-1 sm:px-4 sm:py-1.5 inline-block">
                  <h1 className="tracking-[0.2em] sm:tracking-[0.3em] text-sm sm:text-base">
                    BAGCADDIE
                  </h1>
                </div>
                <p className="text-[9px] sm:text-[10px] tracking-wider mt-1">
                  EFFORTLESS TRAVEL, DELIVERED.
                </p>
              </div>
            </div>

            {/* Right Navigation */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <a href="#" className="text-sm text-gray-700 hover:text-[#C8A654] transition-colors">
                Contact Us
              </a>
              <a href="#" className="text-sm text-gray-700 hover:text-[#C8A654] transition-colors">
                Account
              </a>
              <button className="text-gray-700 hover:text-[#C8A654] transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <button className="text-gray-700 hover:text-[#C8A654] transition-colors">
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Icons */}
            <div className="flex md:hidden items-center gap-4">
              <button className="text-gray-700 hover:text-[#C8A654] transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <button className="text-gray-700 hover:text-[#C8A654] transition-colors">
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-64 sm:h-80 lg:h-96 w-full overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center">
          <div className="text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Golf Course</h3>
            <p className="text-lg opacity-90">Scenic View</p>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <h2 className="text-white text-4xl sm:text-5xl lg:text-6xl tracking-wide">
            Create Your Journey
          </h2>
        </div>
      </div>
    </>
  );
}
