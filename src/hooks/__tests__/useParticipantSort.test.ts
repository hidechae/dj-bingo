/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useParticipantSort } from "../useParticipantSort";
import { type Participant } from "~/types";

const createMockParticipant = (
  overrides: Partial<Participant> = {}
): Participant => ({
  id: "1",
  name: "Test User",
  sessionToken: "token",
  bingoGameId: "game1",
  createdAt: new Date("2024-01-01"),
  isGridComplete: false,
  hasWon: false,
  wonAt: null,
  participantSongs: [],
  ...overrides,
});

describe("useParticipantSort", () => {
  it("should initialize with default sort (createdAt desc)", () => {
    const { result } = renderHook(() => useParticipantSort());

    expect(result.current.sortField).toBe("createdAt");
    expect(result.current.sortDirection).toBe("desc");
  });

  it("should toggle sort direction when clicking same field", () => {
    const { result } = renderHook(() => useParticipantSort());

    act(() => {
      result.current.handleSort("createdAt");
    });

    expect(result.current.sortDirection).toBe("asc");

    act(() => {
      result.current.handleSort("createdAt");
    });

    expect(result.current.sortDirection).toBe("desc");
  });

  it("should set new field and asc direction when clicking different field", () => {
    const { result } = renderHook(() => useParticipantSort());

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.sortField).toBe("name");
    expect(result.current.sortDirection).toBe("asc");
  });

  describe("sortParticipants", () => {
    const participants: Participant[] = [
      createMockParticipant({
        id: "1",
        name: "Charlie",
        createdAt: new Date("2024-01-03"),
        isGridComplete: false,
        hasWon: false,
      }),
      createMockParticipant({
        id: "2",
        name: "Alice",
        createdAt: new Date("2024-01-01"),
        isGridComplete: true,
        hasWon: true,
      }),
      createMockParticipant({
        id: "3",
        name: "Bob",
        createdAt: new Date("2024-01-02"),
        isGridComplete: true,
        hasWon: false,
      }),
    ];

    it("should sort by name ascending", () => {
      const { result } = renderHook(() => useParticipantSort());

      act(() => {
        result.current.handleSort("name");
      });

      const sorted = result.current.sortParticipants(participants);
      expect(sorted[0]!.name).toBe("Alice");
      expect(sorted[1]!.name).toBe("Bob");
      expect(sorted[2]!.name).toBe("Charlie");
    });

    it("should sort by name descending", () => {
      const { result } = renderHook(() => useParticipantSort());

      // Start with name asc
      act(() => {
        result.current.handleSort("name");
      });

      // Toggle to desc
      act(() => {
        result.current.handleSort("name");
      });

      const sorted = result.current.sortParticipants(participants);
      expect(sorted[0]!.name).toBe("Charlie");
      expect(sorted[1]!.name).toBe("Bob");
      expect(sorted[2]!.name).toBe("Alice");
    });

    it("should sort by createdAt ascending", () => {
      const { result } = renderHook(() => useParticipantSort());

      act(() => {
        result.current.handleSort("createdAt");
      });

      const sorted = result.current.sortParticipants(participants);
      expect(sorted[0]!.id).toBe("2"); // 2024-01-01
      expect(sorted[1]!.id).toBe("3"); // 2024-01-02
      expect(sorted[2]!.id).toBe("1"); // 2024-01-03
    });

    it("should sort by createdAt descending (default)", () => {
      const { result } = renderHook(() => useParticipantSort());

      const sorted = result.current.sortParticipants(participants);
      expect(sorted[0]!.id).toBe("1"); // 2024-01-03
      expect(sorted[1]!.id).toBe("3"); // 2024-01-02
      expect(sorted[2]!.id).toBe("2"); // 2024-01-01
    });

    it("should sort by isGridComplete ascending", () => {
      const { result } = renderHook(() => useParticipantSort());

      act(() => {
        result.current.handleSort("isGridComplete");
      });

      const sorted = result.current.sortParticipants(participants);
      expect(sorted[0]!.isGridComplete).toBe(false);
      expect(sorted[1]!.isGridComplete).toBe(true);
      expect(sorted[2]!.isGridComplete).toBe(true);
    });

    it("should sort by isGridComplete descending", () => {
      const { result } = renderHook(() => useParticipantSort());

      // Start with isGridComplete asc
      act(() => {
        result.current.handleSort("isGridComplete");
      });

      // Toggle to desc
      act(() => {
        result.current.handleSort("isGridComplete");
      });

      const sorted = result.current.sortParticipants(participants);
      expect(sorted[0]!.isGridComplete).toBe(true);
      expect(sorted[1]!.isGridComplete).toBe(true);
      expect(sorted[2]!.isGridComplete).toBe(false);
    });

    it("should sort by hasWon ascending", () => {
      const { result } = renderHook(() => useParticipantSort());

      act(() => {
        result.current.handleSort("hasWon");
      });

      const sorted = result.current.sortParticipants(participants);
      expect(sorted[0]!.hasWon).toBe(false);
      expect(sorted[1]!.hasWon).toBe(false);
      expect(sorted[2]!.hasWon).toBe(true);
    });

    it("should sort by hasWon descending", () => {
      const { result } = renderHook(() => useParticipantSort());

      // Start with hasWon asc
      act(() => {
        result.current.handleSort("hasWon");
      });

      // Toggle to desc
      act(() => {
        result.current.handleSort("hasWon");
      });

      const sorted = result.current.sortParticipants(participants);
      expect(sorted[0]!.hasWon).toBe(true);
      expect(sorted[1]!.hasWon).toBe(false);
      expect(sorted[2]!.hasWon).toBe(false);
    });

    it("should handle case-insensitive name sorting", () => {
      const mixedCaseParticipants = [
        createMockParticipant({ id: "1", name: "charlie" }),
        createMockParticipant({ id: "2", name: "ALICE" }),
        createMockParticipant({ id: "3", name: "Bob" }),
      ];

      const { result } = renderHook(() => useParticipantSort());

      act(() => {
        result.current.handleSort("name");
      });

      const sorted = result.current.sortParticipants(mixedCaseParticipants);
      expect(sorted[0]!.name).toBe("ALICE");
      expect(sorted[1]!.name).toBe("Bob");
      expect(sorted[2]!.name).toBe("charlie");
    });

    it("should not mutate original array", () => {
      const { result } = renderHook(() => useParticipantSort());
      const originalOrder = participants.map((p) => p.id);

      act(() => {
        result.current.handleSort("name");
      });

      result.current.sortParticipants(participants);
      const afterSortOrder = participants.map((p) => p.id);

      expect(originalOrder).toEqual(afterSortOrder);
    });
  });
});
