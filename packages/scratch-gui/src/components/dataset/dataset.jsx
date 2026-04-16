import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './dataset.css';

class DatasetComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            datasets: { 'default': [] },
            selectedDataset: 'default'
        };
        this.updateInterval = null;
        this.fileInputRef = React.createRef();

        // Binding methods
        this.handleSelectChange = this.handleSelectChange.bind(this);
        this.handleExport = this.handleExport.bind(this);
        this.handleImport = this.handleImport.bind(this);
        this.triggerFileInput = this.triggerFileInput.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
    }

    componentDidMount() {
        this.updateInterval = setInterval(() => {
            try {
                const vm = this.props.vm || window.vm;
                if (vm && vm.runtime && vm.runtime.mlDatasets) {
                    const vmSelected = vm.runtime.currentSelectedDataset || 'default';
                    let hasChanges = false;
                    
                    if (vmSelected !== this.state.selectedDataset) {
                        hasChanges = true;
                    }
                    
                    const vmKeys = Object.keys(vm.runtime.mlDatasets);
                    const stateKeys = Object.keys(this.state.datasets);
                    
                    if (vmKeys.length !== stateKeys.length) {
                        hasChanges = true;
                    } else {
                        for (let key of vmKeys) {
                            const vmLen = vm.runtime.mlDatasets[key] ? vm.runtime.mlDatasets[key].length : 0;
                            const stateLen = this.state.datasets[key] ? this.state.datasets[key].length : 0;
                            if (vmLen !== stateLen) {
                                hasChanges = true;
                                break;
                            }
                        }
                    }

                    if (hasChanges) {
                        const clonedDatasets = {};
                        for (let key in vm.runtime.mlDatasets) {
                            clonedDatasets[key] = [...vm.runtime.mlDatasets[key]];
                        }
                        this.setState({
                            datasets: clonedDatasets,
                            selectedDataset: vmSelected
                        });
                    }
                }
            } catch (err) {
                console.warn("[Dataset Tab] Sync error:", err);
            }
        }, 500);
    }

    componentWillUnmount() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    handleSelectChange(event) {
        const newSelection = event.target.value;
        this.setState({ selectedDataset: newSelection });
        
        const vm = this.props.vm || window.vm;
        if (vm && vm.runtime) {
            vm.runtime.currentSelectedDataset = newSelection;
        }
    }

    handleExport() {
        const { datasets, selectedDataset } = this.state;
        const currentData = datasets[selectedDataset] || [];

        if (currentData.length === 0) {
            alert("This dataset is empty.");
            return;
        }

        const dataStr = JSON.stringify(currentData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedDataset}_dataset.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    triggerFileInput() {
        if (this.fileInputRef.current) {
            this.fileInputRef.current.click();
        }
    }

    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                if (Array.isArray(importedData)) {
                    const vm = this.props.vm || window.vm;
                    const { selectedDataset } = this.state;

                    if (vm && vm.runtime && vm.runtime.mlDatasets) {
                        vm.runtime.mlDatasets[selectedDataset] = [...importedData];

                        this.setState(prevState => ({
                            datasets: {
                                ...prevState.datasets,
                                [selectedDataset]: vm.runtime.mlDatasets[selectedDataset]
                            }
                        }));
                    }
                } else {
                    alert("Invalid JSON format. Expected an array.");
                }
            } catch (err) {
                console.error("Import error:", err);
                alert("Failed to read JSON file.");
            }
        };
        reader.readAsText(file);
        event.target.value = null;
    }

    handleDelete(idToDelete) {
        const vm = this.props.vm || window.vm;
        const { selectedDataset } = this.state;

        if (vm && vm.runtime && vm.runtime.mlDatasets) {
            vm.runtime.mlDatasets[selectedDataset] = vm.runtime.mlDatasets[selectedDataset].filter(
                item => item.id !== idToDelete
            );

            this.setState(prevState => ({
                datasets: {
                    ...prevState.datasets,
                    [selectedDataset]: vm.runtime.mlDatasets[selectedDataset]
                }
            }));
        }
    }

    /**
     * Calculates class distribution and renders a visual balance bar.
     */
    renderClassBalanceBar(currentData) {
        if (!currentData || currentData.length === 0) return null;

        // 1. Count occurrences of each label
        const counts = {};
        currentData.forEach(item => {
            counts[item.label] = (counts[item.label] || 0) + 1;
        });

        // 2. Map Scratch category colors to labels to keep aesthetics
        const scratchColors = [
            '#4C97FF', // Motion Blue
            '#9966FF', // Looks Purple
            '#D65CD6', // Sound Pink
            '#FFBF00', // Events Yellow
            '#FFAB19', // Control Orange
            '#5CB1D6', // Sensing Light Blue
            '#59C059', // Operators Green
            '#FF6680', // Variables Dark Orange
            '#FF661A'  // My Blocks Red
        ];

        const labels = Object.keys(counts);
        const totalItems = currentData.length;

        return (
            <div className={styles.balanceContainer}>
                <div className={styles.balanceHeader}>
                    <strong>Balance de clases:</strong>
                </div>
                
                {/* The stacked progress bar */}
                <div className={styles.balanceBar}>
                    {labels.map((label, index) => {
                        const percentage = (counts[label] / totalItems) * 100;
                        const color = scratchColors[index % scratchColors.length];
                        return (
                            <div 
                                key={label} 
                                className={styles.balanceSegment}
                                style={{ width: `${percentage}%`, backgroundColor: color }}
                                title={`${label}: ${counts[label]} (${percentage.toFixed(1)}%)`}
                            />
                        );
                    })}
                </div>

                {/* The legend */}
                <div className={styles.balanceLegend}>
                    {labels.map((label, index) => {
                        const color = scratchColors[index % scratchColors.length];
                        return (
                            <div key={label} className={styles.legendItem}>
                                <span className={styles.legendDot} style={{ backgroundColor: color }} />
                                <span>{label} ({counts[label]})</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    render() {
        const { datasets, selectedDataset } = this.state;
        const currentData = datasets[selectedDataset] || [];

        return (
            <div className={classNames(styles.editorContainer, this.props.className)}>
                
                {/* TOP TOOLBAR ROW */}
                <div className={styles.row}>
                    <div className={styles.inputGroup}>
                        <label><strong>Dataset:</strong></label>
                        <select 
                            className={styles.dropdown}
                            value={selectedDataset} 
                            onChange={this.handleSelectChange}
                        >
                            {Object.keys(datasets).map(key => (
                                <option key={key} value={key}>{key}</option>
                            ))}
                        </select>
                        <span className={styles.badge}>{currentData.length} items</span>
                    </div>

                    <div className={styles.inputGroup}>
                        <input 
                            type="file" 
                            accept=".json" 
                            style={{ display: 'none' }} 
                            ref={this.fileInputRef}
                            onChange={this.handleImport}
                        />
                        <button className={styles.button} onClick={this.triggerFileInput}>
                            Import JSON
                        </button>
                        <button className={classNames(styles.button, styles.primaryButton)} onClick={this.handleExport}>
                            Export JSON
                        </button>
                    </div>
                </div>

                {/* CLASS BALANCE BAR */}
                {this.renderClassBalanceBar(currentData)}
                
                {/* SCROLL WRAPPER */}
                <div className={styles.scrollWrapper}>
                    <div className={styles.datasetContainer}>
                        <div className={styles.datasetGrid}>
                            {currentData.length === 0 ? (
                                <p className={styles.emptyMessage}>
                                    Empty dataset. Run blocks to collect data.
                                </p>
                            ) : (
                                currentData.map(item => (
                                    <div key={item.id} className={styles.card}>
                                        <button 
                                            className={styles.deleteBtn} 
                                            onClick={() => this.handleDelete(item.id)}
                                            title="Delete sample"
                                        >
                                            ✕
                                        </button>
                                        <img src={item.image} alt={item.label} className={styles.image} />
                                        <div className={styles.label}>{item.label}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        );
    }
}

DatasetComponent.propTypes = {
    className: PropTypes.string,
    vm: PropTypes.object
};

export default DatasetComponent;