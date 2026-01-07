// components/home/FeedFilters.tsx
import { Search, Filter, Megaphone } from "lucide-react"
import { Organization } from "@/app/(site)/home/types"

interface FeedFiltersProps {
  activeFilter: string
  organizations: Organization[] 
  selectedOrg: string | null
  setSelectedOrg: (id: string | null) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedSource: string | null
  setSelectedSource: (id: string) => void
}

export function FeedFilters({ 
  activeFilter, organizations, selectedOrg, setSelectedOrg, 
  searchTerm, setSearchTerm, selectedSource, setSelectedSource 
}: FeedFiltersProps) {
  
  const announcementSources = [
    { id: "faith", name: "FAITH Administration" },
    { id: "scouncil", name: "Student Council" },
    { id: "lighthouse", name: "Lighthouse" },
    { id: "all", name: "All Announcements" },
  ]

  // --- ORGANIZATION FILTER ---
  if (activeFilter === "org") {
    // Logic to filter the "pills" based on the search input
    const filteredOrgs = organizations.filter(org => 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      org.code.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
      <div className="sticky top-0 z-10 mb-6 py-2 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left Side: Label & Scrollable List */}
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-2 text-gray-500 flex-shrink-0">
              <Filter className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Filter</span>
            </div>

            <div className="h-6 w-px bg-gray-300 flex-shrink-0 mx-1"></div>

            {/* Scrollable Container */}
            <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              {/* Always show 'All Orgs' unless we are filtering heavily? 
                  Keeping it visible allows easy reset without deleting text manually */}
              <button
                onClick={() => setSelectedOrg(null)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                  selectedOrg === null 
                    ? 'bg-orange-600 border-orange-600 text-white shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                All Orgs
              </button>

              {/* RENDER FILTERED ORGANIZATIONS */}
              {filteredOrgs.map(org => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrg(org.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                    selectedOrg === org.id 
                      ? 'bg-orange-600 border-orange-600 text-white shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
                  }`}
                >
                  {org.code || org.name}
                </button>
              ))}

              {/* Empty State for Filters */}
              {filteredOrgs.length === 0 && (
                <span className="text-xs text-gray-400 italic whitespace-nowrap pl-2">
                  No orgs match "{searchTerm}"
                </span>
              )}
            </div>
            
            {/* Gradient fade */}
            <div className="w-8 h-full absolute right-0 md:right-auto md:left-[60%] bg-gradient-to-l from-gray-50 to-transparent pointer-events-none md:hidden"></div>
          </div>
          
          {/* Right Side: Search */}
          <div className="relative flex-shrink-0 w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="search"
              placeholder="Find organization..."
              className="w-full md:w-48 pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
    )
  }

  // --- ANNOUNCEMENT FILTER ---
  if (activeFilter === "announcements") {
    return (
      <div className="sticky top-0 z-10 mb-6 py-2 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-500 flex-shrink-0">
            <Megaphone className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Source</span>
          </div>

          <div className="h-6 w-px bg-gray-300 flex-shrink-0 mx-1"></div>

          <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {announcementSources.map(source => (
              <button
                key={source.id}
                onClick={() => setSelectedSource(source.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                  selectedSource === source.id 
                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600'
                }`}
              >
                {source.name.replace(" Administration", "").replace("Student ", "")}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}