import { IncomingWebhook } from '@slack/webhook'
import { BirthdayInfo } from './birthdays'

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL

if (!slackWebhookUrl) {
  console.log('Slack webhook URL not configured, skipping Slack notifications')
}

const webhook = slackWebhookUrl ? new IncomingWebhook(slackWebhookUrl) : null

export async function sendSlackNotification(
  digestData: {
    today: BirthdayInfo[]
    thisWeek: BirthdayInfo[]
  }
) {
  if (!webhook) {
    throw new Error('Slack webhook not configured')
  }

  const today = new Date()
  
  // Create main message
  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🎂 گزارش روزانه تولدها - PeoplePulse',
        emoji: true
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*تاریخ:* ${today.toLocaleDateString('fa-IR')}`
      }
    }
  ]

  // Add today's birthdays section
  if (digestData.today.length > 0) {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*🎉 تولدهای امروز:*'
        }
      }
    )

    digestData.today.forEach((person) => {
      blocks.push(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• *${person.firstName} ${person.lastName}*${person.department ? ` (${person.department})` : ''}${person.isLeapYearBirthday ? ' 🎂' : ''}`
          }
        }
      )
    })
  } else {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*🎉 تولدهای امروز:*\nامروز کسی تولد ندارد'
        }
      }
    )
  }

  // Add divider
  blocks.push({
    type: 'divider'
  })

  // Add this week's birthdays section
  if (digestData.thisWeek.length > 0) {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📅 تولدهای هفته آینده:*'
        }
      }
    )

    // Group by day of week for better presentation
    const weeklyBirthdays = digestData.thisWeek.reduce((acc, person) => {
      // This is a simplified grouping - you might want to group by specific dates
      if (!acc.others) acc.others = []
      acc.others.push(person)
      return acc
    }, {} as any)

    if (weeklyBirthdays.others) {
      weeklyBirthdays.others.forEach((person: BirthdayInfo) => {
        blocks.push(
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `• *${person.firstName} ${person.lastName}*${person.department ? ` (${person.department})` : ''}${person.isLeapYearBirthday ? ' 🎂' : ''}`
            }
          }
        )
      })
    }
  } else {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📅 تولدهای هفته آینده:*\nهیچ تولدی در هفته آینده وجود ندارد'
        }
      }
    )
  }

  // Add footer
  blocks.push(
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'این پیام به صورت خودکار توسط سیستم PeoplePulse ارسال شده است.'
        }
      ]
    }
  )

  try {
    await webhook.send({
      text: '🎂 گزارش روزانه تولدها - PeoplePulse',
      blocks
    })
    console.log('Slack notification sent successfully')
  } catch (error) {
    console.error('Error sending Slack notification:', error)
    throw error
  }
}

export async function sendTestAssignmentNotification(
  employeeName: string,
  testTitle: string,
  testDescription?: string
) {
  if (!webhook) {
    throw new Error('Slack webhook not configured')
  }

  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🧠 تست جدید اختصاص یافت',
        emoji: true
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*برای:* ${employeeName}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*تست:* ${testTitle}`
      }
    }
  ]

  if (testDescription) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*توضیحات:* ${testDescription}`
      }
    })
  }

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'کارمند می‌تواند در داشبورد شخصی خود به این تست دسترسی داشته باشد.'
    }
  })

  try {
    await webhook.send({
      text: '🧠 تست جدید اختصاص یافت',
      blocks
    })
    console.log('Test assignment Slack notification sent successfully')
  } catch (error) {
    console.error('Error sending test assignment Slack notification:', error)
    throw error
  }
}

export async function sendSystemAlert(
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'error' = 'info'
) {
  if (!webhook) {
    throw new Error('Slack webhook not configured')
  }

  const emoji = severity === 'error' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️'
  const color = severity === 'error' ? '#ff0000' : severity === 'warning' ? '#ffaa00' : '#00aa00'

  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} هشدار سیستم`,
        emoji: true
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${title}*`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `سطح: ${severity.toUpperCase()} | تاریخ: ${new Date().toLocaleString('fa-IR')}`
        }
      ]
    }
  ]

  try {
    await webhook.send({
      text: `${emoji} هشدار سیستم: ${title}`,
      attachments: [
        {
          color,
          blocks
        }
      ]
    })
    console.log('System alert Slack notification sent successfully')
  } catch (error) {
    console.error('Error sending system alert Slack notification:', error)
    throw error
  }
}