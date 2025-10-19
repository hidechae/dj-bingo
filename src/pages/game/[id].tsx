import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import { useInitialLoading } from "~/hooks/useInitialLoading";

const ParticipantGame: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [sessionToken, setSessionToken] = useState<string>("");
  const [participantName, setParticipantName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const { data: bingoGame, isLoading: bingoGameLoading } =
    api.bingo.getById.useQuery({ id: id as string }, { enabled: !!id });

  const { data: participant, isLoading: participantLoading } =
    api.participant.getBySessionToken.useQuery(
      { sessionToken, bingoGameId: id as string },
      { enabled: !!sessionToken && !!id }
    );

  // 初期ロード中はグローバルローディングを表示
  useInitialLoading({
    isLoading: bingoGameLoading || (!!sessionToken && participantLoading),
  });

  const joinMutation = api.participant.join.useMutation({
    onSuccess: () => {
      // Participant successfully joined, redirect to setup
      void router.push(`/game/${id}/setup`);
    },
    onError: (error) => {
      if (error.message === "Already joined this game") {
        // Already joined, continue to game
      } else {
        alert(`参加に失敗しました: ${error.message}`);
        setIsJoining(false);
      }
    },
  });

  useEffect(() => {
    // Generate or retrieve session token from localStorage
    let token = localStorage.getItem("dj-bingo-session");
    if (!token) {
      token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("dj-bingo-session", token);
    }
    setSessionToken(token);
  }, []);

  useEffect(() => {
    // Redirect to setup/play page if already joined
    if (
      participant &&
      participant.bingoGameId === id &&
      participant.bingoGame
    ) {
      if (!participant.isGridComplete) {
        // If game is PLAYING and grid is incomplete, go directly to play
        if (participant.bingoGame.status === "PLAYING") {
          void router.push(`/game/${id}/play`);
        } else if (participant.bingoGame.status === "ENTRY") {
          // Only allow setup during ENTRY status
          void router.push(`/game/${id}/setup`);
        }
        // For other statuses, stay on join page to show appropriate message
      } else {
        void router.push(`/game/${id}/play`);
      }
    }
  }, [participant, id, router]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim() || !id || !sessionToken) return;

    setIsJoining(true);
    joinMutation.mutate({
      name: participantName.trim(),
      bingoGameId: id as string,
      sessionToken,
    });
  };

  if (!bingoGame) {
    return null; // グローバルローディングオーバーレイが表示される
  }

  if (!bingoGame.isActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            このビンゴゲームは現在利用できません
          </h1>
          <p className="text-gray-600">管理者にお問い合わせください。</p>
        </div>
      </div>
    );
  }

  // Check if game is in ENTRY status
  if (bingoGame.status !== "ENTRY") {
    // If user is already a participant with incomplete grid and game is PLAYING, show special message
    if (
      participant &&
      participant.bingoGameId === id &&
      !participant.isGridComplete &&
      bingoGame.status === "PLAYING"
    ) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="mx-auto max-w-md px-4 text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">
              ゲーム開始
            </h1>
            <p className="mb-4 text-gray-600">
              ゲームが開始されました。グリッド設定が完了していませんが、現在の状態でゲームに参加できます。
            </p>
            <button
              onClick={() => router.push(`/game/${id}/play`)}
              className="cursor-pointer rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
            >
              ゲームに参加
            </button>
            <div className="mt-4 text-sm text-gray-500">
              <p>⚠️ 空白のマスではビンゴになりません</p>
            </div>
          </div>
        </div>
      );
    }

    const getStatusMessage = (status: string) => {
      switch (status) {
        case "EDITING":
          return "現在ゲームの準備中です。しばらくお待ちください。";
        case "PLAYING":
          return "ゲームが既に開始されています。新規参加はできません。";
        case "FINISHED":
          return "ゲームは終了しました。";
        default:
          return "このゲームには現在参加できません。";
      }
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            参加できません
          </h1>
          <p className="mb-4 text-gray-600">
            {getStatusMessage(bingoGame.status)}
          </p>
          <div className="text-sm text-gray-500">
            <p>管理者にお問い合わせいただくか、</p>
            <p>しばらくしてから再度お試しください。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{bingoGame.title} - DJ Bingo参加</title>
        <meta name="description" content="DJ Bingoゲームに参加" />
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="mx-4 w-full max-w-md">
          <div className="rounded-lg bg-white p-8 shadow-xl">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                DJ Bingo
              </h1>
              <h2 className="text-xl font-semibold text-gray-700">
                {bingoGame.title}
              </h2>
              <p className="mt-2 text-gray-500">
                サイズ: {bingoGame.size} | 楽曲数: {bingoGame.songs.length}
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  お名前を入力してください
                </label>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-3 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 田中太郎"
                  disabled={isJoining}
                />
              </div>

              <button
                type="submit"
                disabled={isJoining || !participantName.trim()}
                className="w-full cursor-pointer rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isJoining ? "参加中..." : "ビンゴに参加する"}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>参加後、ビンゴのマスに楽曲を配置してゲームを開始します</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ParticipantGame;
