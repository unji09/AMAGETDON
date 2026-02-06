import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSurvey } from '../hooks/useSurvey'
import { submitSurvey } from '../../../api/surveyApi.ts'
import { INVESTMENT_TYPE_CONFIG } from '@/constants/investmentType'
import type { InvestmentResult } from '../types'
import './SurveyForm.css'

const ErrorIcon = () => (
    <svg className="survey-error-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
)

const LoadingSpinner = () => (
    <div className="survey-loading">
        <div className="survey-spinner" />
        <p>설문을 불러오는 중...</p>
    </div>
)

interface ResultModalProps {
    result: InvestmentResult
    onConfirm: () => void
}

const ResultModal = ({ result, onConfirm }: ResultModalProps) => (
    <div className="survey-result-overlay">
        <div className="survey-result-modal">
            <div className={`survey-result-icon survey-result-icon--${result.type}`}>
                {INVESTMENT_TYPE_CONFIG[result.type].icon}
            </div>
            <h2 className="survey-result-title">투자 성향 분석 완료</h2>
            <div className={`survey-result-type survey-result-type--${result.type}`}>
                {result.label}
            </div>
            <p className="survey-result-description">{result.description}</p>
            <button
                type="button"
                className="survey-result-btn"
                onClick={onConfirm}
            >
                확인
            </button>
        </div>
    </div>
)

export const SurveyForm = () => {
    const navigate = useNavigate()
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [showResult, setShowResult] = useState(false)
    const [investmentResult, setInvestmentResult] = useState<InvestmentResult | null>(null)

    const {
        loading,
        error: loadError,
        currentIndex,
        currentQuestion,
        totalQuestions,
        progress,
        selectedAnswer,
        isCompleted,
        answerOptions,
        handleSelectAnswer,
        handleNext,
        calculateScore,
        getInvestmentResult,
    } = useSurvey()

    const handleSubmit = async () => {
        if (!isCompleted) {
            handleNext()
            return
        }

        setSubmitError(null)
        setSubmitting(true)

        try {
            const score = calculateScore()
            // 백엔드에서 InvestmentType 반환
            const response = await submitSurvey({ score })
            const result = getInvestmentResult(response.data)
            setInvestmentResult(result)
            setShowResult(true)
        } catch {
            setSubmitError('설문 제출에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleResultConfirm = () => {
        setShowResult(false)
        navigate('/', { replace: true })
    }

    if (loading) {
        return (
            <div className="survey-container">
                <LoadingSpinner />
            </div>
        )
    }

    if (loadError || !currentQuestion) {
        return (
            <div className="survey-container">
                <div className="survey-error-container">
                    <ErrorIcon />
                    <p>{loadError || '설문을 불러올 수 없습니다.'}</p>
                    <button
                        type="button"
                        className="survey-retry-btn"
                        onClick={() => window.location.reload()}
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        )
    }

    const isLastQuestion = currentIndex === totalQuestions - 1

    return (
        <div className="survey-container">
            {showResult && investmentResult && (
                <ResultModal result={investmentResult} onConfirm={handleResultConfirm} />
            )}

            <div className="survey-header">

                <h1 className="survey-title">투자 성향 설문조사</h1>
                <p className="survey-description">
                    몇 가지 질문을 통해 회원님의 투자 성향을 파악합니다.
                </p>
            </div>

            <div className="survey-card">
                <div className="survey-progress-header">
                    <span className="survey-progress-text">
                        질문 {currentIndex + 1} / {totalQuestions}
                    </span>
                    <span className="survey-progress-percent">{progress}%</span>
                </div>

                <div className="survey-progress-bar">
                    <div
                        className="survey-progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="survey-question-card">
                    <span className="survey-question-number">Q{currentIndex + 1}</span>
                    <p className="survey-question-text">{currentQuestion.questionText}</p>
                </div>

                <div className="survey-options">
                    {answerOptions.map((option, index) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`survey-option ${selectedAnswer === option.value ? 'selected' : ''}`}
                            onClick={() => handleSelectAnswer(option.value)}
                        >
                            <span className="survey-option-number">{index + 1}</span>
                            <span className="survey-option-radio">
                                {selectedAnswer === option.value && (
                                    <span className="survey-option-radio-dot" />
                                )}
                            </span>
                            <span className="survey-option-label">{option.label}</span>
                        </button>
                    ))}
                </div>

                {submitError && (
                    <div className="survey-error-box">
                        <ErrorIcon />
                        <span>{submitError}</span>
                    </div>
                )}

                <button
                    type="button"
                    className="survey-next-btn"
                    disabled={selectedAnswer === null || submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? '제출 중...' : isLastQuestion ? '설문 완료' : '다음 질문'}
                </button>
            </div>

            <p className="survey-footer-text">
                정확한 투자 성향 분석을 위해 솔직하게 답변해 주세요.
            </p>
        </div>
    )
}
