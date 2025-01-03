import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/';

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/VTI?interval=1d&period1=1735195186&period2=1735895186`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
