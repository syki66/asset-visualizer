import { NextResponse } from 'next/server';
import { transformYahooHistoryData } from '@/app/services/data/transformData';

const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  // 경로 파라미터에서 심볼 추출
  const { symbol } = params;

  // 요청 URL에서 쿼리 파라미터 추출
  const url = new URL(request.url);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const interval = url.searchParams.get('interval') || '1d'; // 기본값 '1d'

  if (!symbol) {
    return NextResponse.json(
      { error: 'Missing symbol parameter' },
      { status: 400 }
    );
  }

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'Missing startDate or endDate parameter' },
      { status: 400 }
    );
  }

  const fetchUrl = `${BASE_URL}/${symbol}?interval=${interval}&period1=${startDate}&period2=${endDate}`;

  try {
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch data from fetchUrl' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const transformData = transformYahooHistoryData(data);

    return NextResponse.json(transformData);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
