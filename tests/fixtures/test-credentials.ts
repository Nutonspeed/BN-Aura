/**
 * Test credentials for E2E testing
 * ใช้ credentials จริงสำหรับ testing
 */

export const REAL_TEST_USERS = {
  super_admin: {
    email: 'nuttapong161@gmail.com',
    // Note: รหัสผ่านจริงต้องแก้ไขก่อนใช้งาน
    password: 'your-real-password-here',
    role: 'super_admin',
    name: 'Nuttapong - System Administrator'
  },
  // สำหรับ demo และ testing พื้นฐาน
  demo_user: {
    email: 'demo@bn-aura.com',
    password: 'demo123',
    role: 'customer',
    name: 'Demo User'
  }
};

export const INVALID_CREDENTIALS = {
  email: 'invalid@test.com',
  password: 'wrongpassword'
};
