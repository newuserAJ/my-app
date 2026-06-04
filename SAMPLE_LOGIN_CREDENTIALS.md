# Sample User Login Credentials

Your database has been successfully populated with 15 sample users using **phone number authentication**.

## Login Credentials

| # | Name | Phone Number | Password | Location |
|---|------|-------------|----------|----------|
| 1 | Aishvarya | `+919876543210` | `Aish@123` | Coimbatore |
| 2 | Bianca | `+919876543211` | `Bian@123` | Chennai |
| 3 | Deepthi | `+919876543212` | `Deep@123` | Madurai |
| 4 | Dhilip | `+919876543213` | `Dhil@123` | Coimbatore |
| 5 | Harshini | `+919876543214` | `Harsh@123` | Ramanathapuram |
| 6 | Indrajit | `+919876543215` | `Indra@123` | Coimbatore |
| 7 | Iswaryaa | `+919876543216` | `Iswar@123` | Erode |
| 8 | Jenitha | `+919876543217` | `Jeni@123` | Chittoor |
| 9 | Keerthi | `+919876543218` | `Keer@123` | Coimbatore |
| 10 | Mokshith | `+919876543219` | `Moksh@123` | Hosur |
| 11 | Preetham | `+919876543220` | `Preet@123` | Salem |
| 12 | Rishitha | `+919876543221` | `Rishi@123` | Kolkata |
| 13 | Roshini | `+919876543222` | `Roshi@123` | Salem |
| 14 | Sneha | `+919876543223` | `Sneha@123` | Coimbatore |
| 15 | Swetha | `+919876543224` | `Sweth@123` | Coimbatore |

## Quick Test Examples

### Test Login 1 - Aishvarya
```
Phone: +91 9876543210
Password: Aish@123
```

### Test Login 2 - Bianca  
```
Phone: +91 9876543211
Password: Bian@123
```

### Test Login 3 - Keerthi
```
Phone: +91 9876543218
Password: Keer@123
```

## User Profile Information

All users are **Software Engineers from PSG** with rich profile data:

- **Companies**: Microsoft, Wipro, Deloitte, JPMC, Oracle, Cisco, Morgan Stanley, Walmart, Astra Zeneca, Societe Generale, Medibuddy
- **Languages**: Tamil, Telugu, Hindi
- **Locations**: Coimbatore, Chennai, Salem, Madurai, etc.
- **Interests**: Movies, Music, Books, Cricket, Gaming, Art, Cooking, Tech, etc.

## Password Pattern

All passwords follow the pattern: `{FirstFewLettersOfName}@123`

Examples:
- Aishvarya → `Aish@123`
- Bianca → `Bian@123`
- Dhilip → `Dhil@123`

## Phone Number Pattern

All phone numbers follow: `+91987654321{X}` where X is 0-4

This makes them easy to remember and distinguishable from real user accounts.

## Commands for Managing Sample Data

```bash
cd backend

# Check existing users
npm run seed:phone:basic:check

# Show credentials table
npm run seed:phone:basic:credentials

# Clear sample users
npm run seed:phone:basic:clear

# Re-seed fresh data
npm run seed:phone:basic:fresh
```

## Usage in Your App

### Frontend Login Form
Use these credentials in your app's login form:
- Phone number field: `+919876543210`
- Password field: `Aish@123`

### Testing Different Users
- Test with users from different cities for location features
- Test with users from different companies for professional features  
- Test with users having different interests for recommendation features

### API Testing
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210",
    "password": "Aish@123"
  }'
```

## Security Notes

⚠️ **Important for Production:**
- These are sample accounts for development/testing only
- All passwords are intentionally simple and predictable
- Phone numbers use a fake range (+91987654321X)
- Never use these credentials in production
- Always implement proper user registration in production

## Profile Data Available

Each user profile contains:
- **Basic Info**: First name, last name, phone number
- **Location**: Indian cities (great for geo-based features)
- **Bio**: Rich biographical information including company, school, interests, language
- **Company Info**: Embedded in bio (since company field isn't in current schema)
- **Interests**: Embedded in bio (since interests field isn't in current schema)

## Next Steps

1. **Test your authentication flow** with these credentials
2. **Build user profile displays** using the available data
3. **Test location-based features** with users from different cities
4. **Consider schema upgrade** if you need structured company/interests data (see `UPGRADE_DATABASE.md`)

Happy testing! 🚀