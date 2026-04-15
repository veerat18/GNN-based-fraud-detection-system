# GNN-Based Credit Card Fraud Detection

> Implementation of the research paper:  
> *"Graph Neural Network Based Intelligent Credit Card Fraud Detection"*

---

## Project Structure

```
├── gnn_fraud_detection.py   # Full GNN pipeline (Python)
├── requirements.txt         # Dependencies
└── README.md
```

---

## Setup

### 1. Install dependencies
```bash
pip install -r requirements.txt

# PyTorch Geometric extras (match your torch version)
pip install torch-scatter torch-sparse \
  -f https://data.pyg.org/whl/torch-2.0.0+cpu.html
```

### 2. Download the Dataset
Get the **Kaggle Credit Card Fraud Dataset**:  
🔗 https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud

Place `creditcard.csv` in the same directory.

### 3. Run the pipeline
```bash
python gnn_fraud_detection.py creditcard.csv
```

---

## Pipeline Overview

| Step | Description |
|------|-------------|
| 1 | Load & preprocess transaction data |
| 2 | Normalize `Amount` and `Time` features |
| 3 | Build k-NN transaction graph (nodes = transactions, edges = similarity) |
| 4 | Apply **Temporal Decay** weights (`w = exp(-λ·(T_max - t))`) |
| 5 | Train **3-layer GraphSAGE** model with weighted cross-entropy loss |
| 6 | Evaluate: Accuracy, Precision, Recall, F1, ROC-AUC |
| 7 | Compare against Logistic Regression & Random Forest baselines |

---

## GNN Architecture

```
Input (30 features)
    │
SAGEConv(30 → 128) + ReLU + Dropout
    │
SAGEConv(128 → 64) + ReLU + Dropout
    │
SAGEConv(64 → 32) + ReLU
    │
Linear(32 → 32) + ReLU + Dropout
    │
Linear(32 → 2)  → [Legitimate / Fraudulent]
```

---

## Temporal Decay Formula

```
w(t) = exp(-λ × (T_max - t))
```
- Recent transactions → weight ≈ 1.0  
- Old transactions    → weight → 0.0  
- Default λ = 0.001

---

## Expected Results

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|-------|----------|-----------|--------|----|---------|
| Logistic Regression | ~97% | ~0.05 | ~0.90 | ~0.10 | ~0.96 |
| Random Forest | ~99.9% | ~0.85 | ~0.77 | ~0.81 | ~0.97 |
| **GNN (GraphSAGE)** | **~99.9%** | **~0.88** | **~0.84** | **~0.86** | **~0.98** |

---

## Outputs

- `fraud_detection_results.csv` — metric comparison table  
- `gnn_fraud_model.pt` — saved GNN model weights

---

## Future Extensions (from paper)
- [ ] Real-time streaming with Kafka / Apache Spark  
- [ ] Graph Attention Networks (GAT)  
- [ ] GNN + LSTM hybrid for temporal sequences  
- [ ] Explainable AI (XAI) with GNNExplainer  
- [ ] Deploy on AWS / Azure with REST API  
