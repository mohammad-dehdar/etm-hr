import { z } from 'zod'

// Test configuration schema
export const TestConfigSchema = z.object({
  pages: z.array(z.object({
    questions: z.array(z.object({
      id: z.string(),
      text: z.string(),
      type: z.enum(['likert', 'multiple_choice', 'text']),
      options: z.array(z.object({
        value: z.union([z.string(), z.number()]),
        label: z.string(),
        score: z.number().optional()
      })).optional(),
      dimension: z.string().optional(),
      reverse: z.boolean().default(false),
      reverseMax: z.number().optional()
    }))
  })),
  dimensions: z.record(z.object({
    name: z.string(),
    description: z.string().optional(),
    weights: z.record(z.string(), z.number()).optional()
  })),
  scoring: z.object({
    bands: z.array(z.object({
      name: z.string(),
      min: z.number(),
      max: z.number(),
      color: z.string().optional()
    })).optional()
  })
})

export type TestConfig = z.infer<typeof TestConfigSchema>

export interface ScoreResult {
  dimensions: Record<string, {
    score: number
    normalized: number
    band?: string
    color?: string
  }>
  overall: {
    score: number
    band?: string
    color?: string
  }
  details: {
    questions: Array<{
      id: string
      dimension?: string
      originalScore: number
      finalScore: number
      reverse: boolean
    }>
  }
}

/**
 * Score a psychology test based on the configuration
 * @param config - Test configuration with pages, questions, dimensions, and scoring rules
 * @param answers - User answers keyed by question ID
 * @returns ScoreResult with dimension scores, overall score, and details
 */
export function scoreTest(config: TestConfig, answers: Record<string, any>): ScoreResult {
  const dimensionScores: Record<string, number[]> = {}
  const questionScores: ScoreResult['details']['questions'] = []

  // Process each page and question
  for (const page of config.pages) {
    for (const question of page.questions) {
      const answer = answers[question.id]
      if (answer === undefined || answer === null) continue

      let originalScore = 0

      // Calculate original score based on question type
      if (question.type === 'likert' || question.type === 'multiple_choice') {
        if (question.options) {
          const option = question.options.find(opt => opt.value === answer)
          originalScore = option?.score ?? 0
        }
      } else if (question.type === 'text') {
        // For text questions, you might have predefined scoring rules
        // For now, we'll assume they don't contribute to scoring
        continue
      }

      // Apply reverse scoring if needed
      let finalScore = originalScore
      if (question.reverse) {
        const max = question.reverseMax || Math.max(...(question.options?.map(opt => opt.score || 0) || [0]))
        finalScore = max - originalScore
      }

      questionScores.push({
        id: question.id,
        dimension: question.dimension,
        originalScore,
        finalScore,
        reverse: question.reverse
      })

      // Add to dimension score if dimension is specified
      if (question.dimension) {
        if (!dimensionScores[question.dimension]) {
          dimensionScores[question.dimension] = []
        }
        dimensionScores[question.dimension].push(finalScore)
      }
    }
  }

  // Calculate dimension scores (sums)
  const dimensionResults: Record<string, ScoreResult['dimensions'][string]> = {}
  for (const [dimension, scores] of Object.entries(dimensionScores)) {
    const sum = scores.reduce((a, b) => a + b, 0)
    const max = scores.length * 5 // Assuming 5-point Likert scale
    const normalized = max > 0 ? (sum / max) * 100 : 0

    let band: string | undefined
    let color: string | undefined

    // Determine band based on normalized score
    if (config.scoring.bands) {
      const bandConfig = config.scoring.bands.find(b => normalized >= b.min && normalized <= b.max)
      if (bandConfig) {
        band = bandConfig.name
        color = bandConfig.color
      }
    }

    dimensionResults[dimension] = {
      score: sum,
      normalized,
      band,
      color
    }
  }

  // Calculate overall score (average of all dimension scores)
  const overallScore = Object.values(dimensionResults).reduce((sum, dim) => sum + dim.normalized, 0)
  const overallNormalized = Object.keys(dimensionResults).length > 0 
    ? overallScore / Object.keys(dimensionResults).length 
    : 0

  let overallBand: string | undefined
  let overallColor: string | undefined
  if (config.scoring.bands) {
    const bandConfig = config.scoring.bands.find(b => overallNormalized >= b.min && overallNormalized <= b.max)
    if (bandConfig) {
      overallBand = bandConfig.name
      overallColor = bandConfig.color
    }
  }

  return {
    dimensions: dimensionResults,
    overall: {
      score: overallScore,
      normalized: overallNormalized,
      band: overallBand,
      color: overallColor
    },
    details: {
      questions: questionScores
    }
  }
}

/**
 * Get the default Likert scale options (1-5 with labels)
 */
export function getLikertScale() {
  return [
    { value: 1, label: 'Strongly Disagree', score: 1 },
    { value: 2, label: 'Disagree', score: 2 },
    { value: 3, label: 'Neutral', score: 3 },
    { value: 4, label: 'Agree', score: 4 },
    { value: 5, label: 'Strongly Agree', score: 5 }
  ]
}