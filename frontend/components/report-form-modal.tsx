"use client"

import type React from "react"

import { useState } from "react"
import { apiFetch } from "@/lib/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface User {
  _id: string
  name: string
  email: string
  username: string
  number: string
}

interface Report {
  _id: string
  title: string
  content: string
  status: "Lost" | "Found" | "Returned"
  location: string
  image?: string
  number: string
  owner: User
  createdAt: string
}

interface ReportFormModalProps {
  isOpen: boolean
  onClose: () => void
  onReportAdded: (report: Report) => void
  user: User | null
}

const reportSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  status: z.enum(["Lost", "Found"]),
  image: z.string().optional(),
})

type ReportFormValues = z.infer<typeof reportSchema>

export function ReportFormModal({ isOpen, onClose, onReportAdded, user }: ReportFormModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      content: "",
      location: "",
      status: "Lost",
      image: "",
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // For now, just create a preview URL
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      form.setValue("image", previewUrl)
    }
  }

  async function onSubmit(data: ReportFormValues) {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to report an item",
        variant: "destructive",
      })
      return
    }
  
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = fileInput?.files?.[0]
  
    const formData = new FormData()
    formData.append("title", data.title)
    formData.append("content", data.content)
    formData.append("location", data.location)
    formData.append("status", data.status)
    formData.append("number", user.number) // Backend expects this
    if (file) {
      formData.append("file", file) // Must be named `file` to match multer setup
    }
  
    setIsSubmitting(true)
    try {
      const response = await apiFetch("report/", {
        method: "POST",
        body: formData,
      })
  
      const result = await response.json()
  
      if (!response.ok) {
        throw new Error(result.message || "Failed to create report")
      }
  
      const newReport = {
        ...result.data,
        owner: user,
      }
  
      onReportAdded(newReport)
      form.reset()
      setImagePreview(null)
      onClose()
  
      toast({
        title: `New ${data.status} Item Reported`,
        description: `${data.title} has been reported ${data.status.toLowerCase()} at ${data.location}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create report",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Lost or Found Item</DialogTitle>
          <DialogDescription>Fill in the details about the item you lost or found.</DialogDescription>
        </DialogHeader>
        
        {/* Add a container with fixed height and scroll */}
        <div className="max-h-[60vh] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Blue Backpack" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the item in detail..."
                        className="min-h-[100px]"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Library, 2nd Floor" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Lost">Lost</SelectItem>
                        <SelectItem value="Found">Found</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Image (Optional)</FormLabel>
                <FormControl>
                  <Input type="file" accept="image/*" onChange={handleImageChange} disabled={isSubmitting} />
                </FormControl>
                {imagePreview && (
                  <div className="mt-2 max-h-48 overflow-hidden rounded-md">
                    <img 
                      src={imagePreview || "/placeholder.svg"} 
                      alt="Preview" 
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: "192px" }} // Ensure image doesn't exceed container
                    />
                  </div>
                )}
              </FormItem>
            </form>
          </Form>
        </div>

        {/* Move the footer outside the scrollable area to make it always visible */}
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}