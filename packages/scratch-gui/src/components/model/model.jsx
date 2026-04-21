import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './models.css';

class ModelsComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            models: {},
            selectedModel: null,
            // Local state to track history for visualizations
            localHistory: {} 
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
                        const newHistory = { ...prevState.localHistory };
                        let newSelected = prevState.selectedModel;

                        for (let i = 0; i < keys.length; i++) {
                            const key = keys[i];
                            const m = vm.runtime.mlModels[key];
                            clonedModels[key] = {
                                id: m.id,
                                isTrained: m.isTrained,
                                isTraining: m.isTraining,
                                currentLoss: m.currentLoss,
                                datasetUsed: m.datasetUsed,
                                algorithm: m.algorithm,
                                lastPrediction: m.lastPrediction,
                                lastConfidence: m.lastConfidence
                            };

                            // Initialize local history for new models
                            if (!newHistory[key]) {
                                newHistory[key] = { lossGraph: [], predictions: [] };
                            }

                            // Update Loss Graph during training
                            if (m.isTraining && typeof m.currentLoss === 'number' && !isNaN(m.currentLoss)) {
                                newHistory[key].lossGraph.push(m.currentLoss);
                            } else if (!m.isTraining && !m.isTrained) {
                                newHistory[key].lossGraph = []; // Reset if untrained
                            }

                            // Update Prediction History
                            const lastSavedPred = newHistory[key].predictions[0];
                            const isValidPrediction = m.lastPrediction !== "None" && m.lastPrediction !== "Not trained" && m.lastPrediction !== "Error";
                            
                            // Only add to history if it's different from the immediate previous one (to avoid spamming from polling)
                            if (isValidPrediction && (!lastSavedPred || lastSavedPred.label !== m.lastPrediction || lastSavedPred.confidence !== m.lastConfidence)) {
                                newHistory[key].predictions.unshift({
                                    label: m.lastPrediction,
                                    confidence: m.lastConfidence,
                                    time: new Date().toLocaleTimeString()
                                });
                                // Keep only the last 5 predictions
                                if (newHistory[key].predictions.length > 5) {
                                    newHistory[key].predictions.pop();
                                }
                            }
                        }
                        
                        if (!newSelected && keys.length > 0) {
                            newSelected = keys[0];
                        }
                        if (newSelected && !clonedModels[newSelected]) {
                            newSelected = keys.length > 0 ? keys[0] : null;
                        }
                        
                        return { 
                            models: clonedModels, 
                            selectedModel: newSelected,
                            localHistory: newHistory
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

        // Clear local graph history on retrain
        this.setState(prevState => ({
            localHistory: {
                ...prevState.localHistory,
                [selectedModel]: { ...prevState.localHistory[selectedModel], lossGraph: [] }
            }
        }));

        const vm = this.props.vm || window.vm;
        if (vm && vm.runtime) {
            vm.runtime.emit('GUI_RETRAIN_MODEL', {
                modelName: currentModel.id,
                datasetName: currentModel.datasetUsed
            });
        }
    }

    // Generates a simple SVG line chart for the learning curve
    renderLossGraph(lossArray) {
        if (!lossArray || lossArray.length < 2) {
            return (
                <div className={styles.graphPlaceholder}>
                    Calculando el margen de error...
                </div>
            );
        }

        const width = 300;
        const height = 100;
        const maxLoss = Math.max(...lossArray, 1); // Minimum scale of 1
        const minLoss = 0;
        
        const points = lossArray.map((loss, index) => {
            const x = (index / (lossArray.length - 1)) * width;
            const y = height - ((loss - minLoss) / (maxLoss - minLoss)) * height;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className={styles.graphContainer}>
                <svg viewBox={`0 0 ${width} ${height}`} className={styles.svgGraph}>
                    {/* Y-Axis labels */}
                    <text x="5" y="15" className={styles.graphText}>Error alto</text>
                    <text x="5" y={height - 5} className={styles.graphText}>Error bajo</text>
                    
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
            <div className={styles.architectureDiagram}>
                <div className={styles.archNode}>
                    <div className={styles.nodeBox}>1. Imagen de entrada</div>
                </div>
                <div className={styles.archArrow}>&#8594;</div>
                <div className={styles.archNode}>
                    <div className={classNames(styles.nodeBox, styles.nodePreTrained)}>
                        2. Extraer Características<br/><small>(Identificar patrones visuales)</small>
                    </div>
                </div>
                <div className={styles.archArrow}>&#8594;</div>
                <div className={styles.archNode}>
                    <div className={classNames(styles.nodeBox, styles.nodeAlgorithm)}>
                        {isNN ? "3. Red Neuronal" : "3. K-Nearest Neighbors"}<br/>
                        <small>{isNN ? "(Ajustar conexiones matemáticas)" : "(Encontrar las imágenes más parecidas)"}</small>
                    </div>
                </div>
                <div className={styles.archArrow}>&#8594;</div>
                <div className={styles.archNode}>
                    <div className={styles.nodeBox}>4. Predicción</div>
                </div>
            </div>
        );
    }

    render() {
        const { models, selectedModel, localHistory } = this.state;
        const modelKeys = Object.keys(models);
        const currentModel = selectedModel ? models[selectedModel] : null;
        const historyData = selectedModel ? localHistory[selectedModel] : null;

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
                                            {models[key].isTraining ? "Entrenando..." : (models[key].isTrained ? "Entrenado" : "Sin entrenar")}
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
                                <p>Selecciona un modelo para ver sus métricas y detalles.</p>
                            </div>
                        ) : (
                            <div className={styles.dashboard}>
                                
                                {/* Header & Actions */}
                                <div className={styles.dashHeader}>
                                    <div>
                                        <h2 className={styles.dashTitle}>{currentModel.id}</h2>
                                        <span className={styles.dashSubtitle}>Algoritmo: <strong>{currentModel.algorithm === 'NeuralNetwork' ? 'Red Neuronal' : 'K-Nearest Neighbors (Vecinos más cercanos)'}</strong></span>
                                    </div>
                                    <button 
                                        className={classNames(styles.button, styles.primaryButton)}
                                        onClick={this.handleRetrain}
                                        disabled={currentModel.isTraining || !currentModel.datasetUsed}
                                    >
                                        {currentModel.isTraining ? "Entrenando..." : "Reentrenar Modelo"}
                                    </button>
                                </div>

                                {/* Configuration & Status Row */}
                                <div className={styles.infoRow}>
                                    <div className={styles.infoCard}>
                                        <h4>Configuración del modelo</h4>
                                        <p><strong>Datos origen:</strong> {currentModel.datasetUsed || "Ninguno"}</p>
                                        <p><strong>Estado:</strong> {currentModel.isTraining ? "Entrenando" : (currentModel.isTrained ? "Entrenamiento completado" : "Sin datos para empezar")}</p>
                                        {/* Read-only Hyperparameters */}
                                        {currentModel.algorithm === 'NeuralNetwork' && (
                                            <div className={styles.hyperparams}>
                                                <small>Épocas de entrenamiento (Ciclos): 50</small><br/>
                                                <small>Tasa de aprendizaje (Learning Rate): 0.0001</small>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className={styles.infoCard}>
                                        <h4>Gráfica de Error (Pérdida)</h4>
                                        {currentModel.algorithm === 'KNN' ? (
                                            <p className={styles.mutedText}>Este algoritmo no calcula errores progresivos, mapea las características directamente en el espacio geométrico.</p>
                                        ) : (
                                            <div className={styles.lossMonitor}>
                                                <div className={styles.lossHeader}>
                                                    <span>Margen de error matemático:</span>
                                                    <strong>{typeof currentModel.currentLoss === 'number' && !isNaN(currentModel.currentLoss) ? currentModel.currentLoss.toFixed(4) : "---"}</strong>
                                                </div>
                                                {this.renderLossGraph(historyData?.lossGraph)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Didactic Architecture */}
                                <div className={styles.archSection}>
                                    <h4>¿Cómo procesa los datos?</h4>
                                    {this.renderArchitecture(currentModel.algorithm)}
                                </div>

                                {/* Performance/Inference Row */}
                                <div className={styles.infoRow}>
                                    <div className={classNames(styles.infoCard, styles.inferenceCard)}>
                                        <h4>Registro de Clasificación</h4>
                                        {!currentModel.isTrained ? (
                                            <p className={styles.mutedText}>El modelo debe ser entrenado para poder clasificar datos nuevos.</p>
                                        ) : (
                                            <div className={styles.predictionDisplay}>
                                                <div className={styles.predResult}>
                                                    <span>Última predicción:</span>
                                                    <span className={styles.predLabel}>{currentModel.lastPrediction}</span>
                                                </div>
                                                <div className={styles.predConfidence}>
                                                    <span>Probabilidad de acierto (Confianza):</span>
                                                    <span className={styles.confValue}>{currentModel.lastConfidence}%</span>
                                                </div>
                                                <div className={styles.confBarContainer}>
                                                    <div 
                                                        className={styles.confBarFill} 
                                                        style={{ width: `${currentModel.lastConfidence}%` }}
                                                    ></div>
                                                </div>
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