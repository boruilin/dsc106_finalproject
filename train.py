import os
import pandas as pd
import numpy as np
from sklearn.tree import export_text
from sklearn.ensemble import RandomForestRegressor
import json

# === Scores dictionary
grades = {
    'Midterm1': {'S1': '78/100', 'S2': '82/100', 'S3': '77/100', 'S4': '75/100', 'S5': '67/100',
                 'S6': '71/100', 'S7': '64/100', 'S8': '92/100', 'S9': '80/100', 'S10': '89/100'},
    'Midterm2': {'S1': '82/100', 'S2': '85/100', 'S3': '90/100', 'S4': '77/100', 'S5': '77/100',
                 'S6': '64/100', 'S7': '33/100', 'S8': '88/100', 'S9': '39/100', 'S10': '64/100'},
    'Final': {'S1': '182/200', 'S2': '180/200', 'S3': '188/200', 'S4': '149/200', 'S5': '157/200',
              'S6': '175/200', 'S7': '110/200', 'S8': '184/200', 'S9': '126/200', 'S10': '116/200'}
}

# === Nervous thresholds
HR_THRESHOLD = 90
EDA_THRESHOLD = 1.5
TEMP_THRESHOLD = 92

# === Duration limits
DURATION_LIMITS = {
    'Midterm1': 90 * 60,
    'Midterm2': 90 * 60,
    'Final': 180 * 60
}

def process_signal(filepath, threshold, direction, duration_limit):
    try:
        with open(filepath) as f:
            lines = f.read().splitlines()

        sample_rate = float(lines[1])
        values = list(map(float, lines[2:]))
        max_samples = int(sample_rate * duration_limit)
        values = values[:max_samples]

        # Nervous minutes
        bucket_size = int(sample_rate * 60)
        nervous_minutes = 0
        for i in range(0, len(values), bucket_size):
            chunk = values[i:i + bucket_size]
            if not chunk:
                continue
            avg = np.mean(chunk)
            if (direction == 'above' and avg > threshold) or (direction == 'below' and avg < threshold):
                nervous_minutes += 1

        return {
            'nervous_minutes': nervous_minutes,
            'percent_nervous': nervous_minutes / (duration_limit / 60),
            'std': np.std(values),
            'max': np.max(values)
        }

    except Exception as e:
        print(f"⚠️ Error with {filepath}: {e}")
        return None

# === Collect features
data = []
students = [f'S{i}' for i in range(1, 11)]
exams = ['Midterm1', 'Midterm2', 'Final']

for student in students:
    for exam in exams:
        duration = DURATION_LIMITS[exam]
        base = os.path.join(student, exam)

        eda = process_signal(os.path.join(base, 'EDA.csv'), EDA_THRESHOLD, 'above', duration)
        hr = process_signal(os.path.join(base, 'HR.csv'), HR_THRESHOLD, 'above', duration)
        temp = process_signal(os.path.join(base, 'TEMP.csv'), TEMP_THRESHOLD, 'below', duration)

        if not all([eda, hr, temp]):
            continue

        raw_score = grades[exam][student]
        num, denom = map(float, raw_score.split('/'))
        pct_score = (num / denom) * 100

        data.append({
            'student': student,
            'exam': exam,
            'score': pct_score,

            # EDA
            'eda_nervous': eda['nervous_minutes'],
            'eda_percent': eda['percent_nervous'],
            'eda_std': eda['std'],
            'eda_max': eda['max'],

            # HR
            'hr_nervous': hr['nervous_minutes'],
            'hr_percent': hr['percent_nervous'],
            'hr_std': hr['std'],
            'hr_max': hr['max'],

            # TEMP
            'temp_nervous': temp['nervous_minutes'],
            'temp_percent': temp['percent_nervous'],
            'temp_std': temp['std'],
            'temp_max': temp['max'],
        })

# === Train model
df = pd.DataFrame(data)
print("📊 Feature Table:\n", df.head())

features = [
    'eda_nervous', 'eda_percent', 'eda_std', 'eda_max',
    'hr_nervous', 'hr_percent', 'hr_std', 'hr_max',
    'temp_nervous', 'temp_percent', 'temp_std', 'temp_max'
]

X = df[features]
y = df['score']

model = RandomForestRegressor(random_state=42)
model.fit(X, y)

# === Optional: feature importance
importances = model.feature_importances_
print("\n📈 Feature Importances:")
for name, imp in zip(features, importances):
    print(f"{name:15s} → {imp:.4f}")

# === Predict & save
df['predicted'] = model.predict(X)
print("\n✅ Sample Predictions:")
print(df[['student', 'exam', 'score', 'predicted']])

df.to_csv("model_predictions.csv", index=False)
print("\n📁 Saved: model_predictions.csv")

print(export_text(model.estimators_[0], feature_names=features, max_depth=3))

