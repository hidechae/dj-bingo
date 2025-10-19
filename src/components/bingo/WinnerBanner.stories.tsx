import type { Meta, StoryObj } from "@storybook/react";
import { WinnerBanner } from "./WinnerBanner";

const meta = {
  title: "Bingo/WinnerBanner",
  component: WinnerBanner,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    hasWon: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof WinnerBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Winner: Story = {
  args: {
    hasWon: true,
  },
};

export const NotWon: Story = {
  args: {
    hasWon: false,
  },
};

export const Comparison: Story = {
  args: {},
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-lg font-semibold">Winner State</h3>
        <WinnerBanner hasWon={true} />
      </div>
      <div>
        <h3 className="mb-2 text-lg font-semibold">Not Won State</h3>
        <WinnerBanner hasWon={false} />
      </div>
    </div>
  ),
};
