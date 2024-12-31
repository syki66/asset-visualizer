import { transactionTypeProps } from '@/types';

export const formatJsonForGraph = (
  json: transactionTypeProps[],
  startDate,
  endDate
) => {
  let _currency = 1;
  let evaluationAmount = 0; // 평가금액
  let principalAmount = 0; // 원금

  return json.map((item: transactionTypeProps) => {
    // 환율 계산
    if (item.currency === 'KRW') {
      _currency = 1; // 원달러 환율
    } else if (item.currency === 'USD') {
      _currency = 1350; // 달러원 환율
    }

    // 원금 계산
    if (item.type === 'deposit') {
      principalAmount += item.price * item.quantity * _currency;
    }
    if (item.type === 'withdraw') {
      principalAmount -= item.price * item.quantity * _currency;
    }

    // 평가금액 계산
    if (item.type === 'buy') {
      evaluationAmount += item.price * item.quantity * _currency;
    }
    if (item.type === 'sell') {
      evaluationAmount -= item.price * item.quantity * _currency;
    }

    // 예수금 계산
    const escrow = item.usdDeposit * 1350 + item.krwDeposit;

    return {
      date: item.date,
      principalAmount: Math.round(principalAmount),
      evaluationAmount: Math.round(evaluationAmount + escrow),
    };
  });
};
