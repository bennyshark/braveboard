// app/(site)/home/page.tsx
"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import {
  Newspaper,
  Calendar,
  Megaphone,
  MessageSquare,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { Organization, EventItem } from "@/app/(site)/home/types";
import { EventCard } from "@/components/feed/EventCard";
import { CreateButton } from "@/components/home/CreateButton";
import { FeedFilters } from "@/components/home/FeedFilters";
import { AnnouncementCard } from "@/components/feed/AnnouncementCard";
import { BulletinCard } from "@/components/feed/BulletinCard";
import { FreeWallCard } from "@/components/feed/FreeWallCard";
import { RepostCard } from "@/components/feed/RepostCard";
import { CreateFreeWallPostDialog } from "@/components/posts/CreateFreeWallPostDialog";
import { useSearchParams } from "next/navigation";

// Avatar cache type
type AvatarCache = {
  faithAdmin: string | null;
  organizations: Map<string, string | null>;
};

type Announcement = {
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

type FreeWallPost = {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  imageUrls: string[];
  reactionCount: number;
  comments: number;
  repostCount: number;
  createdAt: string;
  editedAt: string | null;
  taggedUsersCount?: number;
};

type OriginalContent = {
  type: "free_wall_post" | "post" | "bulletin" | "announcement" | "repost";
  id: string;
  content?: string;
  header?: string;
  body?: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string | null;
  authorType?: string;
  creatorName?: string;
  creatorAvatar?: string | null;
  creatorType?: string;
  imageUrls?: string[];
  imageUrl?: string | null;
  createdAt: string;
  comment?: string;
  reposterId?: string;
  reposterName?: string;
  reposterAvatar?: string | null;
  contentType?: string;
  contentId?: string;
  originalContent?: OriginalContent | null;
};

type Repost = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  contentType:
    | "post"
    | "bulletin"
    | "announcement"
    | "free_wall_post"
    | "repost";
  contentId: string;
  repostComment: string | null;
  createdAt: string;
  originalContent?: OriginalContent | null;
  taggedUsersCount?: number;
};

type FreeWallItem = {
  type: "post" | "repost";
  data: FreeWallPost | Repost;
  timestamp: number;
  createdAtRaw: string;
};

const INITIAL_LOAD = 3;
const AUTO_LOAD = 3;
const ITEMS_PER_SCROLL = 3;

function HomeLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-500" />
      <p>Loading campus content...</p>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const [activeFeedFilter, setActiveFeedFilter] = useState("free_wall");
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedAnnouncementSource, setSelectedAnnouncementSource] = useState<
    string | null
  >("all");
  const [hiddenEvents, setHiddenEvents] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [freeWallItems, setFreeWallItems] = useState<FreeWallItem[]>([]);

  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [userCreateOrgs, setUserCreateOrgs] = useState<Organization[]>([]);
  const [isFaithAdmin, setIsFaithAdmin] = useState(false);

  const [avatarCache, setAvatarCache] = useState<AvatarCache>({
    faithAdmin: null,
    organizations: new Map(),
  });

  // FIXED: Separate initialization states
  const [isInitializingApp, setIsInitializingApp] = useState(true);
  const [isLoadingFreeWall, setIsLoadingFreeWall] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingBulletins, setIsLoadingBulletins] = useState(false);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [initialBatchLoaded, setInitialBatchLoaded] = useState(false);
  const [shouldAutoLoad, setShouldAutoLoad] = useState(false);

  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [pendingScrollTo, setPendingScrollTo] = useState<{
    tab: string;
    id: string;
  } | null>(null);

  const contentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);

  const handleNavigateToContent = (tab: string, contentId: string) => {
    setActiveFeedFilter(tab);
    setPendingScrollTo({ tab, id: contentId });
  };

  const handleRepostCreated = (repostData: any) => {
    console.log("Repost created:", repostData);

    const newFreeWallItem: FreeWallItem = {
      type: "repost",
      data: {
        id: repostData.id,
        userId: repostData.userId,
        userName: repostData.userName,
        userAvatar: repostData.userAvatar,
        contentType: repostData.contentType,
        contentId: repostData.contentId,
        repostComment: repostData.repostComment,
        createdAt: repostData.createdAt,
        originalContent: repostData.originalContent,
        taggedUsersCount: repostData.taggedUsersCount || 0,
      },
      timestamp: new Date(repostData.createdAtRaw).getTime(),
      createdAtRaw: repostData.createdAtRaw,
    };

    setFreeWallItems((prev) => [newFreeWallItem, ...prev]);

    if (activeFeedFilter !== "free_wall") {
      setActiveFeedFilter("free_wall");
    }

    setPendingScrollTo({ tab: "free_wall", id: repostData.id });
    setHighlightedId(repostData.id);

    setTimeout(() => setHighlightedId(null), 3000);
  };

  // FIXED: Prefetch avatars and organizations together
  const initializeAppData = async () => {
    try {
      console.log("🚀 Initializing app data...");
      
      // Step 1: Fetch avatars and organizations in parallel
      const [faithAdminRes, orgsRes, userRes] = await Promise.all([
        supabase.from("faith_admin_settings").select("avatar_url").single(),
        supabase.from("organizations").select("id, code, name, member_count, avatar_url").order("name"),
        supabase.auth.getUser()
      ]);

      // Step 2: Build avatar cache
      const orgAvatarMap = new Map<string, string | null>();
      const orgsData = orgsRes.data || [];
      orgsData.forEach((org) => {
        orgAvatarMap.set(org.id, org.avatar_url);
      });

      setAvatarCache({
        faithAdmin: faithAdminRes.data?.avatar_url || null,
        organizations: orgAvatarMap,
      });

      // Step 3: Set organizations
      const fetchedOrgs: Organization[] = [
        {
          id: "faith_admin",
          code: "FAITH",
          name: "FAITH Administration",
          role: "admin",
          members: 0,
        },
        ...orgsData.map((o: any) => ({
          id: o.id,
          code: o.code,
          name: o.name,
          role: "",
          members: o.member_count,
        })),
      ];
      setAllOrganizations(fetchedOrgs);

      // Step 4: Load user-specific data
      if (userRes.data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userRes.data.user.id)
          .single();

        setIsFaithAdmin(profile?.role === "admin");

        const { data: memberships } = await supabase
          .from("user_organizations")
          .select(`role, organization:organizations (id, code, name)`)
          .eq("user_id", userRes.data.user.id)
          .in("role", ["officer", "admin"]);

        const validUserOrgs: Organization[] =
          memberships?.map((m: any) => ({
            id: m.organization.id,
            code: m.organization.code,
            name: m.organization.name,
            role: m.role,
          })) || [];

        setUserCreateOrgs(validUserOrgs);
      }

      console.log("✅ App data initialized:", {
        faithAdmin: !!faithAdminRes.data?.avatar_url,
        orgs: orgAvatarMap.size,
        totalOrgs: fetchedOrgs.length
      });
    } catch (err) {
      console.error("Error initializing app data:", err);
    }
  };

  const fetchOriginalContent = async (
    repost: any
  ): Promise<OriginalContent | null> => {
    try {
      if (repost.content_type === "free_wall_post") {
        const { data } = await supabase
          .from("free_wall_posts")
          .select("*")
          .eq("id", repost.content_id)
          .maybeSingle();

        if (!data) return null;

        const { data: authorData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .eq("id", data.author_id)
          .maybeSingle();

        return {
          type: "free_wall_post",
          id: data.id,
          content: data.content,
          authorId: authorData?.id,
          authorName: authorData
            ? `${authorData.first_name} ${authorData.last_name}`
            : "Unknown User",
          authorAvatar: authorData?.avatar_url || null,
          imageUrls: data.image_urls || [],
          createdAt: new Date(data.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }

      if (repost.content_type === "post") {
        const { data } = await supabase
          .from("posts")
          .select("*")
          .eq("id", repost.content_id)
          .maybeSingle();

        if (!data) return null;

        let authorName = "Unknown User";
        let authorAvatar: string | null = null;
        let authorType = "user";

        if (data.posted_as_type === "faith_admin") {
          authorName = "FAITH Administration";
          authorType = "faith_admin";
          authorAvatar = avatarCache.faithAdmin;
        } else if (
          data.posted_as_type === "organization" &&
          data.posted_as_org_id
        ) {
          authorAvatar =
            avatarCache.organizations.get(data.posted_as_org_id) || null;

          const { data: orgData } = await supabase
            .from("organizations")
            .select("name")
            .eq("id", data.posted_as_org_id)
            .maybeSingle();

          if (orgData) {
            authorName = orgData.name;
            authorType = "organization";
          }
        } else {
          const { data: userData } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, avatar_url")
            .eq("id", data.author_id)
            .maybeSingle();

          if (userData) {
            authorName = `${userData.first_name} ${userData.last_name}`;
            authorAvatar = userData.avatar_url;
          }
        }

        return {
          type: "post",
          id: data.id,
          content: data.content,
          authorId: data.author_id,
          authorName,
          authorAvatar,
          authorType,
          imageUrls: data.image_urls || [],
          createdAt: new Date(data.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }

      if (repost.content_type === "bulletin") {
        const { data } = await supabase
          .from("bulletins")
          .select(
            `
            *,
            creator_org:organizations(name)
          `
          )
          .eq("id", repost.content_id)
          .maybeSingle();

        if (!data) return null;

        let creatorName = "Unknown";
        let creatorAvatar: string | null = null;
        let creatorType = "user";

        if (data.creator_type === "faith_admin") {
          creatorName = "FAITH Administration";
          creatorType = "faith_admin";
          creatorAvatar = avatarCache.faithAdmin;
        } else if (data.creator_type === "organization" && data.creator_org) {
          creatorName = data.creator_org.name;
          creatorAvatar =
            avatarCache.organizations.get(data.creator_org_id) || null;
          creatorType = "organization";
        }

        return {
          type: "bulletin",
          id: data.id,
          header: data.header,
          body: data.body,
          creatorName,
          creatorAvatar,
          creatorType,
          imageUrls: data.image_urls || [],
          createdAt: new Date(data.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }

      if (repost.content_type === "announcement") {
        const { data } = await supabase
          .from("announcements")
          .select(
            `
            *,
            creator_org:organizations(name)
          `
          )
          .eq("id", repost.content_id)
          .maybeSingle();

        if (!data) return null;

        let creatorName = "Unknown";
        let creatorAvatar: string | null = null;
        let creatorType = "user";

        if (data.creator_type === "faith_admin") {
          creatorName = "FAITH Administration";
          creatorType = "faith_admin";
          creatorAvatar = avatarCache.faithAdmin;
        } else if (data.creator_type === "organization" && data.creator_org) {
          creatorName = data.creator_org.name;
          creatorAvatar =
            avatarCache.organizations.get(data.creator_org_id) || null;
          creatorType = "organization";
        }

        return {
          type: "announcement",
          id: data.id,
          header: data.header,
          body: data.body,
          creatorName,
          creatorAvatar,
          creatorType,
          imageUrls: data.image_urls || [],
          createdAt: new Date(data.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }

      if (repost.content_type === "repost") {
        const { data } = await supabase
          .from("reposts")
          .select("*")
          .eq("id", repost.content_id)
          .maybeSingle();

        if (!data) return null;

        const { data: reposterData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .eq("id", data.user_id)
          .maybeSingle();

        const nestedOriginal = await fetchOriginalContent(data);

        return {
          type: "repost",
          id: data.id,
          comment: data.repost_comment,
          reposterId: reposterData?.id,
          reposterName: reposterData
            ? `${reposterData.first_name} ${reposterData.last_name}`
            : "Unknown User",
          reposterAvatar: reposterData?.avatar_url || null,
          contentType: data.content_type,
          contentId: data.content_id,
          originalContent: nestedOriginal,
          createdAt: new Date(data.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching original content:", error);
      return null;
    }
  };

  const loadFreeWall = async (itemCount: number, reset: boolean = false) => {
    if (!reset && !hasMore) return;

    try {
      const isFirstLoad = reset || lastTimestamp === null;

      if (isFirstLoad) {
        setIsLoadingFreeWall(true);
      } else {
        setIsLoadingMore(true);
      }

      let postsQuery = supabase
        .from("free_wall_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(itemCount);

      let repostsQuery = supabase
        .from("reposts")
        .select("*")
        .in("content_type", [
          "post",
          "bulletin",
          "announcement",
          "free_wall_post",
          "repost",
        ])
        .order("created_at", { ascending: false })
        .limit(itemCount);

      if (!isFirstLoad && lastTimestamp) {
        postsQuery = postsQuery.lt("created_at", lastTimestamp);
        repostsQuery = repostsQuery.lt("created_at", lastTimestamp);
      }

      const [postsRes, repostsRes] = await Promise.all([
        postsQuery,
        repostsQuery,
      ]);

      if (postsRes.error) throw postsRes.error;
      if (repostsRes.error) throw repostsRes.error;

      const postIds = postsRes.data.map((p: any) => p.id);
      const repostIds = repostsRes.data.map((r: any) => r.id);

      const [postTagCounts, repostTagCounts] = await Promise.all([
        supabase
          .from("tags")
          .select("content_id")
          .eq("content_type", "free_wall_post")
          .in("content_id", postIds),
        supabase
          .from("tags")
          .select("content_id")
          .eq("content_type", "repost")
          .in("content_id", repostIds),
      ]);

      const postTagCountMap = new Map<string, number>();
      postTagCounts.data?.forEach((tag) => {
        postTagCountMap.set(
          tag.content_id,
          (postTagCountMap.get(tag.content_id) || 0) + 1
        );
      });

      const repostTagCountMap = new Map<string, number>();
      repostTagCounts.data?.forEach((tag) => {
        repostTagCountMap.set(
          tag.content_id,
          (repostTagCountMap.get(tag.content_id) || 0) + 1
        );
      });

      const postAuthorIds = [
        ...new Set(postsRes.data.map((p: any) => p.author_id)),
      ];
      const { data: postAuthorsData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", postAuthorIds);

      const postAuthorMap = new Map(
        postAuthorsData?.map((author) => [
          author.id,
          {
            name: `${author.first_name || "Unknown"} ${
              author.last_name || "User"
            }`,
            avatarUrl: author.avatar_url,
          },
        ]) || []
      );

      const reposterIds = [
        ...new Set(repostsRes.data.map((r: any) => r.user_id)),
      ];
      const { data: repostersData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", reposterIds);

      const reposterMap = new Map(
        repostersData?.map((user) => [
          user.id,
          {
            name: `${user.first_name || "Unknown"} ${user.last_name || "User"}`,
            avatarUrl: user.avatar_url,
          },
        ]) || []
      );

      const mappedPosts: FreeWallItem[] = postsRes.data.map((p: any) => {
        const authorData = postAuthorMap.get(p.author_id) || {
          name: "Unknown User",
          avatarUrl: null,
        };
        return {
          type: "post" as const,
          data: {
            id: p.id,
            content: p.content,
            authorId: p.author_id,
            authorName: authorData.name,
            authorAvatar: authorData.avatarUrl,
            imageUrls: p.image_urls || [],
            reactionCount: p.reaction_count || 0,
            comments: p.comments || 0,
            repostCount: p.repost_count || 0,
            createdAt: new Date(p.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            editedAt: p.edited_at,
            taggedUsersCount: postTagCountMap.get(p.id) || 0,
          },
          timestamp: new Date(p.created_at).getTime(),
          createdAtRaw: p.created_at,
        };
      });

      const repostOriginalContentPromises = repostsRes.data.map((r) =>
        fetchOriginalContent(r)
      );
      const repostOriginalContents = await Promise.all(
        repostOriginalContentPromises
      );

      const mappedReposts: FreeWallItem[] = repostsRes.data.map(
        (r: any, index: number) => {
          const reposterData = reposterMap.get(r.user_id) || {
            name: "Unknown User",
            avatarUrl: null,
          };
          return {
            type: "repost" as const,
            data: {
              id: r.id,
              userId: r.user_id,
              userName: reposterData.name,
              userAvatar: reposterData.avatarUrl,
              contentType: r.content_type,
              contentId: r.content_id,
              repostComment: r.repost_comment,
              createdAt: new Date(r.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              originalContent: repostOriginalContents[index],
              taggedUsersCount: repostTagCountMap.get(r.id) || 0,
            },
            timestamp: new Date(r.created_at).getTime(),
            createdAtRaw: r.created_at,
          };
        }
      );

      const combined = [...mappedPosts, ...mappedReposts]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, itemCount);

      if (reset) {
        setFreeWallItems(combined);
      } else {
        setFreeWallItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.data.id));
          const newItems = combined.filter(
            (item) => !existingIds.has(item.data.id)
          );
          return [...prev, ...newItems];
        });
      }

      if (combined.length > 0) {
        setLastTimestamp(combined[combined.length - 1].createdAtRaw);
      }

      setHasMore(combined.length === itemCount);
      setLoadedTabs((prev) => new Set(prev).add("free_wall"));
    } catch (err) {
      console.error("Error loading free wall:", err);
    } finally {
      setIsLoadingFreeWall(false);
      setIsLoadingMore(false);
    }
  };

  const loadEvents = async () => {
    try {
      setIsLoadingEvents(true);

      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select(
          `
          *, 
          creator_org:organizations(name),
          end_date,
          posting_open_until,
          participant_type,
          participant_orgs,
          participant_depts,
          participant_courses
        `
        )
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (eventsError) throw eventsError;

      const eventIds = eventsData.map((e: any) => e.id);

      const { data: allPosts, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      const postIds = allPosts.map((p: any) => p.id);
      const { data: tagCounts } = await supabase
        .from("tags")
        .select("content_id")
        .eq("content_type", "post")
        .in("content_id", postIds);

      const tagCountMap = new Map<string, number>();
      tagCounts?.forEach((tag) => {
        tagCountMap.set(
          tag.content_id,
          (tagCountMap.get(tag.content_id) || 0) + 1
        );
      });

      const postsByEvent = new Map<string, any[]>();
      allPosts.forEach((post: any) => {
        if (!postsByEvent.has(post.event_id)) {
          postsByEvent.set(post.event_id, []);
        }
        const eventPosts = postsByEvent.get(post.event_id)!;
        if (eventPosts.length < 3) {
          eventPosts.push(post);
        }
      });

      const authorIds = [...new Set(allPosts.map((p: any) => p.author_id))];
      const { data: authorsData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", authorIds);

      const authorMap = new Map(
        authorsData?.map((author) => [
          author.id,
          {
            name: `${author.first_name || "Unknown"} ${
              author.last_name || "User"
            }`,
            avatarUrl: author.avatar_url,
          },
        ]) || []
      );

      const orgIds = [
        ...new Set(
          allPosts
            .filter(
              (p: any) =>
                p.posted_as_type === "organization" && p.posted_as_org_id
            )
            .map((p: any) => p.posted_as_org_id)
        ),
      ];

      const { data: orgsDataForPosts } = await supabase
        .from("organizations")
        .select("id, name")
        .in("id", orgIds);

      const orgNameMap = new Map(
        orgsDataForPosts?.map((org) => [org.id, org.name]) || []
      );

      const allParticipantOrgIds = new Set<string>();
      eventsData.forEach((event: any) => {
        if (event.participant_orgs) {
          event.participant_orgs.forEach((id: string) =>
            allParticipantOrgIds.add(id)
          );
        }
      });

      const { data: participantOrgs } = await supabase
        .from("organizations")
        .select("id, name")
        .in("id", Array.from(allParticipantOrgIds));

      const participantOrgMap = new Map(
        participantOrgs?.map((org) => [org.id, org.name]) || []
      );

      const mappedEvents: EventItem[] = eventsData.map((row: any) => {
        const start = new Date(row.start_date);
        const dateStr = start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        let organizerName = "Unknown";
        let organizerType = "user";

        if (row.creator_type === "faith_admin") {
          organizerName = "FAITH Administration";
          organizerType = "faith";
        } else if (row.creator_type === "organization") {
          organizerName = row.creator_org?.name || "Organization";
          organizerType = "organization";
        }

        const visibilityMap: Record<string, string> = {
          public: "Public",
          organization: "Selected Orgs",
          department: "Selected Depts",
          course: "Selected Courses",
          mixed: "Custom Group",
        };

        const deadlineString = row.posting_open_until || row.end_date;
        let isPostingExpired = false;

        if (deadlineString) {
          const deadlineDate = new Date(deadlineString);
          const today = new Date();
          isPostingExpired = deadlineDate <= today;
        }

        let eventOfText = "Loading...";
        if (row.participant_type === "public") {
          eventOfText = "FAITH";
        } else {
          const names: string[] = [];
          if (row.participant_orgs?.length > 0) {
            row.participant_orgs.forEach((id: string) => {
              const name = participantOrgMap.get(id);
              if (name) names.push(name);
            });
          }

          if (names.length === 0) eventOfText = "Custom Group";
          else if (names.length <= 3) eventOfText = names.join(", ");
          else
            eventOfText = `${names.slice(0, 3).join(", ")} +${
              names.length - 3
            } more`;
        }

        const eventPosts = postsByEvent.get(row.id) || [];

        const posts = eventPosts.map((p: any) => {
          let displayName = "Unknown User";
          let displayAvatar = null;
          let displayAuthorType = "user";

          if (p.posted_as_type === "faith_admin") {
            displayName = "FAITH Administration";
            displayAvatar = avatarCache.faithAdmin;
            displayAuthorType = "faith_admin";
          } else if (
            p.posted_as_type === "organization" &&
            p.posted_as_org_id
          ) {
            displayAvatar =
              avatarCache.organizations.get(p.posted_as_org_id) || null;
            displayName = orgNameMap.get(p.posted_as_org_id) || "Organization";
            displayAuthorType = "organization";
          } else {
            const authorData = authorMap.get(p.author_id) || {
              name: "Unknown User",
              avatarUrl: null,
            };
            displayName = authorData.name;
            displayAvatar = authorData.avatarUrl;
            displayAuthorType = "user";
          }

          return {
            id: p.id,
            author: displayName,
            authorId: p.author_id,
            authorType: displayAuthorType,
            avatarUrl: displayAvatar,
            content: p.content || "",
            time: new Date(p.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            likes: p.likes || 0,
            comments: p.comments || 0,
            imageUrls: p.image_urls || [],
            postedAsType: p.posted_as_type,
            postedAsOrgId: p.posted_as_org_id,
            reactionCount: p.reaction_count || 0,
            repostCount: p.repost_count || 0,
            editedAt: p.edited_at,
            pinOrder: p.pin_order,
            taggedUsersCount: tagCountMap.get(p.id) || 0,
          };
        });

        return {
          id: row.id,
          title: row.title,
          description: row.description,
          organizer: { type: organizerType, name: organizerName },
          date: dateStr,
          tags: row.tags || [],
          visibility: visibilityMap[row.participant_type] || "Restricted",
          visibilityType: row.participant_type,
          postingRestricted: row.who_can_post === "officers",
          isPinned: row.is_pinned,
          participants: row.participant_count || 0,
          totalPosts: row.post_count || 0,
          posts: posts,
          isPostingExpired,
          eventOfText,
        };
      });

      setEvents(mappedEvents);
      setLoadedTabs((prev) => new Set(prev).add("events"));
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      setIsLoadingAnnouncements(true);

      const { data: announcementsData, error } = await supabase
        .from("announcements")
        .select(
          `
          *,
          creator_org:organizations(name)
        `
        )
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const announcementIds = announcementsData.map((a: any) => a.id);

      const { data: tagCounts } = await supabase
        .from("tags")
        .select("content_id")
        .eq("content_type", "announcement")
        .in("content_id", announcementIds);

      const tagCountMap = new Map<string, number>();
      tagCounts?.forEach((tag) => {
        tagCountMap.set(
          tag.content_id,
          (tagCountMap.get(tag.content_id) || 0) + 1
        );
      });

      const mappedAnnouncements: Announcement[] = announcementsData.map(
        (row: any) => {
          let organizerName = "Unknown";
          let organizerType = "user";

          if (row.creator_type === "faith_admin") {
            organizerName = "FAITH Administration";
            organizerType = "faith";
          } else if (row.creator_type === "organization") {
            organizerName = row.creator_org?.name || "Organization";
            organizerType = "organization";
          }

          return {
            id: row.id,
            header: row.header,
            body: row.body,
            organizerType,
            organizerName,
            imageUrls: row.image_urls || [],
            isPinned: row.is_pinned,
            likes: row.likes || 0,
            comments: row.comments || 0,
            allowComments: row.allow_comments ?? true,
            createdAt: new Date(row.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            reactionCount: row.reaction_count || 0,
            repostCount: row.repost_count || 0,
            createdBy: row.created_by,
            taggedUsersCount: tagCountMap.get(row.id) || 0,
            organizerId: row.creator_org_id,
          };
        }
      );

      setAnnouncements(mappedAnnouncements);
      setLoadedTabs((prev) => new Set(prev).add("announcements"));
    } catch (err) {
      console.error("Error loading announcements:", err);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  const loadBulletins = async () => {
    try {
      setIsLoadingBulletins(true);

      const { data: bulletinsData, error } = await supabase
        .from("bulletins")
        .select(
          `
          *,
          creator_org:organizations(name)
        `
        )
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const bulletinIds = bulletinsData.map((b: any) => b.id);

      const { data: tagCounts } = await supabase
        .from("tags")
        .select("content_id")
        .eq("content_type", "bulletin")
        .in("content_id", bulletinIds);

      const tagCountMap = new Map<string, number>();
      tagCounts?.forEach((tag) => {
        tagCountMap.set(
          tag.content_id,
          (tagCountMap.get(tag.content_id) || 0) + 1
        );
      });

      const mappedBulletins: Bulletin[] = bulletinsData.map((row: any) => {
        let organizerName = "Unknown";
        let organizerType = "user";

        if (row.creator_type === "faith_admin") {
          organizerName = "FAITH Administration";
          organizerType = "faith";
        } else if (row.creator_type === "organization") {
          organizerName = row.creator_org?.name || "Organization";
          organizerType = "organization";
        }

        return {
          id: row.id,
          header: row.header,
          body: row.body,
          organizerType,
          organizerName,
          imageUrls: row.image_urls || [],
          isPinned: row.is_pinned,
          likes: row.likes || 0,
          comments: row.comments || 0,
          allowComments: row.allow_comments ?? true,
          createdAt: new Date(row.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          reactionCount: row.reaction_count || 0,
          repostCount: row.repost_count || 0,
          createdBy: row.created_by,
          taggedUsersCount: tagCountMap.get(row.id) || 0,
          organizerId: row.creator_org_id,
        };
      });

      setBulletins(mappedBulletins);
      setLoadedTabs((prev) => new Set(prev).add("bulletin"));
    } catch (err) {
      console.error("Error loading bulletins:", err);
    } finally {
      setIsLoadingBulletins(false);
    }
  };

  // FIXED: Only load content for tab, not initialization data
  const loadTabData = async (tab: string) => {
    if (loadedTabs.has(tab)) {
      return;
    }

    switch (tab) {
      case "free_wall":
        await loadFreeWall(INITIAL_LOAD, true);
        setInitialBatchLoaded(true);
        setShouldAutoLoad(true);
        break;
      case "events":
        await loadEvents();
        break;
      case "announcements":
        await loadAnnouncements();
        break;
      case "bulletin":
        await loadBulletins();
        break;
    }
  };

  const handlePostDeleted = (postId: string) => {
    console.log("Removing post from state:", postId);
    setFreeWallItems((prev) => prev.filter((item) => item.data.id !== postId));
  };

  const handleRepostDeleted = (repostId: string) => {
    console.log("Removing repost from state:", repostId);
    setFreeWallItems((prev) =>
      prev.filter((item) => item.data.id !== repostId)
    );
  };

  const handlePostCreated = async (newPostData: any) => {
    console.log("Adding new post to state:", newPostData);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (!userData) return;

    const newPost: FreeWallItem = {
      type: "post",
      data: {
        id: newPostData.id,
        content: newPostData.content,
        authorId: user.id,
        authorName: `${userData.first_name} ${userData.last_name}`,
        authorAvatar: userData.avatar_url,
        imageUrls: newPostData.image_urls || [],
        reactionCount: 0,
        comments: 0,
        repostCount: 0,
        createdAt: new Date(newPostData.created_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        editedAt: null,
        taggedUsersCount: 0,
      },
      timestamp: new Date(newPostData.created_at).getTime(),
      createdAtRaw: newPostData.created_at,
    };

    setFreeWallItems((prev) => [newPost, ...prev]);

    if (activeFeedFilter !== "free_wall") {
      setActiveFeedFilter("free_wall");
    }

    setPendingScrollTo({ tab: "free_wall", id: newPostData.id });
    setHighlightedId(newPostData.id);

    setTimeout(() => setHighlightedId(null), 3000);
  };

  useEffect(() => {
    if (
      shouldAutoLoad &&
      initialBatchLoaded &&
      activeFeedFilter === "free_wall"
    ) {
      const timer = setTimeout(() => {
        loadFreeWall(AUTO_LOAD, false);
        setShouldAutoLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoLoad, initialBatchLoaded, activeFeedFilter]);

  // FIXED: Initialize app data first, then load initial tab content
  useEffect(() => {
    async function initialize() {
      setIsInitializingApp(true);
      try {
        // Step 1: Initialize app data (avatars, orgs, user data)
        await initializeAppData();
        
        // Step 2: Load initial tab content
        await loadTabData(activeFeedFilter);
      } catch (err) {
        console.error("Error initializing:", err);
      } finally {
        setIsInitializingApp(false);
      }
    }

    initialize();
  }, []);

  // FIXED: Load tab data when filter changes (only after initialization)
  useEffect(() => {
    if (!isInitializingApp) {
      if (activeFeedFilter === "free_wall" && !loadedTabs.has("free_wall")) {
        setInitialBatchLoaded(false);
        setShouldAutoLoad(false);
      }
      loadTabData(activeFeedFilter);
    }
  }, [activeFeedFilter, isInitializingApp]);

  useEffect(() => {
    if (
      activeFeedFilter !== "free_wall" ||
      shouldAutoLoad ||
      !initialBatchLoaded
    ) {
      return;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const options = {
      root: null,
      rootMargin: "200px",
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoadingMore) {
        loadFreeWall(ITEMS_PER_SCROLL, false);
      }
    }, options);

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [
    activeFeedFilter,
    hasMore,
    isLoadingMore,
    shouldAutoLoad,
    initialBatchLoaded,
  ]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const scrollTo = searchParams.get("scrollTo");

    if (
      tab &&
      ["free_wall", "bulletin", "events", "announcements"].includes(tab)
    ) {
      setActiveFeedFilter(tab);
    }

    if (scrollTo && !isInitializingApp) {
      setTimeout(() => {
        const element = contentRefs.current.get(scrollTo);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          setHighlightedId(scrollTo);
          setTimeout(() => setHighlightedId(null), 3000);
        }
      }, 500);
    }
  }, [searchParams, isInitializingApp]);

  useEffect(() => {
    if (pendingScrollTo && !isInitializingApp) {
      setTimeout(() => {
        const element = contentRefs.current.get(pendingScrollTo.id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          setHighlightedId(pendingScrollTo.id);
          setPendingScrollTo(null);
          setTimeout(() => setHighlightedId(null), 3000);
        } else {
          setTimeout(() => {
            const retryElement = contentRefs.current.get(pendingScrollTo.id);
            if (retryElement) {
              retryElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
              setHighlightedId(pendingScrollTo.id);
              setPendingScrollTo(null);
              setTimeout(() => setHighlightedId(null), 3000);
            }
          }, 300);
        }
      }, 100);
    }
  }, [pendingScrollTo, isInitializingApp, activeFeedFilter]);

  const feedFilters = [
    { id: "free_wall", label: "Free Wall", icon: MessageSquare, color: "gray" },
    { id: "bulletin", label: "Bulletin", icon: Newspaper, color: "blue" },
    { id: "events", label: "Events", icon: Calendar, color: "orange" },
    {
      id: "announcements",
      label: "Announcements",
      icon: Megaphone,
      color: "purple",
    },
  ];

  const toggleHideEvent = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) newSet.delete(eventId);
      else newSet.add(eventId);
      return newSet;
    });
  };

  const handleEventDeleted = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const filteredEvents = events.filter((event) => {
    if (
      searchTerm &&
      !event.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    if (activeFeedFilter === "events") {
      const isOrgOrFaith =
        event.organizer.type === "organization" ||
        event.organizer.type === "faith";
      if (!isOrgOrFaith) return false;

      if (selectedOrg) {
        if (selectedOrg === "faith_admin") {
          return event.organizer.type === "faith";
        }
        const targetOrgName = allOrganizations.find(
          (o) => o.id === selectedOrg
        )?.name;
        return event.organizer.name === targetOrgName;
      }
      return true;
    }

    return false;
  });

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (activeFeedFilter !== "announcements") return false;

    if (!selectedAnnouncementSource || selectedAnnouncementSource === "all") {
      return true;
    }

    const sourceMap: Record<string, string> = {
      faith: "FAITH Administration",
      sc: "Student Council",
      lighthouse: "Lighthouse",
    };

    const targetName = sourceMap[selectedAnnouncementSource];
    return announcement.organizerName === targetName;
  });

  const filteredBulletins = bulletins.filter((bulletin) => {
    if (activeFeedFilter !== "bulletin") return false;

    if (
      searchTerm &&
      !bulletin.header.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    const isOrgOrFaith =
      bulletin.organizerType === "organization" ||
      bulletin.organizerType === "faith";
    if (!isOrgOrFaith) return false;

    if (selectedOrg) {
      if (selectedOrg === "faith_admin") {
        return bulletin.organizerType === "faith";
      }
      const targetOrgName = allOrganizations.find(
        (o) => o.id === selectedOrg
      )?.name;
      return bulletin.organizerName === targetOrgName;
    }
    return true;
  });

  // FIXED: Check if currently loading
  const isCurrentTabLoading = () => {
    if (isInitializingApp) return true;

    switch (activeFeedFilter) {
      case "free_wall":
        return isLoadingFreeWall;
      case "events":
        return isLoadingEvents;
      case "bulletin":
        return isLoadingBulletins;
      case "announcements":
        return isLoadingAnnouncements;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-1">
              Braveboard
            </h1>
            <p className="text-gray-600 text-sm">
              {activeFeedFilter === "free_wall" &&
                "Share your thoughts, discover more"}
              {activeFeedFilter === "bulletin" && "Community updates and posts"}
              {activeFeedFilter === "events" &&
                "Organization events and activities"}
              {activeFeedFilter === "announcements" &&
                "Official campus announcements"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex overflow-x-auto pb-2 space-x-2 scrollbar-hide flex-1">
            {feedFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFeedFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFeedFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${
                          filter.color === "gray"
                            ? "from-gray-500 to-gray-600"
                            : filter.color === "blue"
                            ? "from-blue-500 to-blue-600"
                            : filter.color === "orange"
                            ? "from-orange-500 to-orange-600"
                            : "from-purple-500 to-purple-600"
                        } text-white shadow-md`
                      : "bg-white border border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>

          {activeFeedFilter === "free_wall" ? (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-bold text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              Create Post
            </button>
          ) : (
            <CreateButton
              activeFeedFilter={activeFeedFilter}
              isFaithAdmin={isFaithAdmin}
              userCreateOrgs={userCreateOrgs}
              avatarCache={avatarCache}
            />
          )}
        </div>
      </div>

      {/* FIXED: Render filters only after app initialization */}
      {!isInitializingApp && (
        <FeedFilters
          activeFilter={activeFeedFilter}
          organizations={allOrganizations}
          selectedOrg={selectedOrg}
          setSelectedOrg={setSelectedOrg}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedSource={selectedAnnouncementSource}
          setSelectedSource={setSelectedAnnouncementSource}
        />
      )}

      <div className="space-y-5">
        {isCurrentTabLoading() ? (
          <HomeLoading />
        ) : (
          <>
            {activeFeedFilter === "free_wall" && (
              <>
                {freeWallItems.map((item) => {
                  const uniqueKey = `${item.type}-${item.data.id}`;

                  return (
                    <div
                      key={uniqueKey}
                      ref={(el) => {
                        if (el) {
                          contentRefs.current.set(item.data.id, el);
                        }
                      }}
                      className={`transition-all duration-500 ${
                        highlightedId === item.data.id
                          ? "ring-4 ring-blue-400 rounded-2xl"
                          : ""
                      }`}
                    >
                      {item.type === "post" ? (
                        <FreeWallCard
                          post={item.data as FreeWallPost}
                          onDelete={handlePostDeleted}
                          onRepostCreated={handleRepostCreated}
                        />
                      ) : (
                        <RepostCard
                          repost={item.data as Repost}
                          originalContent={
                            (item.data as Repost).originalContent
                          }
                          onDelete={handleRepostDeleted}
                          onNavigateToContent={handleNavigateToContent}
                          onRepostCreated={handleRepostCreated}
                        />
                      )}
                    </div>
                  );
                })}

                {hasMore && !shouldAutoLoad && (
                  <div
                    ref={loadMoreTriggerRef}
                    className="py-8 flex justify-center"
                  >
                    {isLoadingMore && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading more...</span>
                      </div>
                    )}
                  </div>
                )}

                {shouldAutoLoad && (
                  <div className="py-8 flex justify-center">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading more...</span>
                    </div>
                  </div>
                )}

                {!hasMore && freeWallItems.length > 0 && (
                  <div className="py-8 text-center text-gray-500">
                    <p className="font-medium">You've reached the end</p>
                  </div>
                )}

                {freeWallItems.length === 0 && !isLoadingFreeWall && (
                  <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-gray-500 font-medium">
                      No content found.
                    </p>
                  </div>
                )}
              </>
            )}

            {activeFeedFilter === "bulletin" && (
              <>
                {filteredBulletins.map((bulletin) => (
                  <div
                    key={bulletin.id}
                    ref={(el) => {
                      if (el) {
                        contentRefs.current.set(bulletin.id, el);
                      }
                    }}
                    className={`transition-all duration-500 ${
                      highlightedId === bulletin.id
                        ? "ring-4 ring-blue-400 rounded-2xl"
                        : ""
                    }`}
                  >
                    <BulletinCard
                      bulletin={bulletin}
                      onUpdate={loadBulletins}
                      onRepostCreated={handleRepostCreated}
                      avatarCache={avatarCache}
                    />
                  </div>
                ))}

                {filteredBulletins.length === 0 && !isLoadingBulletins && (
                  <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-gray-500 font-medium">
                      No content found.
                    </p>
                  </div>
                )}
              </>
            )}

            {activeFeedFilter === "announcements" && (
              <>
                {filteredAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    ref={(el) => {
                      if (el) {
                        contentRefs.current.set(announcement.id, el);
                      }
                    }}
                    className={`transition-all duration-500 ${
                      highlightedId === announcement.id
                        ? "ring-4 ring-blue-400 rounded-2xl"
                        : ""
                    }`}
                  >
                    <AnnouncementCard
                      announcement={announcement}
                      onUpdate={loadAnnouncements}
                      onRepostCreated={handleRepostCreated}
                      avatarCache={avatarCache}
                    />
                  </div>
                ))}

                {filteredAnnouncements.length === 0 &&
                  !isLoadingAnnouncements && (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-gray-500 font-medium">
                        No content found.
                      </p>
                    </div>
                  )}
              </>
            )}

            {activeFeedFilter === "events" && (
              <>
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    ref={(el) => {
                      if (el) {
                        contentRefs.current.set(event.id, el);
                        event.posts.forEach((post) => {
                          contentRefs.current.set(post.id, el);
                        });
                      }
                    }}
                    className={`transition-all duration-500 ${
                      highlightedId === event.id ||
                      event.posts.some((p) => p.id === highlightedId)
                        ? "ring-4 ring-blue-400 rounded-2xl"
                        : ""
                    }`}
                  >
                    <EventCard
                      event={event}
                      isPostsHidden={hiddenEvents.has(event.id)}
                      onToggleHide={(e) => toggleHideEvent(event.id, e)}
                      onPostCreated={loadEvents}
                      onEventDeleted={() => handleEventDeleted(event.id)}
                      onRepostCreated={handleRepostCreated}
                      avatarCache={avatarCache}
                    />
                  </div>
                ))}

                {filteredEvents.length === 0 && !isLoadingEvents && (
                  <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-gray-500 font-medium">
                      No content found.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <CreateFreeWallPostDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}