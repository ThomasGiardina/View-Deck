import { supabase } from "./supabase";

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (!error && data?.user) {
    const defaultUsername = "User_" + Math.random().toString(36).slice(2, 8);
    await supabase.from("profiles").upsert({ id: data.user.id, username: defaultUsername });
  }
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
