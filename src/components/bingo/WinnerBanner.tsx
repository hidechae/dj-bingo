type WinnerBannerProps = {
  hasWon: boolean;
};

export const WinnerBanner = ({ hasWon }: WinnerBannerProps) => {
  if (!hasWon) {
    return null;
  }

  return (
    <div className="mb-6 animate-bounce rounded-lg bg-yellow-500 p-4 text-center text-black">
      <h2 className="text-2xl font-bold">
        🎉 ビンゴ！おめでとうございます！ 🎉
      </h2>
      <p className="mt-2">管理者に勝利をお伝えください</p>
    </div>
  );
};
