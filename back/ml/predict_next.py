import sys
import json
import numpy as np
from sklearn.linear_model import LinearRegression

def sliding_window(data, window_size=3):
    X, y = [], []
    for i in range(len(data) - window_size):
        X.append(data[i:i+window_size])
        y.append(data[i+window_size])
    return np.array(X), np.array(y)

def main():
    # Read JSON from stdin
    input_data = json.loads(sys.stdin.read())
    values = input_data["values"]

    if len(values) < 4:
        print(json.dumps({"error": "At least 4 values required"}))
        sys.exit(1)

    X, y = sliding_window(values)
    model = LinearRegression()
    model.fit(X, y)

    # Predict next value using last 3 measurements
    last_window = np.array(values[-3:]).reshape(1, -1)
    prediction = model.predict(last_window)[0]

    print(json.dumps({"prediction": float(prediction)}))

if __name__ == "__main__":
    main()
