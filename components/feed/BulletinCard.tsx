// components/feed/BulletinCard.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Pin,
  Clock,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Users,
  Image,
} from "lucide-react";
import { BulletinOptionsMenu } from "@/components/menus/BulletinOptionsMenu";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { SingleImageDisplay } from "./SingleImageDisplay";
import { CommentSection } from "@/components/comments/CommentSection";
import { ReactionButton } from "@/components/reactions/ReactionButton";
import { ReactionSummary } from "@/components/reactions/ReactionSummary";
import { RepostButton } from "@/components/reposts/RepostButton";
import { TaggedUsersDisplay } from "@/components/tags/TaggedUsersDisplay";
import { createBrowserClient } from "@supabase/ssr";
import { TruncatedText } from "../ui/TruncatedText";

type Bulletin = {
  id: string;
  header: string;
  body: string;
  organizerType: string;
  organizerName: string;
  imageUrls: string[];
  isPinned: boolean;
  likes: number;
  comments: number;
  allowComments: boolean;
  createdAt: string;
  reactionCount?: number;
  repostCount?: number;
  createdBy?: string;
  taggedUsersCount?: number;
  organizerId?: string;
};

interface BulletinCardProps {
  bulletin: Bulletin;
  onUpdate?: () => void;
  onRepostCreated?: (repost: any) => void;
  avatarCache?: {
    faithAdmin: string | null;
    organizations: Map<string, string | null>;
  };
}

export function BulletinCard({
  bulletin,
  onUpdate,
  onRepostCreated,
  avatarCache,
}: BulletinCardProps) {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showComments, setShowComments] = useState(true);

  const [reactionCount, setReactionCount] = useState(
    bulletin.reactionCount || 0
  );
  const [repostCount, setRepostCount] = useState(bulletin.repostCount || 0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [canEditTags, setCanEditTags] = useState(false);
  const [organizerId, setOrganizerId] = useState<string | null>(
    bulletin.organizerId || null
  );

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  useEffect(() => {
    loadUserData();
  }, [bulletin.id]);

  const loadUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Fetch bulletin data including creator_org_id
      const { data: bulletinData } = await supabase
        .from("bulletins")
        .select("created_by, creator_org_id, creator_type")
        .eq("id", bulletin.id)
        .single();

      if (bulletinData) {
        setCanEditTags(user?.id === bulletinData.created_by);

        // Set organizer ID if not already set
        if (!organizerId && bulletinData.creator_org_id) {
          setOrganizerId(bulletinData.creator_org_id);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadData = async () => {
    try {
      const { data: bulletinData } = await supabase
        .from("bulletins")
        .select("reaction_count, repost_count, creator_org_id")
        .eq("id", bulletin.id)
        .single();

      if (bulletinData) {
        setReactionCount(bulletinData.reaction_count || 0);
        setRepostCount(bulletinData.repost_count || 0);

        if (bulletinData.creator_org_id) {
          setOrganizerId(bulletinData.creator_org_id);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleReactionChange = () => {
    loadData();
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleImageClick = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  // Handle organizer click navigation
  const handleOrganizerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (bulletin.organizerType === "faith") {
      router.push("/faith-admin");
    } else if (bulletin.organizerType === "organization" && organizerId) {
      router.push(`/organization/${organizerId}`);
    }
  };

  // Get avatar from cache
  const getOrganizerAvatar = () => {
    if (!avatarCache) return null;

    if (bulletin.organizerType === "faith") {
      return avatarCache.faithAdmin;
    } else if (bulletin.organizerType === "organization" && organizerId) {
      return avatarCache.organizations.get(organizerId) || null;
    }
    return null;
  };

  const getOrganizerColor = (type: string) => {
    switch (type) {
      case "faith":
        return "from-purple-500 to-indigo-600";
      case "organization":
        return "from-orange-500 to-red-600";
      default:
        return "from-gray-500 to-gray-700";
    }
  };

  const getOrganizerIcon = (type: string) => {
    switch (type) {
      case "faith":
        return <Shield className="h-5 w-5 text-white" />;
      case "organization":
        return <Users className="h-5 w-5 text-white" />;
      default:
        return "📋";
    }
  };

  // Check if organizer is clickable
  const isOrganizerClickable =
    bulletin.organizerType === "faith" ||
    (bulletin.organizerType === "organization" && organizerId);

  const avatarUrl = getOrganizerAvatar();

  // Optimized multi-image layout renderer
  const renderMultipleImages = () => {
    const count = bulletin.imageUrls.length;

    if (count === 2) {
      // 2 images: Side by side
      return (
        <div className="grid grid-cols-2 gap-1 mb-3 -mx-1">
          {bulletin.imageUrls.map((url, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-md bg-gray-100 cursor-pointer group"
              style={{ aspectRatio: "4/3" }}
              onClick={() => handleImageClick(idx)}
            >
              <img
                src={url}
                alt={`Image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>
          ))}
        </div>
      );
    }

    if (count === 3) {
      // 3 images: 1 on top (larger), 2 on bottom (equal size)
      return (
        <div className="mb-3 -mx-1">
          {/* Top: Single large image */}
          <div
            className="relative overflow-hidden rounded-md bg-gray-100 cursor-pointer group mb-1"
            style={{ aspectRatio: "16/9" }}
            onClick={() => handleImageClick(0)}
          >
            <img
              src={bulletin.imageUrls[0]}
              alt="Image 1"
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          </div>

          {/* Bottom: 2 equal images */}
          <div className="grid grid-cols-2 gap-1">
            {bulletin.imageUrls.slice(1, 3).map((url, idx) => (
              <div
                key={idx + 1}
                className="relative overflow-hidden rounded-md bg-gray-100 cursor-pointer group"
                style={{ aspectRatio: "4/3" }}
                onClick={() => handleImageClick(idx + 1)}
              >
                <img
                  src={url}
                  alt={`Image ${idx + 2}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (count === 4) {
      // 4 images: 2x2 grid
      return (
        <div className="grid grid-cols-2 gap-1 mb-3 -mx-1">
          {bulletin.imageUrls.map((url, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-md bg-gray-100 cursor-pointer group"
              style={{ aspectRatio: "1/1" }}
              onClick={() => handleImageClick(idx)}
            >
              <img
                src={url}
                alt={`Image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>
          ))}
        </div>
      );
    }

    // 5+ images: Show first 4 in 2x2 grid with "+N more" overlay on last image
    const remaining = count - 4;
    return (
      <div className="grid grid-cols-2 gap-1 mb-3 -mx-1">
        {bulletin.imageUrls.slice(0, 4).map((url, idx) => {
          const isLast = idx === 3;

          return (
            <div
              key={idx}
              className="relative overflow-hidden rounded-md bg-gray-100 cursor-pointer group"
              style={{ aspectRatio: "1/1" }}
              onClick={() => handleImageClick(idx)}
            >
              <img
                src={url}
                alt={`Image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />

              {!isLast && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
              )}

              {isLast && remaining > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold drop-shadow-lg">
                    +{remaining}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            {/* Clickable Organizer Avatar */}
            <button
              onClick={handleOrganizerClick}
              disabled={!isOrganizerClickable}
              className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden ${
                avatarUrl
                  ? ""
                  : `bg-gradient-to-br ${getOrganizerColor(
                      bulletin.organizerType
                    )}`
              } ${
                isOrganizerClickable
                  ? "cursor-pointer hover:opacity-80 transition-opacity"
                  : "cursor-default"
              }`}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={bulletin.organizerName}
                  className="h-full w-full object-cover"
                />
              ) : (
                getOrganizerIcon(bulletin.organizerType)
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Clickable Organizer Name */}
                    <button
                      onClick={handleOrganizerClick}
                      disabled={!isOrganizerClickable}
                      className={`font-bold text-gray-900 ${
                        isOrganizerClickable
                          ? "hover:underline cursor-pointer hover:text-blue-600 transition-colors"
                          : "cursor-default"
                      }`}
                    >
                      {bulletin.organizerName}
                    </button>
                    {bulletin.isPinned && (
                      <span className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold">
                        <Pin className="h-3 w-3 fill-current" />
                        Pinned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{bulletin.createdAt}</span>
                    {bulletin.imageUrls.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Image className="h-3 w-3" />
                          {bulletin.imageUrls.length}
                        </span>
                      </>
                    )}
                    {/* Tagged Users */}
                    <span>•</span>
                    <TaggedUsersDisplay
                      contentType="bulletin"
                      contentId={bulletin.id}
                      canEdit={canEditTags}
                      onTagsUpdated={loadData}
                      initialCount={bulletin.taggedUsersCount || 0}
                    />
                  </div>
                </div>

                <BulletinOptionsMenu
                  bulletinId={bulletin.id}
                  onUpdate={() => {
                    if (onUpdate) onUpdate();
                  }}
                />
              </div>
            </div>
          </div>

          {/* Header/Subject Line */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
            {bulletin.header}
          </h3>

          {/* Content Body */}
          <TruncatedText
            text={bulletin.body}
            maxLines={2}
            className="text-gray-800 leading-relaxed mb-4"
          />

          {/* Images - Optimized Layouts */}
          {bulletin.imageUrls.length === 1 ? (
            <SingleImageDisplay
              imageUrl={bulletin.imageUrls[0]}
              onImageClick={() => handleImageClick(0)}
              alt="Bulletin image"
            />
          ) : bulletin.imageUrls.length > 0 ? (
            renderMultipleImages()
          ) : null}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <ReactionButton
                contentType="bulletin"
                contentId={bulletin.id}
                onReactionChange={handleReactionChange}
              />

              {bulletin.allowComments && (
                <button
                  onClick={() => setShowComments(!showComments)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                    showComments
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold">{bulletin.comments}</span>
                  {showComments ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}

              <RepostButton
                contentType="bulletin"
                contentId={bulletin.id}
                onRepostChange={handleReactionChange}
                onRepostCreated={onRepostCreated}
              />
            </div>

            <div className="flex items-center gap-2">
              {repostCount > 0 && (
                <span className="text-xs text-gray-500">
                  {repostCount} reposts
                </span>
              )}
              <ReactionSummary
                contentType="bulletin"
                contentId={bulletin.id}
                totalCount={reactionCount}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        </div>

        {bulletin.allowComments && showComments && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <CommentSection
              contentType="bulletin"
              contentId={bulletin.id}
              initialCount={bulletin.comments}
              avatarCache={avatarCache}
            />
          </div>
        )}
      </div>

      {bulletin.imageUrls.length > 0 && (
        <ImagePreviewModal
          images={bulletin.imageUrls}
          initialIndex={previewIndex}
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
