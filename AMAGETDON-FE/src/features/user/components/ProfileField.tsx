import type { ReactNode, InputHTMLAttributes } from 'react'

interface ProfileFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    icon: ReactNode
    label: string
    rightLabel?: string
    inputWrapper?: ReactNode
}

export const ProfileField = ({
    icon,
    label,
    rightLabel,
    inputWrapper,
    ...inputProps
}: ProfileFieldProps) => {
    return (
        <div className="myinfo-field">
            {rightLabel ? (
                <div className="myinfo-field-label-row">
                    <span className="myinfo-field-label-left">
                        {icon}
                        {label}
                    </span>
                    <span className="myinfo-readonly-badge">{rightLabel}</span>
                </div>
            ) : (
                <label className="myinfo-field-label">
                    {icon}
                    {label}
                </label>
            )}
            {inputWrapper ?? (
                <input className="myinfo-input" {...inputProps} />
            )}
        </div>
    )
}
