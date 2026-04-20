import os
import glob
import json
import pandas as pd
import numpy as np
import lightgbm as lgb
from pathlib import Path
from datetime import datetime

# 9-class taxonomy mapping (typical CASAS alignment)
TAXONOMY_MAP = {
    'bathe': 'Personal_Care', 'toilet': 'Personal_Care', 'personal_hygiene': 'Personal_Care', 'wash': 'Personal_Care',
    'cook': 'Cook', 'breakfast': 'Cook', 'lunch': 'Cook', 'dinner': 'Cook',
    'eat': 'Eat',
    'sleep': 'Sleep', 'bed': 'Sleep',
    'relax': 'Relax', 'tv': 'Relax', 'read': 'Relax',
    'work': 'Work', 'desk': 'Work',
    'leave_home': 'Leave_Home', 'enter_home': 'Enter_Home',
    'dress': 'Dress',
    'other': 'Other'
}

def map_activity(act):
    if not isinstance(act, str) or pd.isna(act):
        return 'Other'
    act_lower = act.lower()
    for k, v in TAXONOMY_MAP.items():
        if k in act_lower:
            return v
    return 'Other'

def fast_process_casas(filepath):
    # Load dataset
    df = pd.read_csv(filepath, header=None, names=['date', 'time', 'sensor', 'state', 'activity'], on_bad_lines='skip')
    
    # Forward fill activity matching "begin" and "end" logic
    # Clean activity column: separate the begin/end tags
    df['is_activity'] = df['activity'].notna()
    
    clean_activities = []
    current_act = 'Other'
    for val in df['activity']:
        if pd.isna(val):
            clean_activities.append(current_act)
            continue
            
        val_str = str(val)
        if '="begin"' in val_str:
            current_act = val_str.replace('="begin"', '').strip()
            clean_activities.append(current_act)
        elif '="end"' in val_str:
            clean_activities.append(current_act) # log the final step
            current_act = 'Other' # reset
        else:
            clean_activities.append(val_str)
            
    df['clean_activity'] = clean_activities
    df['target'] = df['clean_activity'].apply(map_activity)
    
    # Drop "Other" or keep? Usually "Other" is ignored or kept as background
    # We will keep it but apply class weights during training
    
    # Feature Engineering (Fast)
    # Convert time to seconds from midnight
    df['time_str'] = df['time'].astype(str)
    
    def time_to_sec(t_str):
        try:
            h, m, s = t_str.split(':')
            return int(h)*3600 + int(m)*60 + float(s)
        except:
            return 0
            
    df['seconds'] = df['time_str'].apply(time_to_sec)
    
    # Encode sensors
    df['sensor_cat'] = df['sensor'].astype('category').cat.codes
    df['state_cat'] = df['state'].astype('category').cat.codes
    
    features = df[['seconds', 'sensor_cat', 'state_cat']].copy()
    
    # Rolling features (history of last 3 sensors)
    features['sens_lag1'] = features['sensor_cat'].shift(1).fillna(-1)
    features['sens_lag2'] = features['sensor_cat'].shift(2).fillna(-1)
    features['sens_lag3'] = features['sensor_cat'].shift(3).fillna(-1)
    
    labels = df['target']
    
    # Filter out 'Other' transitions as requested for paper preprocessing compliance
    mask = labels != 'Other'
    features = features[mask]
    labels = labels[mask]
    
    return features, labels

def evaluate_household(filepath):
    print(f"Processing {filepath.name}...")
    X, y = fast_process_casas(filepath)
    
    # Drop 'Other' transitions if it dominates too much, but standard is to keep it
    # We will keep it for now.
    
    # Encode labels
    df_y = pd.Series(y)
    classes = df_y.unique()
    y_encoded = df_y.astype('category').cat.codes
    
    # Chronological Split (80/20)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y_encoded.iloc[:split_idx], y_encoded.iloc[split_idx:]
    
    # Handle case where test set has unseen classes
    # LGBM can handle this if we just use accuracy score securely
    
    model = lgb.LGBMClassifier(
        n_estimators=100, 
        learning_rate=0.1, 
        class_weight='balanced', 
        random_state=42, 
        verbose=-1
    )
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    acc = (preds == y_test).mean()
    return acc

if __name__ == "__main__":
    raw_dir = Path(os.path.dirname(os.path.abspath(__file__))) / "data" / "raw"
    results = {}
    
    files = list(raw_dir.glob("*.csv"))
    files = sorted(files)
    
    # Just processing all of them!
    import time
    start = time.time()
    for f in files:
        try:
            acc = evaluate_household(f)
            hh = f.stem
            results[hh] = acc
            print(f"  Accuracy: {acc:.4f}")
        except Exception as e:
            print(f"  Error on {f.stem}: {e}")
            
    end = time.time()
    print(f"Total evaluation time: {end-start:.1f}s")
    
    with open("paper_metrics_temp.json", "w") as f:
        json.dump(results, f, indent=2)
