import './Container.css';

interface ContainerProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * 전체 컨테이너 (max-width: 1920px)
 */
export const Container = ({ children, className = '' }: ContainerProps) => {
    return (
        <div className={`container ${className}`}>
            {children}
        </div>
    );
};

interface ContainerContentProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * 콘텐츠 컨테이너 (max-width: 1200px)
 */
export const ContainerContent = ({ children, className = '' }: ContainerContentProps) => {
    return (
        <div className={`container-content ${className}`}>
            {children}
        </div>
    );
};