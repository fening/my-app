"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm as useHookForm } from "react-hook-form"
import type { ControllerRenderProps, FieldValues } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
import { canMakeRequest, recordRequest, getRemainingCooldownTime } from "@/lib/request-limiter"

// Updated schema to only include recipient field
const formSchema = z.object({
  recipient: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
})

// Use type for the form values
type FormValues = z.infer<typeof formSchema>;

export default function AirtimeForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Change useForm to useHookForm to match the import
  const form = useHookForm<FormValues>({
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
        
        toast({
          title: "Airtime Sent Successfully",
          description: `Airtime has been sent to ${values.recipient}`,
        })
        form.reset()
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="recipient"
          render={({ field }: { field: ControllerRenderProps<FieldValues, "recipient"> }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter phone number" {...field} />
              </FormControl>
              <FormDescription>
                Enter the phone number to receive the airtime.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Airtime"}
        </Button>
      </form>
    </Form>
  )
}

