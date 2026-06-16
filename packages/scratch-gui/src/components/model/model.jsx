import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './models.css';

// Subcomponent to display the Neural Network / KNN Architecture with Dynamic Weights
const ArchitectureModal = ({ algorithm, isTrained, lossHistory, datasetUsed, onClose }) => {
    
    // We use state to hold our display weights so they persist while the modal is open,
    // but update them if the model changes from untrained to trained.
    const [networkWeights, setNetworkWeights] = useState(null);

    useEffect(() => {
        // Generate pseudo-random, but consistent-looking weights 
        // to illustrate the concept of internal mathematical adjustments.
        if (algorithm === 'NeuralNetwork') {
            const numConnections = (4 * 5) + (5 * 3); // 4 input, 5 hidden, 3 output
            const newWeights = [];
            
            for (let i = 0; i < numConnections; i++) {
                if (!isTrained) {
                    // Untrained: Initialize weights near zero (typical ML start)
                    newWeights.push((Math.random() * 0.1 - 0.05).toFixed(3));
                } else {
                    // Trained: Weights spread out, representing learned features
                    // We use the dataset name length to seed some variety
                    const seed = datasetUsed ? datasetUsed.length : 1;
                    const val = (Math.random() * 2 - 1) * (1 + (seed * 0.1));
                    newWeights.push(val.toFixed(3));
                }
            }
            setNetworkWeights(newWeights);
        }
    }, [isTrained, algorithm, datasetUsed, lossHistory]);

    // Inline styles mimicking Scratch's aesthetic
    const overlayStyle = {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
    };

    const modalStyle = {
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '20px',
        width: '80%',
        maxWidth: '800px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        border: '4px solid #0FBD8C' 
    };

    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '10px',
        marginBottom: '10px'
    };

    const containerStyle = {
        padding: '20px',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ccc',
        borderRadius: '6px',
        minHeight: '350px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
    };

    const scratchButtonStyle = {
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        padding: '0.5rem 1rem',
        borderRadius: '0.25rem',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        color: 'white',
        backgroundColor: '#FF6680', 
        boxShadow: '0 2px 0 rgba(0,0,0,0.1)'
    };

    const isNN = algorithm === 'NeuralNetwork';

    // Renders the Neural Network with text overlay for weights
    const renderNeuralNetwork = () => {
        if (!networkWeights) return <p>Cargando topología...</p>;

        const inputNodes = 4;
        const hiddenNodes = 5;
        const outputNodes = 3;
        
        // Expanded width to fit the numbers
        const width = 650;
        const height = 300;
        
        const nodeColor = '#4C97FF';
        const unadjustedLineColor = '#cccccc';
        
        // Color mapping for weights: Positive (green-ish), Negative (red-ish)
        const getLineColor = (weightStr) => {
            if (!isTrained) return unadjustedLineColor;
            const w = parseFloat(weightStr);
            if (w > 0.5) return 'rgba(15, 189, 140, 0.8)'; // Strong positive
            if (w < -0.5) return 'rgba(255, 102, 128, 0.8)'; // Strong negative
            return 'rgba(153, 102, 255, 0.5)'; // Neutral/Weak
        };
        
        const strokeWidth = isTrained ? 2.5 : 1;

        const getYPos = (index, total, height) => {
            const spacing = height / (total + 1);
            return spacing * (index + 1);
        };

        const lines = [];
        const weightLabels = [];
        let weightIndex = 0;
        
        // Helper to draw line and its weight text
        const drawConnection = (x1, y1, x2, y2, layerIdx) => {
            const wVal = networkWeights[weightIndex];
            const color = getLineColor(wVal);
            
            lines.push(
                <line 
                    key={`l-${weightIndex}`} 
                    x1={x1} y1={y1} 
                    x2={x2} y2={y2} 
                    stroke={color} 
                    strokeWidth={strokeWidth} 
                />
            );

            // Only show a fraction of the labels to avoid visual clutter,
            // but enough to show the numbers are changing.
            if (layerIdx % 2 === 0 || isTrained) {
                // Calculate midpoint for text
                const midX = x1 + (x2 - x1) * 0.35; // Offset slightly to left
                const midY = y1 + (y2 - y1) * 0.35;
                
                weightLabels.push(
                    <text 
                        key={`w-${weightIndex}`} 
                        x={midX} 
                        y={midY - 4} 
                        fontSize="9" 
                        fill={isTrained ? '#333' : '#999'}
                        fontFamily="monospace"
                        textAnchor="middle"
                        style={{ backgroundColor: 'white' }}
                    >
                        {wVal}
                    </text>
                );
            }
            weightIndex++;
        };

        // Draw connections Input -> Hidden
        for (let i = 0; i < inputNodes; i++) {
            for (let j = 0; j < hiddenNodes; j++) {
                drawConnection(50, getYPos(i, inputNodes, height), 325, getYPos(j, hiddenNodes, height), j);
            }
        }
        
        // Draw connections Hidden -> Output
        for (let j = 0; j < hiddenNodes; j++) {
            for (let k = 0; k < outputNodes; k++) {
                drawConnection(325, getYPos(j, hiddenNodes, height), 600, getYPos(k, outputNodes, height), j+k);
            }
        }

        const nodes = [];
        // Draw Input nodes
        for (let i = 0; i < inputNodes; i++) nodes.push(<circle key={`in-${i}`} cx={50} cy={getYPos(i, inputNodes, height)} r={14} fill={nodeColor} />);
        // Draw Hidden nodes
        for (let j = 0; j < hiddenNodes; j++) nodes.push(<circle key={`hid-${j}`} cx={325} cy={getYPos(j, hiddenNodes, height)} r={14} fill={nodeColor} />);
        // Draw Output nodes
        for (let k = 0; k < outputNodes; k++) nodes.push(<circle key={`out-${k}`} cx={600} cy={getYPos(k, outputNodes, height)} r={14} fill={nodeColor} />);

        return (
            <div style={{ position: 'relative' }}>
                {/* Note about representation */}
                <div style={{ position: 'absolute', top: '-15px', right: '0', fontSize: '0.75rem', color: '#888', fontStyle: 'italic' }}>
                    *Representación didáctica de una topología 4-5-3
                </div>
                
                <svg width={width} height={height} style={{ overflow: 'visible', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
                    {lines}
                    {weightLabels}
                    {nodes}
                    
                    {/* Layer Labels */}
                    <text x={50} y={height + 25} textAnchor="middle" fill="#575E75" fontSize="13" fontWeight="bold">Características de Entrada</text>
                    <text x={325} y={height + 25} textAnchor="middle" fill="#575E75" fontSize="13" fontWeight="bold">Capa de Cálculo</text>
                    <text x={600} y={height + 25} textAnchor="middle" fill="#575E75" fontSize="13" fontWeight="bold">Probabilidad de Salida</text>
                </svg>
            </div>
        );
    };

    const renderKNN = () => {
        return (
            <div style={{ textAlign: 'center', color: '#575E75', maxWidth: '500px' }}>
                <div style={{ fontSize: '50px', marginBottom: '15px' }}>📐</div>
                <h3 style={{ color: '#4C97FF' }}>Plano Geométrico (Matemáticas sin pesos)</h3>
                <p style={{ lineHeight: '1.5', fontSize: '1rem' }}>
                    A diferencia de las Redes Neuronales, el algoritmo <strong>K-Nearest Neighbors</strong> no tiene "pesos" que ajustar.<br/><br/>
                    Lo que hace es coger los números de la matriz de la imagen y usarlos como coordenadas (X, Y, Z...) para colocar la foto en un mapa geométrico gigante. Cuando le pasas una imagen nueva, calcula la distancia con una simple regla de tres (Teorema de Pitágoras) para ver qué ejemplos están más cerca.
                </p>
                <div style={{ 
                    marginTop: '20px', 
                    padding: '15px', 
                    backgroundColor: isTrained ? '#e6f7f2' : '#f5f0ff', 
                    border: `2px solid ${isTrained ? '#0FBD8C' : '#9966FF'}`,
                    borderRadius: '8px',
                    fontWeight: 'bold'
                }}>
                    {isTrained 
                        ? `✅ Mapa poblado y listo. Comparando contra ${datasetUsed || 'los'} datos.` 
                        : "⏳ El mapa geométrico está vacío. Necesita datos."}
                </div>
            </div>
        );
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <div>
                        <h2 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', margin: '0 0 5px 0', color: '#575E75' }}>
                            Arquitectura Interna del Modelo
                        </h2>
                        <span style={{ fontSize: '0.9rem', color: '#888' }}>
                            Visualización de la "Caja Negra" matemática
                        </span>
                    </div>
                    <button onClick={onClose} style={scratchButtonStyle}>Cerrar vista</button>
                </div>
                
                <div style={{ marginBottom: '15px', color: '#575E75', display: 'flex', gap: '20px', backgroundColor: '#f0f4f8', padding: '10px 15px', borderRadius: '6px' }}>
                    <div>
                        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: '3px' }}>Algoritmo:</span>
                        <strong>{isNN ? "Red Neuronal Artificial" : "Vecinos Más Cercanos (KNN)"}</strong>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: '3px' }}>Ecuación Matemática:</span>
                        {isNN 
                            ? (isTrained ? <span style={{ color: '#0FBD8C', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '5px' }}>●</span> Pesos numéricos ajustados</span> : <span style={{ color: '#FFAB19', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '5px' }}>●</span> Valores aleatorios iniciales</span>)
                            : <span style={{ color: '#575E75', fontWeight: 'bold' }}>Cálculo de distancias directas</span>
                        }
                    </div>
                </div>
                
                <div style={containerStyle}>
                    {isNN ? renderNeuralNetwork() : renderKNN()}
                </div>
            </div>
        </div>
    );
};

class ModelsComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            models: {},
            selectedModel: null,
            showArchitectureModal: false // Modal toggle state
        };
        this.updateInterval = null;
        
        // Binding methods
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
                        
                        // Auto-select the first model if none is selected
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

    // Generates the line chart with a directional arrow to illustrate the error dropping
    renderLossGraph(lossArray) {
        // Parse explicitly to numbers to prevent SVG crashes if ml5 returns unexpected data types
        const validLosses = (lossArray || []).map(l => Number(l)).filter(l => !isNaN(l));

        if (validLosses.length < 2) {
            return (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#575E75', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    <strong>Esperando datos matemáticos...</strong><br/>
                    Inicia el entrenamiento para ver cómo la fórmula intenta reducir sus fallos.
                </div>
            );
        }

        // SVG Base dimensions (internal coordinate system)
        const width = 500; 
        const height = 180; 
        const paddingLeft = 40; 
        const paddingRight = 15;
        const paddingTop = 20;
        const paddingBottom = 25;
        
        const graphWidth = width - paddingLeft - paddingRight;
        const graphHeight = height - paddingTop - paddingBottom;
        
        // Prevent division by zero
        const maxLoss = Math.max(...validLosses, 0.01); 
        const minLoss = 0;
        
        // Map points to SVG coordinates
        const points = validLosses.map((loss, index) => {
            const x = paddingLeft + (index / (validLosses.length - 1)) * graphWidth;
            const y = paddingTop + graphHeight - ((loss - minLoss) / (maxLoss - minLoss)) * graphHeight;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div style={{ marginTop: '10px', width: '100%', display: 'block' }}>
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                    
                    {/* Define the arrowhead marker */}
                    <defs>
                        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <polygon points="0 0, 6 3, 0 6" fill="#FF6680" />
                        </marker>
                    </defs>

                    {/* Background Gridlines */}
                    <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#e0e0e0" strokeDasharray="2 2" />
                    <line x1={paddingLeft} y1={paddingTop + graphHeight / 2} x2={width - paddingRight} y2={paddingTop + graphHeight / 2} stroke="#e0e0e0" strokeDasharray="2 2" />
                    
                    {/* The Zero Error Goal Line */}
                    <line x1={paddingLeft} y1={paddingTop + graphHeight} x2={width - paddingRight} y2={paddingTop + graphHeight} stroke="#0FBD8C" strokeWidth="2" strokeDasharray="4 4" />
                    <text x={width - paddingRight} y={paddingTop + graphHeight - 8} textAnchor="end" fill="#0FBD8C" fontSize="10" fontWeight="bold">Objetivo: Ningún Fallo</text>

                    {/* Y-Axis labels */}
                    <text x={paddingLeft - 8} y={paddingTop + 4} textAnchor="end" fill="#575E75" fontSize="10">{maxLoss.toFixed(2)}</text>
                    <text x={paddingLeft - 8} y={paddingTop + (graphHeight / 2) + 4} textAnchor="end" fill="#575E75" fontSize="10">{(maxLoss / 2).toFixed(2)}</text>
                    <text x={paddingLeft - 8} y={paddingTop + graphHeight + 4} textAnchor="end" fill="#575E75" fontSize="10">0</text>
                    
                    {/* Axis Titles */}
                    <text x={paddingLeft - 28} y={paddingTop + graphHeight / 2} transform={`rotate(-90 ${paddingLeft - 28} ${paddingTop + graphHeight / 2})`} textAnchor="middle" fill="#575E75" fontSize="10" fontWeight="bold">Cantidad de Error</text>
                    <text x={paddingLeft + graphWidth / 2} y={height - 2} textAnchor="middle" fill="#575E75" fontSize="10" fontWeight="bold">Tiempo calculando &#8594;</text>

                    {/* Data Line with Arrow Marker at the end */}
                    <polyline
                        fill="none"
                        stroke="#FF6680"
                        strokeWidth="3"
                        points={points}
                        strokeLinejoin="round"
                        markerEnd="url(#arrowhead)"
                    />
                </svg>
            </div>
        );
    }

    render() {
        const { models, selectedModel, showArchitectureModal } = this.state;
        const modelKeys = Object.keys(models);
        const currentModel = selectedModel ? models[selectedModel] : null;

        return (
            <div className={classNames(styles.editorContainer, this.props.className)}>
                
                {/* ARCHITECTURE MODAL OVERLAY */}
                {showArchitectureModal && currentModel && (
                    <ArchitectureModal 
                        algorithm={currentModel.algorithm} 
                        isTrained={currentModel.isTrained} 
                        onClose={() => this.setState({ showArchitectureModal: false })} 
                    />
                )}

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
                                <p>Selecciona un modelo para ver sus métricas y predicciones.</p>
                            </div>
                        ) : (
                            <div className={styles.dashboard}>
                                
                                {/* Header & Actions */}
                                <div className={styles.dashHeader}>
                                    <div>
                                        <h2 className={styles.dashTitle}>{currentModel.id}</h2>
                                        <span className={styles.dashSubtitle}>Método: <strong>{currentModel.algorithm === 'NeuralNetwork' ? 'Red Neuronal (Cálculo de pesos)' : 'K-Nearest Neighbors (Comparación de distancias)'}</strong></span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {/* NEW BUTTON TO OPEN ARCHITECTURE MODAL */}
                                        <button 
                                            className={styles.button}
                                            onClick={() => this.setState({ showArchitectureModal: true })}
                                            style={{ padding: '10px 20px', fontSize: '1rem' }}
                                        >
                                            Ver Arquitectura
                                        </button>

                                        <button 
                                            className={classNames(styles.button, styles.primaryButton)}
                                            onClick={this.handleRetrain}
                                            disabled={currentModel.isTraining || !currentModel.datasetUsed}
                                            style={{ padding: '10px 20px', fontSize: '1rem' }}
                                        >
                                            {currentModel.isTraining ? "Ajustando matemáticas..." : "Recalcular Reglas (Entrenar)"}
                                        </button>
                                    </div>
                                </div>

                                {/* Full width graph to prevent clipping */}
                                <div className={styles.infoCard} style={{ marginTop: '20px', width: '100%' }}>
                                    <h4 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px', marginBottom: '15px' }}>Evolución del Error (Pérdida)</h4>
                                    {currentModel.algorithm === 'KNN' ? (
                                        <p className={styles.mutedText}>Este algoritmo no calcula errores progresivos, mapea las características directamente en un plano geométrico.</p>
                                    ) : (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <span style={{ color: '#575E75' }}>Fallo matemático actual:</span>
                                                <strong style={{ color: '#FF6680', fontSize: '1.2rem' }}>
                                                    {typeof currentModel.currentLoss === 'number' && !isNaN(currentModel.currentLoss) ? currentModel.currentLoss.toFixed(4) : "---"}
                                                </strong>
                                            </div>
                                            {this.renderLossGraph(currentModel.lossHistory)}
                                        </div>
                                    )}
                                </div>

                                {/* Probability Gauge */}
                                <div className={classNames(styles.infoCard, styles.inferenceCard)} style={{ marginTop: '20px', width: '100%' }}>
                                    <h4 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px', marginBottom: '15px' }}>Última Predicción</h4>
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
                                                            <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.2rem' }}>
                                                                    <span>Resultado: <strong>{latest.label}</strong></span>
                                                                    <span style={{ color: isHighConfidence ? '#0FBD8C' : '#FFAB19', fontWeight: 'bold' }}>
                                                                        {latest.confidence}%
                                                                    </span>
                                                                </div>
                                                                <div style={{ width: '100%', height: '24px', backgroundColor: '#e0e0e0', borderRadius: '12px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                                                                    <div style={{ 
                                                                        width: `${latest.confidence}%`, 
                                                                        height: '100%', 
                                                                        backgroundColor: isHighConfidence ? '#0FBD8C' : '#FFAB19',
                                                                        transition: 'width 0.3s ease-out'
                                                                    }}></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                    
                                                    {/* Condensed history list */}
                                                    {currentModel.predictionHistory.length > 1 && (
                                                        <div style={{ marginTop: '15px' }}>
                                                            <p style={{ fontSize: '0.85rem', color: '#575E75', marginBottom: '8px' }}>Historial anterior:</p>
                                                            <ul className={styles.predictionList} style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                                                                {currentModel.predictionHistory.slice(1).map((pred, idx) => (
                                                                    <li key={idx} style={{ backgroundColor: '#fff', padding: '6px 12px', borderRadius: '15px', fontSize: '0.8rem', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                                                                        <span style={{ color: '#888', marginRight: '6px' }}>{pred.time}</span>
                                                                        <strong>{pred.label}</strong> ({pred.confidence}%)
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className={styles.mutedText} style={{ textAlign: 'center', padding: '10px' }}>Ejecuta tus bloques para realizar clasificaciones.</p>
                                            )}
                                        </div>
                                    )}
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