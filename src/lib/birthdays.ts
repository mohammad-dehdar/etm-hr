import { format, isSameDay, addDays, startOfDay, endOfDay } from 'date-fns'
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz'
import { prisma } from './db'

export interface BirthdayInfo {
  id: string
  firstName: string
  lastName: string
  department?: string
  birthDate: Date
  isLeapYearBirthday: boolean
}

export interface BirthdayDigestData {
  today: BirthdayInfo[]
  thisWeek: BirthdayInfo[]
}

/**
 * Check if a year is a leap year
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

/**
 * Adjust Feb 29 birthdays for non-leap years
 * Returns Feb 28 for non-leap years if the original birthday was Feb 29
 */
function adjustFeb29Birthday(birthDate: Date, targetYear: number): Date {
  const originalMonth = birthDate.getMonth() + 1 // getMonth() is 0-indexed
  const originalDay = birthDate.getDate()
  
  if (originalMonth === 2 && originalDay === 29 && !isLeapYear(targetYear)) {
    return new Date(targetYear, 1, 28) // Month 1 is February, day 28
  }
  
  return new Date(targetYear, originalMonth - 1, originalDay)
}

/**
 * Get birthdays for a specific date considering timezone and leap year rules
 * @param date - The date to check for birthdays
 * @param timezone - IANA timezone string (e.g., 'Asia/Tehran')
 * @returns Array of users with birthdays on this date
 */
export async function getBirthdaysForDate(date: Date, timezone: string = 'UTC'): Promise<BirthdayInfo[]> {
  // Convert the date to the target timezone
  const zonedDate = utcToZonedTime(date, timezone)
  const targetYear = zonedDate.getFullYear()
  const targetMonth = zonedDate.getMonth() + 1
  const targetDay = zonedDate.getDate()

  // Get all users with birth dates
  const users = await prisma.user.findMany({
    where: {
      profile: {
        birthDate: {
          not: null
        }
      }
    },
    include: {
      profile: true
    }
  })

  const birthdayUsers: BirthdayInfo[] = []

  for (const user of users) {
    if (!user.profile?.birthDate) continue

    const birthDate = user.profile.birthDate
    const adjustedBirthDate = adjustFeb29Birthday(birthDate, targetYear)

    // Check if the adjusted birth date matches the target date
    if (adjustedBirthDate.getMonth() + 1 === targetMonth && 
        adjustedBirthDate.getDate() === targetDay) {
      birthdayUsers.push({
        id: user.id,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        department: user.profile.department || undefined,
        birthDate: birthDate,
        isLeapYearBirthday: birthDate.getMonth() === 1 && birthDate.getDate() === 29
      })
    }
  }

  return birthdayUsers
}

/**
 * Get birthdays for today and the next 7 days
 * @param timezone - IANA timezone string
 * @returns BirthdayDigestData with today and this week's birthdays
 */
export async function getBirthdayDigest(timezone: string = 'UTC'): Promise<BirthdayDigestData> {
  const now = new Date()
  
  // Get today's birthdays
  const todayBirthdays = await getBirthdaysForDate(now, timezone)
  
  // Get birthdays for the next 7 days
  const thisWeekBirthdays: BirthdayInfo[] = []
  
  for (let i = 1; i <= 7; i++) {
    const futureDate = addDays(now, i)
    const futureBirthdays = await getBirthdaysForDate(futureDate, timezone)
    thisWeekBirthdays.push(...futureBirthdays)
  }

  return {
    today: todayBirthdays,
    thisWeek: thisWeekBirthdays
  }
}

/**
 * Create a birthday digest record for auditing
 */
export async function createBirthdayDigest(
  channel: 'email' | 'slack' | 'in_app',
  data: BirthdayDigestData,
  timezone: string = 'UTC'
) {
  const digestData = {
    date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    timezone,
    ...data
  }

  await prisma.birthdayDigest.create({
    data: {
      runDate: new Date(),
      payload: digestData as any,
      channel
    }
  })
}

/**
 * Format birthday information for notifications
 */
export function formatBirthdayNotification(birthday: BirthdayInfo): string {
  const age = birthday.isLeapYearBirthday 
    ? '🎂 Birthday: Feb 29th (Leap Year Baby!)'
    : `🎂 Birthday: ${format(birthday.birthDate, 'MMM dd')}`
    
  return `${birthday.firstName} ${birthday.lastName} ${age} ${birthday.department ? `from ${birthday.department}` : ''}`
}

/**
 * Get upcoming birthdays (next 30 days) for admin dashboard
 */
export async function getUpcomingBirthdays(timezone: string = 'UTC', days: number = 30): Promise<BirthdayInfo[]> {
  const now = new Date()
  const upcomingBirthdays: BirthdayInfo[] = []

  for (let i = 0; i <= days; i++) {
    const futureDate = addDays(now, i)
    const birthdays = await getBirthdaysForDate(futureDate, timezone)
    upcomingBirthdays.push(...birthdays)
  }

  return upcomingBirthdays
}