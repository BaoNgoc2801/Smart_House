from __future__ import annotations

from pathlib import Path
from typing import Optional, Any, Dict, Tuple, List, Set
import json
import time
from datetime import datetime
import os

import joblib
import pandas as pd
import numpy as np
import httpx

from fastapi import (
    FastAPI,
    HTTPException,
    BackgroundTasks,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# =========================
# Paths / App
# =========================
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "backend" / "models" / "households"
DATA_DIR = BASE_DIR / "backend" / "data" / "processed"

app = FastAPI(title="SmartHome Activity API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Household configurations
# =========================
HOUSEHOLDS = ["hh124"]

# =========================
# Cache
# =========================
pkg_cache: Dict[str, Dict[str, Any]] = {}
data_cache: Dict[str, pd.DataFrame] = {}
time_info_cache: Dict[str, Dict[str, Any]] = {}

# =========================
# Training status & file
# =========================
TRAINING_RESULTS_FILE = BASE_DIR / "training_results.json"
training_status = {
    "is_training": False,
    "progress": 0,
    "current_household": None,
    "message": "",
}

# =========================
# Realtime (WebSocket) + Push (Expo)
# =========================
WS_CONNECTIONS: Dict[str, Set[WebSocket]] = {}
EXPO_PUSH_TOKENS: Dict[str, Set[str]] = {}

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
EXPO_ACCESS_TOKEN = os.getenv("EXPO_ACCESS_TOKEN", "")

# Device state (mock/in-memory)
DEVICE_STATES: Dict[str, Dict[str, str]] = {}


async def ws_broadcast(household: str, payload: Dict[str, Any]) -> None:
    conns = list(WS_CONNECTIONS.get(household, set()))
    for ws in conns:
        try:
            await ws.send_json(payload)
        except Exception:
            WS_CONNECTIONS.get(household, set()).discard(ws)


@app.websocket("/ws/{household}")
async def ws_endpoint(ws: WebSocket, household: str):
    if household not in HOUSEHOLDS:
        await ws.accept()
        await ws.close(code=1008)
        return

    await ws.accept()
    WS_CONNECTIONS.setdefault(household, set()).add(ws)

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        WS_CONNECTIONS.get(household, set()).discard(ws)
    except Exception:
        WS_CONNECTIONS.get(household, set()).discard(ws)


@app.post("/push/register")
def register_push_token(payload: Dict[str, Any]) -> Dict[str, Any]:
    household = str(payload.get("household", "hh124"))
    token = payload.get("expoPushToken")

    if household not in HOUSEHOLDS:
        raise HTTPException(status_code=400, detail=f"Invalid household: {household}")
    if not token:
        raise HTTPException(status_code=400, detail="Missing expoPushToken")

    EXPO_PUSH_TOKENS.setdefault(household, set()).add(str(token))
    return {"ok": True, "household": household, "tokens": len(EXPO_PUSH_TOKENS[household])}


async def send_expo_push(
    household: str,
    title: str,
    body: str,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    tokens = list(EXPO_PUSH_TOKENS.get(household, set()))
    if not tokens:
        return {"ok": False, "reason": "no_tokens"}

    messages = [
        {
            "to": t,
            "title": title,
            "body": body,
            "data": data,
            "sound": "default",
            "priority": "high",
        }
        for t in tokens
    ]

    headers: Dict[str, str] = {}
    if EXPO_ACCESS_TOKEN:
        headers["Authorization"] = f"Bearer {EXPO_ACCESS_TOKEN}"

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(EXPO_PUSH_URL, json=messages, headers=headers)
        try:
            resp = r.json()
        except Exception:
            resp = {"text": r.text}
        return {"ok": True, "status": r.status_code, "resp": resp}

# Utilities
def _clear_household_cache(household: str) -> None:
    pkg_cache.pop(household, None)
    data_cache.pop(household, None)
    time_info_cache.pop(household, None)


def load_training_results() -> List[Dict[str, Any]]:
    if TRAINING_RESULTS_FILE.exists():
        with open(TRAINING_RESULTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_training_result(result: Dict[str, Any]) -> None:
    results = load_training_results()
    results.append(result)
    results = results[-100:]
    with open(TRAINING_RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)


def get_label_col(df: pd.DataFrame) -> Optional[str]:
    for c in ["Activity", "activity", "label", "y", "target"]:
        if c in df.columns:
            return c
    return None


def get_time_info(household: str, df: pd.DataFrame) -> Dict[str, Any]:
    if household in time_info_cache:
        return time_info_cache[household]

    TIME_COL_CANDIDATES = [
        "timestamp", "Timestamp",
        "datetime", "Datetime", "date_time", "DateTime",
        "ts", "TS",
        "time", "Time",
    ]

    time_col = None
    for c in TIME_COL_CANDIDATES:
        if c in df.columns:
            time_col = c
            break

    df_time = None
    time_min = None
    time_max = None

    if time_col:
        df_time = pd.to_datetime(df[time_col], errors="coerce", utc=False)
        valid = df_time.dropna()
        if len(valid) > 0:
            time_min = valid.min()
            time_max = valid.max()

    info = {
        "time_col": time_col,
        "df_time": df_time,
        "time_min": time_min,
        "time_max": time_max,
    }
    time_info_cache[household] = info
    return info


def nearest_index_by_timestamp(
    ts: pd.Timestamp,
    time_info: Dict[str, Any],
) -> Tuple[int, Optional[str], pd.Timestamp]:
    df_time = time_info["df_time"]
    time_min = time_info["time_min"]
    time_max = time_info["time_max"]
    time_col = time_info["time_col"]

    if df_time is None:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Dataset does not contain a usable time column. TIME_COL={time_col}. "
                "Keep timestamp/datetime in features_data.csv to enable time-based prediction."
            ),
        )
    if pd.isna(ts):
        raise HTTPException(status_code=400, detail="Invalid timestamp format.")

    valid_mask = ~df_time.isna()
    if not bool(valid_mask.any()):
        raise HTTPException(status_code=400, detail="Time column exists but could not be parsed (all NaT).")

    clamp_flag: Optional[str] = None
    ts_eff = ts

    if time_min is not None and ts_eff < time_min:
        ts_eff = time_min
        clamp_flag = "before_min"
    if time_max is not None and ts_eff > time_max:
        ts_eff = time_max
        clamp_flag = "after_max"

    diffs = (df_time[valid_mask] - ts_eff).abs()
    best_pos = int(diffs.idxmin())
    return best_pos, clamp_flag, ts_eff


def nearest_index_by_time_of_day(
    time_str: str,
    time_info: Dict[str, Any],
) -> Tuple[int, None, str]:
    """
    Find the nearest row by time-of-day only (HH:MM:SS), ignoring date.
    Returns (best_idx, None, time_str).
    """
    df_time = time_info["df_time"]
    time_col = time_info["time_col"]

    if df_time is None:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Dataset does not contain a usable time column. TIME_COL={time_col}. "
                "Keep timestamp/datetime in features_data.csv to enable time-based prediction."
            ),
        )

    # Parse the requested time
    try:
        parsed = pd.to_datetime(time_str, format="%H:%M:%S", errors="raise")
        req_seconds = parsed.hour * 3600 + parsed.minute * 60 + parsed.second
    except Exception:
        try:
            parsed = pd.to_datetime(time_str, format="%H:%M", errors="raise")
            req_seconds = parsed.hour * 3600 + parsed.minute * 60
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid time format: '{time_str}'. Expected HH:MM or HH:MM:SS.")

    valid_mask = ~df_time.isna()
    if not bool(valid_mask.any()):
        raise HTTPException(status_code=400, detail="Time column exists but could not be parsed (all NaT).")

    valid_times = df_time[valid_mask]

    # Convert all timestamps to seconds-of-day
    row_seconds = valid_times.dt.hour * 3600 + valid_times.dt.minute * 60 + valid_times.dt.second

    # Compute circular distance (wraps around midnight)
    diff = (row_seconds - req_seconds).abs()
    circular_diff = diff.apply(lambda d: min(d, 86400 - d))

    best_pos = int(circular_diff.idxmin())
    return best_pos, None, time_str


# Data / Model loading
def load_household_data(household: str) -> pd.DataFrame:
    if household in data_cache:
        return data_cache[household]

    csv_path = DATA_DIR / f"features_data_{household}.csv"
    if csv_path.exists():
        df = pd.read_csv(csv_path)
        data_cache[household] = df
        return df

    csv_path = DATA_DIR / "features_data.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail=f"Data file not found for {household}")

    df = pd.read_csv(csv_path)

    household_col = None
    for col in ["Household", "household", "hh"]:
        if col in df.columns:
            household_col = col
            break

    if not household_col:
        raise HTTPException(status_code=400, detail="Cannot filter by household - no household column found")

    df = df[df[household_col] == household].reset_index(drop=True)
    data_cache[household] = df
    return df


def load_household_pkg(household: str) -> Dict[str, Any]:
    if household in pkg_cache:
        return pkg_cache[household]

    model_path = MODELS_DIR / f"model_{household}.pkl"
    if not model_path.exists():
        raise HTTPException(status_code=404, detail=f"Model for {household} not found at {model_path}")

    obj = joblib.load(model_path)

    model = None
    label_encoder = None
    activity_map = None
    feature_cols = None

    if isinstance(obj, dict):
        model = obj.get("model") or obj.get("estimator") or obj.get("classifier") or obj.get("best_estimator")
        label_encoder = obj.get("label_encoder")
        activity_map = obj.get("activity_map")
        feature_cols = obj.get("feature_cols")

        if model is None:
            for _, v in obj.items():
                if hasattr(v, "predict"):
                    model = v
                    break
    else:
        model = obj

    if model is None or not hasattr(model, "predict"):
        raise HTTPException(status_code=500, detail=f"Invalid model object for {household}: {type(obj)}")

    if activity_map is None:
        map_path = MODELS_DIR / f"activity_map_{household}.pkl"
        if map_path.exists():
            try:
                map_data = joblib.load(map_path)
                if isinstance(map_data, dict):
                    activity_map = {int(k): str(v) for k, v in map_data.items()}
            except Exception:
                activity_map = None

    if feature_cols is None:
        if hasattr(model, "feature_names_in_"):
            feature_cols = list(model.feature_names_in_)
        elif hasattr(model, "estimators_") and getattr(model, "estimators_", None):
            first = model.estimators_[0]
            if hasattr(first, "feature_names_in_"):
                feature_cols = list(first.feature_names_in_)

    pkg = {
        "model": model,
        "label_encoder": label_encoder,
        "activity_map": activity_map,
        "feature_cols": feature_cols,
    }
    pkg_cache[household] = pkg
    return pkg


# Decoding helpers
def decode_label(x: Any, activity_map: Optional[Dict[int, str]], label_encoder: Any = None) -> str:
    try:
        x_int = int(x)
    except Exception:
        return str(x)

    if label_encoder is not None and hasattr(label_encoder, "inverse_transform"):
        try:
            return str(label_encoder.inverse_transform([x_int])[0])
        except Exception:
            pass

    if activity_map and x_int in activity_map:
        return activity_map[x_int]

    return str(x_int)


def decode_probs(
    classes: Any,
    prob_arr: Any,
    activity_map: Optional[Dict[int, str]],
    label_encoder: Any = None,
    min_prob: float = 0.01,
) -> Dict[str, float]:
    out: Dict[str, float] = {}
    for cls, p in zip(classes, prob_arr):
        p = float(p)
        if p < min_prob:
            continue
        out[decode_label(cls, activity_map, label_encoder)] = p
    return dict(sorted(out.items(), key=lambda kv: kv[1], reverse=True))


# =========================
# Feature alignment
# =========================
def build_feature_cols(df: pd.DataFrame, label_col: Optional[str], time_col: Optional[str]) -> List[str]:
    exclude = set()
    if label_col:
        exclude.add(label_col)
    if time_col:
        exclude.add(time_col)
    for c in ["Household", "household", "hh"]:
        if c in df.columns:
            exclude.add(c)

    leak_exact = {"Activity_Code", "Probable_Activity"}
    for c in leak_exact:
        if c in df.columns:
            exclude.add(c)

    for c in df.columns:
        if c.startswith("Prob_Act_"):
            exclude.add(c)

    cols = []
    for c in df.columns:
        if c in exclude:
            continue
        if pd.api.types.is_numeric_dtype(df[c]):
            cols.append(c)
    return cols


def align_features(X: pd.DataFrame, expected: Optional[List[str]]) -> Tuple[pd.DataFrame, List[str]]:
    if not expected:
        return X, list(X.columns)

    X2 = X.copy()
    cur = set(X2.columns)
    exp = list(expected)
    exp_set = set(exp)

    extra = [c for c in X2.columns if c not in exp_set]
    if extra:
        X2 = X2.drop(columns=extra, errors="ignore")

    missing = [c for c in exp if c not in cur]
    if missing:
        for c in missing:
            X2[c] = 0

    X2 = X2[exp]
    return X2, exp


# Prediction
def predict_row(
    household: str,
    row: pd.Series,
    idx: int,
    pkg: Dict[str, Any],
    df: pd.DataFrame,
    time_info: Dict[str, Any],
    label_col: Optional[str],
    query_ts: Optional[Any] = None,
    clamped: Optional[str] = None,
) -> Dict[str, Any]:
    model = pkg["model"]
    activity_map = pkg.get("activity_map")
    label_encoder = pkg.get("label_encoder")
    expected_cols = pkg.get("feature_cols")

    if expected_cols:
        row_dict = {c: row.get(c, 0) for c in expected_cols}
        X = pd.DataFrame([row_dict])
    else:
        feature_cols = build_feature_cols(df, label_col=label_col, time_col=time_info["time_col"])
        X = pd.DataFrame([row[feature_cols].to_dict()])
        X, expected_cols = align_features(X, expected_cols)

    X, used_cols = align_features(X, expected_cols)

    pred_raw = model.predict(X)[0]
    pred_label = decode_label(pred_raw, activity_map, label_encoder)

    conf = None
    probs = None
    if hasattr(model, "predict_proba"):
        p = model.predict_proba(X)[0]
        conf = float(np.max(p))
        classes = model.classes_ if hasattr(model, "classes_") else list(range(len(p)))
        probs = decode_probs(classes, p, activity_map, label_encoder, min_prob=0.01)

    gt = str(row[label_col]) if label_col else None

    matched_ts = None
    if time_info["time_col"]:
        v = row.get(time_info["time_col"])
        matched_ts = None if pd.isna(v) else str(v)

    return {
        "household": household,
        "index": int(idx),
        "activity": pred_label,
        "confidence": conf,
        "probs": probs,
        "ground_truth": gt,
        "raw_class": str(pred_raw),
        "time_col": time_info["time_col"],
        "query_timestamp": str(query_ts) if query_ts is not None else None,
        "matched_timestamp": matched_ts,
        "clamped": clamped,
        "time_range": {
            "min": None if time_info["time_min"] is None else str(time_info["time_min"]),
            "max": None if time_info["time_max"] is None else str(time_info["time_max"]),
        },
        "feature_count": int(len(used_cols)) if used_cols else None,
        "feature_cols": used_cols,
        "has_label_encoder": bool(label_encoder is not None),
        "has_activity_map": bool(activity_map is not None),
    }


# =========================
# Training
# =========================
def train_model_task(household: str, dataset_percentage: float, use_smote: bool) -> None:
    global training_status
    try:
        training_status["is_training"] = True
        training_status["current_household"] = household
        training_status["progress"] = 0
        training_status["message"] = "Loading data..."

        start_time = time.time()

        df = load_household_data(household)

        if dataset_percentage < 100:
            n = max(1, int(len(df) * dataset_percentage / 100))
            df = df.sample(n=n, random_state=42).reset_index(drop=True)

        training_status["progress"] = 20
        training_status["message"] = f"Preparing {len(df)} samples..."

        label_col = get_label_col(df)
        if not label_col:
            raise ValueError("No activity/label column found (expected 'Activity').")

        from sklearn.preprocessing import LabelEncoder
        le = LabelEncoder()
        y = le.fit_transform(df[label_col].astype(str))
        activity_map = {int(i): str(name) for i, name in enumerate(le.classes_)}

        time_info = get_time_info(household, df)

        drop_cols = ["Household", label_col]
        if time_info["time_col"]:
            drop_cols.append(time_info["time_col"])

        LEAK_COLS_EXACT = {"Activity_Code", "Probable_Activity"}
        for c in LEAK_COLS_EXACT:
            if c in df.columns and c not in drop_cols:
                drop_cols.append(c)

        for c in df.columns:
            if c.startswith("Prob_Act_") and c not in drop_cols:
                drop_cols.append(c)

        for c in df.columns:
            low = c.lower()
            if any(k in low for k in ["activity", "label", "target", "ground_truth", "_code"]):
                if c in ["Sensor_Code", "Value_Code"]:
                    continue
                if c not in drop_cols:
                    drop_cols.append(c)

        X = df.drop(columns=drop_cols, errors="ignore")
        X = X.select_dtypes(include=[np.number])

        feature_cols = list(X.columns)
        if len(feature_cols) == 0:
            raise ValueError("No numeric feature columns after dropping leakage columns.")

        training_status["progress"] = 40
        training_status["message"] = "Splitting train/test..."

        from sklearn.model_selection import train_test_split

        min_class_samples = pd.Series(y).value_counts().min()
        if min_class_samples < 2:
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        else:
            try:
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=0.2, random_state=42, stratify=y
                )
            except Exception:
                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        if use_smote:
            training_status["message"] = "Applying SMOTE..."
            try:
                from imblearn.over_sampling import SMOTE
                sm = SMOTE(random_state=42)
                X_train, y_train = sm.fit_resample(X_train, y_train)
            except Exception as e:
                print(f"SMOTE failed: {e} (continue without SMOTE)")

        training_status["progress"] = 55
        training_status["message"] = "Training LightGBM..."

        import lightgbm as lgb
        clf_lgbm = lgb.LGBMClassifier(
            n_estimators=300,
            learning_rate=0.05,
            num_leaves=31,
            class_weight="balanced",
            random_state=42,
            verbose=-1,
            force_col_wise=True,
        )
        clf_lgbm.fit(X_train, y_train)

        training_status["progress"] = 75
        training_status["message"] = "Training Random Forest..."

        from sklearn.ensemble import RandomForestClassifier, VotingClassifier
        clf_rf = RandomForestClassifier(
            n_estimators=250,
            max_depth=20,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )
        clf_rf.fit(X_train, y_train)

        training_status["progress"] = 85
        training_status["message"] = "Creating ensemble..."

        model = VotingClassifier(
            estimators=[("lgbm", clf_lgbm), ("rf", clf_rf)],
            voting="soft",
        )
        model.fit(X_train, y_train)

        training_status["progress"] = 92
        training_status["message"] = "Evaluating..."

        from sklearn.metrics import accuracy_score
        y_pred = model.predict(X_test)
        accuracy = float(accuracy_score(y_test, y_pred))

        training_time = float(time.time() - start_time)

        training_status["progress"] = 95
        training_status["message"] = "Saving model package..."

        pkg = {
            "model": model,
            "label_encoder": le,
            "activity_map": activity_map,
            "feature_cols": feature_cols,
            "meta": {
                "household": household,
                "dataset_percentage": dataset_percentage,
                "samples_used": int(len(df)),
                "use_smote": bool(use_smote),
                "trained_at": datetime.now().isoformat(),
            },
        }

        model_path = MODELS_DIR / f"model_{household}.pkl"
        joblib.dump(pkg, model_path)

        map_path = MODELS_DIR / f"activity_map_{household}.pkl"
        joblib.dump(activity_map, map_path)

        result = {
            "household": household,
            "dataset_percentage": float(dataset_percentage),
            "samples_used": int(len(df)),
            "accuracy": accuracy,
            "training_time": training_time,
            "timestamp": datetime.now().isoformat(),
            "model_type": "Ensemble (LGBM + RF)",
            "use_smote": bool(use_smote),
            "n_features": int(len(feature_cols)),
        }
        save_training_result(result)

        _clear_household_cache(household)

        training_status["progress"] = 100
        training_status["message"] = f"Complete! Accuracy: {accuracy:.4f}"

    except Exception as e:
        training_status["message"] = f"Error: {str(e)}"
        import traceback
        traceback.print_exc()
    finally:
        training_status["is_training"] = False
        training_status["current_household"] = None


# =========================
# API Schemas
# =========================
class PredictRequest(BaseModel):
    household: str = Field(default="hh124")
    index: Optional[int] = None
    timestamp: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    # NEW: time-of-day only matching (ignores date)
    time_only: Optional[str] = None   # format: "HH:MM" or "HH:MM:SS"


class TrainRequest(BaseModel):
    household: str
    dataset_percentage: float = Field(default=100.0, ge=10.0, le=100.0)
    use_smote: bool = False


class DeviceCommandRequest(BaseModel):
    household: str = Field(default="hh124")
    device: str
    command: str
    value: Optional[str] = None


# =========================
# Device command helpers
# =========================
def apply_command(req: DeviceCommandRequest) -> str:
    hh = req.household
    device = req.device
    cmd = (req.command or "").lower().strip()
    val = (req.value or "").upper().strip() if req.value else None

    DEVICE_STATES.setdefault(hh, {})
    cur = DEVICE_STATES[hh].get(device, "OFF")

    if cmd == "toggle":
        new_state = "OFF" if cur in ("ON", "DIM") else "ON"
    elif cmd == "set":
        if val not in ("ON", "OFF", "DIM"):
            raise HTTPException(status_code=422, detail=f"Invalid value for set: {req.value}")
        new_state = val
    else:
        raise HTTPException(status_code=422, detail=f"Invalid command: {req.command}")

    DEVICE_STATES[hh][device] = new_state
    return new_state


# =========================
# Endpoints
# =========================
@app.get("/health")
def health() -> Dict[str, Any]:
    households_info: Dict[str, Any] = {}
    for hh in HOUSEHOLDS:
        try:
            pkg = load_household_pkg(hh)
            df = load_household_data(hh)
            time_info = get_time_info(hh, df)

            model = pkg["model"]
            feature_cols = pkg.get("feature_cols")

            households_info[hh] = {
                "model_type": str(type(model)),
                "rows": int(len(df)),
                "label_col": get_label_col(df),
                "time_col": time_info["time_col"],
                "time_parsed_ok": bool(time_info["df_time"] is not None and (~time_info["df_time"].isna()).any()),
                "time_range": {
                    "min": None if time_info["time_min"] is None else str(time_info["time_min"]),
                    "max": None if time_info["time_max"] is None else str(time_info["time_max"]),
                },
                "has_label_encoder": bool(pkg.get("label_encoder") is not None),
                "has_activity_map": bool(pkg.get("activity_map") is not None),
                "has_feature_cols": bool(feature_cols is not None and len(feature_cols) > 0),
                "n_features": None if not feature_cols else int(len(feature_cols)),
            }
        except Exception as e:
            households_info[hh] = {"error": str(e)}
    return {"status": "ok", "households": households_info}


@app.get("/devices/state/{household}")
def get_devices_state(household: str) -> Dict[str, Any]:
    if household not in HOUSEHOLDS:
        raise HTTPException(status_code=400, detail=f"Invalid household: {household}")
    return {"household": household, "devices": DEVICE_STATES.get(household, {})}


@app.post("/predict")
async def predict(req: PredictRequest) -> Dict[str, Any]:
    household = req.household
    if household not in HOUSEHOLDS:
        raise HTTPException(status_code=400, detail=f"Invalid household: {household}. Must be one of {HOUSEHOLDS}")

    pkg = load_household_pkg(household)
    df = load_household_data(household)
    time_info = get_time_info(household, df)
    label_col = get_label_col(df)

    out: Optional[Dict[str, Any]] = None

    # NEW: time_only — match by time-of-day, ignoring date
    if req.time_only is not None:
        idx, clamp_flag, ts_eff = nearest_index_by_time_of_day(req.time_only, time_info)
        row = df.iloc[idx]
        out = predict_row(
            household, row, idx, pkg, df, time_info, label_col,
            query_ts=req.time_only, clamped=clamp_flag
        )

    elif req.index is not None:
        idx = int(req.index)
        idx = max(0, min(idx, len(df) - 1))
        row = df.iloc[idx]
        out = predict_row(household, row, idx, pkg, df, time_info, label_col)

    elif req.timestamp:
        query_ts = pd.to_datetime(req.timestamp, errors="coerce", utc=False)
        idx, clamp_flag, ts_eff = nearest_index_by_timestamp(query_ts, time_info)
        row = df.iloc[idx]
        out = predict_row(
            household, row, idx, pkg, df, time_info, label_col,
            query_ts=ts_eff, clamped=clamp_flag
        )

    elif req.date and req.time:
        query_ts = pd.to_datetime(f"{req.date} {req.time}", errors="coerce", utc=False)
        idx, clamp_flag, ts_eff = nearest_index_by_timestamp(query_ts, time_info)
        row = df.iloc[idx]
        out = predict_row(
            household, row, idx, pkg, df, time_info, label_col,
            query_ts=ts_eff, clamped=clamp_flag
        )

    else:
        raise HTTPException(
            status_code=400,
            detail="Provide one of: time_only (HH:MM or HH:MM:SS), index, timestamp, or (date + time)."
        )

    # Broadcast to WebSocket clients
    await ws_broadcast(household, {"type": "prediction", "payload": out})

    # Optional: push notification for Sleep
    if out.get("activity") == "Sleep" and (out.get("confidence") or 0) >= 0.75:
        await send_expo_push(
            household,
            title="Sắp đi ngủ 😴",
            body="Mở sẵn đèn phòng ngủ + điều hoà. Bấm để chỉnh.",
            data={"type": "prediction", "payload": out},
        )

    return out


@app.post("/devices/command")
async def devices_command(req: DeviceCommandRequest) -> Dict[str, Any]:
    if req.household not in HOUSEHOLDS:
        raise HTTPException(status_code=400, detail=f"Invalid household: {req.household}. Must be one of {HOUSEHOLDS}")

    new_state = apply_command(req)

    await ws_broadcast(
        req.household,
        {
            "type": "device_command",
            "payload": {
                "household": req.household,
                "device": req.device,
                "command": req.command,
                "value": new_state,
            },
        },
    )

    return {"ok": True, "state": new_state}


@app.post("/train")
async def train_model(req: TrainRequest, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    if training_status["is_training"]:
        raise HTTPException(status_code=400, detail=f"Training already in progress for {training_status['current_household']}")

    if req.household not in HOUSEHOLDS:
        raise HTTPException(status_code=400, detail=f"Invalid household: {req.household}")

    background_tasks.add_task(train_model_task, req.household, req.dataset_percentage, req.use_smote)

    return {
        "status": "started",
        "household": req.household,
        "dataset_percentage": req.dataset_percentage,
        "use_smote": req.use_smote,
        "message": "Training started in background",
    }


@app.get("/training-status")
def get_training_status() -> Dict[str, Any]:
    return training_status


@app.get("/training-results")
def get_training_results(household: Optional[str] = None) -> Dict[str, Any]:
    results = load_training_results()
    if household:
        results = [r for r in results if r.get("household") == household]
    return {"total": len(results), "results": results}


@app.delete("/training-results")
def clear_training_results() -> Dict[str, Any]:
    if TRAINING_RESULTS_FILE.exists():
        TRAINING_RESULTS_FILE.unlink()
    return {"status": "cleared"}