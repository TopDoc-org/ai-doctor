export const environment = {
  production: true,
  appName: 'DoctoGuide', // single source for the user-facing product name
  serverUrl: 'https://backend.knocdoc.in',
  aiBase: '/ai-doctor',
  userBase: '/user',
  partnerBase: '/partner', // clinic affiliate / sales-funnel endpoints
  adminBase: '/admin', // global super-admin console (cross-clinic)
  ownerBase: '/owner', // creator console (app-wide, owners only)
  emergencyNumbers: { all: '112', ambulance: '108' },
  gaMeasurementId: 'G-XKGDL4WS32',
};
