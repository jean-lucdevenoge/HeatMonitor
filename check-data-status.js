import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDataStatus() {
  console.log('Checking database status...\n');

  // Check heating data count
  const { count: heatingCount, error: heatingError } = await supabase
    .from('heating_data')
    .select('*', { count: 'exact', head: true });

  if (heatingError) {
    console.error('Error checking heating_data:', heatingError);
  } else {
    console.log(`Total heating_data records: ${heatingCount}`);
  }

  // Check house heating calculations count
  const { count: calcCount, error: calcError } = await supabase
    .from('house_heating_calculations')
    .select('*', { count: 'exact', head: true });

  if (calcError) {
    console.error('Error checking house_heating_calculations:', calcError);
  } else {
    console.log(`Total house_heating_calculations: ${calcCount}`);
  }

  // Get date ranges
  const { data: heatingDates } = await supabase
    .from('heating_data')
    .select('date')
    .order('date', { ascending: true })
    .limit(1);

  const { data: heatingDatesMax } = await supabase
    .from('heating_data')
    .select('date')
    .order('date', { ascending: false })
    .limit(1);

  if (heatingDates && heatingDatesMax) {
    console.log(`Heating data date range: ${heatingDates[0]?.date} to ${heatingDatesMax[0]?.date}`);
  }

  const { data: calcDates } = await supabase
    .from('house_heating_calculations')
    .select('date')
    .order('date', { ascending: true })
    .limit(1);

  const { data: calcDatesMax } = await supabase
    .from('house_heating_calculations')
    .select('date')
    .order('date', { ascending: false })
    .limit(1);

  if (calcDates && calcDatesMax) {
    console.log(`House heating calculations date range: ${calcDates[0]?.date} to ${calcDatesMax[0]?.date}`);
  }

  // Get sample of recent calculations
  const { data: recentCalcs } = await supabase
    .from('house_heating_calculations')
    .select('date, house_heating_energy_kwh, house_heating_active_minutes, data_points_count')
    .order('date', { ascending: false })
    .limit(5);

  if (recentCalcs && recentCalcs.length > 0) {
    console.log('\nRecent house heating calculations:');
    recentCalcs.forEach(calc => {
      console.log(`  ${calc.date}: ${calc.house_heating_energy_kwh} kWh, ${calc.house_heating_active_minutes} min active, ${calc.data_points_count} data points`);
    });
  } else {
    console.log('\nNo house heating calculations found!');
  }

  // Check for dates that have heating_data but no calculations
  const { data: allHeatingDates } = await supabase
    .from('heating_data')
    .select('date')
    .order('date', { ascending: false })
    .limit(50);

  if (allHeatingDates) {
    const uniqueDates = [...new Set(allHeatingDates.map(d => d.date))];
    console.log(`\nChecking if recent dates have calculations...`);

    for (const date of uniqueDates.slice(0, 5)) {
      const { data: calc } = await supabase
        .from('house_heating_calculations')
        .select('id')
        .eq('date', date)
        .maybeSingle();

      console.log(`  ${date}: ${calc ? '✓ Has calculation' : '✗ Missing calculation'}`);
    }
  }
}

checkDataStatus().catch(console.error);
