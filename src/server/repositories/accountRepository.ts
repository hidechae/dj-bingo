import { type PrismaClient, type Account as PrismaAccount } from "@prisma/client";

export interface AccountEntity {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
  refresh_token_expires_in?: number | null;
}

export class AccountRepository {
  constructor(private db: PrismaClient) {}

  async findByUserId(userId: string): Promise<AccountEntity[]> {
    const accounts = await this.db.account.findMany({
      where: { userId },
    });
    return accounts.map((account) => this.toDomain(account));
  }

  async findByProviderAndUserId(
    provider: string,
    userId: string
  ): Promise<AccountEntity | null> {
    const account = await this.db.account.findFirst({
      where: {
        provider,
        userId,
      },
    });
    if (!account) return null;
    return this.toDomain(account);
  }

  async findByProviderAndProviderAccountId(
    provider: string,
    providerAccountId: string
  ): Promise<AccountEntity | null> {
    const account = await this.db.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
    });
    if (!account) return null;
    return this.toDomain(account);
  }

  async create(data: {
    userId: string;
    type: string;
    provider: string;
    providerAccountId: string;
    refresh_token?: string | null;
    access_token?: string | null;
    expires_at?: number | null;
    token_type?: string | null;
    scope?: string | null;
    id_token?: string | null;
    session_state?: string | null;
    refresh_token_expires_in?: number | null;
  }): Promise<AccountEntity> {
    const account = await this.db.account.create({
      data,
    });
    return this.toDomain(account);
  }

  async delete(id: string): Promise<AccountEntity> {
    const account = await this.db.account.delete({
      where: { id },
    });
    return this.toDomain(account);
  }

  async deleteByProviderAndUserId(
    provider: string,
    userId: string
  ): Promise<void> {
    await this.db.account.deleteMany({
      where: {
        provider,
        userId,
      },
    });
  }

  private toDomain(prismaAccount: PrismaAccount): AccountEntity {
    return {
      id: prismaAccount.id,
      userId: prismaAccount.userId,
      type: prismaAccount.type,
      provider: prismaAccount.provider,
      providerAccountId: prismaAccount.providerAccountId,
      refresh_token: prismaAccount.refresh_token,
      access_token: prismaAccount.access_token,
      expires_at: prismaAccount.expires_at,
      token_type: prismaAccount.token_type,
      scope: prismaAccount.scope,
      id_token: prismaAccount.id_token,
      session_state: prismaAccount.session_state,
      refresh_token_expires_in: prismaAccount.refresh_token_expires_in,
    };
  }
}