# Live Validation Plan

แผนนี้จะทดสอบระบบจริงทุกบทบาทด้วยบัญชีจริงก่อน แล้วแก้บั๊กเฉพาะจุดที่พังจริงระหว่างทดสอบ.

1) Baseline
- ตรวจ /api/monitoring/health
- ตรวจ login page + supabase auth response

2) Role-by-role smoke
- superadmin@bnaura.com -> /th/admin
- owner@bnaura.com, admin@bnaura.com -> /th/clinic
- sales@bnaura.com, newsales@bnaura.com -> /th/sales
- beauty@bnaura.com -> /th/beautician
- cust1@bnaura.com, cust2@bnaura.com, cust3@bnaura.com -> /th/customer
- ใช้รหัสเดียว: 123456789nut

3) Critical flows per role
- Admin: management/stats/clinic list
- Clinic: reports, pos, inventory alerts
- Sales: customers, quota, commissions
- Beautician: tasks, appointments, workflow
- Customer: loyalty, appointments, sales rep widget

4) Failure handling (during test)
- เก็บหลักฐาน: URL, screenshot, console, network, API response
- จัด severity: blocker/high/medium
- แก้ root cause แบบ minimal patch
- retest จุดเดิม + เส้นทางข้างเคียง

5) Exit criteria
- ทุก role login + redirect ถูกต้อง
- ฟีเจอร์หลักของแต่ละ role ผ่าน
- blocker/high = 0
