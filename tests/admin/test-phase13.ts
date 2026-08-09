import { GovernanceEngineService } from './governance-engine.service';

async function testGovernanceFlow() {
  console.log('--- TEST 1: ADMIN ACTION LOGGING ---');
  await GovernanceEngineService.audit.logEvent({
    event_type: 'ADMIN_LOGIN',
    actor_id: 'd3d3d3d3-d3d3-43d3-a3d3-d3d3d3d3d3d3', // Dummy UUID
    actor_role: 'super_admin',
    action: 'admin.login',
    metadata: { ip: '127.0.0.1', password: 'secret_password_should_be_redacted' }
  });
  console.log('TEST 1: Check logs for redacted password.');

  console.log('\n--- TEST 2: DELTA TRACKING ---');
  await GovernanceEngineService.tracking.trackChange({
    actor_id: 'd3d3d3d3-d3d3-43d3-a3d3-d3d3d3d3d3d3',
    actor_role: 'super_admin',
    event_type: 'ADMIN_CONFIGURATION_CHANGE',
    action: 'config.update',
    target_type: 'app_settings',
    target_id: 'maintenance_mode',
    before: { enabled: false, reason: 'none' },
    after: { enabled: true, reason: 'updates' },
    reason: 'Planned maintenance'
  });
  console.log('TEST 2: Check logs for delta before/after.');

  console.log('\n--- TEST 3: SANITIZATION ---');
  await GovernanceEngineService.audit.logEvent({
    event_type: 'ADMIN_SECURITY_ACTION',
    actor_id: 'd3d3d3d3-d3d3-43d3-a3d3-d3d3d3d3d3d3',
    actor_role: 'super_admin',
    action: 'security.token_gen',
    metadata: { api_key: 'sb_secret_12345', details: { token: 'jwt_content' } }
  });
  console.log('TEST 3: Verify API key and token are [REDACTED].');
}

testGovernanceFlow().catch(console.error);
