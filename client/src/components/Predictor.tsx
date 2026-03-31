import React, { useState } from 'react';
import { api } from '../api/http';

interface PredictorProps {
  initialValues?: number[];
  initialUsl?: number;
}

const Predictor: React.FC<PredictorProps> = ({ initialValues = [], initialUsl = 510 }) => {
  const [values, setValues] = useState<string>(initialValues.length > 0 ? initialValues.join(',') : '');
  const [usl, setUsl] = useState<number>(initialUsl);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handlePredict = async () => {
    setError('');
    setPrediction(null);
    setStatus('');
    try {
      const vals = values.split(',').map(v => Number(v.trim())).filter(v => !isNaN(v));
      const response = await api.post('/predict', { values: vals, usl });
      setPrediction(response.data.prediction);
      setStatus(response.data.status);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Prediction failed');
    }
  };

  React.useEffect(() => {
    if (initialValues.length > 0) setValues(initialValues.join(','));
    if (initialUsl) setUsl(initialUsl);
    // eslint-disable-next-line
  }, [initialValues.join(','), initialUsl]);

  return (
    <div style={{ maxWidth: 400, margin: 'auto' }}>
      <h2>Process Capability Predictor</h2>
      <div>
        <label>Measurements (comma separated):</label>
        <input
          type="text"
          value={values}
          onChange={e => setValues(e.target.value)}
          placeholder="e.g. 500,502,501,503,504,505"
          style={{ width: '100%' }}
        />
      </div>
      <div>
        <label>USL:</label>
        <input
          type="number"
          value={usl}
          onChange={e => setUsl(Number(e.target.value))}
        />
      </div>
      <button onClick={handlePredict}>Predict</button>
      {prediction !== null && (
        <div>
          <p>
            Prediction: <b>{prediction.toFixed(2)}</b>
          </p>
          <p>
            Status: <b style={{ color: status === 'WARNING' ? 'red' : 'green' }}>
              {status === 'WARNING' ? 'Future Risk' : 'OK'}
            </b>
          </p>
          {status === 'WARNING' && (
            <div style={{ color: 'red' }}>
              ⚠️ Prediction exceeds USL!
            </div>
          )}
        </div>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default Predictor;
