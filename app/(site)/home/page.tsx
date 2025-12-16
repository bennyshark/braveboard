// app/home/page.tsx
"use client"

import { Globe, Building, Users, Paperclip, Smile, Image as ImageIcon } from "lucide-react"
import { useState } from "react"

export default function HomePage() {
  const [activeFeedFilter, setActiveFeedFilter] = useState("feed")

  const feedFilters = [
    { id: "feed", label: "Feed", icon: Globe, color: "blue" },
    { id: "department", label: "Department", icon: Building, color: "green" },
    { id: "org", label: "Organization", icon: Users, color: "orange" },
  ]

  return (
    // Widened container to max-w-5xl for better visibility
    <div className="max-w-5xl mx-auto pb-10">
      
      {/* Header Area */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-stone-800 tracking-tight">Campus Journal</h2>
          <p className="text-stone-500 font-medium">Here's what's happening at school today.</p>
        </div>

        {/* Filters - Styled like Washi Tape / Tags */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-stone-200 shadow-sm">
          {feedFilters.map((filter) => {
            const Icon = filter.icon
            const isActive = activeFeedFilter === filter.id
            
            // Dynamic colors based on selection
            const activeClass = 
              filter.color === "blue" ? "bg-blue-100 text-blue-700 shadow-sm" :
              filter.color === "green" ? "bg-green-100 text-green-700 shadow-sm" :
              "bg-orange-100 text-orange-800 shadow-sm"

            return (
              <button
                key={filter.id}
                onClick={() => setActiveFeedFilter(filter.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isActive
                    ? activeClass
                    : "text-stone-500 hover:bg-stone-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Create Post - Notebook Style */}
      <div className="bg-white rounded-3xl p-6 mb-8 border-2 border-stone-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.03)] relative overflow-hidden">
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 via-green-400 to-orange-400 opacity-70"></div>
        
        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
            JD
          </div>
          <div className="flex-1">
            <textarea
              placeholder="Write something for your memory journal..."
              className="w-full border-none resize-none bg-stone-50/50 rounded-xl p-4 text-stone-700 placeholder:text-stone-400 focus:ring-0 focus:bg-stone-50 transition-colors text-lg"
              rows={2}
            />
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <button className="p-2 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                  <ImageIcon className="h-5 w-5" />
                </button>
                <button className="p-2 text-stone-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                  <Paperclip className="h-5 w-5" />
                </button>
                <button className="p-2 text-stone-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                  <Smile className="h-5 w-5" />
                </button>
              </div>
              <button className="px-6 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Post Announcement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="space-y-8">
        {[1, 2, 3, 4, 5].map((post) => (
          <div key={post} className="group bg-white rounded-3xl border-2 border-stone-100/80 shadow-sm hover:border-blue-200 transition-all duration-300">
            {/* Post Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-stone-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                    <div className={`h-full w-full flex items-center justify-center text-white font-bold text-lg ${
                       post % 2 === 0 ? "bg-green-400" : "bg-blue-400"
                    }`}>
                      U{post}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-lg">User {post}</h4>
                    <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                      <span>2 hours ago</span>
                      <span className="h-1 w-1 rounded-full bg-stone-300"></span>
                      <span className={
                        activeFeedFilter === "feed" ? "text-blue-500" :
                        activeFeedFilter === "department" ? "text-green-600" :
                        "text-orange-600"
                      }>
                        {activeFeedFilter === "feed" ? "Public" :
                         activeFeedFilter === "department" ? "Dept. Only" :
                         "Council"}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Cute Badge */}
                <div className={`px-4 py-1.5 rounded-full border-2 text-xs font-bold uppercase tracking-wider ${
                    activeFeedFilter === "feed" ? "bg-blue-50 text-blue-600 border-blue-100" :
                    activeFeedFilter === "department" ? "bg-green-50 text-green-600 border-green-100" :
                    "bg-orange-50 text-orange-600 border-orange-100"
                }`}>
                  {activeFeedFilter}
                </div>
              </div>

              {/* Content Body - Larger Text */}
              <div className="pl-16 pr-4">
                <p className="text-stone-700 text-lg leading-relaxed">
                  This is a sample announcement in the {activeFeedFilter} view. 
                  {post === 1 && " Welcome to the new semester! 🎒 Remember to check your schedules and grab your welcome kits from the lobby."}
                  {post === 2 && " Important meeting scheduled for all department members tomorrow at 3 PM. Coffee will be served! ☕"}
                  {post === 3 && " Organization fair will be held next week. Don't miss the opportunity to join! 🎪"}
                  {post === 4 && " Research paper submissions are now open for the annual conference. Good luck everyone! 📝"}
                  {post === 5 && " Campus cleanup drive this Saturday. Volunteers needed! Let's make our school green. 🌱"}
                </p>
              </div>
            </div>

            {/* Post Actions - Separated like a footer */}
            <div className="mx-6 mb-6 mt-2 pt-4 border-t-2 border-dashed border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 text-stone-500 hover:text-rose-500 transition-colors group/btn">
                  <div className="p-1.5 rounded-lg group-hover/btn:bg-rose-50 transition-colors">
                    👍
                  </div>
                  <span className="font-bold text-sm">Like</span>
                </button>
                <button className="flex items-center gap-2 text-stone-500 hover:text-blue-600 transition-colors group/btn">
                  <div className="p-1.5 rounded-lg group-hover/btn:bg-blue-50 transition-colors">
                    💬
                  </div>
                  <span className="font-bold text-sm">Comment</span>
                </button>
                <button className="flex items-center gap-2 text-stone-500 hover:text-green-600 transition-colors group/btn">
                   <div className="p-1.5 rounded-lg group-hover/btn:bg-green-50 transition-colors">
                    ↪️
                  </div>
                  <span className="font-bold text-sm">Share</span>
                </button>
              </div>
              
              <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                   <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-gray-200"></div>
                 ))}
                 <span className="ml-4 text-xs font-bold text-stone-400 self-center">
                   +{post * 5} likes
                 </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}