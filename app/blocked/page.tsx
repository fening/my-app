export default function BlockedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-bold text-red-600">Access Denied</h1>
        <p className="mb-8 text-lg text-gray-600">
          Sorry, you are not authorized to access this page. This number has already received airtime.
        </p>
        <a
          href="/"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
