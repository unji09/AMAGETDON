import { useState, useRef, useEffect } from 'react';
import './Dropdown.css';

interface DropdownOption {
    value: string;
    label: string;
}

interface DropdownProps {
    options: DropdownOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

/**
 * 드롭다운 컴포넌트
 */
export const Dropdown = ({
                             options,
                             value,
                             onChange,
                             placeholder = '선택하세요',
                             disabled = false,
                         }: DropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`dropdown ${disabled ? 'dropdown-disabled' : ''}`} ref={dropdownRef}>
            <button
                type="button"
                className="dropdown-button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
        <span className="dropdown-button-text">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
                <span className={`dropdown-arrow ${isOpen ? 'dropdown-arrow-open' : ''}`}>
          ▼
        </span>
            </button>

            {isOpen && (
                <div className="dropdown-menu">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`dropdown-item ${
                                option.value === value ? 'dropdown-item-selected' : ''
                            }`}
                            onClick={() => handleSelect(option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};