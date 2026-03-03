INSERT INTO admin_users (username, password, email, role)
VALUES (
  'admin',
  crypt('admin123', gen_salt('bf', 10)),
  'admin@academic-scheduler.local',
  'admin'
)
ON CONFLICT (username)
DO UPDATE SET
  password = EXCLUDED.password,
  email = EXCLUDED.email,
  role = EXCLUDED.role;
