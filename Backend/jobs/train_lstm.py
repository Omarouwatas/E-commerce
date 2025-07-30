import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.model_selection import train_test_split
from jobs.utils import extract_sequences_from_mongo

def train_lstm():
    print("🚀 Lancement du job de réentraînement LSTM...")

    # Étape 1 : (ré)extraire les données de Mongo + générer X/y
    X, y = extract_sequences_from_mongo(window_size=3)

    if len(X) < 10:
        print("⚠️ Pas assez de données pour entraîner.")
        return

    # Étape 2 : charger ancien modèle ou en créer un nouveau
    try:
        model = load_model("models/lstm_model.h5")
        print("✅ Modèle existant chargé.")
    except:
        print("📦 Aucun modèle trouvé. Création d’un nouveau.")
        model = Sequential()
        model.add(LSTM(64, activation='tanh', input_shape=(X.shape[1], X.shape[2]), return_sequences=False))
        model.add(Dropout(0.2))
        model.add(Dense(32, activation='relu'))
        model.add(Dense(1))
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])

    # Étape 3 : entraînement incrémental
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2)
    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=50,
        batch_size=16,
        callbacks=[EarlyStopping(patience=5, restore_best_weights=True)],
        verbose=1
    )

    # Étape 4 : sauvegarde
    model.save("models/lstm_model.h5")
    print("✅ Modèle LSTM réentraîné et sauvegardé.")
