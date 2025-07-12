""" from fastapi import FastAPI, Form
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
 """
 
 
 
 
##NUEVO CODIGO

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

def clasificar_columnas(df):
    """Clasifica las columnas en categóricas y numéricas"""
    columnas_categoricas = []
    columnas_numericas = []
    
    # Definir columnas que sabemos que son categóricas
    categoricas_conocidas = [
        'sexo', 'rendimiento', 'trabajo', 'nivel_socioeconomico', 'apoyo_familiar',
        'internet', 'problemas_emocionales', 'motivacion', 'abandono_pensado',
        'actividades', 'calidad_enseñanza', 'transporte', 'riesgo', 'abandona'
    ]
    
    # Definir columnas que sabemos que son numéricas
    numericas_conocidas = [
        'edad', 'promedio', 'faltas'
    ]
    
    for col in df.columns:
        col_simple = col.lower().replace('¿', '').replace('?', '').replace(' ', '_')
        
        # Verificar si es categórica conocida
        if any(cat in col_simple for cat in categoricas_conocidas):
            columnas_categoricas.append(col)
        # Verificar si es numérica conocida
        elif any(num in col_simple for num in numericas_conocidas):
            columnas_numericas.append(col)
        # Verificar por tipo de datos
        elif df[col].dtype == 'object':
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
        '¿Cuál es tu edad?': 'edad',
        '¿Cuál es tu sexo?': 'sexo',
        '¿Cuál fue tu promedio escolar en el último ciclo?': 'promedio',
        '¿Cómo calificas tu rendimiento académico?': 'rendimiento',
        '¿Cuántas faltas acumulaste en el último mes?': 'faltas',
        '¿Trabajas mientras estudias?': 'trabajo',
        '¿Cuál es tu nivel socioeconómico?': 'nivel_socioeconomico',
        '¿Cuánto apoyo familiar recibes para tus estudios?': 'apoyo_familiar',
        '¿Tienes acceso constante a internet en casa?': 'internet',
        '¿Has tenido problemas emocionales o psicológicos recientes?': 'problemas_emocionales',
        '¿Te sientes motivado para continuar tus estudios?': 'motivacion',
        '¿Has pensado en abandonar la escuela alguna vez?': 'abandono_pensado',
        '¿Participas en actividades extracurriculares o deportivas?': 'actividades',
        '¿Consideras que la calidad de enseñanza es buena?': 'calidad_enseñanza',
        '¿Tienes problemas de transporte para asistir a la escuela?': 'transporte'
    }
    
    # Limpiar nombres con espacios extra
    for col in df.columns:
        col_limpio = col.strip()
        if col_limpio in mapeo_nombres:
            df = df.rename(columns={col: mapeo_nombres[col_limpio]})
    
    return df

@app.post("/predecir")
async def predecir(filas: str = Form(...), variables: str = Form(...)):
    data_json = json.loads(filas)
    columnas = json.loads(variables)
    df = pd.DataFrame(data_json)

    # Eliminar columnas innecesarias
    if 'Marca temporal' in df.columns:
        df.drop(columns=['Marca temporal'], inplace=True)

    # Limpiar nombres de columnas
    df = limpiar_nombres_columnas(df)

    # Guardar nombres originales
    if 'Nombre' in df.columns:
        nombres = df['Nombre'].tolist()
        df.drop(columns=['Nombre'], inplace=True)
    else:
        nombres = [f'Estudiante {i+1}' for i in range(len(df))]

    # Crear copia para procesamiento
    df_clean = df.copy()

    # Filtrar columnas si se especifican
    if columnas and all(col in df_clean.columns for col in columnas):
        df_clean = df_clean[columnas]

    # ✅ Convertir strings numéricos a números reales
    columnas_numericas = ['edad', 'promedio', 'faltas']
    for col in columnas_numericas:
        if col in df_clean.columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')

    # Codificación de variables categóricas
    label_encoders = {}
    for col in df_clean.select_dtypes(include='object').columns:
        le = LabelEncoder()
        df_clean[col] = le.fit_transform(df_clean[col].astype(str))
        label_encoders[col] = le

    # Clustering con KMeans
    kmeans = KMeans(n_clusters=2, random_state=42)
    clusters = kmeans.fit_predict(df_clean)

    # Determinar qué clúster es el de riesgo
    riesgo_label = 1 if df_clean.sum(axis=1).mean() < df_clean[clusters == 1].sum(axis=1).mean() else 0

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
        datos_orig['nombre'] = nombre
        datos_orig['riesgo'] = riesgo
        datos_orig['abandona'] = abandono

        # Datos procesados (números)
        datos_proc = df_clean.iloc[idx].to_dict()
        datos_proc['nombre'] = nombre
        datos_proc['riesgo'] = 1 if cluster == riesgo_label else 0
        datos_proc['abandona'] = 1 if cluster == riesgo_label else 0

        # Resultado simplificado para tabla
        resultado = {
            "nombre": nombre,
            "riesgo": riesgo,
            "abandona": abandono
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
        "porcentaje_no_riesgo": round((sin_riesgo / len(resultados)) * 100, 2)
    }

    # Metadatos para el frontend
    metadatos = {
        "columnas_categoricas": columnas_categoricas,
        "columnas_numericas": columnas_numericas,
        "mapeo_nombres": {
            'edad': 'Edad',
            'sexo': 'Sexo',
            'promedio': 'Promedio Escolar',
            'rendimiento': 'Rendimiento Académico',
            'faltas': 'Faltas',
            'trabajo': 'Trabaja',
            'nivel_socioeconomico': 'Nivel Socioeconómico',
            'apoyo_familiar': 'Apoyo Familiar',
            'internet': 'Acceso a Internet',
            'problemas_emocionales': 'Problemas Emocionales',
            'motivacion': 'Motivación',
            'abandono_pensado': 'Pensó en Abandonar',
            'actividades': 'Actividades Extracurriculares',
            'calidad_enseñanza': 'Calidad de Enseñanza',
            'transporte': 'Problemas de Transporte',
            'riesgo': 'Nivel de Riesgo',
            'abandona': 'Abandona'
        }
    }

    response = {
        "resultados": resultados,  # Para mostrar en tabla
        "datos_originales": datos_originales,  # Para gráficas con strings
        "datos_procesados": datos_procesados,  # Para gráficas con números
        "resumen": resumen,
        "metadatos": metadatos,
        "descargable": data_json  # Dataset original sin modificar
    }

    # Mostrar en consola
    print(json.dumps(response, indent=2, ensure_ascii=False))

    return response