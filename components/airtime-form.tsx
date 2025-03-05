"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm as useHookForm, Controller } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
import { canMakeRequest, recordRequest, getRemainingCooldownTime } from "@/lib/request-limiter"
import { Phone } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

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
  
  // Change useForm to useHookForm to match the import
  const form = useHookForm<AirtimeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: "",
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)
      
      // Check if user can make a request
      if (!canMakeRequest(values.recipient)) {
        const remainingTime = getRemainingCooldownTime(values.recipient)
        const hours = Math.ceil((remainingTime || 0) / (1000 * 60 * 60))
        
        toast({
          variant: "destructive",
          title: "Request Denied",
          description: `This number already received airtime. Try again in ${hours} hours.`,
        })
        setIsSubmitting(false)
        return
      }
      
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
        // Record the successful request
        recordRequest(values.recipient)
        
        // Show success step
        setFormStep(1)
        
        toast({
          title: "Airtime Sent Successfully",
          description: `Airtime has been sent to ${values.recipient}`,
        })
        // Don't reset form immediately so user can see success state
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        })
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

  // Format phone number as user types
  function formatPhoneNumber(value: string) {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
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
    <Card className="w-full max-w-md mx-auto shadow-lg border-0">
      <CardHeader className="space-y-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="text-2xl font-bold text-center">Send Airtime</CardTitle>
        <CardDescription className="text-blue-100 text-center">Enter a phone number to receive free airtime</CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        {formStep === 0 ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <Controller
                  control={form.control}
                  name="recipient"
                  render={({ field, fieldState, formState }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                          <Input
                            placeholder="Enter phone number"
                            className="pl-10 h-12 text-lg"
                            {...field}
                            onChange={e => {
                              const formatted = formatPhoneNumber(e.target.value)
                              field.onChange(formatted)
                            }}
                            disabled={isSubmitting}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-sm text-gray-500">
                        Enter the phone number to receive the airtime
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="pt-2 transition-opacity opacity-100">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending Airtime...</span>
                    </div>
                  ) : (
                    "Send Airtime"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 transition-all duration-300">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Airtime Sent!</h3>
            <p className="text-gray-500 text-center mb-6">
              Your airtime has been sent successfully to {form.getValues().recipient}.
            </p>
            <Button 
              onClick={resetForm}
              className="bg-gray-100 text-gray-800 hover:bg-gray-200"
            >
              Send Another
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t px-6 py-3 bg-gray-50 flex justify-center rounded-b-lg">
        <p className="text-xs text-gray-500">
          Thank you for your support.
        </p>
      </CardFooter>
    </Card>
  )
}

