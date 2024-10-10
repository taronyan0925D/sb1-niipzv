import React, { useState } from 'react';
import { Youtube, Send, ArrowLeft } from 'lucide-react';
import { getSubtitles } from 'youtube-captions-scraper';
import { GoogleGenerativeAI } from '@google/generative-ai';

function App() {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [summaryPoints, setSummaryPoints] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getVideoId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : false;
  };

  const summarizeSubtitles = async (subtitles: string, points: string) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `以下の字幕を要約してください。${points ? `以下の点に注目してください：${points}` : ''}

字幕：
${subtitles}`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('要約の生成中にエラーが発生しました。');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const videoId = getVideoId(url);
      if (!videoId) {
        throw new Error('無効なYouTube URLです。');
      }

      const subtitles = await getSubtitles({ videoID: videoId, lang: 'ja' });
      const subtitlesText = subtitles.map(caption => caption.text).join(' ');

      const summarizedText = await summarizeSubtitles(subtitlesText, summaryPoints);
      setSummary(summarizedText);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        {!summary ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-2xl font-bold text-center mb-6">YouTube字幕要約</h1>
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Youtube className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="url"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
              <input
                type="password"
                id="apiKey"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="summaryPoints" className="block text-sm font-medium text-gray-700 mb-1">要約ポイント（オプション）</label>
              <textarea
                id="summaryPoints"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                rows={3}
                value={summaryPoints}
                onChange={(e) => setSummaryPoints(e.target.value)}
                placeholder="例：主要な論点、重要な数字、結論など"
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  処理中...
                </span>
              ) : (
                <span className="flex items-center">
                  <Send className="mr-2 h-5 w-5" />
                  要約する
                </span>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">要約結果</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
            <button
              onClick={() => setSummary('')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              要約に戻る
            </button>
          </div>
        )}
        {error && (
          <div className="mt-4 text-red-600 text-sm">{error}</div>
        )}
      </div>
    </div>
  );
}

export default App;