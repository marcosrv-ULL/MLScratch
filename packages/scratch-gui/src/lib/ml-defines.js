export default function defineMachineLearningBlocks(ScratchBlocks) {
    if (!ScratchBlocks || !ScratchBlocks.Blocks) return;

    // A distinct green color for the ML category
    const ML_COLOR = '#0FBD8C';

    // --- ACTION BLOCKS (STACK) ---

    // ml_set_canvas_area
    ScratchBlocks.Blocks['ml_set_canvas_area'] = {
        init: function () {
            this.jsonInit({
                "message0": "set ml area x: %1 y: %2 width: %3 height: %4",
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
                "message0": "learn all costumes as %1",
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

    ScratchBlocks.Blocks['ml_create_dataset'] = {
        init: function () {
            this.jsonInit({
                "message0": "create dataset %1",
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

    // ml_learn_current_area
    ScratchBlocks.Blocks['ml_save_current_area'] = {
        init: function () {
            this.jsonInit({
                "message0": "save current area as %1 to %2",
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
                "message0": "train ml model",
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "extensions": ["shape_statement"]
            });
        }
    };

    // --- REPORTER BLOCKS (VALUES) ---

    // ml_get_prediction
    ScratchBlocks.Blocks['ml_get_prediction'] = {
        init: function () {
            this.jsonInit({
                "message0": "ml area prediction",
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
                "message0": "ml area confidence %",
                "category": "Machine Learning",
                "colour": ML_COLOR,
                "output": "Number",
                "outputShape": ScratchBlocks.OUTPUT_SHAPE_ROUND
            });
        }
    };

    console.log("MACHINE LEARNING BLOCKS VISUALLY INJECTED");
}