export const formatWon = (value: number): string =>
    value.toLocaleString('ko-KR') + '원';

export const formatRate = (rate: number): string => {
    const pct = (rate * 100).toFixed(2);
    return rate >= 0 ? `+${pct}%` : `${pct}%`;
};

export const formatVolume = (vol: number): string =>
    vol.toLocaleString('ko-KR');

export const formatPrice = (price: string | number): string =>
    Number(price).toLocaleString('ko-KR') + '원';

// 시가총액 포맷 (API에서 억원 단위로 전달됨)
export const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 10000) {
        // 1조 이상: 조 단위로 표시
        const trillion = marketCap / 10000;
        return trillion >= 10
            ? `${Math.round(trillion).toLocaleString('ko-KR')}조`
            : `${trillion.toFixed(1)}조`;
    }
    // 1조 미만: 억 단위로 표시
    return `${marketCap.toLocaleString('ko-KR')}억`;
};

// PER 포맷 (음수 가능)
export const formatPER = (per: number): string => {
    if (per === 0 || !isFinite(per)) return 'N/A';
    return per.toFixed(2);
};

// PBR 포맷
export const formatPBR = (pbr: number): string => {
    if (pbr === 0 || !isFinite(pbr)) return 'N/A';
    return pbr.toFixed(2);
};
