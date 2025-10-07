import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Starting house heating calculations...");

    const { data: heatingData, error: fetchError } = await supabaseClient
      .from("heating_data")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch heating data: ${fetchError.message}`);
    }

    if (!heatingData || heatingData.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No heating data found",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    console.log(`Processing ${heatingData.length} heating data records...`);

    const dailyCalculations = new Map();

    for (const point of heatingData) {
      const dateStr = point.date;

      if (!dailyCalculations.has(dateStr)) {
        dailyCalculations.set(dateStr, {
          date: dateStr,
          total_energy: 0,
          active_minutes: 0,
          flow_temps: [],
          return_temps: [],
          outside_temps: [],
          boiler_modulations: [],
          burner_starts_count: 0,
          data_points: 0,
        });
      }

      const dayCalc = dailyCalculations.get(dateStr);

      const burnerActive = point.burner_state === "on";
      const dhwPumpOff = point.dhw_pump === "off" || point.dhw_pump === "";
      const isHouseHeating = burnerActive && dhwPumpOff;

      if (isHouseHeating) {
        const boilerModulation = parseFloat(point.boiler_modulation) || 0;
        const powerKw = (10 * boilerModulation) / 100;
        const energyKwh = (powerKw * 1) / 60;

        dayCalc.total_energy += energyKwh;
        dayCalc.active_minutes += 1;
        dayCalc.boiler_modulations.push(boilerModulation);
      }

      dayCalc.flow_temps.push(point.flow_temp || 0);
      dayCalc.return_temps.push(point.return_temp || 0);
      dayCalc.outside_temps.push(point.outside_temp || 0);

      if (point.burner_starts > dayCalc.burner_starts_count) {
        dayCalc.burner_starts_count = point.burner_starts;
      }

      dayCalc.data_points += 1;
    }

    const calculationsToInsert = [];

    for (const [dateStr, calc] of dailyCalculations) {
      if (calc.data_points === 0) continue;

      const avgFlowTemp =
        calc.flow_temps.reduce((a: number, b: number) => a + b, 0) /
        calc.flow_temps.length;
      const avgReturnTemp =
        calc.return_temps.reduce((a: number, b: number) => a + b, 0) /
        calc.return_temps.length;
      const avgOutsideTemp =
        calc.outside_temps.reduce((a: number, b: number) => a + b, 0) /
        calc.outside_temps.length;
      const maxFlowTemp = Math.max(...calc.flow_temps);
      const minOutsideTemp = Math.min(...calc.outside_temps);
      const maxOutsideTemp = Math.max(...calc.outside_temps);
      const avgBoilerModulation =
        calc.boiler_modulations.length > 0
          ? calc.boiler_modulations.reduce((a: number, b: number) => a + b, 0) /
            calc.boiler_modulations.length
          : 0;

      calculationsToInsert.push({
        date: dateStr,
        house_heating_energy_kwh: calc.total_energy,
        house_heating_active_minutes: calc.active_minutes,
        avg_flow_temp: avgFlowTemp,
        avg_return_temp: avgReturnTemp,
        avg_outside_temp: avgOutsideTemp,
        max_flow_temp: maxFlowTemp,
        min_outside_temp: minOutsideTemp,
        max_outside_temp: maxOutsideTemp,
        avg_boiler_modulation: avgBoilerModulation,
        total_burner_starts: calc.burner_starts_count,
        data_points_count: calc.data_points,
      });
    }

    console.log(
      `Calculated ${calculationsToInsert.length} daily house heating records`
    );

    if (calculationsToInsert.length > 0) {
      const { data: insertedData, error: insertError } = await supabaseClient
        .from("house_heating_calculations")
        .upsert(calculationsToInsert, {
          onConflict: "date",
        });

      if (insertError) {
        throw new Error(
          `Failed to insert calculations: ${insertError.message}`
        );
      }

      console.log(
        `Successfully inserted/updated ${calculationsToInsert.length} records`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Calculated and stored ${calculationsToInsert.length} days of house heating data`,
        calculations_count: calculationsToInsert.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in calculate-house-heating:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
