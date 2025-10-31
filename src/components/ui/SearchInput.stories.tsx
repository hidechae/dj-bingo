import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SearchInput } from "./SearchInput";

const meta = {
  title: "UI/SearchInput",
  component: SearchInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
    },
    resultLabel: {
      control: "text",
    },
    focusColor: {
      control: "select",
      options: ["blue", "green"],
    },
  },
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive story with state management
const SearchInputWithState = (args: {
  placeholder?: string;
  resultLabel?: string;
  focusColor?: "blue" | "green";
  resultCount?: number;
}) => {
  const [value, setValue] = useState("");

  return (
    <div className="w-96">
      <SearchInput
        value={value}
        onChange={setValue}
        placeholder={args.placeholder}
        resultLabel={args.resultLabel}
        focusColor={args.focusColor}
        resultCount={args.resultCount}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <SearchInputWithState />,
};

export const WithPlaceholder: Story = {
  render: () => (
    <SearchInputWithState placeholder="楽曲名またはアーティスト名で検索..." />
  ),
};

export const BlueFocus: Story = {
  render: () => (
    <SearchInputWithState
      placeholder="Blue focus color..."
      focusColor="blue"
    />
  ),
};

export const GreenFocus: Story = {
  render: () => (
    <SearchInputWithState
      placeholder="Green focus color..."
      focusColor="green"
    />
  ),
};

export const WithResultCount: Story = {
  render: () => (
    <SearchInputWithState
      placeholder="Search with result count..."
      resultCount={42}
      resultLabel="件の楽曲が見つかりました"
    />
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          Default (Blue)
        </h3>
        <div className="w-96">
          <SearchInputWithState placeholder="楽曲名またはアーティスト名で検索..." />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          Green Focus
        </h3>
        <div className="w-96">
          <SearchInputWithState
            placeholder="プレイリスト名で絞り込み..."
            focusColor="green"
          />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          With Result Count
        </h3>
        <div className="w-96">
          <SearchInputWithState
            placeholder="検索結果を絞り込み..."
            resultCount={15}
            resultLabel="件が見つかりました"
            focusColor="blue"
          />
        </div>
      </div>
    </div>
  ),
};
