import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
    if (totalPages <= 1) return null;

    const getPages = (): (number | '...')[] => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 7) {
            for (let i = 0; i < totalPages; i++) pages.push(i);
            return pages;
        }
        pages.push(0);
        if (currentPage > 3) pages.push('...');
        const start = Math.max(1, currentPage - 1);
        const end = Math.min(totalPages - 2, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 4) pages.push('...');
        pages.push(totalPages - 1);
        return pages;
    };

    return (
        <div className="pagination">
            <button
                className="pagination__btn"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
            >
                <ChevronLeft size={16} />
            </button>
            {getPages().map((p, i) =>
                p === '...' ? (
                    <span key={`dots-${i}`} className="pagination__dots">...</span>
                ) : (
                    <button
                        key={p}
                        className={`pagination__btn pagination__btn--page ${p === currentPage ? 'pagination__btn--active' : ''}`}
                        onClick={() => onPageChange(p)}
                    >
                        {p + 1}
                    </button>
                )
            )}
            <button
                className="pagination__btn"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
};
