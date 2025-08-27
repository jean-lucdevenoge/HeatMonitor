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

        // Also check for Excel content type that might be CSV
        const excelCsvAttachments = email.attachments.filter(att => 
          att.filename.toLowerCase().endsWith('.csv') && 
          att.contentType.includes('application/vnd.ms-excel')
        )
        
        // Combine both types
        const allCsvAttachments = [...csvAttachments, ...excelCsvAttachments]
        
        console.log(`Found ${csvAttachments.length} standard CSV attachments`)
        console.log(`Found ${excelCsvAttachments.length} Excel-type CSV attachments`)
        console.log(`Total CSV attachments to process: ${allCsvAttachments.length}`)
        if (allCsvAttachments.length > 0) {
          console.log(`Found ${allCsvAttachments.length} CSV attachment(s)`)
          
          // Process each CSV attachment
          for (const csvAttachment of allCsvAttachments) {
            try {
              console.log(`=== PROCESSING ATTACHMENT: ${csvAttachment.filename} ===`)
              console.log(`Content Type: ${csvAttachment.contentType}`)
              console.log(`Content Length: ${csvAttachment.content?.length || 0} characters`)
              console.log(`Content exists: ${!!csvAttachment.content}`)
              
              if (!csvAttachment.content) {
                console.log(`❌ No content found in attachment ${csvAttachment.filename}`)
                continue
              }
              
              // Decode base64 content
              let csvContent = ''
              try {
                csvContent = atob(csvAttachment.content)
                console.log(`✅ Successfully decoded base64 content`)
              } catch (decodeError) {
                console.log(`❌ Failed to decode base64 content:`, decodeError)
                console.log(`Raw content preview (first 200 chars): "${csvAttachment.content.substring(0, 200)}"`)
                // Try using content directly if it's not base64
                csvContent = csvAttachment.content
                console.log(`Trying to use content directly...`)
              }
              
              console.log(`Processing CSV: ${csvAttachment.filename}`)
              console.log(`CSV content length: ${csvContent.length} characters`)
              console.log(`CSV content is empty: ${csvContent.length === 0}`)
              
              if (csvContent.length === 0) {
                console.log(`❌ CSV content is empty after decoding`)
                continue
              }
              
              // Parse CSV data
              const parsedData = parseHeatingCSV(csvContent)
              console.log(`Parsed ${parsedData.length} data points from CSV`)
              
              if (parsedData.length === 0) {
                console.log('❌ No data was parsed from CSV - checking CSV format...')
                const lines = csvContent.split('\n')
                console.log(`CSV has ${lines.length} lines`)
                console.log('CSV structure analysis completed (data not logged for privacy)')
              }
              
              if (parsedData.length > 0) {
                console.log(`Attempting to insert ${parsedData.length} records into database...`)
                
                // Log sample of data being inserted for debugging
                console.log('📊 Sample data being inserted:')
                parsedData.slice(0, 3).forEach((record, i) => {
                  console.log(`  ${i + 1}. Date: "${record.date}", Time: "${record.time}", Collector: ${record.collector_temp}°C`)
                })
                
                // Check for existing data first to avoid duplicates
                console.log('🔍 Checking for existing data...')
                const existingDataCheck = await supabaseClient
                  .from('heating_data')
                  .select('date, time')
                  .in('date', [...new Set(parsedData.map(r => r.date))])
                
                const existingKeys = new Set()
                if (existingDataCheck.data) {
                  existingDataCheck.data.forEach(row => {
                    existingKeys.add(`${row.date}_${row.time}`)
                  })
                }
                
                // Filter out existing records
                const newRecords = parsedData.filter(record => {
                  const key = `${record.date}_${record.time}`
                  return !existingKeys.has(key)
                })
                
                console.log(`📊 Found ${parsedData.length} total records, ${newRecords.length} are new, ${parsedData.length - newRecords.length} already exist`)
                
                if (newRecords.length === 0) {
                  console.log('ℹ️ No new records to insert - all data already exists')
                  continue
                }
                
                // Insert only new data
                const { data: upsertedData, error } = await supabaseClient
                  .from('heating_data')
                  .insert(newRecords)
                  .select('id')

                if (error) {
                  console.error('❌ Database insertion error:', error)
                  console.error('Error details:', JSON.stringify(error, null, 2))
                  
                  // Log problematic data for debugging
                  if (error.message && error.message.includes('date')) {
                    console.error('🔍 Date format issue detected. Sample dates from CSV:')
                    newRecords.slice(0, 5).forEach((record, i) => {
                      console.error(`  ${i + 1}. "${record.date}" (format: ${record.date.match(/^\d{2}\.\d{2}\.\d{4}$/) ? 'DD.MM.YYYY ✅' : 'INVALID ❌'})`)
                    })
                  }
                  
                  throw error
                } else {
                  const inserted = upsertedData?.length || 0
                  console.log(`✅ Successfully inserted ${inserted} new records from ${csvAttachment.filename}`)
                  importedCount += inserted
                  
                  // Calculate energy for the date from the CSV filename
                  if (inserted > 0) {
                    console.log(`🔋 Calculating energy for CSV file: ${csvAttachment.filename}`)
                    await calculateEnergyForCsvData(supabaseClient, parsedData)
                  }
                }

              } else {
                console.log(`❌ No valid data found in ${csvAttachment.filename}`)
              }
            } catch (csvError) {
              console.error(`❌ Error processing CSV ${csvAttachment.filename}:`, csvError)
              console.error('CSV Error details:', JSON.stringify(csvError, null, 2))
            }
          }
        } else {
          console.log('ℹ️ No CSV attachments found in email')
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
    
    // Direct approach: Get messages from Inbox folder only
    console.log('📧 FETCHING MESSAGES FROM INBOX FOLDER ONLY...')
    
    // Use the well-known Inbox folder directly
    const inboxUrl = `https://graph.microsoft.com/v1.0/users/${config.email}/mailFolders/inbox/messages?$expand=attachments&$orderby=receivedDateTime desc&$top=50`
    
    const response = await fetch(inboxUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ FAILED TO GET MESSAGES FROM INBOX: ${response.status}`)
      console.error(`Error details: ${errorText}`)
      throw new Error(`Failed to fetch inbox messages: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const messages = data.value || []
    console.log(`✅ FOUND ${messages.length} MESSAGES IN INBOX`)
    
    if (messages.length > 0) {
      console.log('=== SAMPLE MESSAGES FROM INBOX ===')
      messages.slice(0, 3).forEach((msg: any, index: number) => {
        console.log(`📨 MESSAGE ${index + 1}:`)
        console.log(`   - Subject: "${msg.subject}"`)
        console.log(`   - From: ${msg.from?.emailAddress?.address}`)
        console.log(`   - Date: ${msg.receivedDateTime}`)
        console.log(`   - Is Read: ${msg.isRead}`)
        console.log(`   - Attachments: ${msg.attachments?.length || 0}`)
        if (msg.attachments && msg.attachments.length > 0) {
          msg.attachments.forEach((att: any, attIndex: number) => {
            console.log(`     📎 Attachment ${attIndex + 1}: ${att.name} (${att.contentType})`)
          })
        }
        console.log('   ---')
      })
      console.log('=== END SAMPLE MESSAGES ===')
    }
    
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
        content: att.contentBytes || ''
      }))
    }))
    
    console.log(`Successfully processed ${emails.length} emails from INBOX only`)
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
  console.log('🔍 Starting CSV parsing...')
  
  const lines = csvContent.split('\n')
  console.log(`CSV has ${lines.length} total lines`)
  
  // Find the start of actual data (after the header information)
  let dataStartIndex = -1
  for (let i = 0; i < lines.length; i++) {
    console.log(`Checking line ${i}: "${lines[i].substring(0, 50)}..."`)
    if (lines[i].includes('Date;Time of day;')) {
      dataStartIndex = i + 1
      console.log(`✅ Found data header at line ${i}, data starts at line ${dataStartIndex}`)
      break
    }
  }
  
  if (dataStartIndex === -1) {
    console.log('❌ Could not find data header "Date;Time of day;" in CSV')
    console.log('Looking for alternative headers...')
    
    // Try alternative header patterns
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i].toLowerCase()
      if (line.includes('date') && line.includes('time')) {
        console.log(`Found alternative header at line ${i}: "${lines[i]}"`)
        dataStartIndex = i + 1
        break
      }
    }
    
    if (dataStartIndex === -1) {
      console.log('❌ No suitable header found, showing first 20 lines for debugging:')
      console.log('CSV structure analysis completed (content not logged for privacy)')
      return []
    }
  }
  
  // Extract data rows
  const dataLines = lines.slice(dataStartIndex).filter(line => 
    line.trim() && line.includes(';') && line.match(/^\d{2}\.\d{2}\.\d{4}/)
  )
  
  console.log(`Found ${dataLines.length} valid data lines after filtering`)
  if (dataLines.length > 0) {
    console.log('Valid data lines found (content not logged for privacy)')
  }
  
  // Date validation: must be after 21.08.2024
  const minDate = new Date('2024-08-21')
  
  const parsedRecords = dataLines.map((line, index) => {
    const values = line.split(';').map(v => v.trim())
    
    // Validate and keep the original DD.MM.YYYY format for the date field
    const originalDate = values[0] || ''
    
    // Validate date format
    if (!originalDate.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      console.log(`⚠️ Invalid date format at line ${index}: "${originalDate}"`)
      return null // Skip invalid dates
    }
    
    // Check if date is after minimum date (21.08.2024)
    const [day, month, year] = originalDate.split('.')
    const recordDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    
    if (recordDate < minDate) {
      console.log(`⚠️ Date before minimum (21.08.2024) at line ${index}: "${originalDate}"`)
      return null // Skip dates before minimum
    }
    
    const record = {
      date: originalDate,
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
    
    return record
  }).filter(record => record !== null) // Remove null records (invalid dates)
  
  // Sort the records by date and time to ensure proper chronological order
  parsedRecords.sort((a, b) => {
    // Convert DD.MM.YYYY to YYYY-MM-DD for proper comparison
    const dateA = a.date.split('.').reverse().join('-')
    const dateB = b.date.split('.').reverse().join('-')
    
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB)
    }
    
    // If dates are the same, sort by time
    return a.time.localeCompare(b.time)
  })
  
  console.log(`✅ Successfully parsed ${parsedRecords.length} records`)
  
  if (parsedRecords.length > 0) {
    console.log(`📅 Date range: ${parsedRecords[0].date} ${parsedRecords[0].time} to ${parsedRecords[parsedRecords.length - 1].date} ${parsedRecords[parsedRecords.length - 1].time}`)
  }
  
  return parsedRecords
}

// Function to calculate energy for dates found in the CSV data
async function calculateEnergyForCsvData(supabaseClient: any, parsedData: any[]) {
  try {
    console.log(`🔋 Starting energy calculation for CSV data with ${parsedData.length} records`)
    
    if (!parsedData || parsedData.length === 0) {
      console.log(`⚠️ No parsed data provided for energy calculation`)
      return
    }
    
    // Get unique dates from the CSV data
    const uniqueDates = [...new Set(parsedData.map(record => record.date))]
    console.log(`📅 Found ${uniqueDates.length} unique dates in CSV data:`, uniqueDates)
    
    // Calculate energy for each unique date
    for (const csvDate of uniqueDates) {
      await calculateEnergyForDate(supabaseClient, csvDate)
    }
    
  } catch (error) {
    console.error(`❌ Error calculating energy for CSV data:`, error)
    throw error
  }
}

// Function to calculate energy for a specific date
async function calculateEnergyForDate(supabaseClient: any, csvDate: string) {
  try {
    console.log(`🔋 Starting energy calculation for date: ${csvDate}`)
    
    // Convert DD.MM.YYYY to YYYY-MM-DD for database queries
    const [day, month, year] = csvDate.split('.')
    const dbDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    
    console.log(`🔍 Date conversion: ${csvDate} -> ${dbDate}`)
    console.log(`🔍 Looking for heating data on date: ${csvDate}`)
    
    // Check if energy calculation already exists for this date
    const { data: existingCalc, error: existingError } = await supabaseClient
      .from('energy_calculations')
      .select('id')
      .eq('date', dbDate)
      .single()
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('❌ Error checking existing calculations:', existingError)
      throw existingError
    }
    
    if (existingCalc) {
      console.log(`⏭️ Energy calculation already exists for ${csvDate}, skipping`)
      return
    }
    
    // Get heating data for this specific date
    const { data: dayData, error: fetchError } = await supabaseClient
      .from('heating_data')
      .select('*')
      .eq('date', csvDate)
      .order('time')
    
    if (fetchError) {
      console.error('❌ Error fetching heating data:', fetchError)
      throw fetchError
    }
    
    if (!dayData || dayData.length === 0) {
      console.log(`❌ No heating data found for date ${csvDate}`)
      console.log(`🔍 Let's check what dates are actually in the database...`)
      
      // Debug: Check what dates are available
      const { data: availableDates, error: datesError } = await supabaseClient
        .from('heating_data')
        .select('date')
        .order('date')
        .limit(10)
      
      if (!datesError && availableDates) {
        console.log(`📅 Available dates in database:`, availableDates.map(d => d.date))
      }
      
      return
    }
    
    console.log(`📊 Found ${dayData.length} data points for ${csvDate}`)
    console.log(`📅 Date range in data: ${dayData[0]?.date} ${dayData[0]?.time} to ${dayData[dayData.length-1]?.date} ${dayData[dayData.length-1]?.time}`)
    
    // Debug: Show sample of data
    console.log('=== SAMPLE DATA FOR ENERGY CALCULATION ===')
    dayData.slice(0, 3).forEach((record, i) => {
      console.log(`${i + 1}: Time="${record.time}" CollectorTemp=${record.collector_temp} SensorTemp=${record.sensor_temp} SolarStatus="${record.solar_status || 'null'}" DHWPump="${record.dhw_pump || 'null'}" BoilerMod="${record.boiler_modulation || 'null'}"`)
    })
    console.log('=== END SAMPLE ===')
    
    // Initialize energy calculations
    let solarEnergyKwh = 0
    let gasEnergyKwh = 0
    let solarActiveMinutes = 0
    let gasActiveMinutes = 0
    
    // Debug counters
    let solarActiveCount = 0
    let gasActiveCount = 0
    let solarPowerCount = 0
    let gasPowerCount = 0
    
    // Temperature and pressure calculations
    const collectorTemps = dayData.map(d => Number(d.collector_temp) || 0).filter(t => t > 0)
    const dhwTemps = dayData.map(d => Number(d.dhw_temp_top) || 0).filter(t => t > 0)
    const outsideTemps = dayData.map(d => Number(d.outside_temp) || 0).filter(t => t !== 0)
    const waterPressures = dayData.map(d => Number(d.water_pressure) || 0).filter(p => p > 0)
    
    const avgCollectorTemp = collectorTemps.length > 0 ? 
      collectorTemps.reduce((sum, t) => sum + t, 0) / collectorTemps.length : 0
    const avgDhwTemp = dhwTemps.length > 0 ? 
      dhwTemps.reduce((sum, t) => sum + t, 0) / dhwTemps.length : 0
    const avgOutsideTemp = outsideTemps.length > 0 ? 
      outsideTemps.reduce((sum, t) => sum + t, 0) / outsideTemps.length : 0
    const avgWaterPressure = waterPressures.length > 0 ? 
      waterPressures.reduce((sum, p) => sum + p, 0) / waterPressures.length : 0
    
    const maxCollectorTemp = collectorTemps.length > 0 ? Math.max(...collectorTemps) : 0
    const maxDhwTemp = dhwTemps.length > 0 ? Math.max(...dhwTemps) : 0
    const minOutsideTemp = outsideTemps.length > 0 ? Math.min(...outsideTemps) : 0
    const maxOutsideTemp = outsideTemps.length > 0 ? Math.max(...outsideTemps) : 0
    
    // Calculate energy for each data point (1-minute intervals)
    const intervalMinutes = 1
    const intervalHours = intervalMinutes / 60 // 1/60 = 0.0167 hours
    
    dayData.forEach((record, index) => {
      try {
        // Solar energy calculation
        const solarStatus = String(record.solar_status || '')
        const collectorPump = String(record.collector_pump || '')
        const isSolarActive = solarStatus.includes('Charging') || collectorPump === 'On'
        
        // Debug first few records
        if (index < 5) {
          console.log(`Record ${index}: SolarStatus="${solarStatus}" CollectorPump="${collectorPump}" IsSolarActive=${isSolarActive}`)
        }
        
        if (isSolarActive) {
          solarActiveCount++
          solarActiveCount++
          solarActiveMinutes += intervalMinutes
          const collectorTemp = Number(record.collector_temp) || 0
          const sensorTemp = Number(record.sensor_temp) || 0
          const tempDiff = collectorTemp - sensorTemp
          
          // Debug first few solar active records
          if (solarActiveCount <= 5) {
            console.log(`Solar Active ${solarActiveCount}: CollectorTemp=${collectorTemp} SensorTemp=${sensorTemp} TempDiff=${tempDiff}`)
          }
          
          if (tempDiff > 0) {
            // Solar power calculation: flow_rate (5.5 L/min) × specific_heat (4.18 kJ/kg·K) × temp_diff (K) / 60
            const solarPowerKw = (5.5 * 4.18 * tempDiff) / 60
            if (solarPowerKw > 0) {
              solarPowerCount++
              solarPowerCount++
              // Energy (kWh) = Power (kW) × Time (hours)
              solarEnergyKwh += solarPowerKw * intervalHours
              
              // Debug first few power calculations
              if (solarPowerCount <= 5) {
                console.log(`Solar Power ${solarPowerCount}: ${solarPowerKw.toFixed(3)} kW, Energy += ${(solarPowerKw * intervalHours).toFixed(6)} kWh`)
              }
            }
          }
        }
        
        // Gas energy calculation
        const dhwPump = String(record.dhw_pump || '')
        const isGasActive = dhwPump === 'On'
        
        // Debug first few records
        if (index < 5) {
          console.log(`Record ${index}: DHWPump="${dhwPump}" IsGasActive=${isGasActive}`)
        }
        
        if (isGasActive) {
          gasActiveCount++
          gasActiveCount++
          gasActiveMinutes += intervalMinutes
          const boilerModulation = String(record.boiler_modulation || '')
          
          // Debug first few gas active records
          if (gasActiveCount <= 5) {
            console.log(`Gas Active ${gasActiveCount}: BoilerModulation="${boilerModulation}"`)
          }
          
          if (boilerModulation && boilerModulation !== '----') {
            const modulationStr = boilerModulation.replace('%', '').trim()
            const modulation = Number(modulationStr)
            if (!isNaN(modulation) && modulation > 0) {
              // Gas power calculation: 10 kW × modulation percentage
              const gasPowerKw = 10 * (modulation / 100)
              if (gasPowerKw > 0) {
                gasPowerCount++
                gasPowerCount++
                // Energy (kWh) = Power (kW) × Time (hours)
                gasEnergyKwh += gasPowerKw * intervalHours
                
                // Debug first few power calculations
                if (gasPowerCount <= 5) {
                  console.log(`Gas Power ${gasPowerCount}: Modulation=${modulation}%, Power=${gasPowerKw.toFixed(3)} kW, Energy += ${(gasPowerKw * intervalHours).toFixed(6)} kWh`)
                }
              }
            }
          }
        }
      } catch (recordError) {
        console.log(`⚠️ Error processing record ${index} for ${csvDate}:`, recordError)
      }
    })
    
    const totalEnergyKwh = solarEnergyKwh + gasEnergyKwh
    
    console.log(`=== ENERGY CALCULATION RESULTS FOR ${csvDate} ===`)
    console.log(`Total data points: ${dayData.length}`)
    console.log(`Solar active count: ${solarActiveCount}`)
    console.log(`Solar power count: ${solarPowerCount}`)
    console.log(`Gas active count: ${gasActiveCount}`)
    console.log(`Gas power count: ${gasPowerCount}`)
    console.log(`Solar energy: ${solarEnergyKwh.toFixed(3)} kWh`)
    console.log(`Gas energy: ${gasEnergyKwh.toFixed(3)} kWh`)
    console.log(`Total energy: ${totalEnergyKwh.toFixed(3)} kWh`)
    console.log('=== END CALCULATION RESULTS ===')
    console.log(`Total data points: ${dayData.length}`)
    console.log(`Solar active count: ${solarActiveCount}`)
    console.log(`Solar power count: ${solarPowerCount}`)
    console.log(`Gas active count: ${gasActiveCount}`)
    console.log(`Gas power count: ${gasPowerCount}`)
    console.log(`Solar energy: ${solarEnergyKwh.toFixed(3)} kWh`)
    console.log(`Gas energy: ${gasEnergyKwh.toFixed(3)} kWh`)
    console.log(`Total energy: ${totalEnergyKwh.toFixed(3)} kWh`)
    console.log('=== END CALCULATION RESULTS ===')
    
    // Create energy record
    const energyRecord = {
      date: dbDate,
      solar_energy_kwh: Number(solarEnergyKwh.toFixed(3)),
      gas_energy_kwh: Number(gasEnergyKwh.toFixed(3)),
      total_energy_kwh: Number(totalEnergyKwh.toFixed(3)),
      solar_active_minutes: solarActiveMinutes,
      gas_active_minutes: gasActiveMinutes,
      avg_collector_temp: Number(avgCollectorTemp.toFixed(1)),
      avg_dhw_temp: Number(avgDhwTemp.toFixed(1)),
      avg_outside_temp: Number(avgOutsideTemp.toFixed(1)),
      max_collector_temp: Number(maxCollectorTemp.toFixed(1)),
      max_dhw_temp: Number(maxDhwTemp.toFixed(1)),
      min_outside_temp: Number(minOutsideTemp.toFixed(1)),
      max_outside_temp: Number(maxOutsideTemp.toFixed(1)),
      avg_water_pressure: Number(avgWaterPressure.toFixed(2)),
      data_points_count: dayData.length
    }
    
    console.log(`💾 Storing energy data for ${csvDate}:`, {
      solar: `${energyRecord.solar_energy_kwh} kWh`,
      gas: `${energyRecord.gas_energy_kwh} kWh`,
      total: `${energyRecord.total_energy_kwh} kWh`,
      solarActive: `${solarActiveMinutes} min`,
      gasActive: `${gasActiveMinutes} min`,
      dataPoints: dayData.length
    })
    
    console.log(`💾 Storing energy data for ${csvDate}:`, {
      solar: `${energyRecord.solar_energy_kwh} kWh`,
      gas: `${energyRecord.gas_energy_kwh} kWh`,
      total: `${energyRecord.total_energy_kwh} kWh`,
      solarActive: `${solarActiveMinutes} min`,
      gasActive: `${gasActiveMinutes} min`,
      dataPoints: dayData.length
    })
    
    // Insert energy calculation
    const { data: insertedData, error: energyError } = await supabaseClient
      .from('energy_calculations')
      .insert(energyRecord)
      .select('id')
    
    if (energyError) {
      if (energyError.code === '23505') {
        console.log(`⚠️ Energy calculation for ${csvDate} already exists, skipping`)
      } else {
        console.error(`❌ Error storing energy data for ${csvDate}:`, energyError)
        console.error('Energy record that failed:', JSON.stringify(energyRecord, null, 2))
        console.error('Energy record that failed:', JSON.stringify(energyRecord, null, 2))
        throw energyError
      }
    } else {
      console.log(`✅ Successfully stored energy data for ${csvDate}`)
    }
    
  } catch (error) {
    console.error(`❌ Error calculating energy for date ${csvDate}:`, error)
    throw error
  }
}