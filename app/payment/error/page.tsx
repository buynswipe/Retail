export const dynamic = "force-static"
export const revalidate = false

export default function PaymentErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4">
        <div>
          <div className="text-xl font-medium text-black">Payment Error</div>
          <p className="text-gray-500">There was an issue with your payment.</p>
          <a href="/retailer/orders" className="mt-4 inline-block text-blue-500 hover:text-blue-700">
            View Orders
          </a>
        </div>
      </div>
    </div>
  )
}
