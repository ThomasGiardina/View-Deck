import { supabase } from "./supabase";

export async function getProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();
  if (error) {
    console.error("Error loading profile:", error);
    return null;
  }
  return data;
}

export async function updateProfile(userId, { username }) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, username })
    .select("username")
    .single();
  if (error) return { error };
  return { data };
}
