export const environment = {
  production: false,
  appName: 'DoctoGuide', // single source for the user-facing product name
  serverUrl: 'http://localhost:3000', // dev: call the backend directly (CORS open)
  aiBase: '/ai-doctor',
  userBase: '/user',
  partnerBase: '/partner', // clinic affiliate / sales-funnel endpoints
  adminBase: '/admin', // global super-admin console (cross-clinic)
  ownerBase: '/owner', // creator console (app-wide, owners only)
  emergencyNumbers: { all: '112', ambulance: '112' },
  gaMeasurementId: '', // empty = analytics disabled in dev
};
