import {
  type PrismaClient,
  type GameAdmin as PrismaGameAdmin,
} from "@prisma/client";
import { type GameAdminEntity, type GameAdminWithUser } from "~/domain/models";

type PrismaGameAdminWithUser = PrismaGameAdmin & {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
  };
};

export class GameAdminRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<GameAdminEntity | null> {
    const gameAdmin = await this.db.gameAdmin.findUnique({
      where: { id },
    });
    if (!gameAdmin) return null;
    return this.toDomain(gameAdmin);
  }

  async findByIdWithUser(id: string): Promise<GameAdminWithUser | null> {
    const gameAdmin = await this.db.gameAdmin.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
    if (!gameAdmin) return null;
    return this.toDomainWithUser(gameAdmin as PrismaGameAdminWithUser);
  }

  async findMany(where?: {
    bingoGameId?: string;
    userId?: string;
  }): Promise<GameAdminEntity[]> {
    const gameAdmins = await this.db.gameAdmin.findMany({
      where,
    });
    return gameAdmins.map((ga) => this.toDomain(ga));
  }

  async findManyWithUser(where?: {
    bingoGameId?: string;
    userId?: string;
  }): Promise<GameAdminWithUser[]> {
    const gameAdmins = await this.db.gameAdmin.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        addedAt: "asc",
      },
    });
    return gameAdmins.map((ga) =>
      this.toDomainWithUser(ga as PrismaGameAdminWithUser)
    );
  }

  async create(data: {
    bingoGameId: string;
    userId: string;
    addedBy: string;
  }): Promise<GameAdminEntity> {
    const gameAdmin = await this.db.gameAdmin.create({
      data,
    });
    return this.toDomain(gameAdmin);
  }

  async delete(id: string): Promise<GameAdminEntity> {
    const gameAdmin = await this.db.gameAdmin.delete({
      where: { id },
    });
    return this.toDomain(gameAdmin);
  }

  private toDomain(prismaGameAdmin: PrismaGameAdmin): GameAdminEntity {
    return {
      id: prismaGameAdmin.id,
      bingoGameId: prismaGameAdmin.bingoGameId,
      userId: prismaGameAdmin.userId,
      addedBy: prismaGameAdmin.addedBy,
      addedAt: prismaGameAdmin.addedAt,
    };
  }

  private toDomainWithUser(
    prismaGameAdmin: PrismaGameAdminWithUser
  ): GameAdminWithUser {
    return {
      ...this.toDomain(prismaGameAdmin),
      user: {
        id: prismaGameAdmin.user.id,
        name: prismaGameAdmin.user.name,
        email: prismaGameAdmin.user.email,
        emailVerified: prismaGameAdmin.user.emailVerified,
        image: prismaGameAdmin.user.image,
      },
    };
  }
}
