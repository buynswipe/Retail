import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">RetailBandhu</h1>
          <nav>
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Welcome to RetailBandhu</h2>
            <p className="mt-4 text-xl text-gray-500">
              Connecting retailers, wholesalers, and delivery partners for streamlined FMCG supply chain operations in
              India
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className="px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">&copy; 2023 RetailBandhu. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
