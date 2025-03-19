import AirtimeForm from "@/components/airtime-form"
import { Toaster } from "@/components/ui/toaster"
import Image from "next/image"

export default function Home() {
  return (
    <main className="min-h-screen bg-white p-4 md:p-8 text-base">
      <div className="mx-auto max-w-md relative z-10">
        <div className="mb-8 text-center">
        </div>
        <AirtimeForm />
      </div>
      <Toaster />
    </main>
  )
}

