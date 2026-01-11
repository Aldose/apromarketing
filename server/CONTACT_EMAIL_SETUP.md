# Contact Form Email Setup

## Overview
The contact form is now configured to send emails to **contact@a-pro.ai** when submissions are received.

## Current Configuration

### Email Destination
- **Recipient**: `contact@a-pro.ai` (set via `MAILER_RECIPIENT` environment variable)
- **Subject**: "Contact Form Submission"
- **Content**: Formatted message with Name, Email, and Message from the form

### Environment Variables Required
To enable email sending, configure these variables in your `.env` file:

```env
# Email Configuration
MAILER_EMAIL=your-sender-email@a-pro.ai        # The email account to send from
MAILER_PASSWORD=your-email-password             # Password for the sender email
MAILER_RECIPIENT=contact@a-pro.ai              # Where contact forms are sent
```

### Email Provider Settings
The mailer is configured for:
- **Host**: `redbull.mxrouting.net`
- **Port**: `465`
- **Security**: SSL/TLS

## Development Mode
When email credentials are not configured, the contact form will:
- ✅ Still accept form submissions
- 📝 Log submissions to console
- 💾 Save to database (if MongoDB connected)
- 📧 Show what email would be sent

## Production Setup
1. **Configure Email Credentials**: Set up the environment variables with actual credentials
2. **Test Email Delivery**: Submit a test contact form to verify emails reach contact@a-pro.ai
3. **Monitor**: Check server logs for any email delivery issues

## Form Features
- ✅ **Input Validation**: Name, email, and message are required and validated
- ✅ **Spam Protection**: Uses Joi validation schema
- ✅ **Database Storage**: Saves submissions when MongoDB is connected
- ✅ **Email Notifications**: Sends formatted emails to contact@a-pro.ai
- ✅ **HTMX Integration**: Seamless form submission without page refresh
- ✅ **Internationalization**: Works with multiple language routes

## Routes Available
- `GET /contact` - Display contact form
- `GET /:lang/contact` - Display contact form (language-specific)
- `POST /contact` - Handle form submission
- `POST /:lang/contact` - Handle form submission (language-specific)

## Email Format
```
Subject: Contact Form Submission

New contact form submission:

Name: [User's Name]
Email: [User's Email]
Message: [User's Message]
```

## Testing
1. Navigate to `http://localhost:8888/contact`
2. Fill out the form with test data
3. Submit and check console logs for email simulation
4. Verify success message appears