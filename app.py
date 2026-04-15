import streamlit as st
import pandas as pd
import torch
import torch.nn.functional as F
from torch_geometric.data import Data
from torch_geometric.nn import GCNConv
from sklearn.preprocessing import StandardScaler

# -------------------------------
# GNN MODEL (same as training)
# -------------------------------
class GCNModel(torch.nn.Module):
    def __init__(self, input_dim):
        super(GCNModel, self).__init__()
        self.conv1 = GCNConv(input_dim, 16)
        self.conv2 = GCNConv(16, 2)

    def forward(self, data):
        x, edge_index = data.x, data.edge_index

        x = self.conv1(x, edge_index)
        x = F.relu(x)

        x = self.conv2(x, edge_index)

        return F.log_softmax(x, dim=1)

# -------------------------------
# LOAD MODEL
# -------------------------------
@st.cache_resource
def load_model(input_dim):
    model = GCNModel(input_dim)
    model.load_state_dict(torch.load("fraud_gnn_model.pt", map_location=torch.device('cpu')))
    model.eval()
    return model

# -------------------------------
# STREAMLIT UI
# -------------------------------
st.title("💳 Credit Card Fraud Detection (GNN)")
st.write("Upload your transaction dataset to detect fraud.")

uploaded_file = st.file_uploader("Upload CSV File", type=["csv"])

if uploaded_file is not None:
    df = pd.read_csv(uploaded_file)

    st.write("### Raw Data")
    st.dataframe(df.head())

    # -------------------------------
    # PREPROCESSING
    # -------------------------------
    if 'Class' in df.columns:
        df = df.drop(columns=['Class'])

    df = df.fillna(0)

    scaler = StandardScaler()
    df['Amount'] = scaler.fit_transform(df[['Amount']])

    # Convert to tensor
    X = torch.tensor(df.values, dtype=torch.float)

    # -------------------------------
    # GRAPH CREATION
    # -------------------------------
    edge_index = []
    for i in range(len(df)-1):
        edge_index.append([i, i+1])
        edge_index.append([i+1, i])

    edge_index = torch.tensor(edge_index, dtype=torch.long).t().contiguous()

    data = Data(x=X, edge_index=edge_index)

    # -------------------------------
    # LOAD MODEL
    # -------------------------------
    model = load_model(X.shape[1])

    # -------------------------------
    # PREDICTION
    # -------------------------------
    with torch.no_grad():
        out = model(data)
        pred = out.argmax(dim=1)

    df['Prediction'] = pred.numpy()

    # -------------------------------
    # OUTPUT
    # -------------------------------
    st.write("### Prediction Results")
    st.dataframe(df.head(20))

    fraud_count = df['Prediction'].sum()
    st.write(f"🚨 Fraud Transactions Detected: {fraud_count}")