import AirtimeForm from "@/components/airtime-form"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
        </div>
        <AirtimeForm />
      </div>
      <Toaster />
    </main>
  )
}

