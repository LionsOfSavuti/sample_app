INSERT INTO admin_users (username, password, email, role)
VALUES (
  'admin',
  '$2a$10$rH3YQ6Sf3lBR1PZxzLhZk.NqD5nqNLEGNJzNqV4aH9XOEBjPk5C9C',
  'admin@academic-scheduler.local',
  'admin'
)
ON CONFLICT (username) DO NOTHING;
