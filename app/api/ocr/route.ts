import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()
    
    if (!image) {
      return NextResponse.json({ error: '画像がありません' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 500 })
    }

    // Base64画像からデータ部分を抽出
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const mediaType = image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg'

    // Claude APIにリクエスト
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: `この健康保険証の画像から以下の情報を読み取ってJSON形式で返してください。
読み取れない項目はnullとしてください。

必要な項目：
- insurer_number: 保険者番号（8桁の数字）
- insurer_name: 保険者名称
- symbol: 記号
- insured_number: 番号
- insured_name: 被保険者氏名
- relationship: 本人/家族
- copay_rate: 負担割合（数字のみ、例: 3）
- valid_from: 有効開始日（YYYY-MM-DD形式）
- valid_until: 有効終了日（YYYY-MM-DD形式）

JSON形式のみで返答してください。説明文は不要です。
例: {"insurer_number": "06130012", "insurer_name": "全国健康保険協会", ...}`,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Claude API error:', errorData)
      return NextResponse.json({ error: 'AI処理に失敗しました' }, { status: 500 })
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''

    // JSONを抽出
    try {
      // JSONブロックを探す
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json({ success: true, data: parsed })
      }
      return NextResponse.json({ error: 'JSONの解析に失敗しました', raw: content }, { status: 500 })
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json({ error: 'JSONの解析に失敗しました', raw: content }, { status: 500 })
    }

  } catch (error: any) {
    console.error('OCR error:', error)
    return NextResponse.json({ error: error.message || 'エラーが発生しました' }, { status: 500 })
  }
}
