import { type UserEntity } from "./User";

// GameAdmin domain model

export type GameAdminEntity = {
  id: string;
  bingoGameId: string;
  userId: string;
  addedBy: string;
  addedAt: Date;
};

export type GameAdminWithUser = GameAdminEntity & {
  user: UserEntity;
};
