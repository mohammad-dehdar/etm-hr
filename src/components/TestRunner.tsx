'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { getLikertScale } from '@/lib/scoreTest'

interface Question {
  id: string
  text: string
  type: 'likert' | 'multiple_choice' | 'text'
  options?: Array<{
    value: string | number
    label: string
    score?: number
  }>
  dimension?: string
  reverse?: boolean
}

interface TestPage {
  title: string
  questions: Question[]
}

interface TestConfig {
  title: string
  disclaimer: string
  pages: TestPage[]
  dimensions: Record<string, {
    name: string
    description?: string
  }>
  scoring: {
    bands: Array<{
      name: string
      min: number
      max: number
      color?: string
    }>
  }
}

interface TestRunnerProps {
  test: {
    id: string
    title: string
    description?: string
    config: TestConfig
  }
  onComplete: (answers: Record<string, any>) => void
  onCancel: () => void
}

export function TestRunner({ test, onComplete, onCancel }: TestRunnerProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentPage = test.config.pages[currentPageIndex]
  const totalPages = test.config.pages.length
  const totalQuestions = test.config.pages.reduce((acc, page) => acc + page.questions.length, 0)
  const answeredQuestions = Object.keys(answers).length

  useEffect(() => {
    // Auto-save answers to localStorage
    const savedAnswers = localStorage.getItem(`test-${test.id}-answers`)
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers))
      } catch (error) {
        console.error('Error parsing saved answers:', error)
      }
    }
  }, [test.id])

  const saveAnswers = (newAnswers: Record<string, any>) => {
    setAnswers(newAnswers)
    localStorage.setItem(`test-${test.id}-answers`, JSON.stringify(newAnswers))
  }

  const handleAnswerChange = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value }
    saveAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onComplete(answers)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    // Check if all questions on current page are answered
    return currentPage.questions.every(q => answers[q.id] !== undefined && answers[q.id] !== '')
  }

  const progressPercentage = (answeredQuestions / totalQuestions) * 100

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{test.config.title}</CardTitle>
              {test.description && (
                <CardDescription className="mt-2">{test.description}</CardDescription>
              )}
            </div>
            <Button variant="ghost" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 ml-2" />
              بازگشت
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>پیشرفت: {answeredQuestions} از {totalQuestions} سوال</span>
              <span>صفحه {currentPageIndex + 1} از {totalPages}</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        </CardHeader>
      </Card>

      {/* Disclaimer */}
      {currentPageIndex === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-2">توجه</h3>
                <p className="text-sm text-amber-700">{test.config.disclaimer}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Page */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{currentPage.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentPage.questions.map((question, index) => {
            const questionNumber = test.config.pages
              .slice(0, currentPageIndex)
              .reduce((acc, page) => acc + page.questions.length, 0) + index + 1

            return (
              <div key={question.id} className="test-question">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">
                    {questionNumber}. {question.text}
                  </h3>
                  {question.dimension && (
                    <Badge variant="outline" className="text-xs">
                      {test.config.dimensions[question.dimension]?.name || question.dimension}
                    </Badge>
                  )}
                </div>

                {question.type === 'likert' && question.options && (
                  <div className="likert-scale">
                    {question.options.map((option) => (
                      <div
                        key={option.value}
                        className={`likert-option ${
                          answers[question.id] === option.value ? 'selected' : ''
                        }`}
                        onClick={() => handleAnswerChange(question.id, option.value)}
                      >
                        <div className="text-center">
                          <div className="font-medium text-sm mb-1">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {question.type === 'multiple_choice' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer p-3 rounded-lg hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option.value}
                          checked={answers[question.id] === option.value}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'text' && (
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="پاسخ خود را اینجا بنویسید..."
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {currentPageIndex > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowRight className="w-4 h-4 ml-2" />
                  قبلی
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {currentPageIndex < totalPages - 1 ? (
                <Button 
                  onClick={handleNext} 
                  disabled={!canProceed()}
                >
                  بعدی
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={!canProceed() || isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    'در حال ارسال...'
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 ml-2" />
                      تکمیل تست
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {!canProceed() && (
            <p className="text-sm text-amber-600 mt-2 text-center">
              لطفاً همه سوالات این صفحه را پاسخ دهید
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}