-- สคริปต์สำหรับตั้งค่า Super Admin user
-- Run หลังจากสร้าง auth user แล้ว

-- 1. ค้นหา user ID จาก email
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- ดึง user ID จาก auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@bn-aura.com'
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- อัปเดทหรือสร้าง record ใน users table
        INSERT INTO users (
            id,
            email,
            role,
            tier,
            clinic_id,
            full_name,
            metadata,
            created_at,
            created_by,
            updated_by
        ) VALUES (
            admin_user_id,
            'admin@bn-aura.com',
            'super_admin'::user_role,
            'clinical'::analysis_tier,
            NULL, -- Super admin ไม่ผูกกับคลินิกใดคลินิกหนึ่ง
            'BN-Aura System Administrator',
            '{"permissions": ["manage_clinics", "view_analytics", "system_config"], "access_level": "global"}'::jsonb,
            NOW(),
            admin_user_id,
            admin_user_id
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'super_admin'::user_role,
            tier = 'clinical'::analysis_tier,
            full_name = 'BN-Aura System Administrator',
            metadata = '{"permissions": ["manage_clinics", "view_analytics", "system_config"], "access_level": "global"}'::jsonb,
            updated_by = admin_user_id;
            
        -- อัปเดท user metadata ใน auth.users เพื่อให้ระบบจำได้
        UPDATE auth.users 
        SET 
            raw_user_meta_data = jsonb_build_object(
                'role', 'super_admin',
                'full_name', 'BN-Aura System Administrator',
                'clinic_id', NULL,
                'clinic_name', 'System Administration'
            ),
            user_metadata = jsonb_build_object(
                'role', 'super_admin',
                'full_name', 'BN-Aura System Administrator',
                'clinic_id', NULL,
                'clinic_name', 'System Administration'
            )
        WHERE id = admin_user_id;
        
        RAISE NOTICE 'Super Admin user setup completed for ID: %', admin_user_id;
        RAISE NOTICE 'Email: admin@bn-aura.com';
        RAISE NOTICE 'Role: super_admin';
    ELSE
        RAISE EXCEPTION 'User with email admin@bn-aura.com not found in auth.users. Please create the auth user first.';
    END IF;
END $$;
