import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";

const ParticipantGame: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [sessionToken, setSessionToken] = useState<string>("");
  const [participantName, setParticipantName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const { data: bingoGame } = api.bingo.getById.useQuery(
    { id: id as string },
    { enabled: !!id }
  );

  const { data: participant } = api.participant.getBySessionToken.useQuery(
    { sessionToken },
    { enabled: !!sessionToken }
  );

  const joinMutation = api.participant.join.useMutation({
    onSuccess: () => {
      // Participant successfully joined, will redirect to setup
    },
    onError: (error: any) => {
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
    if (participant && participant.bingoGameId === id) {
      if (!participant.isGridComplete) {
        void router.push(`/game/${id}/setup`);
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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!bingoGame.isActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            このビンゴゲームは現在利用できません
          </h1>
          <p className="text-gray-600">管理者にお問い合わせください。</p>
        </div>
      </div>
    );
  }

  // Check if game is in ENTRY status  
  if (bingoGame.status !== 'ENTRY') {
    const getStatusMessage = (status: string) => {
      switch (status) {
        case 'EDITING': return '現在ゲームの準備中です。しばらくお待ちください。';
        case 'PLAYING': return 'ゲームが既に開始されています。新規参加はできません。';
        case 'FINISHED': return 'ゲームは終了しました。'; 
        default: return 'このゲームには現在参加できません。';
      }
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            参加できません
          </h1>
          <p className="text-gray-600 mb-4">{getStatusMessage(bingoGame.status)}</p>
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
      <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                DJ Bingo
              </h1>
              <h2 className="text-xl font-semibold text-gray-700">
                {bingoGame.title}
              </h2>
              <p className="text-gray-500 mt-2">
                サイズ: {bingoGame.size} | 楽曲数: {bingoGame.songs.length}
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  お名前を入力してください
                </label>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: 田中太郎"
                  disabled={isJoining}
                />
              </div>

              <button
                type="submit"
                disabled={isJoining || !participantName.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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