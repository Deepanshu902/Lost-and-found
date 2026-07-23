"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Navbar } from "@/components/navbar"
import { ReportCard } from "@/components/report-card"
import { ReportFormModal } from "@/components/report-form-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login")
      return
    }

    setUser(JSON.parse(storedUser))
    fetchReports()
  }, [router])

  const fetchReports = async () => {
    try {
      const response = await apiFetch("report/")

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("user")
          router.push("/login")
          return
        }
        throw new Error("Failed to fetch reports")
      }

      const data = await response.json()
      setReports(data.data || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reports. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReportAdded = (newReport: Report) => {
    setReports((prevReports) => [newReport, ...prevReports])
    toast({
      title: "Success",
      description: "Your report has been submitted successfully!",
    })
  }

  const filteredReports = reports.filter((report) => {
    if (activeTab === "all") return true
    return report.status.toLowerCase() === activeTab
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold mb-4 sm:mb-0">Lost & Found Reports</h1>
          <Button onClick={() => setIsReportModalOpen(true)}>Report Lost/Found Item</Button>
        </div>

        <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="lost">Lost Items</TabsTrigger>
            <TabsTrigger value="found">Found Items</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-0">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No reports found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReports.map((report) => (
                  <ReportCard key={report._id} report={report} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="lost" className="mt-0">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No lost items reported</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReports.map((report) => (
                  <ReportCard key={report._id} report={report} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="found" className="mt-0">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No found items reported</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReports.map((report) => (
                  <ReportCard key={report._id} report={report} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ReportFormModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReportAdded={handleReportAdded}
        user={user}
      />
    </div>
  )
}
