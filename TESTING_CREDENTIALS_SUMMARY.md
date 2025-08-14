# TESTING CREDENTIALS - LOCAL DATABASE ONLY

## 🔐 Temporary Login Credentials

The following temporary passwords have been set in the **LOCAL SQLite database ONLY** for timezone interface testing:

### Student 1: Mia Pleitel
- **Email:** `pleitelmia@gmail.com`
- **Password:** `Testing123!`
- **Student ID:** EST-2025-031
- **Course:** 4to Año C
- **Subjects:** Física, Química

### Student 2: Bianca Nazareth Picone
- **Email:** `bncpicone@gmail.com`
- **Password:** `Testing123!`
- **Student ID:** EST-2025-078
- **Course:** 5to Año A
- **Subjects:** Física, Química

## 🧪 Testing Instructions

1. **Start Local Development Server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Login Page:**
   ```
   http://localhost:3000/auth/signin
   ```

3. **Test Login Flow:**
   - Use either email address above
   - Password: `Testing123!`
   - Verify successful authentication

4. **Test Timezone Interface:**
   - Submit progress reports
   - Check calendar functionality
   - Verify data persistence

## ⚠️ Important Notes

- **LOCAL TESTING ONLY:** These passwords are set in the local SQLite database only
- **PRODUCTION SAFE:** Production database is NOT affected
- **TEMPORARY:** These are temporary credentials for testing purposes
- **BCRYPT HASHED:** Passwords are properly hashed with bcrypt (cost factor 12)
- **VERIFIED:** Both passwords have been verified to work correctly

## 🔧 Technical Details

- **Database File:** `./prisma/data/intellego.db` (Local SQLite)
- **Hashing Algorithm:** bcrypt with 12 rounds
- **Script Used:** `set-temp-passwords-local.js`
- **Verification:** `verify-temp-passwords.js`

## 🗑️ Cleanup

After testing is complete, you can:

1. **Reset Passwords:** Run a cleanup script to remove temporary passwords
2. **Restore Database:** Replace with a clean backup if needed
3. **No Action Required:** These are local-only changes and don't affect production

## 📝 Test Checklist

- [ ] Login with Mia Pleitel credentials
- [ ] Login with Bianca Nazareth Picone credentials
- [ ] Test timezone interface functionality
- [ ] Submit progress reports
- [ ] Verify data persistence
- [ ] Check calendar integration
- [ ] Test logout functionality

---

**Generated:** $(date)  
**Purpose:** Timezone interface testing  
**Database:** Local SQLite only  
**Status:** Ready for testing  