# Local Setup Guide - Academic Scheduling System

This guide will help you recreate the complete academic scheduling system on your local machine using PostgreSQL and Apache.

## System Requirements

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Apache HTTP Server (v2.4 or higher)
- npm or yarn package manager

## Step 1: Install Dependencies

```bash
# Install Node.js from https://nodejs.org/
# Install PostgreSQL from https://www.postgresql.org/download/
# Install Apache from https://httpd.apache.org/download.cgi
```

## Step 2: Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE academic_scheduler;

# Create user (optional but recommended)
CREATE USER scheduler_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE academic_scheduler TO scheduler_admin;

# Exit psql
\q
```

## Step 3: Initialize Project

Create a new directory and initialize the project:

```bash
mkdir academic-scheduler
cd academic-scheduler

# Initialize npm project
npm init -y

# Install dependencies
npm install react react-dom
npm install @types/react @types/react-dom
npm install vite @vitejs/plugin-react
npm install typescript
npm install tailwindcss postcss autoprefixer
npm install lucide-react
npm install date-fns
npm install react-hot-toast
npm install bcryptjs @types/bcryptjs
npm install pg @types/pg

# Install dev dependencies
npm install -D @eslint/js eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals typescript-eslint
```

## Step 4: Project Structure

Create the following directory structure:

```text
academic-scheduler/
├── src/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   ├── utils/
│   ├── data/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── public/
├── supabase/
│   └── migrations/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
└── .env
```

## Step 5: Configuration Files

### package.json
```json
{
  "name": "academic-scheduler",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.344.0",
    "date-fns": "^4.1.0",
    "react-hot-toast": "^2.6.0",
    "bcryptjs": "^3.0.3",
    "pg": "^8.16.3"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/pg": "^8.11.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.2",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.9.1",
    "@eslint/js": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "globals": "^15.9.0",
    "typescript-eslint": "^8.3.0"
  }
}
```

### .env
```env
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=academic_scheduler
VITE_DB_USER=scheduler_admin
VITE_DB_PASSWORD=your_secure_password
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
});
```

### tsconfig.json
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

### tsconfig.app.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

### tsconfig.node.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

### tailwind.config.js
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### eslint.config.js
```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
);
```

### index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Academic Scheduler</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## Step 6: Database Setup

Run all migration files in order. Connect to your database:

```bash
psql -U scheduler_admin -d academic_scheduler
```

Then execute each migration file from the `supabase/migrations/` directory in chronological order. You can create a script to do this:

```bash
# create-tables.sh
#!/bin/bash

DB_USER="scheduler_admin"
DB_NAME="academic_scheduler"
MIGRATIONS_DIR="supabase/migrations"

for file in $(ls -1 $MIGRATIONS_DIR/*.sql | sort); do
    echo "Running migration: $file"
    psql -U $DB_USER -d $DB_NAME -f $file
done

echo "All migrations completed!"
```

Make it executable and run:
```bash
chmod +x create-tables.sh
./create-tables.sh
```

## Step 7: Create Database Connection Library

Create `src/lib/db.ts`:

```typescript
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_DB_PORT || '5432'),
  database: import.meta.env.VITE_DB_NAME || 'academic_scheduler',
  user: import.meta.env.VITE_DB_USER || 'scheduler_admin',
  password: import.meta.env.VITE_DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export default pool;
```

## Step 8: Create Backend API Server

Since the frontend needs to communicate with PostgreSQL, create a simple Express backend:

```bash
npm install express cors dotenv
npm install -D @types/express @types/cors
```

Create `server/index.js`:

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = 3001;

const pool = new Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432'),
  database: process.env.VITE_DB_NAME || 'academic_scheduler',
  user: process.env.VITE_DB_USER || 'scheduler_admin',
  password: process.env.VITE_DB_PASSWORD || '',
});

app.use(cors());
app.use(express.json());

// Generic query endpoint
app.post('/api/query', async (req, res) => {
  const { text, params } = req.body;
  try {
    const result = await pool.query(text, params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
```

Update package.json scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "api": "node server/index.js",
    "start": "npm-run-all --parallel dev api",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

Install npm-run-all:
```bash
npm install -D npm-run-all
```

## Step 9: Update Database Client

Replace Supabase client references with direct PostgreSQL queries. Create `src/lib/db-client.ts`:

```typescript
const API_URL = 'http://localhost:3001/api';

export const dbQuery = async (text: string, params?: any[]) => {
  const response = await fetch(`${API_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, params }),
  });

  if (!response.ok) {
    throw new Error('Database query failed');
  }

  return response.json();
};

// Helper functions to mimic Supabase API
export const db = {
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      eq: async (column: string, value: any) => {
        const result = await dbQuery(
          `SELECT ${columns} FROM ${table} WHERE ${column} = $1`,
          [value]
        );
        return { data: result.rows, error: null };
      },
      // Add more query methods as needed
    }),
    insert: async (data: any) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

      const result = await dbQuery(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      return { data: result.rows, error: null };
    },
    update: (data: any) => ({
      eq: async (column: string, value: any) => {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

        const result = await dbQuery(
          `UPDATE ${table} SET ${setClause} WHERE ${column} = $${values.length + 1} RETURNING *`,
          [...values, value]
        );
        return { data: result.rows, error: null };
      },
    }),
    delete: () => ({
      eq: async (column: string, value: any) => {
        const result = await dbQuery(
          `DELETE FROM ${table} WHERE ${column} = $1 RETURNING *`,
          [value]
        );
        return { data: result.rows, error: null };
      },
    }),
  }),
};
```

## Step 10: Copy Source Files

Copy all files from the `src/` directory maintaining the structure:

- `src/components/` - All 40+ React components
- `src/contexts/` - AcademicYearContext.tsx, ProgramContext.tsx
- `src/hooks/` - useScheduling.ts
- `src/lib/` - Database connection utilities
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions (autoScheduler, calendarGenerator, etc.)
- `src/data/` - Sample data files
- `src/App.tsx` - Main application component
- `src/main.tsx` - Application entry point
- `src/index.css` - Global styles with Tailwind directives

## Step 11: Configure Apache

Create Apache virtual host configuration:

```apache
<VirtualHost *:80>
    ServerName academic-scheduler.local
    DocumentRoot "/path/to/academic-scheduler/dist"

    <Directory "/path/to/academic-scheduler/dist">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        # Enable URL rewriting for React Router
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Proxy API requests to Node.js backend
    ProxyPreserveHost On
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api

    ErrorLog ${APACHE_LOG_DIR}/academic-scheduler-error.log
    CustomLog ${APACHE_LOG_DIR}/academic-scheduler-access.log combined
</VirtualHost>
```

Enable required Apache modules:
```bash
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo systemctl restart apache2
```

Add to `/etc/hosts`:
```text
127.0.0.1 academic-scheduler.local
```

## Step 12: Create Default Admin User

Run this SQL to create a default admin user:

```sql
INSERT INTO admin_users (username, password, email, role)
VALUES (
  'admin',
  '$2a$10$rH3YQ6Sf3lBR1PZxzLhZk.NqD5nqNLEGNJzNqV4aH9XOEBjPk5C9C', -- password: admin123
  'admin@academic-scheduler.local',
  'admin'
);
```

## Step 13: Build and Deploy

```bash
# Build the React application
npm run build

# Start the API server (in a separate terminal)
npm run api

# Or start both together
npm start
```

For production deployment with Apache:
```bash
# Build
npm run build

# Copy build to Apache directory
sudo cp -r dist/* /path/to/apache/academic-scheduler/

# Ensure API server runs as a service (using PM2)
npm install -g pm2
pm2 start server/index.js --name academic-scheduler-api
pm2 save
pm2 startup
```

## Step 14: Initial Setup

1. Open browser to `http://academic-scheduler.local`
2. Login with username: `admin`, password: `admin123`
3. Change the default password immediately
4. Create academic years, programs, terms
5. Import faculty, courses, and students
6. Configure time slots and settings
7. Start scheduling classes

## Key Features Included

### Core Functionality
- Multi-program support (different academic programs)
- Multi-year academic calendar management
- Term-based scheduling (3 terms per year)
- Faculty management with assignments
- Course management with sections and credits
- Student enrollment tracking
- Classroom and time slot management

### Advanced Scheduling
- Automated class scheduling with conflict detection
- Manual rescheduling with history tracking
- No-class periods (holidays, exams, breaks)
- Custom time slot configuration
- Sunday scheduling support
- 20-class limit per course (10 for 0.5 credit courses)
- Calendar regeneration from specific dates

### Calendar & Views
- Monthly calendar view with color-coded classes
- Weekly timetable view
- Term calendar with all scheduled classes
- Faculty course details and assignments
- Student schedules by section
- Rescheduling history logs

### Data Management
- CSV import for faculty, courses, students
- Bulk data operations
- Archive/restore system for academic years
- User invitation system
- Role-based access control (admin, faculty, staff)

### PDF Export
- Customizable PDF timetables
- Faculty-specific schedules
- Student section schedules
- Configurable headers and formatting

### Settings & Configuration
- Term date settings with automatic class period calculation
- Exam date configuration
- No-class periods management
- PDF export settings
- Custom time slot configuration
- Blocked days configuration

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U scheduler_admin -d academic_scheduler -c "SELECT NOW();"
```

### Apache Issues
```bash
# Check Apache is running
sudo systemctl status apache2

# Check error logs
sudo tail -f /var/log/apache2/error.log
```

### Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Production Considerations

1. **Security**
   - Use strong passwords for database and admin accounts
   - Configure firewall to restrict database access
   - Use HTTPS with SSL certificates
   - Implement proper session management
   - Enable CORS restrictions

2. **Performance**
   - Configure PostgreSQL connection pooling
   - Enable Apache caching
   - Optimize database queries with indexes
   - Use production build of React

3. **Backup**
   - Regular PostgreSQL backups
   - Backup uploaded CSV files
   - Version control for code

4. **Monitoring**
   - Set up logging for both frontend and backend
   - Monitor database performance
   - Track API response times

## Support

For issues or questions:
- Check PostgreSQL logs: `/var/log/postgresql/`
- Check Apache logs: `/var/log/apache2/`
- Check application logs in browser console
- Review database migrations for schema changes

## License

This is a custom academic scheduling system built with React, TypeScript, PostgreSQL, and Apache.
