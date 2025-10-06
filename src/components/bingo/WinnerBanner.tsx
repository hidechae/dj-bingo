type WinnerBannerProps = {
  hasWon: boolean;
};

export const WinnerBanner = ({ hasWon }: WinnerBannerProps) => {
  if (!hasWon) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-black p-4 rounded-lg mb-6 text-center animate-bounce">
      <h2 className="text-2xl font-bold">
        🎉 ビンゴ！おめでとうございます！ 🎉
      </h2>
      <p className="mt-2">管理者に勝利をお伝えください</p>
    </div>
  );
};
