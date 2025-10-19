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

    console.log("Starting house heating calculations using SQL function...");

    const { dateFrom, dateTo } = await req.json().catch(() => ({}));

    if (dateFrom && dateTo) {
      console.log(`Calculating house heating for date range: ${dateFrom} to ${dateTo}`);

      const { data, error } = await supabaseClient.rpc(
        "calculate_house_heating_for_date_range",
        {
          date_from: dateFrom,
          date_to: dateTo,
        }
      );

      if (error) {
        throw new Error(`Failed to calculate house heating: ${error.message}`);
      }

      const daysCalculated = data || 0;
      console.log(`Successfully calculated ${daysCalculated} days of house heating data`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Calculated and stored ${daysCalculated} days of house heating data`,
          calculations_count: daysCalculated,
          date_range: { from: dateFrom, to: dateTo },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      console.log("Calculating house heating for all dates in heating_data table");

      const { data, error } = await supabaseClient.rpc("calculate_house_heating_all");

      if (error) {
        throw new Error(`Failed to calculate house heating: ${error.message}`);
      }

      const daysCalculated = data || 0;
      console.log(`Successfully calculated ${daysCalculated} days of house heating data`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Calculated and stored ${daysCalculated} days of house heating data`,
          calculations_count: daysCalculated,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
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
