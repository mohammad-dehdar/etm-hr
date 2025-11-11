import { scoreTest } from '@/lib/scoreTest'

// Mock test configuration
const mockTestConfig = {
  pages: [
    {
      questions: [
        {
          id: 'q1',
          text: 'I prefer working in teams',
          type: 'likert' as const,
          dimension: 'teamwork',
          options: [
            { value: 1, label: 'Strongly Disagree', score: 1 },
            { value: 2, label: 'Disagree', score: 2 },
            { value: 3, label: 'Neutral', score: 3 },
            { value: 4, label: 'Agree', score: 4 },
            { value: 5, label: 'Strongly Agree', score: 5 }
          ]
        },
        {
          id: 'q2',
          text: 'I work better alone',
          type: 'likert' as const,
          dimension: 'teamwork',
          reverse: true,
          options: [
            { value: 1, label: 'Strongly Disagree', score: 5 },
            { value: 2, label: 'Disagree', score: 4 },
            { value: 3, label: 'Neutral', score: 3 },
            { value: 4, label: 'Agree', score: 2 },
            { value: 5, label: 'Strongly Agree', score: 1 }
          ]
        }
      ]
    }
  ],
  dimensions: {
    teamwork: {
      name: 'Teamwork',
      description: 'Ability to work effectively in teams'
    }
  },
  scoring: {
    bands: [
      { name: 'Low', min: 0, max: 40, color: '#ef4444' },
      { name: 'Medium', min: 41, max: 70, color: '#f59e0b' },
      { name: 'High', min: 71, max: 100, color: '#10b981' }
    ]
  }
}

describe('scoreTest', () => {
  it('should calculate scores correctly for basic likert responses', () => {
    const answers = {
      q1: 4, // Agree
      q2: 2  // Disagree (reversed, so should count as 4)
    }

    const result = scoreTest(mockTestConfig, answers)

    expect(result.dimensions.teamwork.score).toBe(8) // 4 + 4
    expect(result.dimensions.teamwork.normalized).toBe(80) // 8/10 * 100
    expect(result.dimensions.teamwork.band).toBe('High')
  })

  it('should handle missing answers', () => {
    const answers = {
      q1: 5 // Only answer q1
    }

    const result = scoreTest(mockTestConfig, answers)

    expect(result.dimensions.teamwork.score).toBe(5)
    expect(result.dimensions.teamwork.normalized).toBe(50)
    expect(result.dimensions.teamwork.band).toBe('Medium')
  })

  it('should handle empty answers', () => {
    const answers = {}

    const result = scoreTest(mockTestConfig, answers)

    expect(result.dimensions.teamwork.score).toBe(0)
    expect(result.dimensions.teamwork.normalized).toBe(0)
    expect(result.overall.score).toBe(0)
    expect(result.overall.normalized).toBe(0)
  })
})