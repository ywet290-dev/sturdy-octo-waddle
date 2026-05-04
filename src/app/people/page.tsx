"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import {
  Search,
  MessageCircle,
  UserPlus,
  UserMinus,
  Circle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";

export default function PeoplePage() {
  const { user } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const results = useQuery(api.users.searchUsers, { query: searchQuery });
  const onlineUsers = useQuery(api.users.getOnlineUsers);
  const contacts = useQuery(
    api.users.getContacts,
    user ? { clerkId: user.id } : "skip"
  );

  const addContact = useMutation(api.users.addContact);
  const removeContact = useMutation(api.users.removeContact);
  const sendMessage = useMutation(api.messages.sendMessage);

  if (!user) return null;

  const contactIds = contacts?.filter((c: Doc<"users">) => c.clerkId).map((c: Doc<"users">) => c.clerkId as string) ?? [];

  const handleMessage = (targetId: string, targetName: string) => {
    router.push(`/messages?chat=${targetId}&name=${encodeURIComponent(targetName)}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <TopBar />
      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            size={24}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for people..."
            className="w-full pl-14 pr-6 py-4 text-lg rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-blue-500 focus:ring-0 outline-none transition-colors shadow-sm"
          />
        </div>

        {/* Online Users */}
        {!searchQuery && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Circle size={12} className="fill-green-500 text-green-500" />
              Online Now
            </h2>
            <div className="flex flex-wrap gap-3">
              {onlineUsers
                ?.filter((u: Doc<"users">) => u.clerkId && u.clerkId !== user.id)
                .map((u: Doc<"users">) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                      {u.profileImageUrl ? (
                        <img
                          src={u.profileImageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        u.name?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <span className="text-sm font-medium">{u.name || "Unknown User"}</span>
                    <Circle
                      size={8}
                      className="fill-green-500 text-green-500"
                    />
                  </div>
                ))}
              {onlineUsers?.filter((u: Doc<"users">) => u.clerkId && u.clerkId !== user.id)
                .length === 0 && (
                <p className="text-sm text-zinc-500">
                  No one else is online right now.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contacts */}
        {!searchQuery && contacts && contacts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">My Contacts</h2>
            <div className="space-y-2">
              {contacts.map((u: Doc<"users">) => (
                <UserCard
                  key={u._id}
                  profile={u}
                  isContact={true}
                  onMessage={() => u.clerkId && handleMessage(u.clerkId, u.name || "Unknown User")}
                  onToggleContact={() =>
                    u.clerkId && removeContact({
                      myClerkId: user.id,
                      contactClerkId: u.clerkId,
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        <div>
          <h2 className="text-xl font-bold mb-4">
            {searchQuery ? `Results for "${searchQuery}"` : "All Users"}
          </h2>
          <div className="space-y-2">
            {results
              ?.filter((u: Doc<"users">) => u.clerkId && u.clerkId !== user.id)
              .map((u: Doc<"users">) => (
                <UserCard
                  key={u._id}
                  profile={u}
                  isContact={!!u.clerkId && contactIds.includes(u.clerkId)}
                  onMessage={() => u.clerkId && handleMessage(u.clerkId, u.name || "Unknown User")}
                  onToggleContact={() => {
                    if (!u.clerkId) return;
                    if (contactIds.includes(u.clerkId)) {
                      removeContact({
                        myClerkId: user.id,
                        contactClerkId: u.clerkId,
                      });
                    } else {
                      addContact({
                        myClerkId: user.id,
                        contactClerkId: u.clerkId,
                      });
                    }
                  }}
                />
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function UserCard({
  profile,
  isContact,
  onMessage,
  onToggleContact,
}: {
  profile: Doc<"users">;
  isContact: boolean;
  onMessage: () => void;
  onToggleContact: () => void;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
          {profile.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            profile.name?.[0]?.toUpperCase() || "?"
          )}
        </div>
        {profile.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold">{profile.name || "Unknown User"}</span>
        </div>
        <span className="text-sm text-zinc-500">{profile.email}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onMessage}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-blue-500"
          title="Send Message"
        >
          <MessageCircle size={18} />
        </button>
        <button
          onClick={onToggleContact}
          className={`p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors ${isContact ? "text-red-500" : "text-green-500"}`}
          title={isContact ? "Remove Contact" : "Add Contact"}
        >
          {isContact ? <UserMinus size={18} /> : <UserPlus size={18} />}
        </button>
      </div>
    </div>
  );
}
