from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
import json
from sklearn.preprocessing import LabelEncoder
from sklearn.cluster import KMeans

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predecir")
async def predecir(filas: str = Form(...), variables: str = Form(...)):
    data_json = json.loads(filas)
    columnas = json.loads(variables)
    df = pd.DataFrame(data_json)

    # Eliminar columnas innecesarias
    for col in ['Marca temporal']:
        if col in df.columns:
            df.drop(columns=[col], inplace=True)

    df_clean = df.copy()
    if 'Nombre' in df_clean.columns:
        nombres = df_clean['Nombre'].tolist()
        df_clean.drop(columns=['Nombre'], inplace=True)
    else:
        nombres = [f'Estudiante {i+1}' for i in range(len(df_clean))]

    # Filtrar columnas
    df_clean = df_clean[columnas] if all(col in df_clean.columns for col in columnas) else df_clean

    # Codificación de variables
    for col in df_clean.select_dtypes(include='object').columns:
        le = LabelEncoder()
        df_clean[col] = le.fit_transform(df_clean[col].astype(str))

    # Clustering
    kmeans = KMeans(n_clusters=2, random_state=42)
    clusters = kmeans.fit_predict(df_clean)

    # Determinar qué clúster es el de riesgo
    riesgo_label = 1 if df_clean.sum(axis=1).mean() < df_clean[clusters == 1].sum(axis=1).mean() else 0

    # Preparar resultados
    resultados = []
    en_riesgo = 0
    sin_riesgo = 0

    for idx, cluster in enumerate(clusters):
        riesgo = "En riesgo de abandono" if cluster == riesgo_label else "Sin riesgo"
        abandono = "Sí" if cluster == riesgo_label else "No"
        nombre = nombres[idx]
        resultados.append({
            "nombre": nombre,
            "riesgo": riesgo,
            "abandona": abandono
        })
        if abandono == "Sí":
            en_riesgo += 1
        else:
            sin_riesgo += 1

    # Datos para gráficas
    resumen = {
        "total": len(resultados),
        "en_riesgo": en_riesgo,
        "sin_riesgo": sin_riesgo,
        "porcentaje_riesgo": round((en_riesgo / len(resultados)) * 100, 2),
        "porcentaje_no_riesgo": round((sin_riesgo / len(resultados)) * 100, 2)
    }

    return {
        "resultados": resultados,
        "resumen": resumen,
        "descargable": data_json  # dataset original + se puede ampliar si se desea agregar predicción
    }
