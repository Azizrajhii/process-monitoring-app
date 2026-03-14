export const getProcesses = async (_req, res) => {
  res.status(200).json([
    {
      _id: 'demo-process-1',
      name: 'Ligne conditionnement A',
      status: 'active',
      cpTarget: 1.33,
      cpkTarget: 1.33,
    },
  ]);
};

export const createProcess = async (req, res) => {
  res.status(201).json({
    message: 'Processus créé (simulation).',
    process: req.body,
  });
};
