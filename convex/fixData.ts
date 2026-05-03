import { mutation } from "./_generated/server";

export const cleanUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let deletedCount = 0;
    
    for (const user of users) {
      if (!user.clerkId || !user.email) {
        await ctx.db.delete(user._id);
        deletedCount++;
      }
    }
    
    return `Deleted ${deletedCount} broken user records.`;
  },
});
