import type { Meta, StoryObj } from "@storybook/react";
import { RecentlyPlayedSongs } from "./RecentlyPlayedSongs";
import { type Song } from "~/types";

const meta = {
  title: "Bingo/RecentlyPlayedSongs",
  component: RecentlyPlayedSongs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RecentlyPlayedSongs>;

export default meta;
type Story = StoryObj<typeof meta>;

const createSong = (
  id: string,
  title: string,
  artist: string | null,
  playedAt: Date | null
): Song => ({
  id,
  title,
  artist,
  bingoGameId: "game1",
  isPlayed: true,
  playedAt,
});

const recentSongs: Song[] = [
  createSong(
    "1",
    "Bohemian Rhapsody",
    "Queen",
    new Date("2024-01-15T10:30:00")
  ),
  createSong("2", "Imagine", "John Lennon", new Date("2024-01-15T10:25:00")),
  createSong(
    "3",
    "Hotel California",
    "Eagles",
    new Date("2024-01-15T10:20:00")
  ),
  createSong(
    "4",
    "Stairway to Heaven",
    "Led Zeppelin",
    new Date("2024-01-15T10:15:00")
  ),
  createSong("5", "Hey Jude", "The Beatles", new Date("2024-01-15T10:10:00")),
];

const fewSongs: Song[] = [
  createSong(
    "1",
    "Shape of You",
    "Ed Sheeran",
    new Date("2024-01-15T10:30:00")
  ),
  createSong(
    "2",
    "Blinding Lights",
    "The Weeknd",
    new Date("2024-01-15T10:25:00")
  ),
];

const manySongs: Song[] = Array.from({ length: 10 }, (_, i) =>
  createSong(
    `${i + 1}`,
    `Song ${i + 1}`,
    `Artist ${i + 1}`,
    new Date(Date.now() - i * 5 * 60 * 1000)
  )
);

export const Default: Story = {
  args: {
    playedSongs: recentSongs,
  },
};

export const Empty: Story = {
  args: {
    playedSongs: [],
  },
};

export const FewSongs: Story = {
  args: {
    playedSongs: fewSongs,
  },
};

export const ManySongs: Story = {
  args: {
    playedSongs: manySongs,
  },
};

export const WithoutArtists: Story = {
  args: {
    playedSongs: [
      createSong("1", "Instrumental 1", null, new Date("2024-01-15T10:30:00")),
      createSong("2", "Instrumental 2", null, new Date("2024-01-15T10:25:00")),
      createSong("3", "Instrumental 3", null, new Date("2024-01-15T10:20:00")),
    ],
  },
};
