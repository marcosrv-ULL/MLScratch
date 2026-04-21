const Cast = require('../util/cast');
const Sequencer = require('../engine/sequencer');
const execute = require('../engine/execute');
const Thread = require('../engine/thread');
const Target = require('../engine/target');
const BlocksRuntimeCache = require('../engine/blocks-runtime-cache');

class MLBlocks {

    constructor(runtime) {
        this.runtime = runtime;

        this.runtime.mlModels = {};

        this.runtime.mlDatasets = {
            'default': [] 
        };
        
        this.runtime.currentSelectedDataset = 'default';

        this.mlArea = { x: 0, y: 0, width: 100, height: 100 };
        this.isAreaDefined = false;
        
        this._boxSkinId = null;
        this._boxDrawableId = null;
        this.areaMode = 'train';

        // Global event flags
        this.hatTrainedFired = false;
        this.hatInferenceFired = false;

        this.runtime.on('PROJECT_STOP_ALL', this.onStopAll.bind(this));

        this.runtime.on('AFTER_EXECUTE', this._forceOverlayOrder.bind(this));

        // Dynamically load ml5.js for real machine learning capabilities
        if (typeof window !== 'undefined' && !window.ml5) {
            const script = document.createElement('script');
            script.src = "https://unpkg.com/ml5@0.12.2/dist/ml5.min.js";
            document.head.appendChild(script);
            console.log("[ML Blocks] Injecting ml5.js library...");
        }

        this.runtime.on('GUI_RETRAIN_MODEL', this._handleGuiRetrain.bind(this));
    }

    onStopAll() {
        this.isAreaDefined = false;
        if (this._boxDrawableId !== null && this.runtime.renderer) {
            this.runtime.renderer.updateDrawableProperties(this._boxDrawableId, { visible: false });
            this.runtime.requestRedraw();
        }
    }

    // 1. Remove the hat functions from getPrimitives
    getPrimitives() {
        return {
            ml_set_canvas_area: this.setCanvasArea,
            ml_move_canvas_area: this.moveCanvasArea,
            ml_move_canvas_area_to: this.moveCanvasAreaTo, 
            ml_set_area_mode: this.setAreaMode,
            
            ml_create_dataset: this.createDataset,
            ml_save_current_area: this.learnCurrentArea,
            ml_learn_from_costumes: this.learnFromCostumes,
            
            ml_create_model: this.createModel,
            ml_train_model_with_dataset: this.trainModelWithDataset,
            ml_make_prediction: this.makePrediction,

            // ml_when_model_trained and ml_when_inference_made removed from here
            // They will be triggered manually now.

            ml_get_prediction: this.getPrediction,
            ml_get_confidence: this.getConfidence
        };
    }

    // 2. Add your manual trigger logic
    /**
     * Manually extracts scripts from all targets and pushes them to the runtime thread queue.
     * Replicates the exact behavior of the custom quantum mod event dispatcher.
     * @param {string} opcode - The hat block opcode to trigger
     */
    _triggerManualHat(opcode) {
        const targets = this.runtime.targets;
        
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const scripts = BlocksRuntimeCache.getScripts(target.blocks, opcode);
            
            if (scripts.length >= 1) {
                for (let j = 0; j < scripts.length; j++) {
                    // Manually push the thread to the VM runtime
                    this.runtime._pushThread(scripts[j].blockId, target);
                }
            }
        }
    }

    _forceOverlayOrder() {
        if (this._boxDrawableId !== null && this.runtime.renderer) {
            this.runtime.renderer.setDrawableOrder(this._boxDrawableId, Infinity);
        }
    }

    _handleGuiRetrain(data) {
        if (!data.modelName || !data.datasetName) return;
        
        const args = {
            MODEL_NAME: data.modelName,
            DATASET_NAME: data.datasetName
        };
        
        this.trainModelWithDataset(args, null).catch(err => {
            console.error("[ML Blocks] GUI Retrain error:", err);
        });
    }

    _base64ToImage(base64Str) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = base64Str;
        });
    }

    /**
     * Evaluates global model trained hat
     */
    whenModelTrained(args, util) {
        return this.hatTrainedFired;
    }

    /**
     * Evaluates global inference made hat
     */
    whenInferenceMade(args, util) {
        return this.hatInferenceFired;
    }

    createModel(args, util) {
        const modelName = Cast.toString(args.MODEL_NAME) || 'default_model';
        const modelType = 'NeuralNetwork';
        
        if (!this.runtime.mlModels[modelName]) {
            this.runtime.mlModels[modelName] = {
                id: modelName,
                isTrained: false,
                isTraining: false, 
                currentLoss: null,
                datasetUsed: null,
                algorithm: modelType, 
                classifier: null, 
                featureExtractor: null, 
                lastPrediction: "None", 
                lastConfidence: 0
            };
            console.log(`[ML Blocks] Model '${modelName}' created as ${modelType}.`);
        }
    }

    async trainModelWithDataset(args, util) {
        const modelName = Cast.toString(args.MODEL_NAME) || 'default_model';
        const datasetName = Cast.toString(args.DATASET_NAME) || 'default';

        const dataset = this.runtime.mlDatasets[datasetName];
        const model = this.runtime.mlModels[modelName];

        if (!dataset || dataset.length === 0) return;
        if (!model) return;
        if (!window.ml5) return;

        console.log(`[ML Blocks] Starting training for '${modelName}' using ${model.algorithm}...`);
        
        model.isTrained = false;
        model.isTraining = true;
        model.datasetUsed = datasetName;
        model.currentLoss = null;

        return new Promise(async (resolve) => {
            
            if (model.algorithm === 'NeuralNetwork') {
                const featureExtractor = window.ml5.featureExtractor('MobileNet', {
                    numLabels: new Set(dataset.map(d => d.label)).size
                });
                
                const classifier = featureExtractor.classification();
                model.classifier = classifier;

                const imagePromises = dataset.map(async (item) => {
                    const imgElement = await this._base64ToImage(item.image);
                    await classifier.addImage(imgElement, item.label);
                });

                await Promise.all(imagePromises);

                classifier.train((loss) => {
                    if (loss === null) {
                        model.isTrained = true;
                        model.isTraining = false;
                        console.log(`[ML Blocks] Training complete for '${modelName}'!`);
                        
                        // Fire global hat synchronously
                        this.hatTrainedFired = true;
                        this.hatTrainedFired = false;
                        this._triggerManualHat("ml_when_model_trained");
                        resolve(); 
                    } else {
                        model.currentLoss = loss;
                    }
                });

            } else if (model.algorithm === 'KNN') {
                const featureExtractor = await new Promise(res => {
                    const fe = window.ml5.featureExtractor('MobileNet', () => res(fe));
                });
                
                const knn = window.ml5.KNNClassifier();
                model.classifier = knn;
                model.featureExtractor = featureExtractor;

                const imagePromises = dataset.map(async (item) => {
                    const imgElement = await this._base64ToImage(item.image);
                    const features = featureExtractor.infer(imgElement);
                    knn.addExample(features, item.label);
                });

                await Promise.all(imagePromises);

                model.isTrained = true;
                model.isTraining = false;
                model.currentLoss = 0; 
                
                // Fire global hat synchronously
                this.hatTrainedFired = true;
                this.runtime.startHats('ml_when_model_trained');
                this.hatTrainedFired = false;
                
                resolve();
            }
        });
    }

    async makePrediction(args, util) {
        const modelName = Cast.toString(args.MODEL_NAME) || 'default_model';
        const model = this.runtime.mlModels[modelName];

        if (!this.isAreaDefined || !model || !model.isTrained || !model.classifier) {
            if (model) {
                model.lastPrediction = "Modelo sin entrenar";
                model.lastConfidence = 0;
            }
            return;
        }

        if (this._boxDrawableId !== null) {
            this.runtime.renderer.updateDrawableProperties(this._boxDrawableId, { visible: false });
        }
        this.runtime.renderer.draw();

        const base64Image = this.extractImageFromArea(this.mlArea);

        if (this._boxDrawableId !== null) {
            this.runtime.renderer.updateDrawableProperties(this._boxDrawableId, { visible: true });
            this.runtime.requestRedraw();
        }

        if (!base64Image) return;

        return new Promise(async (resolve) => {
            const imgElement = await this._base64ToImage(base64Image);
            
            if (model.algorithm === 'NeuralNetwork') {
                model.classifier.classify(imgElement, (err, results) => {
                    if (err) {
                        model.lastPrediction = "Error";
                        model.lastConfidence = 0;
                    } else if (results && results.length > 0) {
                        model.lastPrediction = results[0].label;
                        model.lastConfidence = Math.round(results[0].confidence * 100); 
                    }
                    
                    // Fire global hat synchronously
                    this.hatInferenceFired = true;
                    this._triggerManualHat('ml_when_inference_made');
                    this.hatInferenceFired = false;
                    
                    resolve();
                });

            } else if (model.algorithm === 'KNN') {
                const features = model.featureExtractor.infer(imgElement);
                
                model.classifier.classify(features, (err, result) => {
                    if (err) {
                        model.lastPrediction = "Error";
                        model.lastConfidence = 0;
                    } else if (result) {
                        model.lastPrediction = result.label;
                        const confidence = result.confidencesByLabel[result.label] || 0;
                        model.lastConfidence = Math.round(confidence * 100);
                    }
                    
                    // Fire global hat synchronously
                    this.hatInferenceFired = true;
                    this._triggerManualHat('ml_when_inference_made');
                    this.hatInferenceFired = false;
                    
                    resolve();
                });
            }
        });
    }

    createDataset(args, util) {
        const datasetName = Cast.toString(args.LABEL) || 'default';
        
        if (!this.runtime.mlDatasets[datasetName]) {
            this.runtime.mlDatasets[datasetName] = [];
            
            if (Object.keys(this.runtime.mlDatasets).length === 2) {
                this.runtime.currentSelectedDataset = datasetName;
            }
            
            console.log(`[ML Blocks] Dataset '${datasetName}' created.`);
        }
    }

    getPrediction(args, util) {
        const modelName = Cast.toString(args.MODEL_NAME) || 'default_model';
        const model = this.runtime.mlModels[modelName];
        if (!model) return "No hay modelo";
        return model.lastPrediction;
    }

    getConfidence(args, util) {
        const modelName = Cast.toString(args.MODEL_NAME) || 'default_model';
        const model = this.runtime.mlModels[modelName];
        if (!model) return 0;
        return model.lastConfidence;
    }

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

    moveCanvasArea(args, util) {
        if (!this.isAreaDefined) return;
        this.mlArea.x = Cast.toNumber(args.X);
        this.mlArea.y = Cast.toNumber(args.Y);
        this._drawBoxOnCanvas(this.mlArea.x, this.mlArea.y, this.mlArea.width, this.mlArea.height);
        this.runtime.requestRedraw();
    }

    moveCanvasAreaTo(args, util) {
        if (!this.isAreaDefined) return;

        const targetName = Cast.toString(args.TARGET);
        let newX = this.mlArea.x;
        let newY = this.mlArea.y;

        if (targetName === '_mouse_') {
            newX = util.ioQuery('mouse', 'getScratchX');
            newY = util.ioQuery('mouse', 'getScratchY');
        } else if (targetName === '_random_') {
            newX = Math.round(Math.random() * 480 - 240);
            newY = Math.round(Math.random() * 360 - 180);
        } else {
            const targetSprite = this.runtime.getSpriteTargetByName(targetName);
            if (targetSprite) {
                newX = targetSprite.x;
                newY = targetSprite.y;
            } else {
                return;
            }
        }

        this.mlArea.x = newX;
        this.mlArea.y = newY;
        this._drawBoxOnCanvas(this.mlArea.x, this.mlArea.y, this.mlArea.width, this.mlArea.height);
        this.runtime.requestRedraw();
    }

    setAreaMode(args, util) {
        const mode = Cast.toString(args.MODE);
        if (mode === 'predict' || mode === 'train') {
            this.areaMode = mode;
            if (this.isAreaDefined) {
                this._drawBoxOnCanvas(this.mlArea.x, this.mlArea.y, this.mlArea.width, this.mlArea.height);
                this.runtime.requestRedraw();
            }
        }
    }

    _drawBoxOnCanvas(x, y, width, height) {
        const renderer = this.runtime.renderer;
        if (!renderer) return;

        const safeWidth = Math.max(75, width);
        const safeHeight = Math.max(40, height);
        const strokeWidth = 4;

        const isPredict = (this.areaMode === 'predict');
        const mainColor = isPredict ? '#4C97FF' : '#0FBD8C'; 
        const bgColor = isPredict ? 'rgba(76, 151, 255, 0.15)' : 'rgba(15, 189, 140, 0.15)';
        const labelText = isPredict ? 'Predict' : 'Input';

        const svgString = `<svg width="${safeWidth}" height="${safeHeight}" xmlns="http://www.w3.org/2000/svg">
            <rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" width="${safeWidth - strokeWidth}" height="${safeHeight - strokeWidth}" fill="${bgColor}" stroke="${mainColor}" stroke-width="${strokeWidth}" stroke-dasharray="10 10" />
            <rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" width="65" height="26" fill="${mainColor}" />
            <text x="${(strokeWidth / 2) + 32.5}" y="${(strokeWidth / 2) + 18}" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${labelText}</text>
        </svg>`;

        if (this._boxSkinId === null) {
            this._boxSkinId = renderer.createSVGSkin(svgString);
            this._boxDrawableId = renderer.createDrawable('sprite');
        } else {
            renderer.updateSVGSkin(this._boxSkinId, svgString);
        }

        renderer.updateDrawableProperties(this._boxDrawableId, { skinId: this._boxSkinId, position: [x, y], visible: true });
        renderer.setDrawableOrder(this._boxDrawableId, Infinity); 
    }

    _saveToDataset(label, image, datasetName = 'default') {
        if (!this.runtime.mlDatasets[datasetName]) {
            this.runtime.mlDatasets[datasetName] = [];
        }
        this.runtime.mlDatasets[datasetName].push({
            id: Date.now() + Math.random(),
            label: label,
            image: image
        });
        this.runtime.currentSelectedDataset = datasetName;
    }

    learnCurrentArea(args, util) {
        if (!this.isAreaDefined) return;

        if (this._boxDrawableId !== null) {
            this.runtime.renderer.updateDrawableProperties(this._boxDrawableId, { visible: false });
        }
        this.runtime.renderer.draw();

        const label = Cast.toString(args.LABEL);
        const datasetName = Cast.toString(args.LABEL1) || 'default'; 
        
        const base64Image = this.extractImageFromArea(this.mlArea);
        if (base64Image) {
            this._saveToDataset(label, base64Image, datasetName);
        }

        if (this._boxDrawableId !== null) {
            this.runtime.renderer.updateDrawableProperties(this._boxDrawableId, { visible: true });
            this.runtime.requestRedraw(); 
        }
    }

    learnFromCostumes(args, util) {
        if (!this.isAreaDefined) return;

        const target = util.target;
        const label = Cast.toString(args.LABEL);
        const datasetName = Cast.toString(args.DATASET) || 'default'; 
        
        const originalCostumeIndex = target.currentCostume;
        const originalX = target.x;
        const originalY = target.y;

        target.setXY(this.mlArea.x, this.mlArea.y);

        if (this._boxDrawableId !== null) {
            this.runtime.renderer.updateDrawableProperties(this._boxDrawableId, { visible: false });
        }

        const totalCostumes = target.sprite.costumes_.length;

        for (let i = 0; i < totalCostumes; i++) {
            target.setCostume(i);
            this.runtime.renderer.draw();
            const base64Image = this.extractImageFromArea(this.mlArea);
            
            if (base64Image) {
                this._saveToDataset(label, base64Image, datasetName);
            }
        }

        target.setCostume(originalCostumeIndex);
        target.setXY(originalX, originalY);
        
        if (this._boxDrawableId !== null) {
            this.runtime.renderer.updateDrawableProperties(this._boxDrawableId, { visible: true });
            this.runtime.requestRedraw();
        }
    }

    extractImageFromArea(area) {
        const renderer = this.runtime.renderer;
        if (!renderer || !renderer.canvas) return null;

        const sourceCanvas = renderer.canvas;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = area.width;
        tempCanvas.height = area.height;
        const ctx = tempCanvas.getContext('2d');

        const scaleX = sourceCanvas.width / 480;
        const scaleY = sourceCanvas.height / 360;

        const logicalStartX = 240 + area.x - (area.width / 2);
        const logicalStartY = 180 - area.y - (area.height / 2); 
        
        const startX = logicalStartX * scaleX;
        const startY = logicalStartY * scaleY;
        const cropWidth = area.width * scaleX;
        const cropHeight = area.height * scaleY;

        ctx.drawImage(
            sourceCanvas, 
            startX, startY, cropWidth, cropHeight, 
            0, 0, area.width, area.height          
        );

        return tempCanvas.toDataURL('image/png');
    }
}

module.exports = MLBlocks;