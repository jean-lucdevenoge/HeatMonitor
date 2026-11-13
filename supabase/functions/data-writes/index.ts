import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (req.method !== "POST" || !serviceRoleKey || req.headers.get("Authorization") !== `Bearer ${serviceRoleKey}`) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    switch (action) {
      case "insert-heating-data": {
        const { rows } = body;
        if (!Array.isArray(rows)) {
          return new Response(
            JSON.stringify({ success: false, error: "rows must be an array" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabaseClient
          .from("heating_data")
          .upsert(rows, { onConflict: "date,time", ignoreDuplicates: true })
          .select("id");

        if (error) throw new Error(error.message);

        const inserted = data?.length || 0;
        const duplicates = rows.length - inserted;

        return new Response(
          JSON.stringify({ success: true, inserted, duplicates }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete-heating-data": {
        const { error } = await supabaseClient
          .from("heating_data")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (error) throw new Error(error.message);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete-energy-calculations": {
        const { error } = await supabaseClient
          .from("energy_calculations")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (error) throw new Error(error.message);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "upsert-house-heating-calculations": {
        const { rows } = body;
        if (!Array.isArray(rows)) {
          return new Response(
            JSON.stringify({ success: false, error: "rows must be an array" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const batchSize = 100;
        let totalInserted = 0;

        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const { error: insertError } = await supabaseClient
            .from("house_heating_calculations")
            .upsert(batch, { onConflict: "date" });

          if (insertError) throw new Error(insertError.message);
          totalInserted += batch.length;
        }

        return new Response(
          JSON.stringify({ success: true, count: totalInserted }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in data-writes:", error);

    return new Response(
      JSON.stringify({ success: false, error: "Operation failed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
