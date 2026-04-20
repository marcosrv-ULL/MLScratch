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
                    }
                    
                    this.setState(prevState => {
                        // Auto-select the first model if none is selected and models exist
                        let newSelected = prevState.selectedModel;
                        if (!newSelected && keys.length > 0) {
                            newSelected = keys[0];
                        }
                        // If the selected model was deleted, reset selection
                        if (newSelected && !clonedModels[newSelected]) {
                            newSelected = keys.length > 0 ? keys[0] : null;
                        }
                        return { models: clonedModels, selectedModel: newSelected };
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
            alert("This model needs a dataset assigned via blocks before retraining.");
            return;
        }

        const vm = this.props.vm || window.vm;
        if (vm && vm.runtime) {
            // Emit event to the engine to trigger the training process
            vm.runtime.emit('GUI_RETRAIN_MODEL', {
                modelName: currentModel.id,
                datasetName: currentModel.datasetUsed
            });
        }
    }

    renderArchitecture(algorithm) {
        // Didactic visualization of what happens under the hood
        const isNN = algorithm === 'NeuralNetwork';
        
        return (
            <div className={styles.architectureDiagram}>
                <div className={styles.archNode}>
                    <div className={styles.nodeBox}>Input Image</div>
                </div>
                <div className={styles.archArrow}>&#8594;</div>
                <div className={styles.archNode}>
                    <div className={classNames(styles.nodeBox, styles.nodePreTrained)}>
                        Feature Extractor<br/><small>(MobileNet)</small>
                    </div>
                </div>
                <div className={styles.archArrow}>&#8594;</div>
                <div className={styles.archNode}>
                    <div className={classNames(styles.nodeBox, styles.nodeAlgorithm)}>
                        {isNN ? "Dense Layers" : "Space Mapping"}<br/>
                        <small>{isNN ? "(Epoch Training)" : "(K-Nearest Neighbors)"}</small>
                    </div>
                </div>
                <div className={styles.archArrow}>&#8594;</div>
                <div className={styles.archNode}>
                    <div className={styles.nodeBox}>Output Class</div>
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
                            <h3>Models ({modelKeys.length})</h3>
                        </div>
                        <ul className={styles.modelList}>
                            {modelKeys.length === 0 ? (
                                <li className={styles.emptyList}>No models created.</li>
                            ) : (
                                modelKeys.map(key => (
                                    <li 
                                        key={key} 
                                        className={classNames(styles.listItem, { [styles.listItemSelected]: selectedModel === key })}
                                        onClick={() => this.handleModelSelect(key)}
                                    >
                                        <div className={styles.listItemName}>{key}</div>
                                        <div className={styles.listItemStatus}>
                                            {models[key].isTraining ? "Training..." : (models[key].isTrained ? "Ready" : "Untrained")}
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
                                <p>Select a model to view its details.</p>
                            </div>
                        ) : (
                            <div className={styles.dashboard}>
                                
                                {/* Header & Actions */}
                                <div className={styles.dashHeader}>
                                    <div>
                                        <h2 className={styles.dashTitle}>{currentModel.id}</h2>
                                        <span className={styles.dashSubtitle}>Algorithm: <strong>{currentModel.algorithm}</strong></span>
                                    </div>
                                    <button 
                                        className={classNames(styles.button, styles.primaryButton)}
                                        onClick={this.handleRetrain}
                                        disabled={currentModel.isTraining || !currentModel.datasetUsed}
                                    >
                                        {currentModel.isTraining ? "Training..." : "Retrain Model"}
                                    </button>
                                </div>

                                {/* Configuration & Status Row */}
                                <div className={styles.infoRow}>
                                    <div className={styles.infoCard}>
                                        <h4>Configuration</h4>
                                        <p><strong>Dataset:</strong> {currentModel.datasetUsed || "None assigned"}</p>
                                        <p><strong>Status:</strong> {currentModel.isTraining ? "Training" : (currentModel.isTrained ? "Trained" : "Untrained")}</p>
                                    </div>
                                    
                                    <div className={styles.infoCard}>
                                        <h4>Training Progress</h4>
                                        {currentModel.algorithm === 'KNN' ? (
                                            <p className={styles.mutedText}>KNN trains instantly by memorizing data points. No loss curve available.</p>
                                        ) : (
                                            <div className={styles.lossMonitor}>
                                                <p><strong>Loss (Error Rate):</strong> {currentModel.currentLoss !== null ? currentModel.currentLoss.toFixed(4) : "N/A"}</p>
                                                <progress className={styles.progressBar} max="1" value={currentModel.currentLoss !== null ? Math.max(0, 1 - currentModel.currentLoss) : 0}></progress>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Didactic Architecture */}
                                <div className={styles.archSection}>
                                    <h4>Under the Hood</h4>
                                    {this.renderArchitecture(currentModel.algorithm)}
                                </div>

                                {/* Performance/Inference Row */}
                                <div className={styles.infoRow}>
                                    <div className={classNames(styles.infoCard, styles.inferenceCard)}>
                                        <h4>Live Performance</h4>
                                        {!currentModel.isTrained ? (
                                            <p className={styles.mutedText}>Model must be trained to show performance.</p>
                                        ) : (
                                            <div className={styles.predictionDisplay}>
                                                <div className={styles.predResult}>
                                                    <span>Last Prediction:</span>
                                                    <span className={styles.predLabel}>{currentModel.lastPrediction}</span>
                                                </div>
                                                <div className={styles.predConfidence}>
                                                    <span>Confidence:</span>
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