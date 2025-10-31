import type { Meta, StoryObj } from "@storybook/react";
import {
  AlertCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  DotsVerticalIcon,
  GoogleIcon,
  MailIcon,
  SpotifyIcon,
  StarIcon,
  XIcon,
} from "./index";

const meta = {
  title: "Icons/All Icons",
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;

// すべてのアイコンを一覧表示
export const AllIcons: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-8 p-8" style={{ flexWrap: "wrap" }}>
      <div className="flex w-32 flex-col items-center gap-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <AlertCircleIcon className="h-8 w-8 text-yellow-600" />
        </div>
        <span className="text-sm font-medium">AlertCircle</span>
        <span className="text-xs text-gray-500">警告・エラー</span>
      </div>

      <div className="flex w-32 flex-col items-center gap-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <CheckIcon className="h-8 w-8 text-green-600" />
        </div>
        <span className="text-sm font-medium">Check</span>
        <span className="text-xs text-gray-500">チェック・完了</span>
      </div>

      <div className="flex w-32 flex-col items-center gap-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <ChevronDownIcon className="h-8 w-8 text-gray-700" />
        </div>
        <span className="text-sm font-medium">ChevronDown</span>
        <span className="text-xs text-gray-500">ドロップダウン</span>
      </div>

      <div className="flex w-32 flex-col items-center gap-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <ChevronLeftIcon className="h-8 w-8 text-gray-700" />
        </div>
        <span className="text-sm font-medium">ChevronLeft</span>
        <span className="text-xs text-gray-500">戻る</span>
      </div>

      <div className="flex w-32 flex-col items-center gap-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <DotsVerticalIcon className="h-8 w-8 text-gray-700" />
        </div>
        <span className="text-sm font-medium">DotsVertical</span>
        <span className="text-xs text-gray-500">メニュー</span>
      </div>

      <div className="flex w-32 flex-col items-center gap-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <GoogleIcon className="h-8 w-8" />
        </div>
        <span className="text-sm font-medium">Google</span>
        <span className="text-xs text-gray-500">Google OAuth</span>
      </div>

      <div className="flex w-32 flex-col items-center gap-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <MailIcon className="h-8 w-8 text-blue-600" />
        </div>
        <span className="text-sm font-medium">Mail</span>
        <span className="text-xs text-gray-500">メール</span>
      </div>

      <div className="flex w-32 flex-col items-center gap-2">
        <div className="rounded-lg border border-gray-200 bg-[#1DB954] p-4">
          <SpotifyIcon className="h-8 w-8 text-white" />
        </div>
        <span className="text-sm font-medium">Spotify</span>
        <span className="text-xs text-gray-500">Spotify</span>
      </div>

      <div className="flex w-32 flex-col items-center gap-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <StarIcon className="h-10 w-10 text-yellow-500" />
        </div>
        <span className="text-sm font-medium">Star</span>
        <span className="text-xs text-gray-500">ビンゴ達成</span>
      </div>

      <div className="flex w-32 flex-col items-center gap-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <XIcon className="h-8 w-8 text-gray-700" />
        </div>
        <span className="text-sm font-medium">X</span>
        <span className="text-xs text-gray-500">閉じる</span>
      </div>
    </div>
  ),
};

// AlertCircleIcon
export const AlertCircle: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <AlertCircleIcon className="h-5 w-5 text-yellow-600" />
      <AlertCircleIcon className="h-8 w-8 text-red-600" />
      <AlertCircleIcon className="h-12 w-12 text-blue-600" />
    </div>
  ),
};

// CheckIcon
export const Check: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <CheckIcon className="h-6 w-6 text-green-600" />
      <CheckIcon className="h-8 w-8 text-green-600" />
      <CheckIcon className="h-12 w-12 text-green-600" />
    </div>
  ),
};

// ChevronDownIcon
export const ChevronDown: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <ChevronDownIcon className="h-4 w-4 text-gray-700" />
      <ChevronDownIcon className="h-6 w-6 text-gray-700" />
      <ChevronDownIcon className="h-8 w-8 text-gray-700" />
    </div>
  ),
};

// ChevronLeftIcon
export const ChevronLeft: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
      <ChevronLeftIcon className="h-8 w-8 text-gray-700" />
      <ChevronLeftIcon className="h-12 w-12 text-gray-700" />
    </div>
  ),
};

// DotsVerticalIcon
export const DotsVertical: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <DotsVerticalIcon className="h-5 w-5 text-gray-700" />
      <DotsVerticalIcon className="h-6 w-6 text-gray-700" />
      <DotsVerticalIcon className="h-8 w-8 text-gray-700" />
    </div>
  ),
};

// GoogleIcon
export const Google: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <GoogleIcon className="h-6 w-6" />
      <GoogleIcon className="h-8 w-8" />
      <GoogleIcon className="h-12 w-12" />
    </div>
  ),
};

// MailIcon
export const Mail: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <MailIcon className="h-8 w-8 text-blue-600" />
      <MailIcon className="h-10 w-10 text-blue-600" />
      <MailIcon className="h-12 w-12 text-blue-600" />
    </div>
  ),
};

// SpotifyIcon
export const Spotify: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <div className="rounded-lg bg-[#1DB954] p-2">
        <SpotifyIcon className="h-6 w-6 text-white" />
      </div>
      <div className="rounded-lg bg-[#1DB954] p-2">
        <SpotifyIcon className="h-8 w-8 text-white" />
      </div>
      <div className="rounded-lg bg-[#1DB954] p-2">
        <SpotifyIcon className="h-12 w-12 text-white" />
      </div>
    </div>
  ),
};

// StarIcon
export const Star: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <StarIcon className="h-8 w-8 text-yellow-500" />
      <StarIcon className="h-12 w-12 text-yellow-500" />
      <StarIcon className="h-16 w-16 text-yellow-500" />
    </div>
  ),
};

// XIcon
export const X: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <XIcon className="h-6 w-6 text-gray-700" />
      <XIcon className="h-8 w-8 text-gray-700" />
      <XIcon className="h-12 w-12 text-red-600" />
    </div>
  ),
};

// 使用例: ボタン内
export const InButtons: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-4">
      <button className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        <CheckIcon className="h-5 w-5" />
        保存
      </button>

      <button className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50">
        <ChevronLeftIcon className="h-5 w-5" />
        戻る
      </button>

      <button className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-gray-700 shadow hover:bg-gray-50">
        <GoogleIcon className="h-5 w-5" />
        Googleでログイン
      </button>

      <button className="flex items-center gap-2 rounded-md bg-[#1DB954] px-4 py-2 text-white hover:bg-[#1aa34a]">
        <SpotifyIcon className="h-5 w-5" />
        Spotifyでログイン
      </button>

      <button className="rounded-md border border-red-300 bg-white p-2 text-red-600 hover:bg-red-50">
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  ),
};

// 使用例: 通知・アラート
export const InAlerts: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
        <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-600" />
        <div>
          <p className="font-medium text-green-800">成功しました</p>
          <p className="text-sm text-green-700">操作が正常に完了しました。</p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <AlertCircleIcon className="h-5 w-5 flex-shrink-0 text-yellow-600" />
        <div>
          <p className="font-medium text-yellow-800">警告</p>
          <p className="text-sm text-yellow-700">
            この操作は取り消すことができません。
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <XIcon className="h-5 w-5 flex-shrink-0 text-red-600" />
        <div>
          <p className="font-medium text-red-800">エラー</p>
          <p className="text-sm text-red-700">処理中にエラーが発生しました。</p>
        </div>
      </div>
    </div>
  ),
};
