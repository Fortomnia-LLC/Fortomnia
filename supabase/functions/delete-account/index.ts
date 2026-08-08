import { withSupabase } from "npm:@supabase/server@^1";

export default {
  fetch: withSupabase({ auth: "user" }, async (_request, context) => {
    const userId = context.userClaims?.id;

    if (!userId) {
      return Response.json(
        { error: "Authenticated user not found." },
        { status: 401 },
      );
    }

    const { error } =
      await context.supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return Response.json(
        { error: "Unable to delete account." },
        { status: 500 },
      );
    }

    return Response.json({ deleted: true });
  }),
};
