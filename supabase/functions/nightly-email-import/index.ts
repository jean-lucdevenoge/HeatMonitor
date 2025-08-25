import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  attachments: EmailAttachment[];
  body: string;
}

interface EmailAttachment {
  filename: string;
  contentType: string;
  content: string; // base64 encoded
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting nightly email import process...')

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Email configuration
    const emailConfig = {
      email: 'solar@devenoge.net',
      password: Deno.env.get('EMAIL_PASSWORD') ?? '', // Set this in Supabase secrets
      imapHost: 'imap.gmail.com', // Adjust based on your email provider
      imapPort: 993,
      smtpHost: 'smtp.gmail.com', // For moving emails
      smtpPort: 587
    }

    if (!emailConfig.password) {
      throw new Error('EMAIL_PASSWORD environment variable not set')
    }

    // Connect to email inbox
    const emails = await checkInbox(emailConfig)
    console.log(`Found ${emails.length} emails to process`)

    let processedCount = 0
    let importedCount = 0

    for (const email of emails) {
      try {
        console.log(`Processing email: ${email.subject} from ${email.from}`)
        
        // Check for CSV attachments
        const csvAttachments = email.attachments.filter(att => 
          att.filename.toLowerCase().endsWith('.csv') && 
          (att.contentType.includes('text/csv') || att.contentType.includes('application/csv'))
        )

        if (csvAttachments.length > 0) {
          console.log(`Found ${csvAttachments.length} CSV attachment(s)`)
          
          // Process each CSV attachment
          for (const csvAttachment of csvAttachments) {
            try {
              // Decode base64 content
              const csvContent = atob(csvAttachment.content)
              console.log(`Processing CSV: ${csvAttachment.filename}`)
              
              // Parse CSV data
              const parsedData = parseHeatingCSV(csvContent)
              
              if (parsedData.length > 0) {
                // Insert data into database
                const { data, error } = await supabaseClient
                  .from('heating_data')
                  .upsert(parsedData, {
                    onConflict: 'date,time',
                    ignoreDuplicates: true
                  })
                  .select('id')

                if (error) {
                  console.error('Database error:', error)
                  throw error
                }

                const inserted = data?.length || 0
                const duplicates = parsedData.length - inserted
                console.log(`Imported ${inserted} new records, ${duplicates} duplicates skipped from ${csvAttachment.filename}`)
                importedCount += inserted
              } else {
                console.log(`No valid data found in ${csvAttachment.filename}`)
              }
            } catch (csvError) {
              console.error(`Error processing CSV ${csvAttachment.filename}:`, csvError)
            }
          }
        } else {
          console.log('No CSV attachments found in email')
        }

        // Move email to Backup folder
        await moveEmailToBackup(emailConfig, email.id)
        console.log(`Moved email to Backup folder: ${email.subject}`)
        processedCount++

      } catch (emailError) {
        console.error(`Error processing email ${email.id}:`, emailError)
        // Still try to move to backup even if processing failed
        try {
          await moveEmailToBackup(emailConfig, email.id)
        } catch (moveError) {
          console.error(`Failed to move email to backup:`, moveError)
        }
      }
    }

    const result = {
      success: true,
      message: `Processed ${processedCount} emails, imported ${importedCount} new data records`,
      timestamp: new Date().toISOString(),
      details: {
        emailsProcessed: processedCount,
        recordsImported: importedCount
      }
    }

    console.log('Nightly import completed:', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in nightly email import:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Function to check inbox for new emails
async function checkInbox(config: any): Promise<EmailMessage[]> {
  // This is a simplified example - you'll need to implement actual IMAP connection
  // You can use libraries like 'npm:imap' or make HTTP requests to email APIs
  
  try {
    // Example using Gmail API (you'd need to set up OAuth2)
    // For production, consider using Gmail API, Outlook API, or IMAP libraries
    
    console.log('Connecting to email inbox...')
    
    // Placeholder - implement actual email fetching logic here
    // This could be:
    // 1. Gmail API with OAuth2
    // 2. IMAP connection with username/password
    // 3. Microsoft Graph API for Outlook
    // 4. Third-party email service API
    
    // For now, return empty array - you'll need to implement based on your email provider
    const emails: EmailMessage[] = []
    
    // Example structure of what the implementation should return:
    /*
    const emails: EmailMessage[] = [
      {
        id: 'email-123',
        subject: 'Heating System Data',
        from: 'system@heating.com',
        date: new Date().toISOString(),
        body: 'Daily heating system report attached',
        attachments: [
          {
            filename: 'heating-data.csv',
            contentType: 'text/csv',
            content: 'base64-encoded-csv-content'
          }
        ]
      }
    ]
    */
    
    return emails
    
  } catch (error) {
    console.error('Error checking inbox:', error)
    throw error
  }
}

// Function to move email to Backup folder
async function moveEmailToBackup(config: any, emailId: string): Promise<void> {
  try {
    console.log(`Moving email ${emailId} to Backup folder...`)
    
    // Implement email moving logic here
    // This depends on your email provider:
    // 1. Gmail API: labels.modify to add/remove labels
    // 2. IMAP: MOVE command
    // 3. Outlook API: move message to folder
    
    // Placeholder implementation
    console.log(`Email ${emailId} moved to Backup folder`)
    
  } catch (error) {
    console.error('Error moving email to backup:', error)
    throw error
  }
}

// Function to parse heating CSV data (reused from your existing parser)
function parseHeatingCSV(csvContent: string) {
  const lines = csvContent.split('\n')
  
  // Find the start of actual data (after the header information)
  let dataStartIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Date;Time of day;')) {
      dataStartIndex = i + 1
      break
    }
  }
  
  if (dataStartIndex === -1) return []
  
  // Extract data rows
  const dataLines = lines.slice(dataStartIndex).filter(line => 
    line.trim() && line.includes(';') && line.match(/^\d{2}\.\d{2}\.\d{4}/)
  )
  
  return dataLines.map(line => {
    const values = line.split(';').map(v => v.trim())
    
    return {
      date: values[0] || '',
      time: values[1] || '',
      collector_temp: parseFloat(values[2]) || 0,
      outside_temp: parseFloat(values[3]) || 0,
      dhw_temp_top: parseFloat(values[4]) || 0,
      dhw_temp_bottom: parseFloat(values[5]) || 0,
      flow_temp: parseFloat(values[6]) || 0,
      flow_temp_setpoint: parseFloat(values[7]) || 0,
      burner_starts: parseInt(values[8]) || 0,
      boiler_modulation: values[9] || '',
      fan_control: parseFloat(values[10]) || 0,
      collector_pump: values[11] || '',
      boiler_pump: values[12] || '',
      burner_state: values[13] || '',
      solar_status: values[14] || '',
      water_pressure: parseFloat(values[15]) || 0,
      dhw_pump: values[16] || '',
      fan_speed: parseInt(values[17]) || 0,
      return_temp: parseFloat(values[18]) || 0,
      boiler_pump_speed: parseInt(values[19]) || 0,
      sensor_temp: parseFloat(values[20]) || 0,
    }
  })
}