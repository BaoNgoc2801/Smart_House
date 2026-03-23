import joblib
from pathlib import Path

# Check model structure
model_path = Path("../models/households/model_hh121.pkl")
model_data = joblib.load(model_path)

print("Type:", type(model_data))
print("\nKeys (if dict):", model_data.keys() if isinstance(model_data, dict) else "Not a dict")

if isinstance(model_data, dict):
    print("\nDict contents:")
    for key, value in model_data.items():
        print(f"  {key}: {type(value)}")
        if hasattr(value, 'predict'):
            print(f"    -> This is the model!")