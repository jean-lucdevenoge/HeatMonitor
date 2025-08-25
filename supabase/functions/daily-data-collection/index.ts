import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Example: Fetch data from your heating system API
    const heatingSystemUrl = 'YOUR_HEATING_SYSTEM_API_URL'
    const response = await fetch(heatingSystemUrl, {
      headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN', // if needed
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`)
    }

    const rawData = await response.text()
    
    // Parse your CSV or JSON data here
    const parsedData = parseHeatingData(rawData)

    // Insert data into Supabase
    const { data, error } = await supabaseClient
      .from('heating_data')
      .upsert(parsedData, {
        onConflict: 'date,time',
        ignoreDuplicates: true
      })

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    console.log(`Successfully inserted ${data?.length || 0} records`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Inserted ${data?.length || 0} records`,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in daily data collection:', error)
    
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

// Helper function to parse your heating system data
function parseHeatingData(csvContent: string) {
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