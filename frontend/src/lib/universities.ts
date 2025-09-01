export interface University {
  name: string
  country: string
  alpha_two_code: string
  domains: string[]
  web_pages: string[]
  state_province: string | null
}

let universitiesCache: University[] | null = null

export async function fetchUniversities(): Promise<University[]> {
  if (universitiesCache) {
    return universitiesCache
  }

  try {
    // Use our API route to avoid CORS issues
    const response = await fetch('/api/universities')
    if (!response.ok) {
      throw new Error('Failed to fetch universities')
    }
    
    const data = await response.json()
    universitiesCache = data
    return data
  } catch (error) {
    console.error('Error fetching universities:', error)
    // Return some fallback universities if fetch fails
    return getFallbackUniversities()
  }
}

// Fallback list of common universities in case the API fails
function getFallbackUniversities(): University[] {
  return [
    {
      name: "Harvard University",
      country: "United States",
      alpha_two_code: "US",
      domains: ["harvard.edu"],
      web_pages: ["https://www.harvard.edu/"],
      state_province: "Massachusetts"
    },
    {
      name: "Stanford University",
      country: "United States",
      alpha_two_code: "US",
      domains: ["stanford.edu"],
      web_pages: ["https://www.stanford.edu/"],
      state_province: "California"
    },
    {
      name: "Massachusetts Institute of Technology",
      country: "United States",
      alpha_two_code: "US",
      domains: ["mit.edu"],
      web_pages: ["https://www.mit.edu/"],
      state_province: "Massachusetts"
    },
    {
      name: "University of Pennsylvania",
      country: "United States",
      alpha_two_code: "US",
      domains: ["upenn.edu"],
      web_pages: ["https://www.upenn.edu/"],
      state_province: "Pennsylvania"
    },
    {
      name: "Columbia University",
      country: "United States",
      alpha_two_code: "US",
      domains: ["columbia.edu"],
      web_pages: ["https://www.columbia.edu/"],
      state_province: "New York"
    },
    {
      name: "Yale University",
      country: "United States",
      alpha_two_code: "US",
      domains: ["yale.edu"],
      web_pages: ["https://www.yale.edu/"],
      state_province: "Connecticut"
    },
    {
      name: "Princeton University",
      country: "United States",
      alpha_two_code: "US",
      domains: ["princeton.edu"],
      web_pages: ["https://www.princeton.edu/"],
      state_province: "New Jersey"
    },
    {
      name: "University of California, Berkeley",
      country: "United States",
      alpha_two_code: "US",
      domains: ["berkeley.edu"],
      web_pages: ["https://www.berkeley.edu/"],
      state_province: "California"
    },
    {
      name: "University of Chicago",
      country: "United States",
      alpha_two_code: "US",
      domains: ["uchicago.edu"],
      web_pages: ["https://www.uchicago.edu/"],
      state_province: "Illinois"
    },
    {
      name: "Other University",
      country: "Other",
      alpha_two_code: "XX",
      domains: [],
      web_pages: [],
      state_province: null
    }
  ]
}

export async function searchUniversities(query: string): Promise<University[]> {
  const universities = await fetchUniversities()
  
  if (!query) return universities.slice(0, 100)
  
  const searchTerm = query.toLowerCase()
  const filtered = universities.filter(uni => 
    uni.name.toLowerCase().includes(searchTerm) ||
    uni.country.toLowerCase().includes(searchTerm)
  )
  
  return filtered.slice(0, 100)
}