import { supabase } from "@/integrations/supabase/client";

async function fixTestRestaurant() {
  console.log("Starting fix for test restaurant...");
  
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", "teste-mp-570e")
    .single();

  if (!restaurant) {
    console.error("Restaurant not found");
    return;
  }

  console.log("Found restaurant ID:", restaurant.id);

  // Update restaurant flags
  const { error: updateError } = await supabase
    .from("restaurants")
    .update({
      accept_pix_online: true,
      open_mode: 'force_open',
      plan: 'professional',
      plan_id: 'pro'
    } as any)
    .eq("id", restaurant.id);

  if (updateError) {
    console.error("Error updating restaurant:", updateError);
  } else {
    console.log("Restaurant updated successfully");
  }
}

fixTestRestaurant();
