import type { Meta, StoryObj } from "@storybook/react";
import { SongInfo } from "./SongInfo";

const meta = {
  title: "Common/SongInfo",
  component: SongInfo,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
    },
    artist: {
      control: "text",
    },
  },
} satisfies Meta<typeof SongInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Shape of You",
    artist: "Ed Sheeran",
  },
};

export const WithoutArtist: Story = {
  args: {
    title: "Untitled Song",
    artist: null,
  },
};

export const LongTitle: Story = {
  args: {
    title:
      "Supercalifragilisticexpialidocious - A Very Long Song Title That Should Truncate",
    artist: "Mary Poppins",
  },
};

export const LongArtist: Story = {
  args: {
    title: "Song Title",
    artist:
      "This is a very long artist name that might need to be truncated in certain layouts",
  },
};

export const CustomClassName: Story = {
  args: {
    title: "Custom Styled Song",
    artist: "Custom Artist",
    className: "bg-blue-50 p-4 rounded-lg",
  },
};

export const Examples: Story = {
  args: {},
  render: () => (
    <div className="flex w-96 flex-col gap-4">
      <div className="rounded-lg border border-gray-200 p-3">
        <SongInfo title="Bohemian Rhapsody" artist="Queen" />
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <SongInfo title="Imagine" artist="John Lennon" />
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <SongInfo title="Instrumental Track" artist={null} />
      </div>
      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
        <SongInfo title="Played Song" artist="Artist Name" />
      </div>
    </div>
  ),
};
