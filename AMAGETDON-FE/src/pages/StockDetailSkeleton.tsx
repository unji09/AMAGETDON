import './StockDetailSkeleton.css';

/**
 * 투자 상세 페이지 스켈레톤 로딩 UI
 */
export const StockDetailSkeleton = () => {
    return (
        <>
            <div className="stock-detail-skeleton__header">
                <div className="stock-detail-skeleton__badge" />
                <div className="stock-detail-skeleton__toggle" />
            </div>
            <div className="stock-detail-skeleton__info">
                <div className="stock-detail-skeleton__title" />
                <div className="stock-detail-skeleton__price" />
            </div>
            <div className="stock-detail-skeleton__grid">
                <div className="stock-detail-skeleton__chart" />
                <div className="stock-detail-skeleton__panel" />
            </div>
        </>
    );
};
