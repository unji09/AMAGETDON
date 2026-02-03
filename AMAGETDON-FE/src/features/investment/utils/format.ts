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
