import { calculateProfileCompletion } from '@/lib/profile-completion'

const mockProfile = {
  id: '1',
  userId: '1',
  firstName: 'John',
  lastName: 'Doe',
  nationalId: '1234567890',
  birthDate: new Date('1990-01-01'),
  phone: '+1234567890',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  managerId: null,
  skills: ['JavaScript', 'React', 'Node.js'],
  socials: { linkedin: 'johndoe', twitter: '@johndoe' },
  documents: { profilePhoto: 'photo.jpg' },
  completion: 0,
  updatedAt: new Date(),
  user: null
}

describe('Profile Completion', () => {
  it('should calculate 100% completion for complete profile', () => {
    const result = calculateProfileCompletion(mockProfile, 'john@example.com')
    
    expect(result.percentage).toBe(100)
    expect(result.completedFields).toHaveLength(10)
    expect(result.missingFields).toHaveLength(0)
  })

  it('should calculate completion percentage correctly for incomplete profile', () => {
    const incompleteProfile = {
      ...mockProfile,
      nationalId: null,
      phone: null,
      socials: null,
      documents: null
    }

    const result = calculateProfileCompletion(incompleteProfile, 'john@example.com')
    
    // Should be missing nationalId, phone, socials, documents (40% missing)
    expect(result.percentage).toBe(60)
    expect(result.missingFields).toContain('nationalId')
    expect(result.missingFields).toContain('phone')
  })

  it('should handle null profile', () => {
    const result = calculateProfileCompletion(null, 'john@example.com')
    
    expect(result.percentage).toBe(0)
    expect(result.completedFields).toHaveLength(0)
    expect(result.missingFields).toHaveLength(10)
  })

  it('should count email from user parameter', () => {
    const profileWithoutEmail = {
      ...mockProfile,
      // No email field in profile, should use user email
    }

    const result = calculateProfileCompletion(profileWithoutEmail, 'john@example.com')
    expect(result.completedFields).toContain('email')
  })

  it('should handle skills array correctly', () => {
    const profileWithSkills = {
      ...mockProfile,
      skills: ['JavaScript', 'React']
    }

    const result = calculateProfileCompletion(profileWithSkills, 'john@example.com')
    expect(result.completedFields).toContain('skills')
  })

  it('should handle empty skills array as incomplete', () => {
    const profileWithEmptySkills = {
      ...mockProfile,
      skills: []
    }

    const result = calculateProfileCompletion(profileWithEmptySkills, 'john@example.com')
    expect(result.missingFields).toContain('skills')
  })
})