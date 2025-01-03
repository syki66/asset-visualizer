// 야후 금융 API로부터 데이터 변환 (key: timestamp, value: 조정종가)
export function transformYahooHistoryData(data: any) {
  const { timestamp, indicators } = data.chart.result[0];
  const adjClose = indicators.adjclose[0].adjclose;

  return timestamp.map((timestamp: number, index: number) => ({
    timestamp: timestamp,
    adjClose: adjClose[index],
  }));
}
