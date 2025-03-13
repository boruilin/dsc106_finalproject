# train_model.py

import os
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import json

# === Your score data
grades = {
    'Midterm1': {'S1': '78/100', 'S2': '82/100', 'S3': '77/100', 'S4': '75/100', 'S5': '67/100',
                 'S6': '71/100', 'S7': '64/100', 'S8': '92/100', 'S9': '80/100', 'S10': '89/100'},
    'Midterm2': {'S1': '82/100', 'S2': '85/100', 'S3': '90/100', 'S4': '77/100', 'S5': '77/100',
                 'S6': '64/100', 'S7': '33/100', 'S8': '88/100', 'S9': '39/100', 'S10': '64/100'},
    'Final': {'S1': '182/200', 'S2': '180/200', 'S3': '188/200', 'S4': '149/200', 'S5': '157/200',
              'S6': '175/200', 'S7': '110/200', 'S8': '184/200', 'S9': '126/200', 'S10': '116/200'}
}

# === Thresholds for "nervous" state
HR_THRESHOLD = 90
EDA_THRESHOLD = 1.5
TEMP_THRESHOLD = 92  # in Fahrenheit

def count_nervous_minutes(filepath, threshold, direction):
    try:
        with open(filepath) as f:
            lines = f.read().splitlines()
        start_time = int(lines[0])
        sample_rate = float(lines[1])
        values = list(map(float, lines[2:]))

        bucket_size = int(sample_rate * 60)
        nervous_minutes = 0

        for i in range(0, len(values), bucket_size):
            chunk = values[i:i+bucket_size]
            if not chunk: continue
            avg = np.mean(chunk)
            if (direction == 'above' and avg > threshold) or (direction == 'below' and avg < threshold):
                nervous_minutes += 1

        return nervous_minutes

    except FileNotFoundError:
        return None

data = []

students = [f'S{i}' for i in range(1, 11)]
exams = ['Midterm1', 'Midterm2', 'Final']

for student in students:
    for exam in exams:
        base = os.path.join(student, exam)
        eda_path = os.path.join(base, 'EDA.csv')
        hr_path = os.path.join(base, 'HR.csv')
        temp_path = os.path.join(base, 'TEMP.csv')

        eda = count_nervous_minutes(eda_path, EDA_THRESHOLD, 'above')
        hr = count_nervous_minutes(hr_path, HR_THRESHOLD, 'above')
        temp = count_nervous_minutes(temp_path, TEMP_THRESHOLD, 'below')

        if None in (eda, hr, temp):
            continue

        raw_score = grades[exam][student]
        num, denom = map(float, raw_score.split('/'))
        pct_score = (num / denom) * 100

        data.append({
            'student': student,
            'exam': exam,
            'eda_nervous': eda,
            'hr_nervous': hr,
            'temp_nervous': temp,
            'score': pct_score
        })

# Convert to DataFrame
df = pd.DataFrame(data)
print(df)

# Train model
X = df[['eda_nervous', 'hr_nervous', 'temp_nervous']]
y = df['score']

model = LinearRegression()
model.fit(X, y)



# Save model coefficients for use in JS
model_json = {
    'intercept': model.intercept_,
    'eda_coef': model.coef_[0],
    'hr_coef': model.coef_[1],
    'temp_coef': model.coef_[2]
}

with open("model_coeffs.json", "w") as f:
    json.dump(model_json, f, indent=2)

# Print results
print("\nTrained Linear Regression Model:")
print("Intercept:", model.intercept_)
print("EDA coef:", model.coef_[0])
print("HR coef:", model.coef_[1])
print("TEMP coef:", model.coef_[2])

