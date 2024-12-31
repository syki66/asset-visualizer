'use client';

import { useState } from 'react';
import CsvInput from './csv-input';
import { MainChart } from './main-chart';

export default function DataVisualization() {
  const [chartData, setChartData] = useState([]);

  return (
    <>
      <CsvInput setChartData={setChartData} />
      <MainChart
        chartData={chartData}
        chartConfig={{
          evaluationAmount: {
            label: '평가금액',
            color: 'hsl(var(--chart-1))',
          },
          principalAmount: {
            label: '원금',
            color: 'hsl(var(--chart-2))',
          },
        }}
      />
    </>
  );
}
