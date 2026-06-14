import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './models.css';

class ModelsComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            models: {},
            selectedModel: null
        };
        this.updateInterval = null;
        this.handleModelSelect = this.handleModelSelect.bind(this);
        this.handleRetrain = this.handleRetrain.bind(this);
    }

    componentDidMount() {
        this.updateInterval = setInterval(() => {
            try {
                const vm = this.props.vm || window.vm;
                if (vm && vm.runtime && vm.runtime.mlModels) {
                    
                    const clonedModels = {};
                    const keys = Object.keys(vm.runtime.mlModels);
                    
                    this.setState(prevState => {
                        let newSelected = prevState.selectedModel;

                        for (let i = 0; i < keys.length; i++) {
                            const key = keys[i];
                            const m = vm.runtime.mlModels[key];
                            clonedModels[key] = {
                                id: m.id,
                                isTrained: m.isTrained,
                                isTraining: m.isTraining,
                                currentLoss: m.currentLoss,
                                lossHistory: [...(m.lossHistory || [])],             
                                predictionHistory: [...(m.predictionHistory || [])], 
                                datasetUsed: m.datasetUsed,
                                algorithm: m.algorithm,
                                lastPrediction: m.lastPrediction,
                                lastConfidence: m.lastConfidence
                            };
                        }
                        
                        if (!newSelected && keys.length > 0) {
                            newSelected = keys[0];
                        }
                        if (newSelected && !clonedModels[newSelected]) {
                            newSelected = keys.length > 0 ? keys[0] : null;
                        }
                        
                        return { 
                            models: clonedModels, 
                            selectedModel: newSelected
                        };
                    });
                }
            } catch (err) {
                console.warn("[Models Tab] Sync error:", err);
            }
        }, 500); 
    }

    componentWillUnmount() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    handleModelSelect(modelId) {
        this.setState({ selectedModel: modelId });
    }

    handleRetrain() {
        const { models, selectedModel } = this.state;
        const currentModel = models[selectedModel];
        
        if (!currentModel || !currentModel.datasetUsed) {
            alert("Este modelo necesita tener asignado un conjunto de datos a través de los bloques antes de poder entrenarlo.");
            return;
        }

        const vm = this.props.vm || window.vm;
        if (vm && vm.runtime) {
            vm.runtime.emit('GUI_RETRAIN_MODEL', {
                modelName: currentModel.id,
                datasetName: currentModel.datasetUsed
            });
        }
    }

    // Didactic Line Chart for Error Margin
    renderLossGraph(lossArray) {
        if (!lossArray || lossArray.length < 2) {
            return (
                <div className={styles.graphPlaceholder} style={{ textAlign: 'center', padding: '30px', color: '#575E75' }}>
                    <strong>Esperando datos...</strong><br/>
                    Inicia el entrenamiento para ver cómo la fórmula matemática intenta reducir sus fallos.
                </div>
            );
        }

        const width = 300;
        const height = 120; // Increased height slightly for the new labels
        const paddingLeft = 35; 
        const paddingRight = 10;
        const paddingTop = 15;
        const paddingBottom = 20;
        
        const graphWidth = width - paddingLeft - paddingRight;
        const graphHeight = height - paddingTop - paddingBottom;
        
        const maxLoss = Math.max(...lossArray, 0.01); 
        const minLoss = 0;
        
        const points = lossArray.map((loss, index) => {
            const x = paddingLeft + (index / (lossArray.length - 1)) * graphWidth;
            const y = paddingTop + graphHeight - ((loss - minLoss) / (maxLoss - minLoss)) * graphHeight;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className={styles.graphContainer}>
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                    {/* Background Gridlines */}
                    <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#e0e0e0" strokeDasharray="2 2" />
                    <line x1={paddingLeft} y1={paddingTop + graphHeight / 2} x2={width - paddingRight} y2={paddingTop + graphHeight / 2} stroke="#e0e0e0" strokeDasharray="2 2" />
                    
                    {/* The Zero Error Goal Line (Target) */}
                    <line x1={paddingLeft} y1={paddingTop + graphHeight} x2={width - paddingRight} y2={paddingTop + graphHeight} stroke="#0FBD8C" strokeWidth="2" strokeDasharray="4 4" />
                    <text x={width - paddingRight} y={paddingTop + graphHeight - 5} textAnchor="end" fill="#0FBD8C" fontSize="9" fontWeight="bold">Objetivo: 0 Fallos</text>

                    {/* Numerical Y-Axis labels */}
                    <text x={paddingLeft - 5} y={paddingTop + 4} textAnchor="end" fill="#575E75" fontSize="10">{maxLoss.toFixed(2)}</text>
                    <text x={paddingLeft - 5} y={paddingTop + (graphHeight / 2) + 4} textAnchor="end" fill="#575E75" fontSize="10">{(maxLoss / 2).toFixed(2)}</text>
                    <text x={paddingLeft - 5} y={paddingTop + graphHeight + 4} textAnchor="end" fill="#575E75" fontSize="10">0</text>
                    
                    {/* Axis Titles */}
                    <text x={paddingLeft - 25} y={paddingTop + graphHeight / 2} transform={`rotate(-90 ${paddingLeft - 25} ${paddingTop + graphHeight / 2})`} textAnchor="middle" fill="#575E75" fontSize="9" fontWeight="bold">Cantidad de Error</text>
                    <text x={paddingLeft + graphWidth / 2} y={height - 2} textAnchor="middle" fill="#575E75" fontSize="9" fontWeight="bold">Tiempo calculando &#8594;</text>

                    {/* Data Line */}
                    <polyline
                        fill="none"
                        stroke="#FF6680"
                        strokeWidth="3"
                        points={points}
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        );
    }

    renderArchitecture(algorithm) {
        const isNN = algorithm === 'NeuralNetwork';
        
        return (
            <div className={styles.architectureDiagram} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ backgroundColor: '#fff', border: '2px solid #4C97FF', borderRadius: '6px', padding: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: '#575E75' }}>1. Matriz de Píxeles</div>
                    <small style={{ color: '#888', fontSize: '0.7rem' }}>Entrada visual</small>
                </div>
                <div style={{ color: '#4C97FF', fontWeight: 'bold', padding: '0 10px' }}>&#8594;</div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ backgroundColor: '#fff', border: '2px dashed #9966FF', borderRadius: '6px', padding: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: '#575E75' }}>
                        2. Extraer Patrones
                    </div>
                    <small style={{ color: '#888', fontSize: '0.7rem' }}>Búsqueda numérica</small>
                </div>
                <div style={{ color: '#9966FF', fontWeight: 'bold', padding: '0 10px' }}>&#8594;</div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ backgroundColor: '#fff', border: '2px solid #FFAB19', borderRadius: '6px', padding: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: '#575E75' }}>
                        {isNN ? "3. Fórmula Matemática" : "3. Comparación Geométrica"}
                    </div>
                    <small style={{ color: '#888', fontSize: '0.7rem' }}>{isNN ? "Cálculo de pesos" : "Distancia a vecinos"}</small>
                </div>
                <div style={{ color: '#FFAB19', fontWeight: 'bold', padding: '0 10px' }}>&#8594;</div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ backgroundColor: '#0FBD8C', color: 'white', border: '2px solid #0FBD8C', borderRadius: '6px', padding: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>4. Probabilidad</div>
                    <small style={{ color: '#888', fontSize: '0.7rem' }}>Resultado final</small>
                </div>
            </div>
        );
    }

    render() {
        const { models, selectedModel } = this.state;
        const modelKeys = Object.keys(models);
        const currentModel = selectedModel ? models[selectedModel] : null;

        return (
            <div className={classNames(styles.editorContainer, this.props.className)}>
                <div className={styles.layout}>
                    
                    {/* SIDEBAR: List of Models */}
                    <div className={styles.sidebar}>
                        <div className={styles.sidebarHeader}>
                            <h3>Modelos ({modelKeys.length})</h3>
                        </div>
                        <ul className={styles.modelList}>
                            {modelKeys.length === 0 ? (
                                <li className={styles.emptyList}>No hay modelos creados. Usa el bloque verde para crear uno.</li>
                            ) : (
                                modelKeys.map(key => (
                                    <li 
                                        key={key} 
                                        className={classNames(styles.listItem, { [styles.listItemSelected]: selectedModel === key })}
                                        onClick={() => this.handleModelSelect(key)}
                                    >
                                        <div className={styles.listItemName}>{key}</div>
                                        <div className={styles.listItemStatus}>
                                            {models[key].isTraining ? "Calculando..." : (models[key].isTrained ? "Listo" : "Sin empezar")}
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>

                    {/* MAIN CONTENT: Model Dashboard */}
                    <div className={styles.mainContent}>
                        {!currentModel ? (
                            <div className={styles.noSelection}>
                                <p>Selecciona un modelo para ver sus métricas y detalles matemáticos.</p>
                            </div>
                        ) : (
                            <div className={styles.dashboard}>
                                
                                {/* Header & Actions */}
                                <div className={styles.dashHeader}>
                                    <div>
                                        <h2 className={styles.dashTitle}>{currentModel.id}</h2>
                                        <span className={styles.dashSubtitle}>Método: <strong>{currentModel.algorithm === 'NeuralNetwork' ? 'Red Neuronal (Cálculo de pesos)' : 'K-Nearest Neighbors (Comparación de distancias)'}</strong></span>
                                    </div>
                                    {/* DIDACTIC IMPROVEMENT: Changed button text to match K-12 questionnaire */}
                                    <button 
                                        className={classNames(styles.button, styles.primaryButton)}
                                        onClick={this.handleRetrain}
                                        disabled={currentModel.isTraining || !currentModel.datasetUsed}
                                        style={{ padding: '10px 20px', fontSize: '1rem' }}
                                    >
                                        {currentModel.isTraining ? "Ajustando matemáticas..." : "Recalcular Reglas (Entrenar)"}
                                    </button>
                                </div>

                                {/* Configuration & Status Row */}
                                <div className={styles.infoRow}>
                                    <div className={styles.infoCard}>
                                        <h4>Configuración del modelo</h4>
                                        <p><strong>Datos origen:</strong> {currentModel.datasetUsed || "Ninguno"}</p>
                                        <p><strong>Estado:</strong> {currentModel.isTraining ? "Optimizando fórmula..." : (currentModel.isTrained ? "Ajuste matemático completado" : "Esperando datos")}</p>
                                        {currentModel.algorithm === 'NeuralNetwork' && (
                                            <div className={styles.hyperparams} style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                                                <small><strong>Límite de cálculos (Épocas):</strong> 50 ciclos</small><br/>
                                                <small><strong>Velocidad de ajuste:</strong> 0.0001</small>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className={styles.infoCard}>
                                        <h4>Evolución del Error (Pérdida)</h4>
                                        {currentModel.algorithm === 'KNN' ? (
                                            <p className={styles.mutedText}>Este algoritmo no calcula errores progresivos, mapea las características directamente en un plano geométrico.</p>
                                        ) : (
                                            <div className={styles.lossMonitor}>
                                                <div className={styles.lossHeader} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                    <span style={{ color: '#575E75' }}>Fallo matemático actual:</span>
                                                    <strong style={{ color: '#FF6680', fontSize: '1.1rem' }}>
                                                        {typeof currentModel.currentLoss === 'number' && !isNaN(currentModel.currentLoss) ? currentModel.currentLoss.toFixed(4) : "---"}
                                                    </strong>
                                                </div>
                                                {this.renderLossGraph(currentModel.lossHistory)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Didactic Architecture */}
                                <div className={styles.archSection} style={{ marginTop: '20px' }}>
                                    <h4 style={{ marginBottom: '10px' }}>Interior de la Caja Negra (Flujo de datos)</h4>
                                    {this.renderArchitecture(currentModel.algorithm)}
                                </div>

                                {/* DIDACTIC IMPROVEMENT: Probability/Confidence Gauge */}
                                <div className={styles.infoRow} style={{ marginTop: '20px' }}>
                                    <div className={classNames(styles.infoCard, styles.inferenceCard)} style={{ width: '100%' }}>
                                        <h4>Probabilidad de la última predicción</h4>
                                        {!currentModel.isTrained ? (
                                            <p className={styles.mutedText}>El cálculo matemático debe terminar antes de poder adivinar nuevos datos.</p>
                                        ) : (
                                            <div className={styles.historyContainer}>
                                                {currentModel.predictionHistory && currentModel.predictionHistory.length > 0 ? (
                                                    <div>
                                                        {/* Large Visual Gauge for the latest prediction */}
                                                        {(() => {
                                                            const latest = currentModel.predictionHistory[0];
                                                            const isHighConfidence = latest.confidence >= 80;
                                                            return (
                                                                <div style={{ padding: '15px', border: '2px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', marginBottom: '15px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.2rem' }}>
                                                                        <span>Resultado estocástico: <strong>{latest.label}</strong></span>
                                                                        <span style={{ color: isHighConfidence ? '#0FBD8C' : '#FFAB19', fontWeight: 'bold' }}>
                                                                            {latest.confidence}%
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ width: '100%', height: '24px', backgroundColor: '#f0f0f0', borderRadius: '12px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                                                                        <div style={{ 
                                                                            width: `${latest.confidence}%`, 
                                                                            height: '100%', 
                                                                            backgroundColor: isHighConfidence ? '#0FBD8C' : '#FFAB19',
                                                                            transition: 'width 0.3s ease-out'
                                                                        }}></div>
                                                                    </div>
                                                                    <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>
                                                                        {isHighConfidence ? "El cálculo matemático es muy seguro." : "El modelo tiene dudas. Deberías recolectar más matrices (fotos) variadas."}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })()}
                                                        
                                                        {/* Condensed history list */}
                                                        {currentModel.predictionHistory.length > 1 && (
                                                            <div>
                                                                <p style={{ fontSize: '0.85rem', color: '#575E75', marginBottom: '5px' }}>Historial anterior:</p>
                                                                <ul className={styles.predictionList} style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', gap: '10px', overflowX: 'auto' }}>
                                                                    {currentModel.predictionHistory.slice(1).map((pred, idx) => (
                                                                        <li key={idx} style={{ backgroundColor: '#f9f9f9', padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid #eee', whiteSpace: 'nowrap' }}>
                                                                            <span style={{ color: '#888', marginRight: '8px' }}>{pred.time}</span>
                                                                            <strong>{pred.label}</strong> ({pred.confidence}%)
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className={styles.mutedText} style={{ textAlign: 'center', padding: '20px' }}>Ejecuta tus bloques de predicción para ver los cálculos aquí.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>

                </div>
            </div>
        );
    }
}

ModelsComponent.propTypes = {
    className: PropTypes.string,
    vm: PropTypes.object
};

export default ModelsComponent;