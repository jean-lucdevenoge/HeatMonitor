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
AZURE_TENANT_ID=your_azure_tenant_id
AZURE_CLIENT_ID=your_azure_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret
```

**Important**: These are your Azure App Registration credentials for accessing Microsoft Graph API.

### 2. Azure App Registration Setup

You need to create an Azure App Registration to access the Outlook email:

1. **Go to Azure Portal** (portal.azure.com)
2. **Navigate to** Azure Active Directory > App registrations
3. **Click "New registration"**
   - Name: "Heating System Email Import"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: Leave blank for now
4. **Note down** the Application (client) ID and Directory (tenant) ID
5. **Create a client secret**:
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Add description and set expiration
   - **Copy the secret value immediately** (you won't see it again)
6. **Configure API permissions**:
   - Go to "API permissions"
   - Click "Add a permission"
   - Select "Microsoft Graph"
   - Choose "Application permissions"
   - Add these permissions:
     - `Mail.Read` (to read emails)
     - `Mail.ReadWrite` (to move emails)
     - `MailboxSettings.Read` (to access mailbox)
   - Click "Grant admin consent"

### 3. Email Account Configuration

Make sure the `solar@devenoge.net` account:
- Is part of your Azure AD tenant
- Has the necessary permissions
- Is accessible via Microsoft Graph API

### 4. Deploy the Function

```bash
# Deploy the function
supabase functions deploy nightly-email-import

# Set up the cron schedule
supabase functions schedule nightly-email-import --cron "0 1 * * *"
```

### 5. Test the Function

```bash
# Test manually
supabase functions invoke nightly-email-import
```

## How It Works

1. **Authentication**: Uses Azure Client Credentials flow to get an access token
2. **Email Reading**: Uses Microsoft Graph API to read unread emails from the inbox
3. **CSV Processing**: Checks each email for CSV attachments and imports the data
4. **Email Management**: Moves all processed emails to a "Backup" folder
5. **Error Handling**: Continues processing even if individual emails fail

## Security Notes

- Never commit Azure credentials to code
- Use environment variables for all credentials
- Regularly rotate client secrets
- Monitor function logs for security issues
- Use least-privilege permissions in Azure

## Customization

You can modify the function to:
- Change the schedule (edit cron.yaml)
- Filter emails by subject or sender
- Handle different CSV formats
- Add email notifications on success/failure
- Implement retry logic for failed imports
- Process emails from different folders

## Monitoring

Check the function logs in Supabase dashboard:
- Settings > Edge Functions > nightly-email-import > Logs

The function will log:
- Number of emails processed
- Number of records imported
- Any errors encountered
- Email movement operations
- Azure authentication status
