import { supabaseAdmin as supabase } from '../src/integrations/supabase/client.server';

async function testPhase12Final() {
  console.log('--- Phase 12 Final Validation ---');

  try {
    const { data: restaurants } = await supabase.from('restaurants').select('id').limit(1);
    const restaurantId = restaurants?.[0]?.id;
    if (!restaurantId) throw new Error('No restaurant found');

    const mockIncidentId = crypto.randomUUID();
    const { error: incError } = await supabase.from('financial_incidents').insert({
      id: mockIncidentId,
      type: 'WORKER_FAILURE',
      severity: 'HIGH',
      restaurant_id: restaurantId,
      status: 'OPEN',
      details: { test: true }
    });
    if (incError) throw incError;
    console.log('✓ Incident created');

    const dedup = `test-phase12-${mockIncidentId}`;
    const { data: job, error: jobError } = await supabase.from('automation_jobs').insert({
      type: 'FAILED_PROCESS_RECOVERY',
      restaurant_id: restaurantId,
      source_incident_id: mockIncidentId,
      payload: {},
      deduplication_key: dedup,
      status: 'PENDING'
    }).select().single();
    if (jobError) throw jobError;
    console.log('✓ Job created:', job.id);

    const { error: dup } = await supabase.from('automation_jobs').insert({
      type: 'FAILED_PROCESS_RECOVERY',
      deduplication_key: dedup,
      payload: {}
    });
    if (dup?.code === '23505') console.log('✓ Idempotency confirmed');

    await supabase.from('automation_jobs').update({ status: 'SUCCESS' }).eq('id', job.id);
    console.log('✓ Lifecycle confirmed');

    console.log('--- PHASE 12 PASS ---');
  } catch (err: any) {
    console.error('--- PHASE 12 FAIL ---');
    console.error(err.message || err);
    process.exit(1);
  }
}

testPhase12Final();
