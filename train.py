import pandas as pd
import numpy as np
import os

# Define base path and constants
base_path = "/mnt/data/DSC106_FINALPROJECT"
students = [f"S{i}" for i in range(1, 11)]
exams = ["Midterm1", "Midterm2", "Final"]
types = ["EDA", "HR", "TEMP"]
thresholds = {"EDA": 0.5, "HR": 100, "TEMP": 30}
exam_duration_minutes = {"Midterm1": 90, "Midterm2": 90, "Final": 180}

# Function to calculate % time over or under threshold
def calculate_stress_percentage(values, threshold, comparator):
    if comparator == "gt":
        return np.mean(values > threshold) * 100
    elif comparator == "lt":
        return np.mean(values < threshold) * 100

# Comparator types for thresholds
comparators = {"EDA": "gt", "HR": "gt", "TEMP": "lt"}

# Store each student's stress profile per exam
records = []

for student in students:
    for exam in exams:
        profile = {"Student": student, "Exam": exam}
        for sensor in types:
            try:
                path = os.path.join(base_path, student, exam, f"{sensor}.csv")
                with open(path) as f:
                    lines = f.readlines()
                    if len(lines) < 3:
                        raise ValueError("Insufficient data rows in file.")
                    # Extract data rows (skip timestamp and sample rate)
                    values = np.array([float(x.strip()) for x in lines[2:]])
                    score = calculate_stress_percentage(values, thresholds[sensor], comparators[sensor])
                    profile[sensor] = score
            except Exception as e:
                profile[sensor] = np.nan  # Mark missing or bad data
        records.append(profile)

# Convert to DataFrame
stress_df = pd.DataFrame(records)
stress_df["MeanStress"] = stress_df[["EDA", "HR", "TEMP"]].mean(axis=1)








