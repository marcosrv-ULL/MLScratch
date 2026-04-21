export default function defineMachineLearningBlocks(ScratchBlocks) {
    if (!ScratchBlocks || !ScratchBlocks.Blocks) return;

    // A distinct green color for the ML category
    const ML_COLOR = '#0FBD8C';

    // --- ACTION BLOCKS (STACK) ---

    // ml_set_canvas_area
    ScratchBlocks.Blocks['ml_set_canvas_area'] = {
        init: function () {
            this.jsonInit({
                "message0": "fijar área de visión x: %1 y: %2 ancho: %3 alto: %4",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "X"
                    },
                    {
                        "type": "input_value",
                        "name": "Y"
                    },
                    {
                        "type": "input_value",
                        "name": "WIDTH"
                    },
                    {
                        "type": "input_value",
                        "name": "HEIGHT"
                    }
                ],
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "extensions": ["shape_statement"]
            });
        }
    };

    // ml_learn_from_costumes
    ScratchBlocks.Blocks['ml_learn_from_costumes'] = {
        init: function () {
            this.jsonInit({
                "message0": "aprender todos los disfraces como %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "LABEL"
                    }
                ],
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "extensions": ["shape_statement"]
            });
        }
    };

    // ml_when_model_trained
    ScratchBlocks.Blocks['ml_when_model_trained'] = {
        init: function () {
            this.jsonInit({
                "message0": "cuando cualquier modelo termine de entrenar",
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "extensions": ["shape_hat"]
            });
        }
    };

    // ml_when_inference_made
    ScratchBlocks.Blocks['ml_when_inference_made'] = {
        init: function () {
            this.jsonInit({
                "message0": "cuando se haga una predicción",
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "extensions": ["shape_hat"]
            });
        }
    };

    // ml_dataset_menu
    ScratchBlocks.Blocks['ml_dataset_menu'] = {
        init: function () {
            // Dynamic function to fetch active datasets from the VM
            var getOptions = function () {
                var options = [];
                if (typeof window !== 'undefined' && window.vm && window.vm.runtime.mlDatasets) {
                    var datasets = window.vm.runtime.mlDatasets;
                    var keys = Object.keys(datasets);
                    for (var i = 0; i < keys.length; i++) {
                        options.push([keys[i], keys[i]]);
                    }
                }
                
                // Fallback option if no datasets exist
                if (options.length === 0) {
                    options.push(['datos 1', 'nodataset']); 
                }
                
                return options;
            };

            this.appendDummyInput()
                // The field name here doesn't matter much for a shadow block, but we set it
                .appendField(new ScratchBlocks.FieldDropdown(getOptions), 'DATASET_NAME');
            
            this.setColour(ML_COLOR); 
            this.setOutput(true, 'String');
            this.setOutputShape(ScratchBlocks.OUTPUT_SHAPE_ROUND);
        }
    };

    // ml_create_dataset
    ScratchBlocks.Blocks['ml_create_dataset'] = {
        init: function () {
            this.jsonInit({
                "message0": "crear conjunto de datos %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "LABEL"
                    }
                ],
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "extensions": ["shape_statement"]
            });
        }
    };

    // ml_save_current_area
    ScratchBlocks.Blocks['ml_save_current_area'] = {
        init: function () {
            this.jsonInit({
                "message0": "guardar imagen actual como %1 en %2",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "LABEL"
                    },
                    {
                        "type": "input_value",
                        "name": "LABEL1"
                    }
                ],
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "extensions": ["shape_statement"]
            });
        }
    };

    // ml_train_model
    ScratchBlocks.Blocks['ml_train_model'] = {
        init: function () {
            this.jsonInit({
                "message0": "entrenar modelo de IA",
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "extensions": ["shape_statement"]
            });
        }
    };

    // --- REPORTER BLOCKS (VALUES) ---

    // ml_get_prediction (Legacy/Generic prediction block)
    ScratchBlocks.Blocks['ml_get_prediction'] = {
        init: function () {
            this.jsonInit({
                "message0": "predicción del área",
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "output": "String",
                "outputShape": ScratchBlocks.OUTPUT_SHAPE_ROUND
            });
        }
    };

    // ml_move_canvas_area
    ScratchBlocks.Blocks['ml_move_canvas_area'] = {
        init: function () {
            this.jsonInit({
                "message0": "mover área a x: %1 y: %2",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "X"
                    },
                    {
                        "type": "input_value",
                        "name": "Y"
                    }
                ],
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "extensions": ["shape_statement"]
            });
        }
    };

    // ml_goto_menu
    ScratchBlocks.Blocks['ml_goto_menu'] = {
        init: function () {
            // Dynamic function to fetch sprites from the Scratch VM
            var getOptions = function () {
                var options = [
                    ['puntero del ratón', '_mouse_'],
                ];
                if (typeof window !== 'undefined' && window.vm) {
                    var targets = window.vm.runtime.targets;
                    for (var i = 0; i < targets.length; i++) {
                        var target = targets[i];
                        // Exclude the stage and clone targets
                        if (!target.isStage && target.isOriginal) {
                            options.push([target.sprite.name, target.sprite.name]);
                        }
                    }
                }
                return options;
            };

            this.appendDummyInput()
                .appendField(new ScratchBlocks.FieldDropdown(getOptions), 'TARGET');
            
            // Apply the custom Machine Learning color
            this.setColour(ML_COLOR); 
            this.setOutput(true, 'String');
            this.setOutputShape(ScratchBlocks.OUTPUT_SHAPE_ROUND);
        }
    };

    // ml_move_canvas_area_to
    ScratchBlocks.Blocks['ml_move_canvas_area_to'] = {
        init: function () {
            this.jsonInit({
                "message0": "mover área a %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "TARGET"
                    }
                ],
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "extensions": ["shape_statement"]
            });
        }
    };

    // ml_set_area_mode
    ScratchBlocks.Blocks['ml_set_area_mode'] = {
        init: function () {
            this.jsonInit({
                "message0": "cambiar modo del área a %1",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "MODE",
                        "options": [
                            ["entrenar", "train"],
                            ["predecir", "predict"]
                        ]
                    }
                ],
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "extensions": ["shape_statement"]
            });
        }
    };

    // ml_model_menu
    ScratchBlocks.Blocks['ml_model_menu'] = {
        init: function () {
            // Dynamic function to fetch active models from the VM
            var getOptions = function () {
                var options = [];
                if (typeof window !== 'undefined' && window.vm && window.vm.runtime.mlModels) {
                    var models = window.vm.runtime.mlModels;
                    var keys = Object.keys(models);
                    for (var i = 0; i < keys.length; i++) {
                        options.push([keys[i], keys[i]]);
                    }
                }
                
                // Fallback option if no models are created yet
                if (options.length === 0) {
                    options.push(['modelo 1', 'nomodel']); 
                }
                
                return options;
            };

            this.appendDummyInput()
                .appendField(new ScratchBlocks.FieldDropdown(getOptions), 'MODEL_NAME');
            
            this.setColour(ML_COLOR); 
            this.setOutput(true, 'String');
            this.setOutputShape(ScratchBlocks.OUTPUT_SHAPE_ROUND);
        }
    };

    // ml_create_model
    ScratchBlocks.Blocks['ml_create_model'] = {
        init: function () {
            this.jsonInit({
                "message0": "crear modelo llamado %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "MODEL_NAME"
                    }
                ],
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "extensions": ["shape_statement"]
            });
        }
    };

    // ml_train_model_with_dataset
    ScratchBlocks.Blocks['ml_train_model_with_dataset'] = {
        init: function () {
            this.jsonInit({
                "message0": "entrenar modelo %1 con los datos %2",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "MODEL_NAME"
                    },
                    {
                        "type": "input_value",
                        "name": "DATASET_NAME"
                    }
                ],
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "extensions": ["shape_statement"]
            });
        }
    };

    // ml_make_prediction
    ScratchBlocks.Blocks['ml_make_prediction'] = {
        init: function () {
            this.jsonInit({
                "message0": "hacer predicción con el modelo %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "MODEL_NAME"
                    }
                ],
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "extensions": ["shape_statement"]
            });
        }
    };

    // ml_get_prediction (Specific model block)
    ScratchBlocks.Blocks['ml_get_prediction'] = {
        init: function () {
            this.jsonInit({
                "message0": "última predicción del modelo %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "MODEL_NAME"
                    }
                ],
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "output": "String", 
                "outputShape": ScratchBlocks.OUTPUT_SHAPE_ROUND
            });
        }
    };

    // ml_get_confidence
    ScratchBlocks.Blocks['ml_get_confidence'] = {
        init: function () {
            this.jsonInit({
                "message0": "porcentaje de seguridad %",
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "output": "Number",
                "outputShape": ScratchBlocks.OUTPUT_SHAPE_ROUND
            });
        }
    };

    console.log("MACHINE LEARNING BLOCKS VISUALLY INJECTED");
}