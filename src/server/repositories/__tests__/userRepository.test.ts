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

  describe("findByEmailWithPassword", () => {
    it("should return user with password when user exists", async () => {
      const mockUser: User = {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        emailVerified: null,
        image: null,
        password: "hashed-password",
      };

      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await repository.findByEmailWithPassword("test@example.com");

      expect(result).toEqual({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        emailVerified: null,
        image: null,
        password: "hashed-password",
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
    });

    it("should return null when user does not exist", async () => {
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(null);

      const result = await repository.findByEmailWithPassword("nonexistent@example.com");

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update user password successfully", async () => {
      const mockUser: User = {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        emailVerified: null,
        image: null,
        password: "new-hashed-password",
      };

      vi.mocked(mockPrisma.user.update).mockResolvedValue(mockUser);

      const result = await repository.update("user-1", {
        password: "new-hashed-password",
      });

      expect(result).toEqual({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        emailVerified: null,
        image: null,
        // Password should not be included in the result for security
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { password: "new-hashed-password" },
      });
    });
  });

  describe("findById", () => {
    it("should return user without password for security", async () => {
      const mockUser: User = {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        emailVerified: null,
        image: null,
        password: "hashed-password", // This should not be returned
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
        password: "hashed-password", // This should not be returned
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