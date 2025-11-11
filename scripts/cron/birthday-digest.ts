import cron from 'node-cron';
import { getBirthdayDigest, createBirthdayDigest } from '@/lib/birthdays';
import { sendBirthdayEmail } from '@/lib/email';
import { sendSlackNotification } from '@/lib/slack';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

const ORG_TZ = process.env.ORG_TZ || 'Asia/Tehran';
const CRON_LOCAL_HOUR = parseInt(process.env.CRON_LOCAL_HOUR || '8');
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS_CSV || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function processBirthdayDigest() {
  console.log(
    `[${new Date().toISOString()}] Starting birthday digest processing...`
  );

  try {
    // Get birthday digest data
    const digestData = await getBirthdayDigest(ORG_TZ);
    console.log(
      `Found ${digestData.today.length} birthdays today and ${digestData.thisWeek.length} this week`
    );

    if (digestData.today.length === 0 && digestData.thisWeek.length === 0) {
      console.log('No birthdays to process');
      return;
    }

    // Send in-app notifications to all admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const admin of adminUsers) {
      const payload: Prisma.InputJsonValue = {
        today: digestData.today as unknown as Prisma.InputJsonValue,
        thisWeek: digestData.thisWeek as unknown as Prisma.InputJsonValue,
        date: new Date().toISOString(),
      };
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'birthday_digest',
          payload,
        },
      });
    }

    console.log(`Created ${adminUsers.length} in-app notifications for admins`);

    // Send email digest to admin emails
    if (ADMIN_EMAILS.length > 0) {
      for (const email of ADMIN_EMAILS) {
        try {
          await sendBirthdayEmail(email, digestData);
          console.log(`Sent email digest to ${email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
        }
      }
    }

    // Send Slack notification if webhook is configured
    if (SLACK_WEBHOOK_URL) {
      try {
        await sendSlackNotification(digestData);
        console.log('Sent Slack notification');
      } catch (slackError) {
        console.error('Failed to send Slack notification:', slackError);
      }
    }

    // Create audit records
    await createBirthdayDigest('in_app', digestData, ORG_TZ);
    if (ADMIN_EMAILS.length > 0) {
      await createBirthdayDigest('email', digestData, ORG_TZ);
    }
    if (SLACK_WEBHOOK_URL) {
      await createBirthdayDigest('slack', digestData, ORG_TZ);
    }

    console.log('Birthday digest processing completed successfully');
  } catch (error) {
    console.error('Error processing birthday digest:', error);
    throw error;
  }
}

// Schedule the job to run daily at the specified hour
export function scheduleBirthdayCron() {
  const cronExpression = `0 ${CRON_LOCAL_HOUR} * * *`; // Minute Hour Day Month DayOfWeek

  console.log(
    `Scheduling birthday digest to run daily at ${CRON_LOCAL_HOUR}:00 ${ORG_TZ}`
  );

  cron.schedule(
    cronExpression,
    () => {
      processBirthdayDigest();
    },
    {
      timezone: ORG_TZ,
    }
  );
}

// Run once if called directly
if (require.main === module) {
  processBirthdayDigest()
    .then(() => {
      console.log('Birthday digest processing completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Birthday digest processing failed:', error);
      process.exit(1);
    });
}
