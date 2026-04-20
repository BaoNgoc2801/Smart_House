import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app import train_model_task

print("Starting training for hh124...")
train_model_task("hh124", 100.0, False)
print("Finished!")
