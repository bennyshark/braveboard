// components/common/updates-section.tsx
"use client"

import { Calendar, TrendingUp, AlertCircle, Users } from "lucide-react"
import { useState } from "react"

export default function UpdatesSection() {
  const [activeTab, setActiveTab] = useState("updates")

  const tabs = [
    { id: "updates", label: "Updates", icon: TrendingUp },
    { id: "events", label: "Events", icon: Calendar },
    { id: "alerts", label: "Alerts", icon: AlertCircle },
    { id: "people", label: "People", icon: Users },
  ]

  return (
    <aside className="h-full w-full bg-[#FDFCF8] border-l border-stone-100 flex flex-col p-4">
      
      {/* Tabs Header - Bubble Style */}
      <div className="bg-stone-100/50 p-1 rounded-xl mb-6">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-white text-stone-800 shadow-sm"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-blue-500" : ""}`} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pr-1">
        
        {/* Updates Section */}
        {activeTab === "updates" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-stone-800 text-sm uppercase tracking-wide">Recent Updates</h3>
              <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">New</span>
            </div>
            
            {[1, 2, 3, 4, 5, 6].map((update) => (
              <div key={update} className="group p-4 bg-white border border-stone-100 rounded-2xl shadow-sm hover:border-blue-200 transition-all cursor-pointer">
                <div className="flex gap-3">
                  <div className={`h-2 w-2 mt-2 rounded-full shrink-0 ${
                    update % 3 === 0 ? "bg-green-400" :
                    update % 3 === 1 ? "bg-blue-400" : "bg-orange-400"
                  }`} />
                  <div className="flex-1">
                    <p className="font-semibold text-stone-800 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                      {update === 1 && "New academic calendar released for 2025"}
                      {update === 2 && "Department meeting scheduled for Tuesday"}
                      {update === 3 && "Campus maintenance notice: West Wing"}
                      {update === 4 && "Organization fair registration closing soon"}
                      {update === 5 && "New library resources available online"}
                      {update === 6 && "Research grant applications now open"}
                    </p>
                    <p className="text-xs text-stone-400 mt-2 font-medium">2 hours ago</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Events Section - Sticky Note Style */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <h3 className="font-black text-stone-800 text-sm uppercase tracking-wide mb-2">Upcoming Events</h3>
            {[1, 2, 3, 4].map((event) => (
              <div key={event} className="relative bg-[#FFFBEB] rounded-2xl p-4 border border-orange-100 shadow-[2px_2px_0px_0px_rgba(251,191,36,0.2)]">
                {/* Washi Tape Effect */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-12 h-3 bg-orange-200/50 rotate-[-2deg]"></div>
                
                <div className="flex items-center gap-4">
                  <div className="bg-white/80 rounded-xl p-2 text-center min-w-[3.5rem] border border-orange-100">
                    <div className="text-[10px] font-bold text-orange-400 uppercase">DEC</div>
                    <div className="text-xl font-black text-stone-800">2{event}</div>
                  </div>
                  <div>
                    <p className="font-bold text-stone-800 text-sm line-clamp-2">
                      {event === 1 && "Faculty Development Workshop"}
                      {event === 2 && "Student Council Meeting"}
                      {event === 3 && "Sports Fest Opening Ceremony"}
                      {event === 4 && "Research Symposium"}
                    </p>
                    <p className="text-xs text-orange-800/60 mt-1 font-medium">Main Auditorium • 2 PM</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Widget - Styled like a ID Card / Tag */}
        <div className="mt-8 relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-5 text-white shadow-lg">
           <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <h4 className="font-bold mb-4 relative z-10 text-sm uppercase tracking-wider opacity-90">Community Stats</h4>
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <p className="text-2xl font-black">24</p>
              <p className="text-[10px] uppercase font-bold opacity-70">New Posts</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <p className="text-2xl font-black">8</p>
              <p className="text-[10px] uppercase font-bold opacity-70">Events</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}