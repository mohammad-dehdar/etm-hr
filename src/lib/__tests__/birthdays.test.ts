import { 
  isLeapYear, 
  adjustFeb29Birthday, 
  getBirthdaysForDate 
} from '@/lib/birthdays'

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findMany: jest.fn()
    }
  }
}))

import { prisma } from '@/lib/db'

describe('Birthday Utilities', () => {
  describe('isLeapYear', () => {
    it('should return true for leap years', () => {
      expect(isLeapYear(2000)).toBe(true)
      expect(isLeapYear(2004)).toBe(true)
      expect(isLeapYear(2020)).toBe(true)
    })

    it('should return false for non-leap years', () => {
      expect(isLeapYear(2001)).toBe(false)
      expect(isLeapYear(2002)).toBe(false)
      expect(isLeapYear(2003)).toBe(false)
      expect(isLeapYear(1900)).toBe(false) // Century rule
    })
  })

  describe('adjustFeb29Birthday', () => {
    it('should return the same date for non-Feb 29 birthdays', () => {
      const birthDate = new Date('1990-03-15')
      expect(adjustFeb29Birthday(birthDate, 2023)).toEqual(new Date('2023-02-28'))
    })

    it('should return Feb 28 for Feb 29 birthdays in non-leap years', () => {
      const birthDate = new Date('1990-02-29')
      expect(adjustFeb29Birthday(birthDate, 2023)).toEqual(new Date('2023-02-28'))
    })

    it('should return Feb 29 for Feb 29 birthdays in leap years', () => {
      const birthDate = new Date('1990-02-29')
      expect(adjustFeb29Birthday(birthDate, 2024)).toEqual(new Date('2024-02-29'))
    })
  })

  describe('getBirthdaysForDate', () => {
    it('should find users with matching birthdays', async () => {
      const mockUsers = [
        {
          id: '1',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            department: 'Engineering',
            birthDate: new Date('1990-03-15'),
          }
        },
        {
          id: '2',
          profile: {
            firstName: 'Jane',
            lastName: 'Smith',
            department: 'Design',
            birthDate: new Date('1985-03-15'),
          }
        }
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

      const result = await getBirthdaysForDate(new Date('2024-03-15'), 'UTC')

      expect(result).toHaveLength(2)
      expect(result[0].firstName).toBe('John')
      expect(result[1].firstName).toBe('Jane')
    })

    it('should handle Feb 29 birthdays correctly in non-leap years', async () => {
      const mockUsers = [
        {
          id: '1',
          profile: {
            firstName: 'Leap',
            lastName: 'Year',
            department: 'IT',
            birthDate: new Date('1990-02-29'),
          }
        }
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

      const result = await getBirthdaysForDate(new Date('2023-02-28'), 'UTC')

      expect(result).toHaveLength(1)
      expect(result[0].firstName).toBe('Leap')
      expect(result[0].isLeapYearBirthday).toBe(true)
    })

    it('should return empty array for no matching birthdays', async () => {
      const mockUsers = [
        {
          id: '1',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            birthDate: new Date('1990-03-15'),
          }
        }
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

      const result = await getBirthdaysForDate(new Date('2024-01-01'), 'UTC')

      expect(result).toHaveLength(0)
    })
  })
})