export const calculateCapability = ({ usl, lsl, mean, sigma }) => {
  if (!sigma || sigma <= 0) {
    return { cp: 0, cpk: 0 };
  }

  const cp = (usl - lsl) / (6 * sigma);
  const cpu = (usl - mean) / (3 * sigma);
  const cpl = (mean - lsl) / (3 * sigma);

  return {
    cp: Number(cp.toFixed(2)),
    cpk: Number(Math.min(cpu, cpl).toFixed(2)),
  };
};