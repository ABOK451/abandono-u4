from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
import json
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, silhouette_samples
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def clasificar_columnas(df):
    """Clasifica las columnas en categóricas y numéricas"""
    columnas_categoricas = []
    columnas_numericas = []

    # Definir columnas que sabemos que son categóricas
    categoricas_conocidas = [
        "sexo",
        "rendimiento",
        "trabajo",
        "nivel_socioeconomico",
        "apoyo_familiar",
        "internet",
        "problemas_emocionales",
        "motivacion",
        "abandono_pensado",
        "actividades",
        "calidad_enseñanza",
        "transporte",
        "riesgo",
        "abandona",
    ]

    # Definir columnas que sabemos que son numéricas
    numericas_conocidas = ["edad", "promedio", "faltas"]

    for col in df.columns:
        col_simple = col.lower().replace("¿", "").replace("?", "").replace(" ", "_")

        # Verificar si es categórica conocida
        if any(cat in col_simple for cat in categoricas_conocidas):
            columnas_categoricas.append(col)
        # Verificar si es numérica conocida
        elif any(num in col_simple for num in numericas_conocidas):
            columnas_numericas.append(col)
        # Verificar por tipo de datos
        elif df[col].dtype == "object":
            # Intentar convertir a número
            try:
                pd.to_numeric(df[col])
                columnas_numericas.append(col)
            except:
                columnas_categoricas.append(col)
        else:
            columnas_numericas.append(col)

    return columnas_categoricas, columnas_numericas


def limpiar_nombres_columnas(df):
    """Limpia y simplifica los nombres de las columnas"""
    mapeo_nombres = {
        "¿Cuál es tu edad?": "edad",
        "¿Cuál es tu sexo?": "sexo",
        "¿Cuál fue tu promedio escolar en el último ciclo?": "promedio",
        "¿Cómo calificas tu rendimiento académico?": "rendimiento",
        "¿Cuántas faltas acumulaste en el último mes?": "faltas",
        "¿Trabajas mientras estudias?": "trabajo",
        "¿Cuál es tu nivel socioeconómico?": "nivel_socioeconomico",
        "¿Cuánto apoyo familiar recibes para tus estudios?": "apoyo_familiar",
        "¿Tienes acceso constante a internet en casa?": "internet",
        "¿Has tenido problemas emocionales o psicológicos recientes?": "problemas_emocionales",
        "¿Te sientes motivado para continuar tus estudios?": "motivacion",
        "¿Has pensado en abandonar la escuela alguna vez?": "abandono_pensado",
        "¿Participas en actividades extracurriculares o deportivas?": "actividades",
        "¿Consideras que la calidad de enseñanza es buena?": "calidad_enseñanza",
        "¿Tienes problemas de transporte para asistir a la escuela?": "transporte",
    }

    # Limpiar nombres con espacios extra
    for col in df.columns:
        col_limpio = col.strip()
        if col_limpio in mapeo_nombres:
            df = df.rename(columns={col: mapeo_nombres[col_limpio]})

    return df


def evaluar_clusters_optimo(df_clean, max_clusters=8):
    """
    Evalúa diferentes números de clusters usando SSE y Silhouette Score
    para encontrar el número óptimo de clusters
    """
    sse_values = []
    silhouette_scores = []
    cluster_range = range(2, min(max_clusters + 1, len(df_clean)))

    for k in cluster_range:
        # Aplicar KMeans
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(df_clean)

        # Calcular SSE
        sse = kmeans.inertia_
        sse_values.append(sse)

        # Calcular Silhouette Score
        silhouette_avg = silhouette_score(df_clean, clusters)
        silhouette_scores.append(silhouette_avg)

    return {
        "cluster_range": list(cluster_range),
        "sse_values": sse_values,
        "silhouette_scores": silhouette_scores,
    }


def aplicar_pca_para_visualizacion(df_clean):
    """
    Aplica PCA para reducir dimensionalidad y facilitar visualización
    """
    # Estandarizar los datos antes de PCA
    scaler = StandardScaler()
    df_scaled = scaler.fit_transform(df_clean)

    # Aplicar PCA
    pca = PCA(n_components=2)
    datos_pca = pca.fit_transform(df_scaled)

    # Información sobre la varianza explicada
    varianza_explicada = pca.explained_variance_ratio_
    varianza_total = sum(varianza_explicada)

    return {
        "datos_pca": datos_pca.tolist(),
        "varianza_explicada": varianza_explicada.tolist(),
        "varianza_total_explicada": float(varianza_total),
        "componentes": pca.components_.tolist(),
    }


@app.post("/predecir")
async def predecir(filas: str = Form(...), variables: str = Form(...)):
    data_json = json.loads(filas)
    columnas = json.loads(variables)
    df = pd.DataFrame(data_json)

    # Eliminar columnas innecesarias
    if "Marca temporal" in df.columns:
        df.drop(columns=["Marca temporal"], inplace=True)

    # Limpiar nombres de columnas
    df = limpiar_nombres_columnas(df)

    # Guardar nombres originales
    if "Nombre" in df.columns:
        nombres = df["Nombre"].tolist()
        df.drop(columns=["Nombre"], inplace=True)
    else:
        nombres = [f"Estudiante {i+1}" for i in range(len(df))]

    # Crear copia para procesamiento
    df_clean = df.copy()

    # Filtrar columnas si se especifican
    if columnas and all(col in df_clean.columns for col in columnas):
        df_clean = df_clean[columnas]

    # ✅ Convertir strings numéricos a números reales
    columnas_numericas = ["edad", "promedio", "faltas"]
    for col in columnas_numericas:
        if col in df_clean.columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce")

    # Codificación de variables categóricas
    label_encoders = {}
    for col in df_clean.select_dtypes(include="object").columns:
        le = LabelEncoder()
        df_clean[col] = le.fit_transform(df_clean[col].astype(str))
        label_encoders[col] = le

    # 🆕 EVALUACIÓN DE CLUSTERS ÓPTIMOS
    evaluacion_clusters = evaluar_clusters_optimo(df_clean)

    # Encontrar el mejor número de clusters basado en Silhouette Score
    mejor_k_index = np.argmax(evaluacion_clusters["silhouette_scores"])
    mejor_k = evaluacion_clusters["cluster_range"][mejor_k_index]

    # Clustering con KMeans (usando k=2 para mantener compatibilidad)
    kmeans = KMeans(n_clusters=2, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(df_clean)

    # 🆕 MÉTRICAS DE EVALUACIÓN
    # SSE (Suma de Errores al Cuadrado)
    sse = kmeans.inertia_

    # Coeficiente de Silhouette promedio
    silhouette_avg = silhouette_score(df_clean, clusters)

    # Coeficientes de Silhouette individuales
    silhouette_individual = silhouette_samples(df_clean, clusters)
    # Convertir a numpy array para asegurar indexación correcta
    silhouette_individual = np.array(silhouette_individual)

    # 🆕 PCA PARA VISUALIZACIÓN
    pca_info = aplicar_pca_para_visualizacion(df_clean)

    # Aplicar clusters a los datos PCA para visualización
    pca_con_clusters = []
    for i, (x, y) in enumerate(pca_info["datos_pca"]):
        pca_con_clusters.append(
            {
                "x": x,
                "y": y,
                "cluster": int(clusters[i]),
                "nombre": nombres[i],
                "silhouette_individual": float(silhouette_individual[i]),
            }
        )

    # Determinar qué clúster es el de riesgo
    riesgo_label = (
        1
        if df_clean.sum(axis=1).mean() < df_clean[clusters == 1].sum(axis=1).mean()
        else 0
    )

    # Clasificar columnas para el frontend
    columnas_categoricas, columnas_numericas = clasificar_columnas(df)

    resultados = []
    datos_originales = []
    datos_procesados = []
    en_riesgo = 0
    sin_riesgo = 0

    # Construcción de resultados
    for idx, cluster in enumerate(clusters):
        riesgo = "En riesgo de abandono" if cluster == riesgo_label else "Sin riesgo"
        abandono = "Sí" if cluster == riesgo_label else "No"
        nombre = nombres[idx]

        # Datos originales (strings)
        datos_orig = df.iloc[idx].to_dict()
        datos_orig["nombre"] = nombre
        datos_orig["riesgo"] = riesgo
        datos_orig["abandona"] = abandono
        datos_orig["silhouette_score"] = float(silhouette_individual[idx])

        # Datos procesados (números)
        datos_proc = df_clean.iloc[idx].to_dict()
        datos_proc["nombre"] = nombre
        datos_proc["riesgo"] = 1 if cluster == riesgo_label else 0
        datos_proc["abandona"] = 1 if cluster == riesgo_label else 0
        datos_proc["silhouette_score"] = float(silhouette_individual[idx])

        # Resultado simplificado para tabla
        resultado = {
            "nombre": nombre,
            "riesgo": riesgo,
            "abandona": abandono,
            "silhouette_score": round(float(silhouette_individual[idx]), 3),
        }

        resultados.append(resultado)
        datos_originales.append(datos_orig)
        datos_procesados.append(datos_proc)

        if abandono == "Sí":
            en_riesgo += 1
        else:
            sin_riesgo += 1

    resumen = {
        "total": len(resultados),
        "en_riesgo": en_riesgo,
        "sin_riesgo": sin_riesgo,
        "porcentaje_riesgo": round((en_riesgo / len(resultados)) * 100, 2),
        "porcentaje_no_riesgo": round((sin_riesgo / len(resultados)) * 100, 2),
    }

    # Metadatos para el frontend
    metadatos = {
        "columnas_categoricas": columnas_categoricas,
        "columnas_numericas": columnas_numericas,
        "mapeo_nombres": {
            "edad": "Edad",
            "sexo": "Sexo",
            "promedio": "Promedio Escolar",
            "rendimiento": "Rendimiento Académico",
            "faltas": "Faltas",
            "trabajo": "Trabaja",
            "nivel_socioeconomico": "Nivel Socioeconómico",
            "apoyo_familiar": "Apoyo Familiar",
            "internet": "Acceso a Internet",
            "problemas_emocionales": "Problemas Emocionales",
            "motivacion": "Motivación",
            "abandono_pensado": "Pensó en Abandonar",
            "actividades": "Actividades Extracurriculares",
            "calidad_enseñanza": "Calidad de Enseñanza",
            "transporte": "Problemas de Transporte",
            "riesgo": "Nivel de Riesgo",
            "abandona": "Abandona",
        },
    }

    # 🆕 MÉTRICAS DE EVALUACIÓN COMPLETAS
    metricas_evaluacion = {
        "sse": float(sse),
        "silhouette_score_promedio": float(silhouette_avg),
        "centros_clusters": kmeans.cluster_centers_.tolist(),
        "mejor_k_sugerido": int(mejor_k),
        "evaluacion_k_multiple": evaluacion_clusters,
        "calidad_clustering": {
            "excelente": silhouette_avg > 0.7,
            "buena": 0.5 < silhouette_avg <= 0.7,
            "aceptable": 0.25 < silhouette_avg <= 0.5,
            "pobre": silhouette_avg <= 0.25,
            "interpretacion": (
                "Excelente separación entre clusters"
                if silhouette_avg > 0.7
                else (
                    "Buena separación entre clusters"
                    if 0.5 < silhouette_avg <= 0.7
                    else (
                        "Separación aceptable entre clusters"
                        if 0.25 < silhouette_avg <= 0.5
                        else "Separación pobre entre clusters"
                    )
                )
            ),
        },
    }

    response = {
        "resultados": resultados,  # Para mostrar en tabla
        "datos_originales": datos_originales,  # Para gráficas con strings
        "datos_procesados": datos_procesados,  # Para gráficas con números
        "resumen": resumen,
        "metadatos": metadatos,
        "descargable": data_json,  # Dataset original sin modificar
        "metricas_evaluacion": metricas_evaluacion,  # 🆕 Métricas de evaluación
        "pca_visualization": {  # 🆕 Datos para visualización PCA
            "datos_pca": pca_con_clusters,
            "varianza_explicada": pca_info["varianza_explicada"],
            "varianza_total_explicada": pca_info["varianza_total_explicada"],
        },
    }

    # Mostrar métricas en consola
    print("\n" + "=" * 50)
    print("MÉTRICAS DE EVALUACIÓN DE CLUSTERING")
    print("=" * 50)
    print(f"SSE (Suma de Errores al Cuadrado): {sse:.2f}")
    print(f"Silhouette Score Promedio: {silhouette_avg:.3f}")
    print(
        f"Calidad del Clustering: {metricas_evaluacion['calidad_clustering']['interpretacion']}"
    )
    print(f"Mejor k sugerido: {mejor_k}")
    print(f"Varianza explicada por PCA: {pca_info['varianza_total_explicada']:.1%}")
    print("=" * 50)

    return response


# ENDPOINT PARA ANÁLISIS DE CLUSTERS
@app.post("/analizar-clusters")
async def analizar_clusters(
    filas: str = Form(...), variables: str = Form(...), max_k: int = Form(8)
):
    """
    Endpoint específico para análisis detallado de diferentes números de clusters
    """
    data_json = json.loads(filas)
    columnas = json.loads(variables)
    df = pd.DataFrame(data_json)

    # Procesamiento similar al endpoint principal
    if "Marca temporal" in df.columns:
        df.drop(columns=["Marca temporal"], inplace=True)

    df = limpiar_nombres_columnas(df)

    if "Nombre" in df.columns:
        df.drop(columns=["Nombre"], inplace=True)

    df_clean = df.copy()

    if columnas and all(col in df_clean.columns for col in columnas):
        df_clean = df_clean[columnas]

    columnas_numericas = ["edad", "promedio", "faltas"]
    for col in columnas_numericas:
        if col in df_clean.columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce")

    label_encoders = {}
    for col in df_clean.select_dtypes(include="object").columns:
        le = LabelEncoder()
        df_clean[col] = le.fit_transform(df_clean[col].astype(str))
        label_encoders[col] = le

    # Análisis completo de clusters
    evaluacion = evaluar_clusters_optimo(df_clean, max_k)

    return {
        "evaluacion_clusters": evaluacion,
        "recomendacion": {
            "mejor_k": evaluacion["cluster_range"][
                np.argmax(evaluacion["silhouette_scores"])
            ],
            "razon": "Basado en el mayor Silhouette Score",
        },
    }
