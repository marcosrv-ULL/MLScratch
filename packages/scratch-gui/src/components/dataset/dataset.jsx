import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './dataset.css';

// Subcomponent to display the pixel matrix
const PixelMatrixModal = ({ item, onClose }) => {
    const [pixelData, setPixelData] = useState(null);
    const [mode, setMode] = useState('gray'); // 'rgb' or 'gray'
    const [zoom, setZoom] = useState(1);
    
    // Panning state variables
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!item || !item.image) return;

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            
            // Limit the maximum size to avoid browser crash rendering thousands of DOM nodes
            const maxDim = 48; 
            let w = img.width;
            let h = img.height;
            
            if (w > maxDim || h > maxDim) {
                const ratio = Math.min(maxDim / w, maxDim / h);
                w = Math.floor(w * ratio);
                h = Math.floor(h * ratio);
            }
            
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            
            const data = ctx.getImageData(0, 0, w, h).data;
            const rows = [];
            
            for (let y = 0; y < h; y++) {
                const row = [];
                for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * 4;
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];
                    // Standard luminance formula
                    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                    row.push({ r, g, b, gray });
                }
                rows.push(row);
            }
            setPixelData(rows);
        };
        img.src = item.image;
    }, [item]);

    // Handle mouse wheel zoom
    const handleWheel = (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            setZoom(z => Math.min(5, z + 0.2)); // Zoom in, max 5x
        } else {
            setZoom(z => Math.max(0.5, z - 0.2)); // Zoom out, min 0.5x
        }
    };

    // Panning handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - pan.x,
            y: e.clientY - pan.y
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUpOrLeave = () => {
        setIsDragging(false);
    };

    if (!item) return null;

    // Inline styles for the modal to ensure it overlays correctly
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
        height: '80%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        border: '4px solid #4C97FF'
    };

    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '10px',
        marginBottom: '10px'
    };

    const controlsStyle = {
        display: 'flex',
        gap: '10px'
    };

    const matrixContainerStyle = {
        flex: 1,
        overflow: 'hidden', // Changed to hidden to prevent scrollbars fighting with custom drag
        backgroundColor: '#f5f5f5',
        border: '1px solid #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: isDragging ? 'grabbing' : 'grab'
    };

    // Base Scratch button styles
    const scratchButtonStyle = {
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        padding: '0.5rem 1rem',
        borderRadius: '0.25rem',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        color: 'white',
        boxShadow: '0 2px 0 rgba(0,0,0,0.1)'
    };

    const primaryColor = '#4C97FF';
    const secondaryColor = '#855CD6';
    const closeColor = '#FF6680';

    const cellBaseSize = mode === 'rgb' ? 40 : 25;

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <h2 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', margin: 0, color: '#575E75' }}>
                        Vista Matricial: {item.label}
                    </h2>
                    <div style={controlsStyle}>
                        <button 
                            onClick={() => setMode('gray')} 
                            style={{ ...scratchButtonStyle, backgroundColor: mode === 'gray' ? secondaryColor : primaryColor }}
                        >
                            Escala de grises
                        </button>
                        <button 
                            onClick={() => setMode('rgb')} 
                            style={{ ...scratchButtonStyle, backgroundColor: mode === 'rgb' ? secondaryColor : primaryColor }}
                        >
                            RGB
                        </button>
                        <button 
                            onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
                            style={{ ...scratchButtonStyle, backgroundColor: primaryColor }}
                        >
                            Alejar
                        </button>
                        <button 
                            onClick={() => setZoom(z => Math.min(5, z + 0.2))}
                            style={{ ...scratchButtonStyle, backgroundColor: primaryColor }}
                        >
                            Acercar
                        </button>
                        <button 
                            onClick={onClose} 
                            style={{ ...scratchButtonStyle, backgroundColor: closeColor }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>

                <div 
                    style={matrixContainerStyle} 
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                >
                    {pixelData ? (
                        <div style={{
                            display: 'inline-block',
                            // Combine pan translation and zoom scaling
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: 'center',
                            padding: '10px',
                            // Disable pointer events on children so dragging doesn't stick to inner divs
                            pointerEvents: 'none' 
                        }}>
                            {pixelData.map((row, y) => (
                                <div key={y} style={{ display: 'flex' }}>
                                    {row.map((pixel, x) => (
                                        <div key={x} style={{
                                            width: `${cellBaseSize}px`,
                                            height: `${cellBaseSize}px`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '8px',
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            backgroundColor: `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`,
                                            color: pixel.gray > 128 ? 'black' : 'white',
                                            boxSizing: 'border-box'
                                        }}>
                                            {mode === 'gray' ? pixel.gray : `${pixel.r},${pixel.g},${pixel.b}`}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontFamily: 'sans-serif', color: '#575E75' }}>Procesando matriz de la imagen...</p>
                    )}
                </div>
            </div>
        </div>
    );
};


class DatasetComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            datasets: { 'default': [] },
            selectedDataset: 'default',
            editingLabelId: null,
            matrixViewItem: null // Stores the item to be viewed in the modal
        };
        this.updateInterval = null;
        this.fileInputRef = React.createRef();

        // Binding methods
        this.handleSelectChange = this.handleSelectChange.bind(this);
        this.handleExport = this.handleExport.bind(this);
        this.handleImport = this.handleImport.bind(this);
        this.triggerFileInput = this.triggerFileInput.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.saveLabel = this.saveLabel.bind(this);
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

                    // Only sync if not currently editing a label to prevent interruption
                    if (hasChanges && this.state.editingLabelId === null) {
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
            alert("Este conjunto de datos está vacío. Necesitas recolectar ejemplos primero.");
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
                    alert("Formato JSON no válido. Se esperaba una lista de datos.");
                }
            } catch (err) {
                console.error("Import error:", err);
                alert("Error al leer el archivo JSON.");
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

    saveLabel(id, newLabel) {
        const trimmedLabel = newLabel.trim();
        const vm = this.props.vm || window.vm;
        const { selectedDataset } = this.state;

        if (trimmedLabel !== "" && vm && vm.runtime && vm.runtime.mlDatasets) {
            // Update VM memory
            const itemIndex = vm.runtime.mlDatasets[selectedDataset].findIndex(item => item.id === id);
            if (itemIndex > -1) {
                vm.runtime.mlDatasets[selectedDataset][itemIndex].label = trimmedLabel;
            }

            // Update local state
            this.setState(prevState => {
                const newDatasetData = [...(prevState.datasets[selectedDataset] || [])];
                const localIndex = newDatasetData.findIndex(item => item.id === id);
                if (localIndex > -1) {
                    newDatasetData[localIndex] = { ...newDatasetData[localIndex], label: trimmedLabel };
                }
                return {
                    datasets: { ...prevState.datasets, [selectedDataset]: newDatasetData },
                    editingLabelId: null
                };
            });
        } else {
            // Cancel edit if empty
            this.setState({ editingLabelId: null });
        }
    }

    renderClassBalanceBar(currentData) {
        if (!currentData || currentData.length === 0) return null;

        const counts = {};
        currentData.forEach(item => {
            counts[item.label] = (counts[item.label] || 0) + 1;
        });

        const scratchColors = [
            '#4C97FF', '#9966FF', '#D65CD6', '#FFBF00', '#FFAB19', 
            '#5CB1D6', '#59C059', '#FF6680', '#FF661A' 
        ];

        const labels = Object.keys(counts);
        const totalItems = currentData.length;

        return (
            <div className={styles.balanceContainer}>
                <div className={styles.balanceHeader}>
                    <strong>Balance de clases:</strong>
                </div>
                
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
        const { datasets, selectedDataset, matrixViewItem, editingLabelId } = this.state;
        const currentData = datasets[selectedDataset] || [];

        return (
            <div className={classNames(styles.editorContainer, this.props.className)}>
                
                {/* MATRIX MODAL */}
                {matrixViewItem && (
                    <PixelMatrixModal 
                        item={matrixViewItem} 
                        onClose={() => this.setState({ matrixViewItem: null })} 
                    />
                )}

                <div className={styles.row}>
                    <div className={styles.inputGroup}>
                        <label><strong>Conjunto de datos:</strong></label>
                        <select 
                            className={styles.dropdown}
                            value={selectedDataset} 
                            onChange={this.handleSelectChange}
                        >
                            {Object.keys(datasets).map(key => (
                                <option key={key} value={key}>{key}</option>
                            ))}
                        </select>
                        <span className={styles.badge}>{currentData.length} ejemplos</span>
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
                            Cargar datos (.json)
                        </button>
                        <button className={classNames(styles.button, styles.primaryButton)} onClick={this.handleExport}>
                            Guardar datos en el PC
                        </button>
                    </div>
                </div>

                {this.renderClassBalanceBar(currentData)}
                
                <div className={styles.scrollWrapper}>
                    <div className={styles.datasetContainer}>
                        <div className={styles.datasetGrid}>
                            {currentData.length === 0 ? (
                                <p className={styles.emptyMessage}>
                                    Conjunto de datos vacío. Ejecuta tus bloques para empezar a recolectar ejemplos.
                                </p>
                            ) : (
                                currentData.map(item => (
                                    <div key={item.id} className={styles.card}>
                                        <button 
                                            className={styles.deleteBtn} 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                this.handleDelete(item.id);
                                            }}
                                            title="Borrar ejemplo"
                                        >
                                            ✕
                                        </button>
                                        
                                        {/* Click on image opens matrix modal */}
                                        <img 
                                            src={item.image} 
                                            alt={item.label} 
                                            className={styles.image} 
                                            onClick={() => this.setState({ matrixViewItem: item })}
                                            style={{ cursor: 'zoom-in' }}
                                        />
                                        
                                        {/* Click on label toggles edit mode */}
                                        {editingLabelId === item.id ? (
                                            <input 
                                                autoFocus
                                                type="text"
                                                defaultValue={item.label}
                                                onBlur={(e) => this.saveLabel(item.id, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') this.saveLabel(item.id, e.target.value);
                                                    if (e.key === 'Escape') this.setState({ editingLabelId: null });
                                                }}
                                                style={{ width: '100%', textAlign: 'center', marginTop: '5px' }}
                                            />
                                        ) : (
                                            <div 
                                                className={styles.label} 
                                                onClick={() => this.setState({ editingLabelId: item.id })}
                                                style={{ cursor: 'text' }}
                                                title="Click para editar nombre"
                                            >
                                                {item.label}
                                            </div>
                                        )}
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