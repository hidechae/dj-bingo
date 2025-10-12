import { type PrismaClient, type User as PrismaUser } from "@prisma/client";
import { type UserEntity, type UserEntityWithPassword } from "~/domain/models";

export class UserRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.db.user.findUnique({
      where: { id },
    });
    if (!user) return null;
    return this.toDomain(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.db.user.findUnique({
      where: { email },
    });
    if (!user) return null;
    return this.toDomain(user);
  }

  // Method for authentication that includes password
  async findByEmailWithPassword(email: string): Promise<UserEntityWithPassword | null> {
    const user = await this.db.user.findUnique({
      where: { email },
    });
    if (!user) return null;
    return this.toDomainWithPassword(user);
  }

  async findMany(where?: { id?: string }): Promise<UserEntity[]> {
    const users = await this.db.user.findMany({
      where,
    });
    return users.map((user) => this.toDomain(user));
  }

  async create(data: {
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | null;
    image?: string | null;
    password?: string | null;
  }): Promise<UserEntity> {
    const user = await this.db.user.create({
      data,
    });
    return this.toDomain(user);
  }

  async update(
    id: string,
    data: {
      name?: string | null;
      email?: string | null;
      emailVerified?: Date | null;
      image?: string | null;
      password?: string | null;
    }
  ): Promise<UserEntity> {
    const user = await this.db.user.update({
      where: { id },
      data,
    });
    return this.toDomain(user);
  }

  async delete(id: string): Promise<UserEntity> {
    const user = await this.db.user.delete({
      where: { id },
    });
    return this.toDomain(user);
  }

  private toDomain(prismaUser: PrismaUser): UserEntity {
    return {
      id: prismaUser.id,
      name: prismaUser.name,
      email: prismaUser.email,
      emailVerified: prismaUser.emailVerified,
      image: prismaUser.image,
      // Don't include password for security
    };
  }

  private toDomainWithPassword(prismaUser: PrismaUser): UserEntityWithPassword {
    return {
      id: prismaUser.id,
      name: prismaUser.name,
      email: prismaUser.email,
      emailVerified: prismaUser.emailVerified,
      image: prismaUser.image,
      password: prismaUser.password,
    };
  }
}
