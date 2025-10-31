import type { Meta, StoryObj } from "@storybook/react";
import { ParticipantTable } from "./ParticipantTable";
import { type Participant } from "~/types";
import { useParticipantSort } from "~/hooks/useParticipantSort";

const meta = {
  title: "Admin/ParticipantTable",
  component: ParticipantTable,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ParticipantTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const createParticipant = (
  id: string,
  name: string,
  isGridComplete: boolean,
  hasWon: boolean,
  createdAt: Date
): Participant => ({
  id,
  name,
  sessionToken: `token-${id}`,
  bingoGameId: "game1",
  createdAt,
  isGridComplete,
  hasWon,
  wonAt: hasWon ? new Date() : null,
  participantSongs: [],
});

const participants: Participant[] = [
  createParticipant("1", "Alice", true, true, new Date("2024-01-15T10:00:00")),
  createParticipant("2", "Bob", true, false, new Date("2024-01-15T10:05:00")),
  createParticipant(
    "3",
    "Charlie",
    false,
    false,
    new Date("2024-01-15T10:10:00")
  ),
  createParticipant("4", "Diana", true, false, new Date("2024-01-15T10:15:00")),
  createParticipant("5", "Eve", true, true, new Date("2024-01-15T10:20:00")),
];

const manyParticipants: Participant[] = Array.from({ length: 20 }, (_, i) =>
  createParticipant(
    `${i + 1}`,
    `Participant ${i + 1}`,
    Math.random() > 0.3,
    Math.random() > 0.8,
    new Date(Date.now() - i * 5 * 60 * 1000)
  )
);

export const Default: Story = {
  args: {
    participants,
    sortField: "createdAt",
    sortDirection: "desc",
    onSort: () => {},
  },
};

export const Empty: Story = {
  args: {
    participants: [],
    sortField: "createdAt",
    sortDirection: "desc",
    onSort: () => {},
  },
};

export const ManyParticipants: Story = {
  args: {
    participants: manyParticipants,
    sortField: "createdAt",
    sortDirection: "desc",
    onSort: () => {},
  },
};

export const AllWinners: Story = {
  args: {
    participants: participants.map((p) => ({ ...p, hasWon: true })),
    sortField: "createdAt",
    sortDirection: "desc",
    onSort: () => {},
  },
};

export const AllIncomplete: Story = {
  args: {
    participants: participants.map((p) => ({ ...p, isGridComplete: false })),
    sortField: "createdAt",
    sortDirection: "desc",
    onSort: () => {},
  },
};

export const Interactive: Story = {
  args: {},
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { sortField, sortDirection, handleSort, sortParticipants } =
      useParticipantSort();
    const sorted = sortParticipants(participants);

    return (
      <ParticipantTable
        participants={sorted}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
    );
  },
};
