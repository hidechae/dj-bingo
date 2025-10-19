import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "outline", "ghost"],
    },
    color: {
      control: "select",
      options: ["blue", "green", "red", "gray"],
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: "Primary Button",
    variant: "primary",
    color: "blue",
  },
};

export const Ghost: Story = {
  args: {
    children: "Ghost Button",
    variant: "ghost",
    color: "blue",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline Button",
    variant: "outline",
    color: "blue",
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    variant: "primary",
    color: "blue",
    disabled: true,
  },
};

export const Green: Story = {
  args: {
    children: "Green Button",
    variant: "primary",
    color: "green",
  },
};

export const Red: Story = {
  args: {
    children: "Red Button",
    variant: "primary",
    color: "red",
  },
};

export const Gray: Story = {
  args: {
    children: "Gray Button",
    variant: "primary",
    color: "gray",
  },
};

export const AllVariants: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button variant="primary" color="blue">
          Primary Blue
        </Button>
        <Button variant="outline" color="blue">
          Outline Blue
        </Button>
        <Button variant="ghost" color="blue">
          Ghost Blue
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" color="green">
          Primary Green
        </Button>
        <Button variant="outline" color="green">
          Outline Green
        </Button>
        <Button variant="ghost" color="green">
          Ghost Green
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" color="red">
          Primary Red
        </Button>
        <Button variant="outline" color="red">
          Outline Red
        </Button>
        <Button variant="ghost" color="red">
          Ghost Red
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" color="gray">
          Primary Gray
        </Button>
        <Button variant="outline" color="gray">
          Outline Gray
        </Button>
        <Button variant="ghost" color="gray">
          Ghost Gray
        </Button>
      </div>
    </div>
  ),
};
