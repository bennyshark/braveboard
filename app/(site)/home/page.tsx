// app/home/page.tsx
"use client"

import { Globe, Building, Users } from "lucide-react"
import { useState } from "react"

export default function HomePage() {
  const [activeFeedFilter, setActiveFeedFilter] = useState("feed")

  const feedFilters = [
    { id: "feed", label: "Feed", icon: Globe },
    { id: "department", label: "Department", icon: Building },
    { id: "org", label: "Organization", icon: Users },
  ]

  return (
    <div className="p-6">
      {/* Centered Feed Filters */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-center space-x-2">
          {feedFilters.map((filter) => {
            const Icon = filter.icon
            const isActive = activeFeedFilter === filter.id
            
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFeedFilter(filter.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-700 border hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Feed Content */}
      <div className="max-w-3xl mx-auto">
        {/* Create Post */}
        <div className="bg-white rounded-xl border shadow-sm mb-6 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
              JD
            </div>
            <input
              type="text"
              placeholder="What's happening in your campus?"
              className="flex-1 border-none bg-gray-50 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end mt-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Post Announcement
            </button>
          </div>
        </div>

        {/* Feed Content */}
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((post) => (
            <div key={post} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              {/* Post Header */}
              <div className="p-5 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                      U{post}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">User {post}</h4>
                      <p className="text-sm text-gray-500">
                        {activeFeedFilter === "feed" ? "Public Announcement" :
                         activeFeedFilter === "department" ? "Computer Science Department" :
                         "Student Council"}
                      </p>
                      <p className="text-xs text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activeFeedFilter === "feed" ? "bg-blue-100 text-blue-800" :
                    activeFeedFilter === "department" ? "bg-green-100 text-green-800" :
                    "bg-purple-100 text-purple-800"
                  }`}>
                    {activeFeedFilter}
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-5">
                <p className="text-gray-800">
                  This is a sample announcement in the {activeFeedFilter} view. 
                  {post === 1 && " Welcome to the new semester! Remember to check your schedules."}
                  {post === 2 && " Important meeting scheduled for all department members tomorrow at 3 PM."}
                  {post === 3 && " Organization fair will be held next week. Don't miss the opportunity to join!"}
                  {post === 4 && " Research paper submissions are now open for the annual conference."}
                  {post === 5 && " Campus cleanup drive this Saturday. Volunteers needed!"}
                </p>
                
                {/* Post Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <button className="flex items-center gap-1 hover:text-blue-600">
                      👍 Like
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-600">
                      💬 Comment
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-600">
                      ↪️ Share
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">
                    {post === 1 && "24 likes • 8 comments"}
                    {post === 2 && "42 likes • 12 comments"}
                    {post === 3 && "18 likes • 5 comments"}
                    {post === 4 && "31 likes • 9 comments"}
                    {post === 5 && "27 likes • 11 comments"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}