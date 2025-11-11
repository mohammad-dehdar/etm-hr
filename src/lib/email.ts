import nodemailer from 'nodemailer'
import { BirthdayInfo } from './birthdays'

// Create transporter
function createTransporter() {
  if (process.env.SENDGRID_API_KEY) {
    // Use SendGrid
    return nodemailer.createTransporter({
      service: 'sendgrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    })
  } else if (process.env.EMAIL_SERVER_HOST) {
    // Use custom SMTP
    return nodemailer.createTransporter({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD
      }
    })
  } else {
    // Use Ethereal for development
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal-user',
        pass: 'ethereal-password'
      }
    })
  }
}

const transporter = createTransporter()

export async function sendBirthdayEmail(
  to: string, 
  digestData: {
    today: BirthdayInfo[]
    thisWeek: BirthdayInfo[]
  }
) {
  const from = process.env.EMAIL_FROM || 'PeoplePulse <noreply@peoplepulse.com>'
  
  const subject = '🎉 گزارش روزانه تولدها - PeoplePulse'
  
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>گزارش تولدهای روزانه</title>
        <style>
            body {
                font-family: 'Tahoma', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #3b82f6;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #1e40af;
                margin: 0;
                font-size: 24px;
            }
            .section {
                margin-bottom: 25px;
            }
            .section h2 {
                color: #374151;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 10px;
                margin-bottom: 15px;
            }
            .birthday-item {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
            }
            .birthday-item.birthday-today {
                background-color: #fef3c7;
                border-color: #f59e0b;
            }
            .birthday-name {
                font-weight: bold;
                color: #1f2937;
                font-size: 16px;
            }
            .birthday-info {
                color: #6b7280;
                font-size: 14px;
                margin-top: 5px;
            }
            .no-birthdays {
                text-align: center;
                color: #6b7280;
                font-style: italic;
                padding: 20px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎂 گزارش روزانه تولدها</h1>
                <p>سیستم PeoplePulse</p>
            </div>

            <div class="section">
                <h2>🎉 تولدهای امروز (${new Date().toLocaleDateString('fa-IR')})</h2>
                ${digestData.today.length === 0 ? 
                  '<div class="no-birthdays">امروز کسی تولد ندارد</div>' :
                  digestData.today.map(person => `
                    <div class="birthday-item birthday-today">
                        <div class="birthday-name">${person.firstName} ${person.lastName}</div>
                        <div class="birthday-info">
                            ${person.department ? `بخش: ${person.department}` : ''}
                            ${person.isLeapYearBirthday ? ' | 🎂 تولد ۲۹ فوریه (سال کبیسه)' : ''}
                        </div>
                    </div>
                  `).join('')
                }
            </div>

            <div class="section">
                <h2>📅 تولدهای هفته آینده</h2>
                ${digestData.thisWeek.length === 0 ? 
                  '<div class="no-birthdays">هیچ تولدی در هفته آینده وجود ندارد</div>' :
                  digestData.thisWeek.map(person => `
                    <div class="birthday-item">
                        <div class="birthday-name">${person.firstName} ${person.lastName}</div>
                        <div class="birthday-info">
                            ${person.department ? `بخش: ${person.department}` : ''}
                            ${person.isLeapYearBirthday ? ' | 🎂 تولد ۲۹ فوریه (سال کبیسه)' : ''}
                        </div>
                    </div>
                  `).join('')
                }
            </div>

            <div class="footer">
                <p>این ایمیل به صورت خودکار توسط سیستم PeoplePulse ارسال شده است.</p>
                <p>برای تنظیمات این گزارش، به پنل مدیریت مراجعه کنید.</p>
            </div>
        </div>
    </body>
    </html>
  `

  const textContent = `
گزارش روزانه تولدها - PeoplePulse

🎉 تولدهای امروز (${new Date().toLocaleDateString('fa-IR')}):
${digestData.today.length === 0 ? 'امروز کسی تولد ندارد' : 
  digestData.today.map(person => 
    `- ${person.firstName} ${person.lastName} ${person.department ? `(بخش: ${person.department})` : ''} ${person.isLeapYearBirthday ? '(تولد ۲۹ فوریه)' : ''}`
  ).join('\n')
}

📅 تولدهای هفته آینده:
${digestData.thisWeek.length === 0 ? 'هیچ تولدی در هفته آینده وجود ندارد' :
  digestData.thisWeek.map(person => 
    `- ${person.firstName} ${person.lastName} ${person.department ? `(بخش: ${person.department})` : ''} ${person.isLeapYearBirthday ? '(تولد ۲۹ فوریه)' : ''}`
  ).join('\n')
}

---
این ایمیل به صورت خودکار توسط سیستم PeoplePulse ارسال شده است.
  `

  const mailOptions = {
    from,
    to,
    subject,
    text: textContent,
    html: htmlContent
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId)
    return info
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

export async function sendTestInvitationEmail(
  to: string,
  testTitle: string,
  testDescription?: string
) {
  const from = process.env.EMAIL_FROM || 'PeoplePulse <noreply@peoplepulse.com>'
  
  const subject = `🧠 تست جدید: ${testTitle}`
  
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>دعوت به شرکت در تست</title>
        <style>
            body {
                font-family: 'Tahoma', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #3b82f6;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #1e40af;
                margin: 0;
                font-size: 24px;
            }
            .test-info {
                background-color: #f0f9ff;
                border: 1px solid #0ea5e9;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .cta-button {
                display: inline-block;
                background-color: #3b82f6;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🧠 دعوت به شرکت در تست روانشناسی</h1>
            </div>
            
            <div class="test-info">
                <h2>${testTitle}</h2>
                ${testDescription ? `<p>${testDescription}</p>` : ''}
            </div>
            
            <p>برای شروع تست، روی لینک زیر کلیک کنید:</p>
            
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/tests" class="cta-button">
                شروع تست
            </a>
            
            <p><strong>نکته:</strong> این تست یک ابزار بالینی نیست و فقط برای ارزیابی مناسب بودن شما برای محیط کار استفاده می‌شود.</p>
        </div>
    </body>
    </html>
  `

  const mailOptions = {
    from,
    to,
    subject,
    html: htmlContent
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Test invitation email sent:', info.messageId)
    return info
  } catch (error) {
    console.error('Error sending test invitation email:', error)
    throw error
  }
}