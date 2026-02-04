import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, type IChartApi, type CandlestickData, type HistogramData, type Time } from 'lightweight-charts';
import type { CandleData, ChartPeriod } from '../../types/investment';
import './CandleChart.css';

const PERIOD_LABELS: Record<ChartPeriod, string> = {
    '1D': '1일',
    '1W': '1주',
    '3M': '3달',
    '1Y': '1년',
};

const PERIOD_ORDER: ChartPeriod[] = ['1D', '1W', '3M', '1Y'];

interface CandleChartProps {
    candles: CandleData[];
    period: ChartPeriod;
    onPeriodChange: (period: ChartPeriod) => void;
}

export const CandleChart = ({ candles, period, onPeriodChange }: CandleChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!containerRef.current || candles.length === 0) return;

        // 이전 차트 제거
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        const chart = createChart(containerRef.current, {
            layout: {
                background: { color: '#ffffff' },
                textColor: '#888',
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: '#f0f0f0' },
                horzLines: { color: '#f0f0f0' },
            },
            width: containerRef.current.clientWidth,
            height: 360,
            crosshair: { mode: 0 },
            timeScale: { borderColor: '#e0e0e0' },
            rightPriceScale: { borderColor: '#e0e0e0' },
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#DC0000',
            downColor: '#0046B4',
            borderUpColor: '#DC0000',
            borderDownColor: '#0046B4',
            wickUpColor: '#DC0000',
            wickDownColor: '#0046B4',
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });

        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });

        // 시간순 정렬 및 중복 제거
        const sortedCandles = [...candles]
            .map((c) => ({ ...c, timestamp: new Date(c.candleTime).getTime() / 1000 }))
            .sort((a, b) => a.timestamp - b.timestamp);

        // 중복 시간 제거 (같은 시간이면 마지막 데이터만 유지)
        const uniqueCandles = sortedCandles.filter(
            (c, i, arr) => i === arr.length - 1 || c.timestamp !== arr[i + 1].timestamp
        );

        const candleData: CandlestickData[] = uniqueCandles.map((c) => ({
            time: c.timestamp as Time,
            open: c.openPrice,
            high: c.highPrice,
            low: c.lowPrice,
            close: c.closePrice,
        }));

        const volumeData: HistogramData[] = uniqueCandles.map((c) => ({
            time: c.timestamp as Time,
            value: c.volume,
            color: c.closePrice >= c.openPrice ? 'rgba(220, 0, 0, 0.3)' : 'rgba(0, 70, 180, 0.3)',
        }));

        candleSeries.setData(candleData);
        volumeSeries.setData(volumeData);
        chart.timeScale().fitContent();

        chartRef.current = chart;

        const handleResize = () => {
            if (containerRef.current) {
                chart.applyOptions({ width: containerRef.current.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
        };
    }, [candles]);

    return (
        <div className="candle-chart">
            <div className="candle-chart__tabs">
                {PERIOD_ORDER.map((p) => (
                    <button
                        key={p}
                        type="button"
                        className={`candle-chart__tab ${period === p ? 'candle-chart__tab--active' : ''}`}
                        onClick={() => onPeriodChange(p)}
                    >
                        {PERIOD_LABELS[p]}
                    </button>
                ))}
            </div>
            {candles.length === 0 ? (
                <div className="candle-chart__empty">차트 데이터가 없습니다</div>
            ) : (
                <div className="candle-chart__container" ref={containerRef} />
            )}
        </div>
    );
};
