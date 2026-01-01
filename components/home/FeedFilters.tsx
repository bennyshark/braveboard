import { Search, Filter, Megaphone } from "lucide-react"
import { Organization } from "@/app/(site)/home/types"

interface FeedFiltersProps {
  activeFilter: string
  organizations: Organization[] // This matches the display shape
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

  if (activeFilter === "org") {
    return (
      <div className="mb-4 bg-white rounded-lg border border-gray-300 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Filter className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <span className="font-bold text-gray-900 text-sm">Filter:</span>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setSelectedOrg(null)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedOrg === null ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All Organizations
              </button>
              {organizations.slice(0, 3).map(org => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrg(org.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedOrg === org.id ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {org.name}
                </button>
              ))}
            </div>
          </div>
          <div className="relative flex-shrink-0">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              type="search"
              placeholder="Search..."
              className="pl-7 pr-2 py-1 border border-gray-300 rounded-lg text-xs w-32 focus:border-orange-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
    )
  }

  if (activeFilter === "announcements") {
    return (
      <div className="mb-4 bg-white rounded-lg border border-gray-300 p-3">
        <div className="flex items-center gap-3">
          <Megaphone className="h-4 w-4 text-purple-600 flex-shrink-0" />
          <span className="font-bold text-gray-900 text-sm">Source:</span>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {announcementSources.map(source => (
              <button
                key={source.id}
                onClick={() => setSelectedSource(source.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedSource === source.id ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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