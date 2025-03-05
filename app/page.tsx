import AirtimeForm from "@/components/airtime-form"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-800">Airtime Topup</h1>
          <p className="mt-2 text-gray-600">Send airtime to any mobile number</p>
        </div>
        <AirtimeForm />
      </div>
      <Toaster />
    </main>
  )
}

