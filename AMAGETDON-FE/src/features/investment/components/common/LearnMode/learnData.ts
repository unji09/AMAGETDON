export interface LearnItem {
    id: string;
    title: string;
    description: string;
    tip?: string;
}

export const LEARN_DATA: Record<string, LearnItem> = {
    // 대시보드
    'portfolio-card': {
        id: 'portfolio-card',
        title: '포트폴리오 총 자산',
        description: '현재 보유한 모든 자산의 합계입니다. 예수금(현금)과 주식 평가금액을 더한 값이에요.',
        tip: '수익률이 빨간색이면 수익, 파란색이면 손실을 의미해요.',
    },
    'popular-stocks': {
        id: 'popular-stocks',
        title: '실시간 인기 종목',
        description: '현재 거래량이 가장 많은 종목들이에요. 많은 투자자들이 관심을 가지고 있다는 뜻이죠.',
        tip: '거래량이 많다고 좋은 종목은 아니에요. 참고 지표로만 활용하세요!',
    },
    'my-holdings': {
        id: 'my-holdings',
        title: '내 종목',
        description: '현재 보유 중인 주식 목록이에요. 각 종목의 수익률과 평가금액을 확인할 수 있어요.',
        tip: '하트를 눌러 관심 종목에 추가하면 더 쉽게 모니터링할 수 있어요.',
    },
    'watchlist': {
        id: 'watchlist',
        title: '관심 종목',
        description: '내가 관심있게 지켜보고 있는 종목들이에요. 매수하기 전에 추이를 살펴보세요.',
        tip: '관심 종목은 언제든 추가/삭제할 수 있어요.',
    },
    'recent-transactions': {
        id: 'recent-transactions',
        title: '최근 거래 내역',
        description: '최근에 체결된 매수/매도 거래 내역이에요.',
        tip: '매수는 빨간색, 매도는 파란색으로 표시돼요.',
    },

    // 종목 상세
    'stock-header': {
        id: 'stock-header',
        title: '종목 정보',
        description: '선택한 종목의 기본 정보예요. 현재가, 등락률, 거래량 등을 확인할 수 있어요.',
        tip: 'KOSPI는 대형주 중심, KOSDAQ은 기술주/중소형주 중심의 시장이에요.',
    },
    'candle-chart': {
        id: 'candle-chart',
        title: '캔들 차트',
        description: '주가의 흐름을 보여주는 차트예요. 빨간 봉은 상승, 파란 봉은 하락을 의미해요.',
        tip: '캔들의 몸통은 시가와 종가, 꼬리는 고가와 저가를 나타내요.',
    },
    'trading-panel': {
        id: 'trading-panel',
        title: '매매 패널',
        description: '주식을 사고 팔 수 있는 곳이에요. 수량을 입력하고 매수/매도 버튼을 눌러보세요.',
        tip: '비율 버튼(10%, 25%, 50%, 최대)을 활용하면 편리해요.',
    },

    // 매매 관련
    'buy-button': {
        id: 'buy-button',
        title: '매수 (사기)',
        description: '주식을 구매하는 거예요. 주가가 오르면 수익이 나요.',
        tip: '한 번에 모든 금액을 투자하지 말고 분할 매수를 추천해요!',
    },
    'sell-button': {
        id: 'sell-button',
        title: '매도 (팔기)',
        description: '보유한 주식을 판매하는 거예요. 매수가보다 높은 가격에 팔면 수익이에요.',
        tip: '손절도 투자의 일부예요. 욕심내지 마세요!',
    },
    'order-quantity': {
        id: 'order-quantity',
        title: '주문 수량',
        description: '매수하거나 매도할 주식의 개수예요.',
        tip: '주문가능금액을 확인하고 적절한 수량을 입력하세요.',
    },
    'order-total': {
        id: 'order-total',
        title: '주문 총액',
        description: '현재가 × 수량으로 계산된 총 주문 금액이에요.',
        tip: '실제 체결 시 시장가에 따라 금액이 달라질 수 있어요.',
    },
};
