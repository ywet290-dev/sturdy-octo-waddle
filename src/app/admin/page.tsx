"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import {
  Shield,
  Ban,
  ShieldCheck,
  ShieldOff,
  Search,
  Undo2,
} from "lucide-react";
import TopBar from "@/components/TopBar";

export default function AdminPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banIpAddress, setBanIpAddress] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const dbUser = useQuery(
    api.users.getUser,
    user ? { clerkId: user.id } : "skip"
  );
  const results = useQuery(api.users.searchUsers, { query: searchQuery });
  const bannedUsers = useQuery(api.users.getBannedUsers);

  const banUser = useMutation(api.users.banUser);
  const unbanUser = useMutation(api.users.unbanUser);
  const banIp = useMutation(api.users.banIp);
  const setAdmin = useMutation(api.users.setAdmin);
  const removeAdmin = useMutation(api.users.removeAdmin);

  if (!user) return null;

  // Only owner and admins can access
  if (dbUser && dbUser.role !== "owner" && dbUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <TopBar />
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-xl text-red-500 font-bold">
            ⛔ Access Denied — Admins Only
          </p>
        </div>
      </div>
    );
  }

  const isOwner = dbUser?.role === "owner";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <TopBar />
      <main className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3">
          <Shield className="text-red-500" size={28} />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>

        {/* Search Users */}
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            size={20}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-12 pr-6 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-red-500 outline-none transition-colors"
          />
        </div>

        {/* User List */}
        <div className="space-y-3">
          {results
            ?.filter((u: Doc<"users">) => u.clerkId !== user.id)
            .map((u: Doc<"users">) => (
              <div
                key={u._id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                    {u.profileImageUrl ? (
                      <img
                        src={u.profileImageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      u.name[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{u.name}</span>
                      <span className="text-xs text-zinc-500">{u.email}</span>
                      {u.role === "admin" && (
                        <span className="text-[10px] bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 px-1.5 py-0.5 rounded-full font-bold">
                          ADMIN
                        </span>
                      )}
                      {u.isBanned && (
                        <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold">
                          BANNED
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {/* Ban / Unban */}
                    {u.isBanned ? (
                      <button
                        onClick={() =>
                          unbanUser({
                            targetClerkId: u.clerkId,
                            adminClerkId: user.id,
                          })
                        }
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Undo2 size={14} /> Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedUser(u.clerkId)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Ban size={14} /> Ban
                      </button>
                    )}
                    {/* Admin toggle (owner only) */}
                    {isOwner && u.role !== "owner" && (
                      <>
                        {u.role === "admin" ? (
                          <button
                            onClick={() =>
                              removeAdmin({
                                targetClerkId: u.clerkId,
                                ownerClerkId: user.id,
                              })
                            }
                            className="px-3 py-1.5 bg-zinc-600 hover:bg-zinc-700 text-white text-sm rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <ShieldOff size={14} /> Remove Admin
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setAdmin({
                                targetClerkId: u.clerkId,
                                ownerClerkId: user.id,
                              })
                            }
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <ShieldCheck size={14} /> Make Admin
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Ban form */}
                {selectedUser === u.clerkId && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-500/10 rounded-lg space-y-3">
                    <input
                      type="text"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Reason for ban..."
                      className="w-full px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-transparent outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={banIpAddress}
                      onChange={(e) => setBanIpAddress(e.target.value)}
                      placeholder="IP address (optional for IP ban)..."
                      className="w-full px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-transparent outline-none text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (banIpAddress) {
                            await banIp({
                              targetClerkId: u.clerkId,
                              ip: banIpAddress,
                              reason: banReason || "No reason given",
                              adminClerkId: user.id,
                            });
                          } else {
                            await banUser({
                              targetClerkId: u.clerkId,
                              reason: banReason || "No reason given",
                              adminClerkId: user.id,
                            });
                          }
                          setSelectedUser(null);
                          setBanReason("");
                          setBanIpAddress("");
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Confirm Ban
                      </button>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-sm rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Banned Users List */}
        {bannedUsers && bannedUsers.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-red-500">
              Banned Users
            </h2>
            <div className="space-y-2">
              {bannedUsers.map((ban: Doc<"bans">) => (
                <div
                  key={ban._id}
                  className="bg-red-50 dark:bg-red-500/10 rounded-lg p-3 flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-medium">{ban.email}</span>
                    <span className="text-zinc-500 ml-2">— {ban.reason}</span>
                    {ban.ip && (
                      <span className="text-red-500 ml-2">IP: {ban.ip}</span>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      unbanUser({
                        targetClerkId: ban.clerkId,
                        adminClerkId: user.id,
                      })
                    }
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Unban
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
