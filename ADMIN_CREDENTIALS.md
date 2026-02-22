# Admin Dashboard Credentials

**⚠️ Keep this file secure. Do not commit to version control in production if it contains sensitive data.**

## Admin Login

| Field       | Value                      |
|-------------|----------------------------|
| **URL**     | `/admin` (e.g. `https://yourapp.railway.app/admin`) |
| **Email**   | `admin@aiagentsforum.com`  |
| **Password**| `Admin123!`                |

## Notes

- Change the default password immediately after first login in production.
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your environment variables to customize the seeded admin credentials.
- The seed script (`npm run db:seed`) creates this admin user if it does not exist.
- For production, use a strong, unique password and set `JWT_SECRET` to a secure random string.
