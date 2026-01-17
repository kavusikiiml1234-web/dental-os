'use client'

import { useState } from 'react'

export default function CheckinQRPage() {
  const [baseUrl, setBaseUrl] = useState('https://dental-os-pi.vercel.app')
  
  const checkinUrl = `${baseUrl}/checkin`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(checkinUrl)}`

  function handlePrint() {
    window.print()
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">チェックイン用QRコード</h1>
        <p className="text-gray-600 mb-6">受付に設置するQRコードを生成・印刷できます</p>

        {/* 設定 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6 print:hidden">
          <h2 className="font-semibold text-gray-800 mb-4">設定</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              サイトURL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              デプロイ先のURLを入力してください
            </p>
          </div>
        </div>

        {/* プレビュー / 印刷用 */}
        <div className="bg-white rounded-xl shadow p-8 text-center print:shadow-none print:p-0">
          <div className="border-4 border-blue-500 rounded-2xl p-8 inline-block">
            {/* ヘッダー */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-blue-600 mb-2">
                📱 チェックイン
              </h2>
              <p className="text-xl text-gray-700">
                QRコードを読み取ってください
              </p>
            </div>

            {/* QRコード */}
            <div className="bg-white p-4 rounded-xl inline-block mb-6">
              <img 
                src={qrCodeUrl} 
                alt="チェックイン用QRコード" 
                className="w-64 h-64 mx-auto"
              />
            </div>

            {/* 手順 */}
            <div className="text-left bg-gray-50 rounded-xl p-4 max-w-sm mx-auto">
              <p className="font-bold text-gray-800 mb-3">ご利用方法</p>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>スマートフォンでQRコードを読み取り</span>
                </li>
                <li className="flex gap-2">
                  <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>お名前・生年月日・電話番号を入力</span>
                </li>
                <li className="flex gap-2">
                  <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>保険証を撮影してチェックイン完了</span>
                </li>
              </ol>
            </div>

            {/* フッター */}
            <p className="text-sm text-gray-500 mt-6">
              ○○歯科クリニック
            </p>
          </div>
        </div>

        {/* 印刷ボタン */}
        <div className="mt-6 text-center print:hidden">
          <button
            onClick={handlePrint}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            🖨️ 印刷する
          </button>
          <p className="text-sm text-gray-500 mt-2">
            A4用紙に印刷して受付に設置してください
          </p>
        </div>

        {/* 使い方 */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 print:hidden">
          <h3 className="font-semibold text-blue-800 mb-3">💡 使い方</h3>
          <ol className="space-y-2 text-sm text-blue-700">
            <li>1. 「印刷する」ボタンを押してA4用紙に印刷</li>
            <li>2. 受付カウンターに設置（ラミネート加工推奨）</li>
            <li>3. 患者さんが来院時にスマホで読み取り</li>
            <li>4. チェックイン情報が自動で管理画面に反映</li>
          </ol>
        </div>
      </div>

      {/* 印刷用スタイル */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  )
}
