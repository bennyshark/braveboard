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
    <aside className="h-full w-80 border-l bg-white flex flex-col">
      {/* Tabs Header - Fixed */}
      <div className="border-b">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-3 ${
                  isActive
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1 font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        
        {/* Updates Section */}
        {activeTab === "updates" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-3">Recent Updates</h3>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((update) => (
              <div key={update} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    update % 3 === 0 ? "bg-green-100" :
                    update % 3 === 1 ? "bg-blue-100" : "bg-purple-100"
                  }`}>
                    {update % 3 === 0 ? "📢" : update % 3 === 1 ? "⚡" : "🎯"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {update === 1 && "New academic calendar released"}
                      {update === 2 && "Department meeting scheduled"}
                      {update === 3 && "Campus maintenance notice"}
                      {update === 4 && "Organization fair next week"}
                      {update === 5 && "New library resources available"}
                      {update === 6 && "Research grant applications open"}
                      {update === 7 && "Sports tournament finals"}
                      {update === 8 && "Faculty development workshop"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Events Section */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-3">Upcoming Events</h3>
            {[1, 2, 3, 4, 5].map((event) => (
              <div key={event} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-blue-50 flex flex-col items-center justify-center shrink-0">
                    <div className="text-xs font-bold text-blue-600">MON</div>
                    <div className="text-lg font-bold text-gray-900">2{event}</div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {event === 1 && "Faculty Development Workshop"}
                      {event === 2 && "Student Council Meeting"}
                      {event === 3 && "Sports Fest Opening"}
                      {event === 4 && "Research Symposium"}
                      {event === 5 && "Alumni Homecoming"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Main Auditorium • 2:00 PM</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Widget */}
        <div className="mt-6 p-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg text-white">
          <h4 className="font-semibold mb-3">Quick Stats</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/20 rounded p-2">
              <p className="text-xs opacity-90">Announcements</p>
              <p className="text-lg font-bold">24</p>
            </div>
            <div className="bg-white/20 rounded p-2">
              <p className="text-xs opacity-90">Upcoming</p>
              <p className="text-lg font-bold">8</p>
            </div>
            <div className="bg-white/20 rounded p-2">
              <p className="text-xs opacity-90">Responses</p>
              <p className="text-lg font-bold">142</p>
            </div>
            <div className="bg-white/20 rounded p-2">
              <p className="text-xs opacity-90">Members</p>
              <p className="text-lg font-bold">1.2k</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}