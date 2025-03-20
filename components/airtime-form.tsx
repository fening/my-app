"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm as useHookForm, Controller } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"
import { Phone, CheckCircle2, Zap, Gift } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

// Updated schema to only include recipient field
const formSchema = z.object({
  recipient: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
})

// Use type for the form values
type FormValues = z.infer<typeof formSchema>;

// Add this type definition for your form
type AirtimeFormValues = {
  recipient: string;
  // Add other form fields as needed
};

export default function AirtimeForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formStep, setFormStep] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [transactionData, setTransactionData] = useState<{ amount: number } | null>(null)
  
  // Change useForm to useHookForm to match the import
  const form = useHookForm<AirtimeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: "",
    },
  })

  // Show confetti when success screen appears
  useEffect(() => {
    if (formStep === 1) {
      setShowConfetti(true)
      // Hide confetti after animation completes
      const timer = setTimeout(() => setShowConfetti(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [formStep])

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)
      
      // Simulate request delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Make request to our API endpoint instead of directly to the airtime service
      const response = await fetch('/api/airtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: values.recipient,
          // These will be ignored, but including them for the interface
          retailer: "",
          amount: "",
        }),
      })
      
      const result = await response.json()

      if (result.success) {
        // Store the transaction data
        setTransactionData(result.data)
        // Show success step
        setFormStep(1)
        
        toast({
          title: "Airtime Sent Successfully",
          description: `Airtime has been sent to ${values.recipient}`,
        })
        // Don't reset form immediately so user can see success state
      } else {
        // Handle different error scenarios
        if (response.status === 403) {
          toast({
            variant: "destructive",
            title: "Request Denied",
            description: "This number has already received airtime and is not eligible for more.",
          })
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.message || "An error occurred while sending airtime.",
          })
        }
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send airtime. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    form.reset()
    setFormStep(0)
  }

  // Format phone number as user types - updated to match 024 310 2276 pattern
  function formatPhoneNumber(value: string) {
    // Remove all non-digits
    let digits = value.replace(/\D/g, '')
    
    // Add leading zero if not present
    if (digits.length > 0 && !digits.startsWith('0')) {
      digits = '0' + digits;
    }
    
    // Apply formatting based on length
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`
    } else {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-md border rounded-lg overflow-hidden">
      <CardHeader className="space-y-1 bg-gray-50 border-b">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardTitle className="text-3xl font-bold text-center mb-2">Send Airtime</CardTitle>
          <CardDescription className="text-gray-500 text-center text-lg">
            Enter a phone number to receive free airtime
          </CardDescription>
        </motion.div>
      </CardHeader>
      
      <CardContent className="p-8 bg-white">
        <AnimatePresence mode="wait">
          {formStep === 0 ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <Controller
                      control={form.control}
                      name="recipient"
                      render={({ field, fieldState, formState }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-medium">Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                                <Input
                                placeholder="Enter phone number"
                                className="pl-12 h-20 font-semibold rounded-md border-gray-300 focus:border-gray-500 focus:ring-gray-500 shadow-sm"
                                style={{ fontSize: '24px' }}  // or any custom size you want
                                {...field}
                                onChange={e => {
                                  const formatted = formatPhoneNumber(e.target.value)
                                  field.onChange(formatted)
                                }}
                                disabled={isSubmitting}
                              />  
                            </div>
                          </FormControl>
                          <FormDescription className="text-base text-gray-500">
                            Enter the phone number to receive the airtime
                          </FormDescription>
                          <FormMessage className="text-base" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="pt-4 transition-opacity opacity-100">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full h-16 text-lg font-medium bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-all duration-300 shadow-sm"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending Airtime...</span>
                        </div>
                      ) : (
                        "Send Airtime"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative py-8"
            >
              {/* Confetti animation with simple colors */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(50)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      initial={{
                        top: "0%",
                        left: `${Math.random() * 100}%`,
                        opacity: 1,
                        scale: Math.random() * 0.5 + 0.5,
                      }}
                      animate={{
                        top: "100%",
                        left: `${Math.random() * 100}%`,
                        opacity: 0,
                      }}
                      transition={{
                        duration: Math.random() * 2 + 2,
                        ease: "easeOut",
                        delay: Math.random() * 0.5,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: [
                            "#E5E5E5", "#D4D4D4", "#A3A3A3", "#737373", "#525252", 
                            "#404040", "#262626", "#171717", "#0F0F0F", "#000000"
                          ][i % 10]
                        }}
                      ></div>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {/* Simplified success content */}
              <div className="flex flex-col items-center justify-center transition-all duration-300 z-10 relative">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring", 
                    damping: 12, 
                    stiffness: 200,
                    delay: 0.2
                  }}
                  className="rounded-full bg-gray-100 border border-gray-200 p-5 mb-6"
                >
                  <CheckCircle2 className="h-14 w-14 text-gray-800" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <h3 className="text-3xl font-bold text-gray-900 mb-2 text-center">Airtime Sent!</h3>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-4 px-4 py-3 bg-gray-100 rounded-full text-gray-700">
                    <Zap size={18} />
                    <span className="font-medium">Transaction Successful</span>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="bg-gray-50 rounded-md border border-gray-200 p-4 mb-8 w-full"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500">Recipient:</span>
                    <span className="font-bold text-lg">{form.getValues().recipient}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-bold text-lg">GH₵{transactionData?.amount.toFixed(2) || '0.00'}</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      
      <CardFooter className="border-t px-8 py-4 bg-gray-50 flex justify-center">
        <p className="text-sm text-gray-500">
          Thank you for your support.
        </p>
      </CardFooter>
    </Card>
  )
}

