import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "../supabases";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  try {
    const { data, error } = await supabaseServer.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    res.status(200).json({ message: "Login berhasil!", user: data.user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
