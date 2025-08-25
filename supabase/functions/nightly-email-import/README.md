# Nightly Email CSV Import Function

This Supabase Edge Function runs every night at 1:00 AM to:

1. Connect to the `solar@devenoge.net` email inbox
2. Check for new emails with CSV attachments
3. Import CSV data to the heating_data table
4. Move processed emails to the "Backup" folder

## Setup Instructions

### 1. Set Environment Variables

In your Supabase project dashboard, go to Settings > Edge Functions and add:

```
EMAIL_PASSWORD=your_email_app_password
```

**Important**: Use an App Password, not your regular email password for security.

### 2. Configure Email Provider

The function currently has placeholder implementations for email operations. You need to implement one of these approaches:

#### Option A: Gmail API (Recommended)
- Set up OAuth2 credentials in Google Cloud Console
- Use Gmail API to read emails and manage labels
- More secure and reliable than IMAP

#### Option B: IMAP Connection
- Use a library like `npm:imap` to connect directly
- Requires app password or OAuth2
- Works with most email providers

#### Option C: Microsoft Graph API
- For Outlook/Office 365 accounts
- Requires Azure app registration

### 3. Deploy the Function

```bash
# Deploy the function
supabase functions deploy nightly-email-import

# Set up the cron schedule
supabase functions schedule nightly-email-import --cron "0 1 * * *"
```

### 4. Test the Function

```bash
# Test manually
supabase functions invoke nightly-email-import
```

## Email Provider Setup

### Gmail Setup
1. Enable 2-factor authentication
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"
3. Use this app password in the `EMAIL_PASSWORD` environment variable

### Outlook/Office 365 Setup
1. Enable IMAP in Outlook settings
2. Use OAuth2 or app password
3. Update IMAP/SMTP server settings in the code

## Security Notes

- Never commit email passwords to code
- Use environment variables for all credentials
- Consider using OAuth2 instead of passwords
- Regularly rotate app passwords
- Monitor function logs for security issues

## Customization

You can modify the function to:
- Change the schedule (edit cron.yaml)
- Filter emails by subject or sender
- Handle different CSV formats
- Add email notifications on success/failure
- Implement retry logic for failed imports

## Monitoring

Check the function logs in Supabase dashboard:
- Settings > Edge Functions > nightly-email-import > Logs

The function will log:
- Number of emails processed
- Number of records imported
- Any errors encountered
- Email movement operations