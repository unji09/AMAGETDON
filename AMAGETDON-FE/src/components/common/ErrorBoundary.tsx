import { Component} from 'react';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * 에러 바운더리 컴포넌트
 * 자식 컴포넌트에서 발생한 에러를 캐치
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
        });
        window.location.href = '/';
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        padding: '20px',
                        textAlign: 'center',
                    }}
                >
                    <h1 style={{ fontSize: '48px', marginBottom: '16px', color: '#DC0000' }}>
                        오류가 발생했습니다
                    </h1>
                    <p style={{ fontSize: '18px', marginBottom: '8px', color: '#666' }}>
                        예상치 못한 오류가 발생했습니다.
                    </p>
                    <p style={{ fontSize: '14px', marginBottom: '32px', color: '#999' }}>
                        {this.state.error?.message}
                    </p>
                    <button
                        onClick={this.handleReset}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            backgroundColor: '#203C2E',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}