import { transactionTypeProps } from '@/types';

export const shinhanCsvToJson = (csv: string) => {
  const lines = csv.trim().split('\r\n'); // 줄별로 나누기

  // 두 줄씩 묶어서 합치기
  const data = [];
  for (let i = 0; i < lines.length; i++) {
    if (i % 2 === 0) data.push((lines[i] + lines[i + 1]).split(','));
  }

  // 첫 줄 제거하면서 column으로 저장
  const columns: string[] = data.shift() || [];

  // json 형식으로 변환
  const json = data.map((line) => {
    return columns.reduce((obj: { [key: string]: any }, column, index) => {
      obj[column] = line[index];
      return obj;
    }, {});
  });

  // 역순으로 정렬
  json.reverse();

  return json;
};

export const makeShinhanJsonClean = (json: any[]) => {
  let _krwDeposit: number = 0; // 원화 예수금
  let _krwIpoDeposit: number = 0; // 공모주 청약 증거금 (원화)
  let _usdDeposit: number = 0; // USD 예수금
  let _usdRp: number = 0; // USD RP 잔고

  const newJson = json.map((item) => {
    // 새로운 데이터 객체 생성
    const _itemData: transactionTypeProps = {
      date: '',
      type: '',
      currency: '',
      ISIN: '',
      quantity: 0,
      price: 0,
      krwDeposit: 0,
      usdDeposit: 0,
      note: '',
    };

    // USD RP 계산은 이자를 포함한 금액이 출금되어서 실제 보다 적게 나옴. 따라서 음수로 찍힐때마다 0으로 초기화해서 보정함.
    if (_usdRp < 0) {
      _usdRp = 0;
    }

    // KRW 예수금 값 업데이트
    if (
      item['구분'] === '증금예금_증금예금상환' ||
      item['구분'] === '증금예금_증금예금매수' ||
      item['구분'] === '은행이체입금' ||
      item['구분'] === '은행이체출금'
    ) {
      _krwDeposit = Number(item['최종금액']);
    }

    // 공모주 청약 증거금 값 업데이트
    if (item['구분'] === '공모불입') {
      _krwIpoDeposit = Number(item['거래대금']); // 공모주 청약 증거금 업데이트
      _krwDeposit = Number(item['최종금액']); // 원화 잔고 업데이트
    }
    if (item['구분'] === '공모주환불금') {
      _krwIpoDeposit = Number(item['가격']) * Number(item['수량']); // 배정 주식 평가액 업데이트
      _krwDeposit = Number(item['최종금액']); // 원화 잔고 업데이트
    }
    if (item['구분'] === '공모주입고') {
      _krwIpoDeposit = 0; // 공모주 청약 증거금 초기화
      _krwDeposit = Number(item['최종금액']); // 원화 잔고 업데이트
    }

    // USD_RP 잔고 및 USD 예수금 값 업데이트
    if (item['구분'] === '외화RP매수출금') {
      _usdRp += Number(item['거래대금']); // USD RP 잔고 업데이트
      _usdRp = Number(_usdRp.toFixed(2));
      _usdDeposit = Number(item['최종금액']); // USD 예수금 업데이트
    }
    if (item['구분'] === '외화RP매도입금') {
      _usdRp -= Number(item['거래대금']); // USD RP 잔고 업데이트
      _usdRp = Number(_usdRp.toFixed(2));
      _usdDeposit = Number(item['최종금액']); // USD 예수금 업데이트
    }

    // 입금고 데이터 대입
    const isDeposit = ['은행이체입금', '계좌대체입금', '(펌뱅킹)입금'].some(
      (keyword) => item['구분'].endsWith(keyword)
    );

    if (isDeposit) {
      _itemData.date = item['일자'];
      _itemData.type = 'deposit';
      _itemData.currency = 'KRW';
      _itemData.quantity = 1;
      _itemData.price = Number(item['거래대금']);
      _itemData.usdDeposit = _usdDeposit + _usdRp;
      _itemData.krwDeposit = _krwDeposit + _krwIpoDeposit;
    }

    // 출금고 데이터 대입
    const isWithdrawal = [
      '은행이체출금',
      '계좌대체출금',
      '(펌뱅킹)출금',
      '체크카드승인',
      '체크카드대체출금',
    ].some((keyword) => item['구분'].endsWith(keyword));

    if (isWithdrawal) {
      _itemData.date = item['일자'];
      _itemData.type = 'withdrawal';
      _itemData.currency = 'KRW';
      _itemData.quantity = 1;
      _itemData.price = Number(item['거래대금']);
      _itemData.usdDeposit = _usdDeposit + _usdRp;
      _itemData.krwDeposit = _krwDeposit + _krwIpoDeposit;
    }

    // 국내주식 매수, 매도 데이터 대입
    const isKrStockBuy = ['계좌대체입고', '장내_매수', '공모주입고'].some(
      (keyword) => item['구분'].endsWith(keyword)
    );
    const isKrStockSell = ['장내_매도', '코스닥_매도'].some((keyword) =>
      item['구분'].endsWith(keyword)
    );

    if (isKrStockBuy) {
      _itemData.date = item['일자'];
      _itemData.type = 'buy';
      _itemData.currency = 'KRW';
      _itemData.ISIN = item['종목번호'];
      _itemData.quantity = Number(item['수량']);
      _itemData.price = Number(item['가격']);
      _itemData.usdDeposit = _usdDeposit + _usdRp;
      _itemData.krwDeposit = _krwDeposit + _krwIpoDeposit;
    }
    if (isKrStockSell) {
      _itemData.date = item['일자'];
      _itemData.type = 'sell';
      _itemData.currency = 'KRW';
      _itemData.ISIN = item['종목번호'];
      _itemData.quantity = Number(item['수량']);
      _itemData.price = Number(item['가격']);
      _itemData.usdDeposit = _usdDeposit + _usdRp;
      _itemData.krwDeposit = _krwDeposit + _krwIpoDeposit;
    }

    // 해외주식 매수, 매도 데이터 대입
    const isUsStockBuy = ['해외증권_해외주식매수', '타사대체입고'].some(
      (keyword) => item['구분'].endsWith(keyword)
    );
    const isUsStockSell = ['해외증권해외주식매도'].some((keyword) =>
      item['구분'].endsWith(keyword)
    );

    if (isUsStockBuy) {
      _itemData.date = item['일자'];
      _itemData.type = 'buy';
      _itemData.currency = 'USD';
      _itemData.ISIN = item['종목번호'];
      _itemData.quantity = Number(item['수량']);
      _itemData.price = Number(item['가격']);
      _itemData.usdDeposit = _usdDeposit + _usdRp;
      _itemData.krwDeposit = _krwDeposit + _krwIpoDeposit;
    }
    if (isUsStockSell) {
      _itemData.date = item['일자'];
      _itemData.type = 'sell';
      _itemData.currency = 'USD';
      _itemData.ISIN = item['종목번호'];
      _itemData.quantity = Number(item['수량']);
      _itemData.price = Number(item['가격']);
      _itemData.usdDeposit = _usdDeposit + _usdRp;
      _itemData.krwDeposit = _krwDeposit + _krwIpoDeposit;
    }

    // 해외주식 배당금 데이터 대입
    if (item['구분'] === '해외배당금') {
      _itemData.date = item['일자'];
      _itemData.type = 'dividend';
      _itemData.currency = 'USD';
      _itemData.quantity = 1;
      _itemData.price = Number(item['거래대금']);
      _itemData.usdDeposit = _usdDeposit + _usdRp;
      _itemData.krwDeposit = _krwDeposit + _krwIpoDeposit;
    }

    // 국내주식 배당금 데이터 대입
    if (item['구분'] === '배당금') {
      _itemData.date = item['일자'];
      _itemData.type = 'dividend';
      _itemData.currency = 'KRW';
      _itemData.quantity = 1;
      _itemData.price = Number(item['거래대금']);
      _itemData.usdDeposit = _usdDeposit + _usdRp;
      _itemData.krwDeposit = _krwDeposit + _krwIpoDeposit;
    }

    // 타사대체입고 데이터 대입(buy 및 deposit 두 곳 추가)
    if (item['구분'] === '타사대체입고') {
      _itemData.date = item['일자'];
      _itemData.type = 'buy';
      _itemData.currency = 'USD';
      _itemData.ISIN = item['종목번호'];
      _itemData.quantity = Number(item['수량']);
      _itemData.price = Number(item['가격']);
      _itemData.usdDeposit = _usdDeposit + _usdRp;
      _itemData.krwDeposit = _krwDeposit + _krwIpoDeposit;
    }
    if (item['구분'] === '타사대체입고') {
      _itemData.date = item['일자'];
      _itemData.type = 'deposit';
      _itemData.currency = 'USD';
      _itemData.ISIN = item['종목번호'];
      _itemData.quantity = Number(item['수량']);
      _itemData.price = Number(item['가격']);
      _itemData.usdDeposit = _usdDeposit + _usdRp;
      _itemData.krwDeposit = _krwDeposit + _krwIpoDeposit;
    }

    // 외화입금 데이터 대입
    if (item['구분'] === '은행이체외화입금') {
      _itemData.date = item['일자'];
      _itemData.type = 'deposit';
      _itemData.currency = 'USD';
      _itemData.quantity = 1;
      _itemData.price = Number(item['거래대금']);
      _itemData.usdDeposit = _usdDeposit + _usdRp;
      _itemData.krwDeposit = _krwDeposit + _krwIpoDeposit;
    }

    return { ..._itemData };
  });

  return newJson.filter((item) => item.date !== ''); // 빈 데이터 제거
};
