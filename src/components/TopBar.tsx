"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";
import {
  Home,
  PlusCircle,
  Search,
  MessageCircle,
  Users,
  Shield,
} from "lucide-react";

export default function TopBar() {
  const { user } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);

  const dbUser = useQuery(
    api.users.getUser,
    user ? { clerkId: user.id } : "skip"
  );

  const conversations = useQuery(
    api.messages.getConversations,
    user ? { userId: user.id } : "skip"
  );

  const totalUnread =
    conversations?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;

  // Sync user to Convex on login
  useEffect(() => {
    if (user) {
      upsertUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        name: user.fullName || user.username || "Anonymous",
        profileImageUrl: user.imageUrl,
      });
    }
  }, [user, upsertUser]);

  const isAdmin = dbUser?.role === "owner" || dbUser?.role === "admin";

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      <Link
        href="/home"
        className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
      >
        Forum App
      </Link>

      <div className="flex items-center gap-2 md:gap-3">
        <Link
          href="/home"
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400"
          title="Home"
        >
          <Home size={20} />
        </Link>
        <Link
          href="/create"
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400"
          title="Create Post"
        >
          <PlusCircle size={20} />
        </Link>
        <Link
          href="/search"
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400"
          title="Search"
        >
          <Search size={20} />
        </Link>
        <Link
          href="/messages"
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 relative"
          title="Messages"
        >
          <MessageCircle size={20} />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalUnread}
            </span>
          )}
        </Link>
        <Link
          href="/people"
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400"
          title="People"
        >
          <Users size={20} />
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-red-500"
            title="Admin Panel"
          >
            <Shield size={20} />
          </Link>
        )}
        <UserButton />
      </div>
    </nav>
  );
}
