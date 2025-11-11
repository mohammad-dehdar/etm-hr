import { Profile } from '@prisma/client';

export interface ProfileCompletionResult {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
  weights: Record<string, number>;
}

const FIELD_WEIGHTS = {
  // Core identity fields (35%)
  firstName: 8.75,
  lastName: 8.75,
  nationalId: 8.75,
  birthDate: 8.75,

  // Photos (10%)
  profilePhoto: 10,

  // Contact info (5% + 5% = 10%)
  phone: 5,
  email: 5, // From user email

  // Job info (10% + 10% = 20%)
  jobTitle: 10,
  department: 10,

  // Skills (10%)
  skills: 10,

  // Socials (5%)
  socials: 5,

  // Documents (10%)
  documents: 10,
};

export function calculateProfileCompletion(
  profile: Profile | null,
  userEmail?: string
): ProfileCompletionResult {
  if (!profile) {
    return {
      percentage: 0,
      completedFields: [],
      missingFields: Object.keys(FIELD_WEIGHTS),
      weights: FIELD_WEIGHTS,
    };
  }

  const completedFields: string[] = [];
  const missingFields: string[] = [];
  let totalScore = 0;

  // Check core identity fields
  if (profile.firstName?.trim()) {
    totalScore += FIELD_WEIGHTS.firstName;
    completedFields.push('firstName');
  } else {
    missingFields.push('firstName');
  }

  if (profile.lastName?.trim()) {
    totalScore += FIELD_WEIGHTS.lastName;
    completedFields.push('lastName');
  } else {
    missingFields.push('lastName');
  }

  if (profile.nationalId?.trim()) {
    totalScore += FIELD_WEIGHTS.nationalId;
    completedFields.push('nationalId');
  } else {
    missingFields.push('nationalId');
  }

  if (profile.birthDate) {
    totalScore += FIELD_WEIGHTS.birthDate;
    completedFields.push('birthDate');
  } else {
    missingFields.push('birthDate');
  }

  // Check contact info
  if (profile.phone?.trim()) {
    totalScore += FIELD_WEIGHTS.phone;
    completedFields.push('phone');
  } else {
    missingFields.push('phone');
  }

  if (userEmail?.trim()) {
    totalScore += FIELD_WEIGHTS.email;
    completedFields.push('email');
  } else {
    missingFields.push('email');
  }

  // Check job info
  if (profile.jobTitle?.trim()) {
    totalScore += FIELD_WEIGHTS.jobTitle;
    completedFields.push('jobTitle');
  } else {
    missingFields.push('jobTitle');
  }

  if (profile.department?.trim()) {
    totalScore += FIELD_WEIGHTS.department;
    completedFields.push('department');
  } else {
    missingFields.push('department');
  }

  // Check skills
  if (
    profile.skills &&
    Array.isArray(profile.skills) &&
    (profile.skills as any).length > 0
  ) {
    totalScore += FIELD_WEIGHTS.skills;
    completedFields.push('skills');
  } else {
    missingFields.push('skills');
  }

  // Check socials
  if (
    profile.socials &&
    typeof profile.socials === 'object' &&
    Object.keys(profile.socials as object).length > 0
  ) {
    totalScore += FIELD_WEIGHTS.socials;
    completedFields.push('socials');
  } else {
    missingFields.push('socials');
  }

  // Check documents
  if (
    profile.documents &&
    typeof profile.documents === 'object' &&
    Object.keys(profile.documents as object).length > 0
  ) {
    totalScore += FIELD_WEIGHTS.documents;
    completedFields.push('documents');
  } else {
    missingFields.push('documents');
  }

  // Check for profile photo (assuming it's stored in documents or has a specific field)
  // For now, we'll check if documents contain an image
  if (profile.documents && typeof profile.documents === 'object') {
    const docs = profile.documents as any;
    const hasProfilePhoto =
      docs.profilePhoto ||
      (Array.isArray(docs) && docs.some((doc: any) => doc.type === 'photo'));
    if (hasProfilePhoto) {
      totalScore += FIELD_WEIGHTS.profilePhoto;
      completedFields.push('profilePhoto');
    } else {
      missingFields.push('profilePhoto');
    }
  } else {
    missingFields.push('profilePhoto');
  }

  const percentage = Math.round(Math.min(100, Math.max(0, totalScore)));

  return {
    percentage,
    completedFields,
    missingFields,
    weights: FIELD_WEIGHTS,
  };
}

// Backward-compatible API used by dashboard/page.tsx
export function getProfileCompletion(
  profile: Profile | null,
  userEmail?: string
): ProfileCompletionResult {
  return calculateProfileCompletion(profile, userEmail);
}

export function getNextRecommendedFields(
  percentage: number,
  missingFields: string[]
): string[] {
  if (percentage >= 80) return missingFields; // All remaining fields
  if (percentage >= 60) return missingFields.slice(0, 3); // Top 3 missing fields
  if (percentage >= 40) return missingFields.slice(0, 2); // Top 2 missing fields
  return missingFields.slice(0, 1); // Most important missing field
}

export function getCompletionMessage(percentage: number): string {
  if (percentage === 0) return 'شروع تکمیل پروفایل';
  if (percentage < 25) return 'فقط شروع کردید! ادامه دهید';
  if (percentage < 50) return 'خوب پیش می‌روید!';
  if (percentage < 75) return 'عالی! نزدیک تکمیل هستید';
  if (percentage < 100) return 'تقریباً کامل شد!';
  return 'پروفایل شما کامل شد! 🎉';
}
