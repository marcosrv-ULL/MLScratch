const Cast = require('../util/cast');
const Sequencer = require('../engine/sequencer');
const execute = require('../engine/execute');
const Thread = require('../engine/thread');
const Target = require('../engine/target');
const BlocksRuntimeCache = require('../engine/blocks-runtime-cache');

class MLBlocks {

    constructor(runtime) {
        this.runtime = runtime;

        this.runtime.mlDatasets = {
            'default': [] // Dataset inicial por defecto
        };
        // Nombre del dataset que el alumno está visualizando actualmente en la pestaña
        this.runtime.currentSelectedDataset = 'default';

        this.mlArea = { x: 0, y: 0, width: 100, height: 100 };
        this.isAreaDefined = false;

        this.runtime.mlDataset = []; 
        this.isTrained = false;
        
        this.classifier = null; 
        this._boxSkinId = null;
        this._boxDrawableId = null;

        // --- NUEVO: Escuchar el botón de Stop (Bandera roja) ---
        this.runtime.on('PROJECT_STOP_ALL', this.onStopAll.bind(this));
    }

    /**
     * Limpia y oculta el área de Machine Learning cuando el usuario pulsa Stop.
     */
    onStopAll() {
        // Desactivamos el área lógicamente
        this.isAreaDefined = false;

        // Ocultamos el recuadro visualmente en el canvas
        if (this._boxDrawableId !== null && this.runtime.renderer) {
            this.runtime.renderer.updateDrawableProperties(this._boxDrawableId, { visible: false });
            this.runtime.requestRedraw();
        }
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives() {
        return {
            ml_set_canvas_area: this.setCanvasArea,
            ml_learn_from_costumes: this.learnFromCostumes,
            ml_save_current_area: this.learnCurrentArea,
            ml_train_model: this.trainModel,
            ml_get_prediction: this.getPrediction,
            ml_get_confidence: this.getConfidence,
            ml_move_canvas_area: this.moveCanvasArea, // New primitive
            //ml_create_dataset: this.createDataset,
        };
    }

    /**
     * Updates the X and Y coordinates of the ML area without changing its dimensions.
     */
    moveCanvasArea(args, util) {
        if (!this.isAreaDefined) {
            // Cannot move an area that does not exist yet
            return;
        }

        this.mlArea.x = Cast.toNumber(args.X);
        this.mlArea.y = Cast.toNumber(args.Y);
        
        this._drawBoxOnCanvas(this.mlArea.x, this.mlArea.y, this.mlArea.width, this.mlArea.height);
        this.runtime.requestRedraw();
    }

    learnCurrentArea(args, util) {
        if (!this.isAreaDefined) {
            console.log("[ML Blocks] Error: ML area is not defined.");
            return;
        }

        // 1. Hide the ML area visual box
        if (this._boxDrawableId !== null) {
            this.runtime.renderer.updateDrawableProperties(this._boxDrawableId, { visible: false });
        }

        // 2. Force a render step so the canvas updates WITHOUT the box
        this.runtime.renderer.draw();

        // Extract arguments from the Scratch block
        const label = Cast.toString(args.LABEL);
        // Read the new dataset input. Default to 'default' if empty.
        const datasetName = Cast.toString(args.LABEL1) || 'default'; 
        
        const base64Image = this.extractImageFromArea(this.mlArea);
        console.log("learn")
        if (base64Image) {
            // Use the internal method to route the image to the correct dataset array
            this._saveToDataset(label, base64Image, datasetName);
        } else {
            console.log("[ML Blocks] Error: extractImageFromArea returned null.");
        }

        // 3. Restore the ML area visual box visibility
        if (this._boxDrawableId !== null) {
            this.runtime.renderer.updateDrawableProperties(this._boxDrawableId, { visible: true });
            this.runtime.requestRedraw(); 
        }

        this.isTrained = false; 
    }

    /**
     * Defines the bounding box on the canvas for feature extraction.
     */
    setCanvasArea(args, util) {
        this.mlArea = {
            x: Cast.toNumber(args.X),
            y: Cast.toNumber(args.Y),
            width: Cast.toNumber(args.WIDTH),
            height: Cast.toNumber(args.HEIGHT)
        };
        this.isAreaDefined = true;
        
        this._drawBoxOnCanvas(this.mlArea.x, this.mlArea.y, this.mlArea.width, this.mlArea.height);
        this.runtime.requestRedraw();
    }

    /**
     * Creates or updates a dynamic SVG skin representing the ML scanning area.
     */
    /**
     * Creates or updates a dynamic SVG skin representing the ML scanning area.
     */
    _drawBoxOnCanvas(x, y, width, height) {
        const renderer = this.runtime.renderer;
        if (!renderer) return;

        // Aseguramos un tamaño mínimo para que el texto "Input" siempre quepa
        const safeWidth = Math.max(75, width);
        const safeHeight = Math.max(40, height);
        const strokeWidth = 4;

        const svgString = `<svg width="${safeWidth}" height="${safeHeight}" xmlns="http://www.w3.org/2000/svg">
            <rect 
                x="${strokeWidth / 2}" 
                y="${strokeWidth / 2}" 
                width="${safeWidth - strokeWidth}" 
                height="${safeHeight - strokeWidth}" 
                fill="rgba(15, 189, 140, 0.15)" 
                stroke="#0FBD8C" 
                stroke-width="${strokeWidth}" 
                stroke-dasharray="10 10" 
            />
            
            <rect 
                x="${strokeWidth / 2}" 
                y="${strokeWidth / 2}" 
                width="65" 
                height="26" 
                fill="#0FBD8C" 
            />
            
            <text 
                x="${(strokeWidth / 2) + 32.5}" 
                y="${(strokeWidth / 2) + 18}" 
                font-family="Helvetica, Arial, sans-serif" 
                font-size="14" 
                font-weight="bold" 
                fill="white" 
                text-anchor="middle"
            >
                Input
            </text>
        </svg>`;

        if (this._boxSkinId === null) {
            this._boxSkinId = renderer.createSVGSkin(svgString);
            this._boxDrawableId = renderer.createDrawable('sprite');
        } else {
            renderer.updateSVGSkin(this._boxSkinId, svgString);
        }

        renderer.updateDrawableProperties(this._boxDrawableId, {
            skinId: this._boxSkinId,
            position: [x, y],
            visible: true
        });

        renderer.setDrawableOrder(this._boxDrawableId, Infinity);
    }

    _saveToDataset(label, image, datasetName = 'default') {
        // Auto-crear el dataset si no existe
        if (!this.runtime.mlDatasets[datasetName]) {
            this.runtime.mlDatasets[datasetName] = [];
        }

        this.runtime.mlDatasets[datasetName].push({
            id: Date.now() + Math.random(),
            label: label,
            image: image
        });
        console.log(this.runtime.mlDatasets[datasetName])
        // Actualizamos el puntero para que la GUI muestre el dataset que se está modificando
        this.runtime.currentSelectedDataset = datasetName;
    }

    /**
     * Iterates through all costumes of the current sprite, places them in the area,
     * and extracts features to quickly build a dataset.
     */
    learnFromCostumes(args, util) {
        if (!this.isAreaDefined) return;

        const target = util.target;
        const label = Cast.toString(args.LABEL);
        
        const originalCostumeIndex = target.currentCostume;
        const originalX = target.x;
        const originalY = target.y;

        target.setXY(this.mlArea.x, this.mlArea.y);

        // 1. Hide the ML area visual box during the entire batch process
        if (this._boxDrawableId !== null) {
            this.runtime.renderer.updateDrawableProperties(this._boxDrawableId, { visible: false });
        }

        const totalCostumes = target.sprite.costumes_.length;

        for (let i = 0; i < totalCostumes; i++) {
            target.setCostume(i);
            
            // Force render for each costume without the bounding box
            this.runtime.renderer.draw();
            
            const base64Image = this.extractImageFromArea(this.mlArea);
            
            if (base64Image) {
                this.runtime.mlDataset.push({
                    id: Date.now() + Math.random(),
                    label: label,
                    image: base64Image
                });
            }
        }

        // Restore target's original state
        target.setCostume(originalCostumeIndex);
        target.setXY(originalX, originalY);
        
        // 2. Restore the ML area visual box visibility
        if (this._boxDrawableId !== null) {
            this.runtime.renderer.updateDrawableProperties(this._boxDrawableId, { visible: true });
            this.runtime.requestRedraw();
        }

        this.isTrained = false;
    }

    /**
     * Executes the training algorithm on the accumulated dataset.
     */
    trainModel(args, util) {
        if (this.runtime.mlDataset.length === 0) return;

        return new Promise(resolve => {
            setTimeout(() => {
                this.isTrained = true;
                resolve();
            }, 500);
        });
    }

    getPrediction(args, util) {
        if (!this.isTrained || !this.isAreaDefined) return "Unknown";
        return "Mock_Class_A"; 
    }

    getConfidence(args, util) {
        if (!this.isTrained || !this.isAreaDefined) return 0;
        return 95; 
    }

    /**
     * Crops the specific region from the Scratch WebGL canvas and converts it to a Base64 image.
     * @param {Object} area - The bounding box {x, y, width, height}
     * @return {String} Base64 PNG image
     */
    /**
     * Crops the specific region from the Scratch WebGL canvas and converts it to a Base64 image.
     * @param {Object} area - The bounding box {x, y, width, height}
     * @return {String} Base64 PNG image
     */
    extractImageFromArea(area) {
        const renderer = this.runtime.renderer;
        if (!renderer || !renderer.canvas) return null;

        const sourceCanvas = renderer.canvas;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = area.width;
        tempCanvas.height = area.height;
        const ctx = tempCanvas.getContext('2d');

        // 1. Escala entre la resolución lógica de Scratch (480x360) y la real del canvas WebGL en pantalla
        const scaleX = sourceCanvas.width / 480;
        const scaleY = sourceCanvas.height / 360;

        // 2. En Scratch, 'area.x' y 'area.y' son el CENTRO del recuadro.
        // Calculamos dónde está la esquina superior izquierda lógica de ese recuadro.
        const logicalStartX = 240 + area.x - (area.width / 2);
        
        // Cuidado con la Y: en Scratch la Y positiva va hacia arriba, en el canvas va hacia abajo.
        // 180 es el centro vertical. Restamos la Y de Scratch y también la mitad del alto.
        const logicalStartY = 180 - area.y - (area.height / 2); 
        
        // 3. Aplicamos la escala para pantallas de alta resolución (Retina/4K)
        const startX = logicalStartX * scaleX;
        const startY = logicalStartY * scaleY;
        const cropWidth = area.width * scaleX;
        const cropHeight = area.height * scaleY;

        // 4. Copiamos exactamente ese cuadrante al canvas temporal
        ctx.drawImage(
            sourceCanvas, 
            startX, startY, cropWidth, cropHeight, // Recorte original (Fuente)
            0, 0, area.width, area.height          // Destino (Nuestro canvas temporal)
        );

        return tempCanvas.toDataURL('image/png');
    }
}

module.exports = MLBlocks;