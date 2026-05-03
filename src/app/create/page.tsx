"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2 } from "lucide-react";
import TopBar from "@/components/TopBar";

export default function CreatePostPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createPost = useMutation(api.posts.createPost);
  
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let imageId = undefined;

      // 1. Upload image if selected
      if (file) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();
        imageId = storageId;
      }

      // 2. Create post in Convex
      await createPost({
        title,
        text,
        imageId,
        authorId: user.id,
        authorName: user.fullName || user.username || "Anonymous",
      });

      // 3. Redirect back to home
      router.push("/home");
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <TopBar />
      <div className="p-6 flex justify-center items-center mt-8">
        <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8">
        <h1 className="text-3xl font-bold mb-6">Create a Post</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea 
              required
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Explain your topic in detail..."
              className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Attach Image (Optional)</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-300 dark:border-zinc-700 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 mb-3 text-zinc-400" />
                <p className="text-sm text-zinc-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            {file && <p className="text-sm text-green-600 mt-2">Selected: {file.name}</p>}
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={() => router.push("/home")}
              className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !title || !text}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Post"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
