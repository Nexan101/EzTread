export default function JoinCompletePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
      <div className="bg-white rounded-3xl p-12 border border-[#d2d2d7] shadow-sm max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#1d1d1f] mb-3">You&apos;re in!</h1>
        <p className="text-[#6e6e73] mb-8 leading-relaxed">
          Welcome to the EzTread Shop Partner Program. We&apos;ll reach out shortly to get your shop listed and start sending you customers.
        </p>
        <a
          href="/shop-dashboard"
          className="block w-full bg-[#1d1d1f] hover:bg-[#3d3d3f] text-white font-semibold text-[15px] py-4 rounded-2xl transition-all duration-200"
        >
          Go to Shop Dashboard
        </a>
        <a href="/" className="block mt-3 text-sm text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">
          Back to home
        </a>
      </div>
    </div>
  );
}
