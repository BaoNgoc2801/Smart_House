import os
import sys
from pathlib import Path

# Provide standard imports to the backend environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app import train_model_task, get_training_status

def batch_train_all_households():
    print("====================================")
    print("  BATCH HOUSEHOLD TRAINING SCRIPT   ")
    print("====================================")
    
    data_dir = Path(os.path.dirname(os.path.abspath(__file__))) / "data" / "processed"
    if not data_dir.exists():
        print(f"ERROR: No processed data directory found at {data_dir.absolute()}")
        return

    # Find all CSV files starting with features_data_hh
    csv_files = list(data_dir.glob("features_data_hh*.csv"))
    if not csv_files:
        print("WARNING: No datasets found. Add features_data_hhXXX.csv files to backend/data/processed/ !")
        return
        
    households = []
    for f in csv_files:
        # Extract household id: features_data_hh124.csv -> hh124
        name = f.stem
        hh_id = name.split('_')[-1]
        households.append(hh_id)

    households = sorted(list(set(households)))
    print(f"Discovered {len(households)} households to train: {', '.join(households)}")
    
    for i, hh in enumerate(households, start=1):
        print(f"\n[{i}/{len(households)}] Starting training for household: {hh} ...")
        try:
            train_model_task(hh, 100.0, False)
            status = get_training_status()
            print(f"-> Finished {hh}. Status msg: {status.get('message')}")
        except Exception as e:
            print(f"-> ERROR training {hh}: {e}")

    print("\nBatch training completed for all discovered datasets.")

if __name__ == "__main__":
    batch_train_all_households()
