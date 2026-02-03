import { useState, useEffect } from 'react'
import { getSurveys } from '../../../api/surveyApi.ts'
import type { SurveyQuestion, SurveyAnswer, InvestmentResult, InvestmentType } from '../types'

const ANSWER_OPTIONS: SurveyAnswer[] = [
    { value: 4, label: '매우 그렇다' },
    { value: 3, label: '그렇다' },
    { value: 2, label: '그렇지 않다' },
    { value: 1, label: '전혀 그렇지 않다' },
]

const INVESTMENT_RESULTS: Record<InvestmentType, InvestmentResult> = {
    AGGRESSIVE: {
        type: 'AGGRESSIVE',
        label: '공격형',
        description: '높은 수익을 위해 높은 위험을 감수할 수 있는 투자 성향입니다.',
    },
    NEUTRAL: {
        type: 'NEUTRAL',
        label: '중립형',
        description: '적절한 위험과 수익의 균형을 추구하는 투자 성향입니다.',
    },
    STABLE: {
        type: 'STABLE',
        label: '안정형',
        description: '안정적인 수익을 우선시하며 위험을 최소화하는 투자 성향입니다.',
    },
}

export const useSurvey = () => {
    const [questions, setQuestions] = useState<SurveyQuestion[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, number>>({})
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [isCompleted, setIsCompleted] = useState(false)

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                setLoading(true)
                setError(null)
                const response = await getSurveys()
                // 백엔드: List<Survey> 배열 직접 반환
                setQuestions(response.data)
            } catch {
                setError('설문 질문을 불러오는데 실패했습니다.')
            } finally {
                setLoading(false)
            }
        }
        fetchQuestions()
    }, [])

    const totalQuestions = questions.length
    const currentQuestion = questions[currentIndex]
    const progress = totalQuestions > 0
        ? Math.round(((currentIndex + 1) / totalQuestions) * 100)
        : 0

    const handleSelectAnswer = (value: number) => {
        setSelectedAnswer(value)
    }

    const handleNext = () => {
        if (selectedAnswer === null || !currentQuestion) return

        const newAnswers = { ...answers, [currentQuestion.questionId]: selectedAnswer }
        setAnswers(newAnswers)

        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(prev => prev + 1)
            setSelectedAnswer(null)
        } else {
            setIsCompleted(true)
        }
    }

    const calculateScore = (): number => {
        return Object.values(answers).reduce((sum, val) => sum + val, 0)
    }

    const getInvestmentResult = (type: InvestmentType): InvestmentResult => {
        return INVESTMENT_RESULTS[type]
    }

    return {
        questions,
        loading,
        error,
        currentIndex,
        currentQuestion,
        totalQuestions,
        progress,
        selectedAnswer,
        isCompleted,
        answers,
        answerOptions: ANSWER_OPTIONS,
        handleSelectAnswer,
        handleNext,
        calculateScore,
        getInvestmentResult,
    }
}
