import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@company.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await hash(adminPassword, 12),
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'مدیر',
          lastName: 'سیستم',
          email: adminEmail,
          phone: '+98 911 123 4567',
          jobTitle: 'مدیر منابع انسانی',
          department: 'مدیریت',
          completion: 100
        }
      }
    }
  })

  console.log(`Admin user created: ${adminUser.email}`)

  // Create employee users
  const employeeData = [
    {
      email: 'ali.ahmadi@company.com',
      firstName: 'علی',
      lastName: 'احمدی',
      phone: '+98 911 111 1111',
      jobTitle: 'برنامه‌نویس ارشد',
      department: 'فنی',
      birthDate: new Date('1990-03-15'),
      nationalId: '1234567890'
    },
    {
      email: 'fatemeh.hosseini@company.com',
      firstName: 'فاطمه',
      lastName: 'حسینی',
      phone: '+98 911 222 2222',
      jobTitle: 'طراح UI/UX',
      department: 'طراحی',
      birthDate: new Date('1985-07-22'),
      nationalId: '2345678901'
    },
    {
      email: 'mehran.kazemi@company.com',
      firstName: 'مهرداد',
      lastName: 'کاظمی',
      phone: '+98 911 333 3333',
      jobTitle: 'مدیر محصول',
      department: 'مدیریت',
      birthDate: new Date('1992-11-08'),
      nationalId: '3456789012'
    },
    {
      email: 'sara.mousavi@company.com',
      firstName: 'سارا',
      lastName: 'موسوی',
      phone: '+98 911 444 4444',
      jobTitle: 'متخصص بازاریابی',
      department: 'بازاریابی',
      birthDate: new Date('1993-05-12'),
      nationalId: '4567890123'
    },
    {
      email: 'hassan.rohani@company.com',
      firstName: 'حسن',
      lastName: 'روحانی',
      phone: '+98 911 555 5555',
      jobTitle: 'کارشناس مالی',
      department: 'مالی',
      birthDate: new Date('1988-12-29'),
      nationalId: '5678901234' // This is Feb 29 in a leap year
    }
  ]

  for (const data of employeeData) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        passwordHash: await hash('employee123', 12),
        role: 'EMPLOYEE',
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            jobTitle: data.jobTitle,
            department: data.department,
            birthDate: data.birthDate,
            nationalId: data.nationalId,
            completion: 85 // Most fields completed
          }
        }
      }
    })
    console.log(`Employee user created: ${user.email}`)
  }

  // Create default form definition
  const profileForm = await prisma.formDefinition.upsert({
    where: { name: 'Profile v1' },
    update: {},
    create: {
      name: 'Profile v1',
      version: 1,
      active: true,
      schema: {
        title: 'اطلاعات شخصی',
        sections: [
          {
            title: 'اطلاعات پایه',
            fields: [
              {
                type: 'text',
                name: 'firstName',
                label: 'نام',
                required: true,
                placeholder: 'نام خود را وارد کنید'
              },
              {
                type: 'text',
                name: 'lastName',
                label: 'نام خانوادگی',
                required: true,
                placeholder: 'نام خانوادگی خود را وارد کنید'
              },
              {
                type: 'text',
                name: 'nationalId',
                label: 'کد ملی',
                required: true,
                placeholder: 'کد ملی ۱۰ رقمی'
              },
              {
                type: 'date',
                name: 'birthDate',
                label: 'تاریخ تولد',
                required: true
              }
            ]
          },
          {
            title: 'اطلاعات تماس',
            fields: [
              {
                type: 'text',
                name: 'phone',
                label: 'شماره تلفن',
                required: true,
                placeholder: 'شماره تلفن همراه'
              }
            ]
          },
          {
            title: 'اطلاعات شغلی',
            fields: [
              {
                type: 'text',
                name: 'jobTitle',
                label: 'سمت شغلی',
                required: true,
                placeholder: 'سمت فعلی خود را وارد کنید'
              },
              {
                type: 'text',
                name: 'department',
                label: 'بخش',
                required: true,
                placeholder: 'بخش یا دپارتمان'
              }
            ]
          }
        ]
      }
    }
  })

  console.log(`Default form created: ${profileForm.name}`)

  // Create psychology tests
  const teamworkTest = await prisma.psychTest.upsert({
    where: { slug: 'teamwork-collaboration' },
    update: {},
    create: {
      slug: 'teamwork-collaboration',
      title: 'کار گروهی و همکاری',
      description: 'ارزیابی توانایی‌های شما در کار گروهی و همکاری با دیگران',
      version: 1,
      active: true,
      config: {
        title: 'تست کار گروهی و همکاری',
        disclaimer: 'این تست یک ابزار بالینی نیست؛ فقط برای ارزیابی مناسب بودن برای محیط کار استفاده می‌شود.',
        pages: [
          {
            title: 'سوالات کار گروهی',
            questions: [
              {
                id: 'q1',
                text: 'من ترجیح می‌دهم روی پروژه‌ها به صورت گروهی کار کنم',
                type: 'likert',
                dimension: 'teamwork',
                options: [
                  { value: 1, label: 'کاملاً مخالفم', score: 1 },
                  { value: 2, label: 'مخالفم', score: 2 },
                  { value: 3, label: 'بی‌طرف', score: 3 },
                  { value: 4, label: 'موافقم', score: 4 },
                  { value: 5, label: 'کاملاً موافقم', score: 5 }
                ]
              },
              {
                id: 'q2',
                text: 'من در مواقع اختلاف نظر، سعی می‌کنم راه‌حل میانه پیدا کنم',
                type: 'likert',
                dimension: 'collaboration',
                options: [
                  { value: 1, label: 'کاملاً مخالفم', score: 1 },
                  { value: 2, label: 'مخالفم', score: 2 },
                  { value: 3, label: 'بی‌طرف', score: 3 },
                  { value: 4, label: 'موافقم', score: 4 },
                  { value: 5, label: 'کاملاً موافقم', score: 5 }
                ]
              },
              {
                id: 'q3',
                text: 'من ترجیح می‌دهم به تنهایی کار کنم تا با گروه',
                type: 'likert',
                dimension: 'teamwork',
                reverse: true,
                options: [
                  { value: 1, label: 'کاملاً مخالفم', score: 5 },
                  { value: 2, label: 'مخالفم', score: 4 },
                  { value: 3, label: 'بی‌طرف', score: 3 },
                  { value: 4, label: 'موافقم', score: 2 },
                  { value: 5, label: 'کاملاً موافقم', score: 1 }
                ]
              }
            ]
          }
        ],
        dimensions: {
          teamwork: {
            name: 'کار گروهی',
            description: 'توانایی کار موثر در تیم'
          },
          collaboration: {
            name: 'همکاری',
            description: 'توانایی همکاری و حل تعارض'
          }
        },
        scoring: {
          bands: [
            { name: 'پایین', min: 0, max: 40, color: '#ef4444' },
            { name: 'متوسط', min: 41, max: 70, color: '#f59e0b' },
            { name: 'بالا', min: 71, max: 100, color: '#10b981' }
          ]
        }
      }
    }
  })

  const stressTest = await prisma.psychTest.upsert({
    where: { slug: 'stress-tolerance' },
    update: {},
    create: {
      slug: 'stress-tolerance',
      title: 'تحمل استرس',
      description: 'ارزیابی توانایی شما در مدیریت استرس و فشار کاری',
      version: 1,
      active: true,
      config: {
        title: 'تست تحمل استرس',
        disclaimer: 'این تست یک ابزار بالینی نیست؛ فقط برای ارزیابی مناسب بودن برای محیط کار استفاده می‌شود.',
        pages: [
          {
            title: 'سوالات تحمل استرس',
            questions: [
              {
                id: 'q1',
                text: 'من در مواقع فشار کاری، آرامش خود را حفظ می‌کنم',
                type: 'likert',
                dimension: 'stress_management',
                options: [
                  { value: 1, label: 'کاملاً مخالفم', score: 1 },
                  { value: 2, label: 'مخالفم', score: 2 },
                  { value: 3, label: 'بی‌طرف', score: 3 },
                  { value: 4, label: 'موافقم', score: 4 },
                  { value: 5, label: 'کاملاً موافقم', score: 5 }
                ]
              },
              {
                id: 'q2',
                text: 'من به راحتی تحت تاثیر استرس قرار می‌گیرم',
                type: 'likert',
                dimension: 'stress_susceptibility',
                reverse: true,
                options: [
                  { value: 1, label: 'کاملاً مخالفم', score: 5 },
                  { value: 2, label: 'مخالفم', score: 4 },
                  { value: 3, label: 'بی‌طرف', score: 3 },
                  { value: 4, label: 'موافقم', score: 2 },
                  { value: 5, label: 'کاملاً موافقم', score: 1 }
                ]
              },
              {
                id: 'q3',
                text: 'من روش‌های موثری برای کاهش استرس دارم',
                type: 'likert',
                dimension: 'coping_strategies',
                options: [
                  { value: 1, label: 'کاملاً مخالفم', score: 1 },
                  { value: 2, label: 'مخالفم', score: 2 },
                  { value: 3, label: 'بی‌طرف', score: 3 },
                  { value: 4, label: 'موافقم', score: 4 },
                  { value: 5, label: 'کاملاً موافقم', score: 5 }
                ]
              }
            ]
          }
        ],
        dimensions: {
          stress_management: {
            name: 'مدیریت استرس',
            description: 'توانایی حفظ آرامش تحت فشار'
          },
          stress_susceptibility: {
            name: 'آسیب‌پذیری استرس',
            description: 'میزان حساسیت به استرس'
          },
          coping_strategies: {
            name: 'راهبردهای مقابله',
            description: 'توانایی استفاده از روش‌های موثر کاهش استرس'
          }
        },
        scoring: {
          bands: [
            { name: 'پایین', min: 0, max: 40, color: '#ef4444' },
            { name: 'متوسط', min: 41, max: 70, color: '#f59e0b' },
            { name: 'بالا', min: 71, max: 100, color: '#10b981' }
          ]
        }
      }
    }
  })

  console.log(`Psychology tests created: ${teamworkTest.title}, ${stressTest.title}`)

  // Create some sample form responses
  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    include: { profile: true }
  })

  for (const employee of employees) {
    await prisma.formResponse.upsert({
      where: {
        formId_userId: {
          formId: profileForm.id,
          userId: employee.id
        }
      },
      update: {},
      create: {
        formId: profileForm.id,
        userId: employee.id,
        answers: {
          firstName: employee.profile?.firstName,
          lastName: employee.profile?.lastName,
          nationalId: employee.profile?.nationalId,
          birthDate: employee.profile?.birthDate,
          phone: employee.profile?.phone,
          jobTitle: employee.profile?.jobTitle,
          department: employee.profile?.department
        }
      }
    })
  }

  console.log('Sample form responses created')

  // Create some sample notifications
  const today = new Date()
  const birthdayNotifications = []

  // Check for birthdays today
  for (const employee of employees) {
    if (employee.profile?.birthDate) {
      const birthMonth = employee.profile.birthDate.getMonth()
      const birthDay = employee.profile.birthDate.getDate()
      const todayMonth = today.getMonth()
      const todayDay = today.getDate()

      if (birthMonth === todayMonth && birthDay === todayDay) {
        birthdayNotifications.push({
          userId: adminUser.id,
          type: 'birthday_digest',
          payload: {
            birthday_user: {
              id: employee.id,
              firstName: employee.profile.firstName,
              lastName: employee.profile.lastName,
              department: employee.profile.department
            }
          }
        })
      }
    }
  }

  for (const notification of birthdayNotifications) {
    await prisma.notification.create({
      data: notification
    })
  }

  console.log(`Sample notifications created: ${birthdayNotifications.length}`)

  console.log('Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })