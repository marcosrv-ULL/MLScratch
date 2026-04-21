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
                                // Native arrays pulled directly from the VM
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

    // Generates a numerical SVG line chart for the learning curve
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
        const paddingLeft = 35; // Space for numerical text on the Y axis
        const paddingRight = 5;
        const paddingTop = 10;
        const paddingBottom = 10;
        
        const graphWidth = width - paddingLeft - paddingRight;
        const graphHeight = height - paddingTop - paddingBottom;
        
        // Avoid division by zero if all losses are the same or zero
        const maxLoss = Math.max(...lossArray, 0.01); 
        const minLoss = 0;
        
        const points = lossArray.map((loss, index) => {
            const x = paddingLeft + (index / (lossArray.length - 1)) * graphWidth;
            const y = paddingTop + graphHeight - ((loss - minLoss) / (maxLoss - minLoss)) * graphHeight;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className={styles.graphContainer}>
                <svg viewBox={`0 0 ${width} ${height}`} className={styles.svgGraph}>
                    {/* Background Gridlines */}
                    <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#e0e0e0" strokeDasharray="2 2" />
                    <line x1={paddingLeft} y1={paddingTop + graphHeight / 2} x2={width - paddingRight} y2={paddingTop + graphHeight / 2} stroke="#e0e0e0" strokeDasharray="2 2" />
                    <line x1={paddingLeft} y1={paddingTop + graphHeight} x2={width - paddingRight} y2={paddingTop + graphHeight} stroke="#cccccc" />

                    {/* Numerical Y-Axis labels */}
                    <text x={paddingLeft - 5} y={paddingTop + 4} textAnchor="end" className={styles.graphText}>{maxLoss.toFixed(2)}</text>
                    <text x={paddingLeft - 5} y={paddingTop + (graphHeight / 2) + 4} textAnchor="end" className={styles.graphText}>{(maxLoss / 2).toFixed(2)}</text>
                    <text x={paddingLeft - 5} y={paddingTop + graphHeight + 4} textAnchor="end" className={styles.graphText}>0</text>
                    
                    {/* Data Line */}
                    <polyline
                        fill="none"
                        stroke="#FF6680"
                        strokeWidth="2"
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
                                                <small>Ciclos de entrenamiento: 50</small><br/>
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
                                                {this.renderLossGraph(currentModel.lossHistory)}
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
                                            <div className={styles.historyContainer}>
                                                {currentModel.predictionHistory && currentModel.predictionHistory.length > 0 ? (
                                                    <ul className={styles.predictionList}>
                                                        {currentModel.predictionHistory.map((pred, idx) => (
                                                            <li key={idx} className={idx === 0 ? styles.latestPrediction : styles.oldPrediction}>
                                                                <span className={styles.predTime}>{pred.time}</span>
                                                                <span className={styles.predName}>{pred.label}</span>
                                                                <span className={styles.predConf}>{pred.confidence}% probabilidad</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className={styles.mutedText}>Esperando a realizar una predicción...</p>
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