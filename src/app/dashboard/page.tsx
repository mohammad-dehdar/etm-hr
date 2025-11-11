import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { getProfileCompletion } from '@/lib/profile-completion'
import { getUpcomingBirthdays } from '@/lib/birthdays'
import { 
  User, 
  Brain, 
  FileText, 
  Calendar,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react'
import { prisma } from '@/lib/db'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return null
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      testAttempts: {
        include: {
          test: true
        },
        orderBy: { startedAt: 'desc' }
      },
      notifications: {
        where: {
          readAt: null
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  })

  if (!user) {
    return null
  }

  // Calculate profile completion
  const completion = getProfileCompletion(user.profile)

  // Get recent test attempts
  const recentTests = user.testAttempts.slice(0, 3)
  const completedTests = user.testAttempts.filter(attempt => attempt.status === 'SCORED')
  const inProgressTests = user.testAttempts.filter(attempt => attempt.status === 'IN_PROGRESS')

  // Get upcoming birthdays (simulate for demo)
  const upcomingBirthdays = [
    { firstName: 'علی', lastName: 'احمدی', birthDate: new Date() },
    { firstName: 'فاطمه', lastName: 'حسینی', birthDate: new Date() }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            خوش آمدید، {user.profile?.firstName || 'کاربر'}
          </h1>
          <p className="text-blue-100">
            امروز یک روز عالی برای تکمیل پروفایل و شرکت در تست‌های روانشناسی است
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تکمیل پروفایل</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completion.percentage}%</div>
              <Progress value={completion.percentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {100 - completion.percentage}% باقی مانده
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تست‌های تکمیل شده</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTests.length}</div>
              <p className="text-xs text-muted-foreground">
                از {user.testAttempts.length} تست
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تست‌های در انتظار</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressTests.length}</div>
              <p className="text-xs text-muted-foreground">
                نیاز به تکمیل
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">اعلان‌های خوانده نشده</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.notifications.length}</div>
              <p className="text-xs text-muted-foreground">
                اعلان جدید
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle>تکمیل پروفایل</CardTitle>
              <CardDescription>
                پیشرفت شما در تکمیل اطلاعات شخصی
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={completion.percentage} className="w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-600">تکمیل شده</p>
                    <p className="text-2xl font-bold">{completion.completedFields.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-600">باقی مانده</p>
                    <p className="text-2xl font-bold">{completion.missingFields.length}</p>
                  </div>
                </div>
                {completion.missingFields.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">موارد باقی مانده:</h4>
                    <div className="flex flex-wrap gap-1">
                      {completion.missingFields.slice(0, 5).map((field) => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Tests */}
          <Card>
            <CardHeader>
              <CardTitle>تست‌های اخیر</CardTitle>
              <CardDescription>
                آخرین تست‌های شما و وضعیت آنها
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTests.length === 0 ? (
                <div className="text-center py-6">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">هنوز تستی انجام نداده‌اید</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTests.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{attempt.test?.title}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(attempt.startedAt).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Badge 
                          variant={
                            attempt.status === 'SCORED' ? 'success' :
                            attempt.status === 'SUBMITTED' ? 'warning' : 'default'
                          }
                        >
                          {attempt.status === 'SCORED' ? 'تکمیل شده' :
                           attempt.status === 'SUBMITTED' ? 'ارسال شده' : 'در حال انجام'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle>تولیدهای پیش‌رو</CardTitle>
            <CardDescription>
              همکارانی که در روزهای آینده تولد دارند
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">هیچ تولدي در روزهای آینده وجود ندارد</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingBirthdays.map((birthday, index) => (
                  <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse p-3 border rounded-lg">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-medium">{birthday.firstName} {birthday.lastName}</p>
                      <p className="text-sm text-gray-500">تولدي در آینده</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}