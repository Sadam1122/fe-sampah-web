import { toast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error("API error:", error)
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "An unexpected error occurred",
      variant: "destructive",
    })
    throw error
  }
}

export async function fetchGarbageData() {
  return fetchWithAuth("/api/pengumpulan-sampah")
}

export async function fetchUsers() {
  return fetchWithAuth("/api/users")
}

export async function fetchIncidents() {
  return fetchWithAuth("/api/insiden")
}

export async function fetchDesa() {
  return fetchWithAuth("/api/desa")
}

export async function submitGarbageData(data: any) {
  return fetchWithAuth("/api/pengumpulan-sampah", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateGarbageData(id: string, data: any) {
  return fetchWithAuth(`/api/pengumpulan-sampah/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

