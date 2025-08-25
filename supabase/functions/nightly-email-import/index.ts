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

interface AzureTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
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

    // Azure/Outlook configuration
    const azureConfig = {
      email: 'solar@devenoge.net',
      tenantId: Deno.env.get('AZURE_TENANT_ID') ?? '',
      clientId: Deno.env.get('AZURE_CLIENT_ID') ?? '',
      clientSecret: Deno.env.get('AZURE_CLIENT_SECRET') ?? '',
    }

    if (!azureConfig.tenantId || !azureConfig.clientId || !azureConfig.clientSecret) {
      throw new Error('Azure credentials not properly configured. Need AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET')
    }

    // Get Azure access token
    const accessToken = await getAzureAccessToken(azureConfig)
    
    // Connect to email inbox
    const emails = await checkInbox(azureConfig, accessToken)
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
        await moveEmailToBackup(azureConfig, accessToken, email.id)
        console.log(`Moved email to Backup folder: ${email.subject}`)
        processedCount++

      } catch (emailError) {
        console.error(`Error processing email ${email.id}:`, emailError)
        // Still try to move to backup even if processing failed
        try {
          await moveEmailToBackup(azureConfig, accessToken, email.id)
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

// Function to get Azure access token using client credentials flow
async function getAzureAccessToken(config: any): Promise<string> {
  try {
    console.log('Getting Azure access token...')
    
    const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`
    
    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get Azure token: ${response.status} ${errorText}`)
    }

    const tokenData: AzureTokenResponse = await response.json()
    console.log('Successfully obtained Azure access token')
    
    return tokenData.access_token
    
  } catch (error) {
    console.error('Error getting Azure access token:', error)
    throw error
  }
}

// Function to check inbox for new emails using Microsoft Graph API
async function checkInbox(config: any, accessToken: string): Promise<EmailMessage[]> {
  try {
    console.log('Connecting to email inbox...')
    
    // Get messages from inbox using Microsoft Graph API
    const messagesUrl = `https://graph.microsoft.com/v1.0/users/${config.email}/messages?$filter=isRead eq false&$expand=attachments`
    
    const response = await fetch(messagesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch emails: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const messages = data.value || []
    
    console.log(`Found ${messages.length} unread emails`)
    
    // Convert to our EmailMessage format
    const emails: EmailMessage[] = messages.map((msg: any) => ({
      id: msg.id,
      subject: msg.subject || 'No Subject',
      from: msg.from?.emailAddress?.address || 'Unknown',
      date: msg.receivedDateTime,
      body: msg.body?.content || '',
      attachments: (msg.attachments || []).map((att: any) => ({
        filename: att.name || 'unknown.txt',
        contentType: att.contentType || 'application/octet-stream',
        content: att.contentBytes || '' // This is already base64 encoded from Graph API
      }))
    }))
    
    console.log(`Processed ${emails.length} emails for import`)
    
    return emails
    
  } catch (error) {
    console.error('Error checking inbox:', error)
    throw error
  }
}

// Function to move email to Backup folder using Microsoft Graph API
async function moveEmailToBackup(config: any, accessToken: string, emailId: string): Promise<void> {
  try {
    console.log(`Moving email ${emailId} to Backup folder...`)
    
    // First, get or create the Backup folder
    const foldersUrl = `https://graph.microsoft.com/v1.0/users/${config.email}/mailFolders`
    
    const foldersResponse = await fetch(foldersUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!foldersResponse.ok) {
      throw new Error(`Failed to get folders: ${foldersResponse.status}`)
    }

    const foldersData = await foldersResponse.json()
    let backupFolder = foldersData.value.find((folder: any) => folder.displayName === 'Backup')
    
    // Create Backup folder if it doesn't exist
    if (!backupFolder) {
      console.log('Creating Backup folder...')
      const createFolderResponse = await fetch(foldersUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: 'Backup'
        })
      })
      
      if (createFolderResponse.ok) {
        backupFolder = await createFolderResponse.json()
        console.log('Backup folder created successfully')
      } else {
        throw new Error(`Failed to create Backup folder: ${createFolderResponse.status}`)
      }
    }
    
    // Move the email to Backup folder
    const moveUrl = `https://graph.microsoft.com/v1.0/users/${config.email}/messages/${emailId}/move`
    
    const moveResponse = await fetch(moveUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destinationId: backupFolder.id
      })
    })

    if (!moveResponse.ok) {
      const errorText = await moveResponse.text()
      throw new Error(`Failed to move email: ${moveResponse.status} ${errorText}`)
    }
    
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