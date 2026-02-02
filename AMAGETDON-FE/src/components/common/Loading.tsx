import './Loading.css';

interface LoadingProps {
    fullScreen?: boolean;
    size?: 'small' | 'medium' | 'large';
}

/**
 * 로딩 컴포넌트
 */
export const Loading = ({ fullScreen = false, size = 'medium' }: LoadingProps) => {
    if (fullScreen) {
        return (
            <div className="loading-fullscreen">
                <div className={`loading-spinner loading-spinner-${size}`} />
            </div>
        );
    }

    return <div className={`loading-spinner loading-spinner-${size}`} />;
};