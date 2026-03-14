export const getDashboardOverview = async (req, res) => {
  res.status(200).json({
    user: req.user,
    kpis: {
      processCount: 12,
      capableProcesses: 9,
      activeAlerts: 3,
      importedMeasurements: 2480,
    },
    message: 'Vue dashboard exemple prête à être reliée à MongoDB.',
  });
};
