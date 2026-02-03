import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchStocks } from '@/api/investmentApi';
import type { StockSearchItem } from '../../types/investment';
import './InvestmentSearch.css';

export const InvestmentSearch = () => {
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState<StockSearchItem[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const navigate = useNavigate();

    const handleSearch = useCallback(async (value: string) => {
        if (value.length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }
        try {
            const data = await searchStocks(value);
            setResults(data);
            setShowDropdown(data.length > 0);
        } catch {
            setResults([]);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setKeyword(value);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => handleSearch(value), 300);
    };

    const handleSelect = (stockCode: string) => {
        setShowDropdown(false);
        setKeyword('');
        navigate(`/investment/${stockCode}`);
    };

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="investment-search" ref={wrapperRef}>
            <div className="investment-search__input-wrapper">
                <Search size={18} className="investment-search__icon" />
                <input
                    type="text"
                    className="investment-search__input"
                    placeholder="종목명을 검색하세요"
                    value={keyword}
                    onChange={handleChange}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                />
            </div>
            {showDropdown && (
                <ul className="investment-search__dropdown">
                    {results.map((item) => (
                        <li key={item.stockCode}>
                            <button
                                type="button"
                                className="investment-search__dropdown-item"
                                onClick={() => handleSelect(item.stockCode)}
                            >
                                <span className="investment-search__dropdown-name">{item.stockName}</span>
                                <span className="investment-search__dropdown-code">{item.stockCode}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
