import { describe, it, expect, beforeEach, vi } from "vitest";
import { UserRepository } from "~/server/repositories";
import { createMockPrismaClient } from "~/test/mockPrisma";
import { type PrismaClient, type User } from "@prisma/client";

describe("UserRepository", () => {
  let mockPrisma: PrismaClient;
  let repository: UserRepository;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repository = new UserRepository(mockPrisma);
  });

  describe("findById", () => {
    it("should return user without password for security", async () => {
      const mockUser: User = {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        emailVerified: null,
        image: null,
        password: null,
      };

      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await repository.findById("user-1");

      expect(result).toEqual({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        emailVerified: null,
        image: null,
        // No password field for security
      });
      expect(result).not.toHaveProperty("password");
    });
  });

  describe("findByEmail", () => {
    it("should return user without password for security", async () => {
      const mockUser: User = {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        emailVerified: null,
        image: null,
        password: null,
      };

      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await repository.findByEmail("test@example.com");

      expect(result).toEqual({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        emailVerified: null,
        image: null,
        // No password field for security
      });
      expect(result).not.toHaveProperty("password");
    });
  });
});
