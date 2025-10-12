import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { db } from "~/server/db";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  email: z.string().email("正しいメールアドレスを入力してください"),
  password: z.string().min(6, "パスワードは6文字以上である必要があります"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { name, email, password } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "このメールアドレスは既に使用されています" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      message: "ユーザーが正常に作成されました",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "入力データが正しくありません",
        errors: error.issues,
      });
    }

    return res
      .status(500)
      .json({ message: "内部サーバーエラーが発生しました" });
  }
}
