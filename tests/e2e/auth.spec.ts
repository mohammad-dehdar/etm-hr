import { test, expect } from '@playwright/test'

test.describe('User Authentication', () => {
  test('should login as admin and access admin dashboard', async ({ page }) => {
    await page.goto('/login')

    // Fill login form
    await page.fill('[data-testid="email"]', 'admin@company.com')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')

    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin/dashboard')
    await expect(page.locator('h1')).toContainText('داشبورد مدیریت')
  })

  test('should login as employee and access employee dashboard', async ({ page }) => {
    await page.goto('/login')

    // Fill login form
    await page.fill('[data-testid="email"]', 'ali.ahmadi@company.com')
    await page.fill('[data-testid="password"]', 'employee123')
    await page.click('[data-testid="login-button"]')

    // Should redirect to employee dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('خوش آمدید')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill with wrong credentials
    await page.fill('[data-testid="email"]', 'wrong@example.com')
    await page.fill('[data-testid="password"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('ایمیل یا رمز عبور اشتباه است')
  })
})

test.describe('Employee Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as employee
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'ali.ahmadi@company.com')
    await page.fill('[data-testid="password"]', 'employee123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })

  test('should display dashboard with correct information', async ({ page }) => {
    // Check for welcome message
    await expect(page.locator('h1')).toContainText('خوش آمدید')
    
    // Check for stats cards
    await expect(page.locator('[data-testid="profile-completion-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="completed-tests-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="pending-tests-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="unread-notifications-card"]')).toBeVisible()
  })

  test('should navigate to profile page', async ({ page }) => {
    await page.click('[data-testid="profile-link"]')
    await expect(page).toHaveURL('/dashboard/profile')
    await expect(page.locator('h1')).toContainText('پروفایل شخصی')
  })

  test('should navigate to tests page', async ({ page }) => {
    await page.click('[data-testid="tests-link"]')
    await expect(page).toHaveURL('/dashboard/tests')
    await expect(page.locator('h1')).toContainText('تست‌های روانشناسی')
  })
})

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@company.com')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/admin/dashboard')
  })

  test('should display admin dashboard with KPIs', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('داشبورد مدیریت')
    
    // Check for admin-specific KPIs
    await expect(page.locator('[data-testid="kpi-profile-completion"]')).toBeVisible()
    await expect(page.locator('[data-testid="kpi-tests-completion"]')).toBeVisible()
    await expect(page.locator('[data-testid="kpi-birthdays-today"]')).toBeVisible()
  })

  test('should navigate to user management', async ({ page }) => {
    await page.click('[data-testid="users-link"]')
    await expect(page).toHaveURL('/admin/users')
    await expect(page.locator('h1')).toContainText('مدیریت کاربران')
  })

  test('should navigate to form management', async ({ page }) => {
    await page.click('[data-testid="forms-link"]')
    await expect(page).toHaveURL('/admin/forms')
    await expect(page.locator('h1')).toContainText('مدیریت فرم‌ها')
  })
})

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')
    
    // Check that mobile navigation is available
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Login on mobile
    await page.fill('[data-testid="email"]', 'ali.ahmadi@company.com')
    await page.fill('[data-testid="password"]', 'employee123')
    await page.click('[data-testid="login-button"]')
    
    // Dashboard should be responsive
    await expect(page.locator('[data-testid="dashboard-grid"]')).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/login')
    
    // Check for accessible form labels
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('label[for="password"]')).toBeVisible()
    
    // Check button accessibility
    await expect(page.locator('button[aria-label]')).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/login')
    
    // Tab through form elements
    await page.keyboard.press('Tab')
    await page.keyboard.type('admin@company.com')
    await page.keyboard.press('Tab')
    await page.keyboard.type('admin123')
    await page.keyboard.press('Enter')
    
    // Should successfully login via keyboard
    await expect(page).toHaveURL(/\/dashboard|\/admin\/dashboard/)
  })
})