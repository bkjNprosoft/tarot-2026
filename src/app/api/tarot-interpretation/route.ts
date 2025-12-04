import { NextRequest, NextResponse } from 'next/server';
import { tarotAgent } from '@/lib/ai/tarot-agent';
import { getCardById } from '@/lib/tarot-data';
import { CATEGORIES } from '@/lib/categories';

export interface InterpretationRequest {
  cardIds: string[];
  category: string;
  cardOrientations?: boolean[]; // 각 카드의 reversed 여부 (true = reversed, false = upright)
}

export interface InterpretationResponse {
  individualCards: Array<{
    cardId: string;
    cardName: string;
    interpretation: string;
  }>;
  combination: {
    summary: string;
    detailed: string;
  };
}

/**
 * POST /api/tarot-interpretation
 * 선택된 3장의 타로 카드에 대한 AI 해석을 생성합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인
    // Mastra는 GOOGLE_GENERATIVE_AI_API_KEY를 사용합니다
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error(
        'GOOGLE_GENERATIVE_AI_API_KEY 환경 변수가 설정되지 않았습니다.'
      );
      return NextResponse.json(
        {
          error:
            'AI 서비스가 설정되지 않았습니다. GOOGLE_GENERATIVE_AI_API_KEY 환경 변수를 확인해주세요.',
        },
        { status: 500 }
      );
    }

    const body: InterpretationRequest = await request.json();
    const { cardIds, category, cardOrientations } = body;

    // 유효성 검사
    if (!cardIds || !Array.isArray(cardIds) || cardIds.length !== 3) {
      return NextResponse.json(
        { error: '정확히 3장의 카드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 카드 정보 수집
    const cards = cardIds
      .map((id) => getCardById(id))
      .filter((card): card is NonNullable<typeof card> => card !== null);
    if (cards.length !== 3) {
      return NextResponse.json(
        { error: '유효하지 않은 카드 ID가 포함되어 있습니다.' },
        { status: 400 }
      );
    }

    const categoryInfo = CATEGORIES.find((c) => c.id === category);
    if (!categoryInfo) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리입니다.' },
        { status: 400 }
      );
    }

    // 카테고리에 맞는 해석 가져오기 (reversed 여부에 따라 선택)
    const interpretations = cards.map((card, index) => {
      const isReversed =
        cardOrientations && cardOrientations[index] !== undefined
          ? cardOrientations[index]
          : false;
      const orientation = isReversed ? card.reversed : card.upright;
      const categoryKey = category as keyof typeof orientation;
      const categoryInterpretation = orientation[categoryKey];
      return {
        cardId: card.id,
        cardName: card.nameKr,
        keywords: card.keywords,
        isReversed,
        interpretation:
          (typeof categoryInterpretation === 'string'
            ? categoryInterpretation
            : null) || orientation.general,
      };
    });

    // 프롬프트 생성
    const prompt = `다음 3장의 타로 카드에 대해 ${categoryInfo.title} 관점에서 해석해주세요:

카드 1: ${cards[0].nameKr} (${cards[0].name})${interpretations[0].isReversed ? ' [역방향]' : ''}
키워드: ${cards[0].keywords.join(', ')}
기본 해석: ${interpretations[0].interpretation}

카드 2: ${cards[1].nameKr} (${cards[1].name})${interpretations[1].isReversed ? ' [역방향]' : ''}
키워드: ${cards[1].keywords.join(', ')}
기본 해석: ${interpretations[1].interpretation}

카드 3: ${cards[2].nameKr} (${cards[2].name})${interpretations[2].isReversed ? ' [역방향]' : ''}
키워드: ${cards[2].keywords.join(', ')}
기본 해석: ${interpretations[2].interpretation}

위 3장의 카드를 ${categoryInfo.title} 관점에서 해석해주세요. 각 카드의 개별 의미와 3장이 함께 나타낼 때의 조합된 의미를 제공해주세요. [역방향]으로 표시된 카드는 역위(Reversed) 의미로 해석하고, 표시되지 않은 카드는 정위(Upright) 의미로 해석해주세요.`;

    // AI 해석 생성 (타임아웃 30초)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('타임아웃')), 30000)
    );

    console.log(
      'Generating AI interpretation with prompt length:',
      prompt.length
    );

    let agentResponse: { text: string };
    try {
      // Agent.generate()는 문자열 또는 메시지 배열을 받을 수 있음
      // 문서에 따르면 문자열을 직접 전달 가능
      const response = await Promise.race([
        tarotAgent.generate(prompt),
        timeoutPromise,
      ]);

      // Agent.generate()는 { text: string } 형태를 반환
      if (!response || typeof response !== 'object' || !('text' in response)) {
        console.error('Unexpected response format:', response);
        throw new Error('Unexpected response format from agent');
      }

      agentResponse = response as { text: string };
      console.log(
        'AI response received, length:',
        agentResponse.text?.length || 0
      );

      if (!agentResponse.text) {
        console.error('Empty response text');
        throw new Error('Empty response from agent');
      }
    } catch (agentError) {
      console.error('Agent generation error:', agentError);
      if (agentError instanceof Error) {
        console.error('Error name:', agentError.name);
        console.error('Error message:', agentError.message);
        console.error('Error stack:', agentError.stack);
      }
      throw agentError;
    }

    // 응답 파싱 시도
    let parsedResponse: InterpretationResponse;
    try {
      const text = agentResponse.text || '';
      console.log('Parsing response, first 200 chars:', text.substring(0, 200));

      // JSON 형식으로 응답을 파싱 시도
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
          console.log('Successfully parsed JSON response');
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw parseError;
        }
      } else {
        // JSON이 아닌 경우 기본 구조로 변환
        console.log('No JSON found in response, using text as detailed');
        parsedResponse = {
          individualCards: cards.map((card, index) => ({
            cardId: card.id,
            cardName: card.nameKr,
            interpretation: interpretations[index].interpretation,
          })),
          combination: {
            summary:
              text.substring(0, 200) || '3장의 카드가 함께 나타내는 의미',
            detailed: text || 'AI 해석을 생성했습니다.',
          },
        };
      }
    } catch (parseError) {
      console.error('Response parsing error:', parseError);
      // 파싱 실패 시 기본 해석 반환
      parsedResponse = {
        individualCards: cards.map((card, index) => ({
          cardId: card.id,
          cardName: card.nameKr,
          interpretation: interpretations[index].interpretation,
        })),
        combination: {
          summary: '3장의 카드가 함께 나타내는 의미를 분석 중입니다.',
          detailed:
            'AI 해석 생성 중 오류가 발생했습니다. 기본 해석을 표시합니다.',
        },
      };
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Error generating interpretation:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    );
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
    });

    return NextResponse.json(
      {
        error: '해석 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
